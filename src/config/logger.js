/**
 * ====================================================================================
 * SISTEMA DE LOGGING ESTRUCTURADO Y AUDITORÍA OPERATIVA (TEMA 15.4 / UNIDAD 8)
 * - Registros estructurados en formato JSON y texto legible
 * - Niveles: INFO, WARN, ERROR, DEBUG
 * - Filtrado y sanitización estricta de secretos (previene fuga de passwords y tokens)
 * - Persistencia en disco (logs/app.log) y salida estándar en consola
 * ====================================================================================
 */

const fs = require('fs');
const path = require('path');

// Directorio de logs del proyecto
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logFilePath = path.join(logsDir, 'app.log');

// Lista negra de claves sensibles que jamás deben registrarse en texto plano
const CLAVES_SENSIBLES = ['password', 'contrasena', 'token', 'authorization', 'secret', 'jwt'];

/**
 * Sanitiza recursivamente objetos eliminando datos sensibles
 */
function sanitizarParaLog(data) {
  if (!data || typeof data !== 'object') return data;
  if (Array.isArray(data)) return data.map(sanitizarParaLog);

  const copia = {};
  for (const [k, v] of Object.entries(data)) {
    if (CLAVES_SENSIBLES.some(s => k.toLowerCase().includes(s))) {
      copia[k] = '[OCULTO_POR_SEGURIDAD]';
    } else if (typeof v === 'object' && v !== null) {
      copia[k] = sanitizarParaLog(v);
    } else {
      copia[k] = v;
    }
  }
  return copia;
}

/**
 * Escribe una entrada estructurada en disco y consola
 */
function registrar(nivel, mensaje, metadata = {}) {
  const timestamp = new Date().toISOString();
  const metaSanitizada = sanitizarParaLog(metadata);

  const entradaLog = {
    timestamp,
    nivel: nivel.toUpperCase(),
    mensaje,
    ambiente: process.env.NODE_ENV || 'production',
    pid: process.pid,
    ...metaSanitizada
  };

  const lineaJson = JSON.stringify(entradaLog);

  // 1. Escritura asíncrona no bloqueante en archivo físico
  fs.appendFile(logFilePath, lineaJson + '\n', (err) => {
    if (err) console.error('Error al persistir log en disco:', err.message);
  });

  // 2. Salida en consola formateada según el nivel
  const colorNivel = {
    INFO: '\x1b[32m[INFO]\x1b[0m',
    WARN: '\x1b[33m[WARN]\x1b[0m',
    ERROR: '\x1b[31m[ERROR]\x1b[0m',
    DEBUG: '\x1b[36m[DEBUG]\x1b[0m'
  }[nivel.toUpperCase()] || `[${nivel}]`;

  if (process.env.NODE_ENV !== 'test') {
    const metaStr = Object.keys(metaSanitizada).length ? JSON.stringify(metaSanitizada) : '';
    console.log(`${timestamp} ${colorNivel} ${mensaje} ${metaStr}`);
  }

  return entradaLog;
}

const logger = {
  info: (msg, meta) => registrar('INFO', msg, meta),
  warn: (msg, meta) => registrar('WARN', msg, meta),
  error: (msg, meta) => registrar('ERROR', msg, meta),
  debug: (msg, meta) => registrar('DEBUG', msg, meta),

  /**
   * Middleware para Express que audita cada petición HTTP con tiempos y códigos de respuesta
   */
  requestLogger: (req, res, next) => {
    const inicio = Date.now();
    const requestId = req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    req.requestId = requestId;
    res.setHeader('X-Request-Id', requestId);

    res.on('finish', () => {
      const duracionMs = Date.now() - inicio;
      const meta = {
        requestId,
        metodo: req.method,
        ruta: req.originalUrl || req.url,
        statusCode: res.statusCode,
        duracionMs,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent']
      };

      if (res.statusCode >= 500) {
        logger.error(`HTTP ${req.method} ${req.url} -> Error de Servidor (${res.statusCode})`, meta);
      } else if (res.statusCode >= 400) {
        logger.warn(`HTTP ${req.method} ${req.url} -> Solicitud Rechazada (${res.statusCode})`, meta);
      } else {
        logger.info(`HTTP ${req.method} ${req.url} -> Éxito (${res.statusCode}) [${duracionMs}ms]`, meta);
      }
    });

    next();
  }
};

module.exports = logger;
