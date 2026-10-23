const fs = require('fs');
const path = require('path');

// Auto-crear .env desde .env.example si no existe (portabilidad en nuevas computadoras)
const envFile = path.resolve(__dirname, '../.env');
const envExample = path.resolve(__dirname, '../.env.example');
if (!fs.existsSync(envFile) && fs.existsSync(envExample)) {
  fs.copyFileSync(envExample, envFile);
}

const app = require('./app');
const prisma = require('./config/db');
const logger = require('./config/logger');
const { execSync } = require('child_process');

const PORT = process.env.PORT || 3000;

async function bootstrap() {
  try {
    // 1. Auto-verificar y auto-reparar base de datos en cualquier PC
    try {
      await prisma.$connect();
      const count = await prisma.usuario.count();
      if (count === 0) {
        logger.info('Base de datos inicializada sin datos. Ejecutando seed automatico...');
        execSync('node prisma/seed.js', { stdio: 'inherit' });
      }
    } catch (dbErr) { logger.info('Reintentando esquema:', { error: dbErr.message });
      logger.info('Tablas no inicializadas en esta maquina. Auto-creando esquema y usuarios...');
      execSync('npx prisma db push --skip-generate', { stdio: 'inherit' });
      execSync('node prisma/seed.js', { stdio: 'inherit' });
      await prisma.$connect();
    }

    logger.info('Conexion con base de datos SQLite establecida correctamente');
    console.log('[OK] Conexion con base de datos SQLite lista.');

    const server = app.listen(PORT, () => {
      logger.info(`Servidor Productivo escuchando en el puerto ${PORT}`, { puerto: PORT, ambiente: process.env.NODE_ENV || 'production' });
      console.log(`[OK] Servidor Productivo ejecutandose en http://localhost:${PORT}`);
      console.log(`[OK] Interfaz Web Integrada: http://localhost:${PORT}`);
      console.log(`[OK] Health Check & Monitoreo: http://localhost:${PORT}/api/health`);
      console.log(`[OK] Endpoints de Autenticacion: http://localhost:${PORT}/api/auth/login`);
      console.log(`[OK] Endpoints Protegidos: http://localhost:${PORT}/api/incidentes`);
    });

    const gracefulShutdown = async (signal) => {
      logger.warn(`Senal ${signal} recibida. Cerrando servidor de manera ordenada...`);
      console.log(`\n[${signal}] Cerrando servidor de manera ordenada...`);
      server.close(async () => {
        await prisma.$disconnect();
        logger.info('Conexiones a base de datos y socket HTTP cerradas con exito.');
        console.log('[OK] Conexiones cerradas con exito.');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

  } catch (error) {
    logger.error('Error fatal al iniciar el servidor:', { error: error.message, stack: error.stack });
    console.error('[ERROR] Error al iniciar el servidor:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

bootstrap();

