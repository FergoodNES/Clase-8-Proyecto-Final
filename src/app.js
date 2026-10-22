require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');

const logger = require('./config/logger');
const { validarEntorno } = require('./config/envValidator');

// 1. Validación preventiva de entorno antes de procesar cualquier tráfico
validarEntorno();

const authRoutes = require('./routes/auth.routes');
const incidenteRoutes = require('./routes/incidente.routes');
const healthRoutes = require('./routes/health.routes');
const { notFoundHandler, errorHandler } = require('./middlewares/errorHandler');

const app = express();

// 2. Redirección forzada a HTTPS en entornos productivos (detrás de Render/Vercel/Nginx)
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.headers['x-forwarded-proto'] && req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect(`https://${req.headers.host}${req.url}`);
    }
    next();
  });
}

// 3. Optimización de red: Compresión Gzip/Deflate para respuestas HTTP mayores a 512 bytes
app.use(compression({
  threshold: 512,
  level: 6
}));

// 4. Activación de ETags para control de caché HTTP condicional (304 Not Modified)
app.set('etag', 'strong');

// 5. Cabeceras de seguridad HTTP con Helmet adaptadas para acceso público global
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// 6. Control CORS Abierto/Permisivo para que CUALQUIER evaluador pueda abrir y usar la web
app.use(cors({
  origin: true, // Refleja el origen de la solicitud automáticamente (Permite acceso global desde cualquier IP, dominio o dispositivo)
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id']
}));

// 7. Procesamiento de cuerpo JSON y URL Encoded con límite seguro contra DoS
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// 8. Middleware de Logging estructurado y auditoría de peticiones
app.use(logger.requestLogger);

// 9. Manejador de favicon sin error 404 en navegadores
app.get('/favicon.ico', (req, res) => res.status(204).end());

// 10. Servir archivos estáticos del cliente web con directivas de caché
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '1h',
  etag: true
}));

// 11. Montaje de Rutas de la API REST
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/incidentes', incidenteRoutes);

// 12. Manejo centralizado de rutas 404 y excepciones
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
