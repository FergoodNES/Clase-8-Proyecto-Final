const jwt = require('jsonwebtoken');
const { UnauthorizedError, ForbiddenError } = require('../errors/AppError');

const JWT_SECRET = process.env.JWT_SECRET || 'clave_secreta_jwt_reto3_seguridad_plataforma_2026';

/**
 * Middleware para verificar la autenticidad del Token JWT (Autenticación -> 401)
 */
function autenticarToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Formato: "Bearer <token>"

  if (!token) {
    return next(new UnauthorizedError('Acceso denegado: Token no proporcionado'));
  }

  jwt.verify(token, JWT_SECRET, (err, usuarioDecodificado) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return next(new UnauthorizedError('Sesión expirada. Por favor inicie sesión nuevamente'));
      }
      return next(new UnauthorizedError('Token inválido o alterado criptográficamente'));
    }

    req.usuario = usuarioDecodificado;
    next();
  });
}

/**
 * Middleware para autorización por roles basada en menor privilegio (RBAC -> 403)
 */
function autorizarRoles(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.usuario || !rolesPermitidos.includes(req.usuario.rol)) {
      return next(new ForbiddenError(
        `Permiso denegado: Su rol '${req.usuario?.rol || 'anónimo'}' no tiene autorización para realizar esta acción. Roles permitidos: [${rolesPermitidos.join(', ')}]`
      ));
    }
    next();
  };
}

module.exports = {
  autenticarToken,
  autorizarRoles,
  JWT_SECRET
};
