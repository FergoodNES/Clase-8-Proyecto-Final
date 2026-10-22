const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { validateBody } = require('../middlewares/validate');
const { loginSchema } = require('../schemas/auth.schema');
const { autenticarToken } = require('../middlewares/auth');

router.post('/login', validateBody(loginSchema), authController.login);
router.get('/perfil', autenticarToken, authController.perfil);

module.exports = router;
