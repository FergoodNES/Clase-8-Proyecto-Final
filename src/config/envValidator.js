/**
 * ====================================================================================
 * VALIDACIÓN ESTRICTA DE VARIABLES DE ENTORNO (TEMA 15.2 / UNIDAD 8)
 * Verifica que todas las variables requeridas existan y cumplan con los criterios
 * de seguridad antes de permitir que el servidor comience a escuchar tráfico.
 * ====================================================================================
 */

const logger = require('./logger');

const VARIABLES_REQUERIDAS = [
  { nombre: 'PORT', descripcion: 'Puerto de escucha HTTP del servidor', default: '3000' },
  { nombre: 'DATABASE_URL', descripcion: 'Cadena de conexión a SQLite/Prisma', default: 'file:./dev.db' },
  { nombre: 'JWT_SECRET', descripcion: 'Clave criptográfica para firmas HMAC-SHA256 de tokens', default: 'secreto_super_seguro_para_jwt_retos_puce_2026_min32' },
  { nombre: 'ALLOWED_ORIGINS', descripcion: 'Lista blanca de orígenes CORS permitidos', default: 'http://localhost:3000,http://127.0.0.1:3000' }
];

function validarEntorno() {
  const faltantes = [];
  const advertencias = [];

  for (const v of VARIABLES_REQUERIDAS) {
    if (!process.env[v.nombre]) {
      if (process.env.NODE_ENV === 'production') {
        faltantes.push(v.nombre);
      } else {
        // En desarrollo aplicamos valor seguro por defecto con advertencia
        process.env[v.nombre] = v.default;
        advertencias.push(`Variable ${v.nombre} no definida. Usando valor predeterminado para desarrollo.`);
      }
    }
  }

  // Validación de robustez de secreto JWT
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 16) {
    const msg = 'JWT_SECRET es demasiado corta. Debe tener al menos 16 caracteres para garantizar seguridad criptográfica.';
    if (process.env.NODE_ENV === 'production') {
      faltantes.push('JWT_SECRET (longitud insuficiente)');
    } else {
      advertencias.push(msg);
    }
  }

  if (faltantes.length > 0) {
    const errorMsg = `ERROR CRÍTICO AL INICIAR: Faltan variables de entorno obligatorias en producción: ${faltantes.join(', ')}`;
    logger.error(errorMsg, { faltantes });
    console.error(`\x1b[31m${errorMsg}\x1b[0m`);
    process.exit(1);
  }

  if (advertencias.length > 0) {
    advertencias.forEach(adv => logger.warn(adv));
  }

  logger.info('Verificación de variables de entorno superada exitosamente', {
    ambiente: process.env.NODE_ENV || 'production',
    puerto: process.env.PORT,
    corsOrigenes: process.env.ALLOWED_ORIGINS
  });

  return true;
}

module.exports = {
  validarEntorno,
  VARIABLES_REQUERIDAS
};
