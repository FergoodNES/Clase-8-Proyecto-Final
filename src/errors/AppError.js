class AppError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Recurso no encontrado') {
    super(message, 404);
  }
}

class BadRequestError extends AppError {
  constructor(message = 'Solicitud incorrecta', details = null) {
    super(message, 400, details);
  }
}

class ValidationError extends AppError {
  constructor(message = 'Fallo de validación de entrada', details = null) {
    super(message, 400, details);
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Acceso denegado: Token no proporcionado o inválido') {
    super(message, 401);
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'Permiso denegado: Su rol no cuenta con autorizaciones suficientes') {
    super(message, 403);
  }
}

module.exports = {
  AppError,
  NotFoundError,
  BadRequestError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError
};
