const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    error: {
      codigo: 'NOT_FOUND',
      mensaje: `La ruta solicitada ${req.method} ${req.originalUrl} no existe en este servidor.`
    }
  });
};

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let codigo = err.name || 'INTERNAL_SERVER_ERROR';
  let mensaje = err.message || 'Ocurrió un error interno en el servidor';
  let detalles = err.details || null;

  // Error CORS
  if (err.message && err.message.includes('CORS')) {
    statusCode = 403;
    codigo = 'CORS_POLICY_VIOLATION';
    mensaje = 'Origen no autorizado por política de seguridad CORS';
  }

  // ZodError
  if (err.name === 'ZodError') {
    statusCode = 400;
    codigo = 'ValidationError';
    mensaje = 'Fallo de validación de entrada';
    const issues = err.issues || err.errors || [];
    detalles = issues.map(i => ({
      campo: i.path?.join('.') || 'general',
      mensaje: i.message
    }));
  }

  // Prisma Errors
  if (err.code && err.code.startsWith('P')) {
    switch (err.code) {
      case 'P2025':
        statusCode = 404;
        codigo = 'RECORD_NOT_FOUND';
        mensaje = 'El registro solicitado no existe en la base de datos.';
        break;
      case 'P2002':
        statusCode = 409;
        codigo = 'DUPLICATE_KEY_ERROR';
        mensaje = `Ya existe un registro con el mismo valor para el campo: ${err.meta?.target || 'único'}.`;
        break;
      default:
        statusCode = 500;
        codigo = 'DATABASE_ERROR';
        mensaje = 'Error al ejecutar la operación en la base de datos.';
    }
  }

  // SyntaxError en JSON
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    statusCode = 400;
    codigo = 'INVALID_JSON_BODY';
    mensaje = 'El cuerpo de la solicitud JSON contiene errores de sintaxis.';
  }

  if (statusCode === 500 && process.env.NODE_ENV !== 'test') {
    console.error('💥 [ERROR INTERNO]:', err);
  }

  res.status(statusCode).json({
    success: false,
    error: {
      codigo,
      mensaje,
      detalles,
      ...(process.env.NODE_ENV === 'development' && statusCode === 500 ? { stack: err.stack } : {})
    }
  });
};

module.exports = {
  notFoundHandler,
  errorHandler
};
