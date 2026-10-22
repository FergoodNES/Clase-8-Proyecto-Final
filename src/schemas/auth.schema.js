const { z } = require('zod');

const loginSchema = z.object({
  email: z.string({
    required_error: 'El correo electrónico es obligatorio'
  }).email('El formato del correo electrónico no es válido').trim().toLowerCase(),

  password: z.string({
    required_error: 'La contraseña es obligatoria'
  }).min(6, 'La contraseña debe contener al menos 6 caracteres')
});

module.exports = {
  loginSchema
};
