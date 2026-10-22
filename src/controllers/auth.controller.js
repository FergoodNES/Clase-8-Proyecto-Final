const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/db');
const { UnauthorizedError } = require('../errors/AppError');
const { JWT_SECRET } = require('../middlewares/auth');

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const usuario = await prisma.usuario.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!usuario) {
      // Mensaje genérico para evitar enumeración de usuarios (CWE-200)
      throw new UnauthorizedError('Credenciales incorrectas: correo o contraseña inválidos');
    }

    const coincide = await bcrypt.compare(password, usuario.password);
    if (!coincide) {
      throw new UnauthorizedError('Credenciales incorrectas: correo o contraseña inválidos');
    }

    // Generar token JWT firmado
    const payload = {
      id: usuario.id,
      email: usuario.email,
      nombre: usuario.nombre,
      rol: usuario.rol
    };

    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '8h'
    });

    res.status(200).json({
      success: true,
      mensaje: 'Inicio de sesión exitoso',
      token,
      usuario: payload
    });
  } catch (error) {
    next(error);
  }
};

const perfil = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      usuario: req.usuario
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  perfil
};
