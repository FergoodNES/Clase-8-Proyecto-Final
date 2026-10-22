/**
 * ====================================================================================
 * RUTAS DE MONITOREO Y HEALTH CHECK (TEMAS 15.3, 15.4, 15.5 / UNIDAD 8)
 * Permite que los balanceadores de carga y plataformas de despliegue (Render, Vercel)
 * determinen si la instancia está lista para recibir tráfico y monitoreen recursos.
 * ====================================================================================
 */

const express = require('express');
const router = express.Router();
const prisma = require('../config/db');
const logger = require('../config/logger');

/**
 * Health Check Completo (Deep Health Check)
 * Comprueba activamente el proceso, la base de datos y los recursos del sistema.
 */
router.get('/', async (req, res) => {
  const inicio = Date.now();
  let dbStatus = 'healthy';
  let dbLatencyMs = 0;
  let errorDb = null;

  try {
    const t0 = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatencyMs = Date.now() - t0;
  } catch (err) {
    dbStatus = 'unhealthy';
    errorDb = err.message;
    logger.error('Health Check detectó fallo de base de datos', { error: err.message });
  }

  const mem = process.memoryUsage();
  const uptimeSegundos = Math.floor(process.uptime());
  const dias = Math.floor(uptimeSegundos / 86400);
  const horas = Math.floor((uptimeSegundos % 86400) / 3600);
  const minutos = Math.floor((uptimeSegundos % 3600) / 60);
  const segundos = uptimeSegundos % 60;
  const uptimeLegible = `${dias}d ${horas}h ${minutos}m ${segundos}s`;

  const esSaludable = dbStatus === 'healthy';
  const statusCode = esSaludable ? 200 : 503;

  const respuesta = {
    status: esSaludable ? 'HEALTHY' : 'DEGRADED',
    servicio: 'Plataforma de Gestión de Incidentes - Despliegue Final',
    version: '4.0.0-production',
    ambiente: process.env.NODE_ENV || 'production',
    timestamp: new Date().toISOString(),
    duracionCheckMs: Date.now() - inicio,
    dependencias: {
      baseDeDatos: {
        tipo: 'SQLite / Prisma ORM',
        status: dbStatus,
        latenciaMs: dbLatencyMs,
        error: errorDb
      }
    },
    sistema: {
      uptimeSegundos,
      uptimeLegible,
      memoria: {
        rssMB: (mem.rss / 1024 / 1024).toFixed(2),
        heapUsedMB: (mem.heapUsed / 1024 / 1024).toFixed(2),
        heapTotalMB: (mem.heapTotal / 1024 / 1024).toFixed(2)
      },
      nodeVersion: process.version,
      plataforma: process.platform
    },
    seguridad: {
      https: Boolean(req.secure || req.headers['x-forwarded-proto'] === 'https'),
      autenticacion: 'JWT Bearer (HMAC-SHA256)',
      rbac: 'admin, supervisor, analista',
      helmet: 'Activo',
      compresionGzip: 'Activo'
    }
  };

  res.status(statusCode).json(respuesta);
});

/**
 * Liveness Probe: Verificación rápida de que el proceso Node.js responde
 */
router.get('/liveness', (req, res) => {
  res.status(200).json({ status: 'UP', timestamp: new Date().toISOString() });
});

/**
 * Readiness Probe: Comprueba si la base de datos está lista para recibir consultas
 */
router.get('/readiness', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: 'READY', db: 'CONNECTED' });
  } catch (err) {
    res.status(503).json({ status: 'NOT_READY', error: err.message });
  }
});

module.exports = router;
