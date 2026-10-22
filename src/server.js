const app = require('./app');
const prisma = require('./config/db');
const logger = require('./config/logger');

const PORT = process.env.PORT || 3000;

async function bootstrap() {
  try {
    await prisma.$connect();
    logger.info('Conexión con base de datos SQLite establecida correctamente');
    console.log('✅ Conexión con base de datos SQLite establecida.');

    const server = app.listen(PORT, () => {
      logger.info(`Servidor Productivo escuchando en el puerto ${PORT}`, { puerto: PORT, ambiente: process.env.NODE_ENV || 'production' });
      console.log(`🚀 Servidor Productivo ejecutándose en http://localhost:${PORT}`);
      console.log(`🌐 Interfaz Web Integrada: http://localhost:${PORT}`);
      console.log(`📊 Health Check & Monitoreo: http://localhost:${PORT}/api/health`);
      console.log(`🔑 Endpoints de Autenticación: http://localhost:${PORT}/api/auth/login`);
      console.log(`🛡️ Endpoints Protegidos: http://localhost:${PORT}/api/incidentes`);
    });

    const gracefulShutdown = async (signal) => {
      logger.warn(`Señal ${signal} recibida. Cerrando servidor de manera ordenada...`);
      console.log(`\n[${signal}] Cerrando servidor de manera ordenada...`);
      server.close(async () => {
        await prisma.$disconnect();
        logger.info('Conexiones a base de datos y socket HTTP cerradas con éxito.');
        console.log('🛑 Conexiones cerradas con éxito.');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

  } catch (error) {
    logger.error('Error fatal al iniciar el servidor:', { error: error.message, stack: error.stack });
    console.error('❌ Error al iniciar el servidor:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

bootstrap();
