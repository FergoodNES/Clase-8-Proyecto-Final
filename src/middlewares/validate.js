const { ValidationError } = require('../errors/AppError');

/**
 * Función para sanitizar texto plano eliminando caracteres de inyección de script básicos
 */
function sanitizarTexto(valor) {
  if (typeof valor !== 'string') return valor;
  return valor
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Elimina etiquetas script
    .replace(/[<>]/g, ''); // Remueve etiquetas HTML directas en campos de texto
}

/**
 * Middleware para validar y sanitizar el cuerpo (body) con esquema Zod
 */
const validateBody = (schema) => (req, res, next) => {
  try {
    // Sanitizar cadenas dentro del cuerpo de la petición
    if (req.body && typeof req.body === 'object') {
      for (const clave of Object.keys(req.body)) {
        if (typeof req.body[clave] === 'string') {
          req.body[clave] = sanitizarTexto(req.body[clave]);
        }
      }
    }

    const validatedData = schema.parse(req.body);
    req.body = validatedData;
    next();
  } catch (error) {
    const issues = error.issues || error.errors;
    if (issues && Array.isArray(issues)) {
      const formattedErrors = issues.map(err => ({
        campo: err.path.join('.') || 'body',
        mensaje: err.message
      }));
      return next(new ValidationError('Fallo de validación de entrada', formattedErrors));
    }
    next(error);
  }
};

/**
 * Middleware para validar parámetros query con esquema Zod
 */
const validateQuery = (schema) => (req, res, next) => {
  try {
    const validatedQuery = schema.parse(req.query);
    req.query = validatedQuery;
    next();
  } catch (error) {
    const issues = error.issues || error.errors;
    if (issues && Array.isArray(issues)) {
      const formattedErrors = issues.map(err => ({
        parametro: err.path.join('.') || 'query',
        mensaje: err.message
      }));
      return next(new ValidationError('Parámetros de búsqueda o filtro inválidos', formattedErrors));
    }
    next(error);
  }
};

module.exports = {
  validateBody,
  validateQuery,
  sanitizarTexto
};
