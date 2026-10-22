const express = require('express');
const router = express.Router();
const incidenteController = require('../controllers/incidente.controller');
const { autenticarToken, autorizarRoles } = require('../middlewares/auth');
const { validateBody, validateQuery } = require('../middlewares/validate');
const {
  crearIncidenteSchema,
  actualizarIncidenteSchema,
  filtroIncidentesSchema
} = require('../schemas/incidente.schema');

// 🔒 REGLA DE ORO DE SEGURIDAD: Todas las rutas de incidentes requieren autenticación obligatoria (JWT)
router.use(autenticarToken);

// Estadísticas de incidentes (Analista, Supervisor, Admin)
router.get('/estadisticas', autorizarRoles('analista', 'supervisor', 'admin'), incidenteController.getEstadisticas);

// Consultar lista de incidentes (Analista, Supervisor, Admin)
router.get('/', autorizarRoles('analista', 'supervisor', 'admin'), validateQuery(filtroIncidentesSchema), incidenteController.getIncidentes);

// Consultar detalle por ID (Analista, Supervisor, Admin)
router.get('/:id', autorizarRoles('analista', 'supervisor', 'admin'), incidenteController.getIncidenteById);

// Registrar nuevo incidente (Exclusivo Analista y Administrador)
router.post('/', autorizarRoles('analista', 'admin'), validateBody(crearIncidenteSchema), incidenteController.createIncidente);

// Actualizar incidente (Analista, Supervisor, Administrador)
router.put('/:id', autorizarRoles('analista', 'supervisor', 'admin'), validateBody(actualizarIncidenteSchema), incidenteController.updateIncidente);
router.patch('/:id', autorizarRoles('analista', 'supervisor', 'admin'), validateBody(actualizarIncidenteSchema), incidenteController.updateIncidente);

// Eliminar incidente (EXCLUSIVO Administrador -> Si Analista o Supervisor intenta -> 403 Forbidden)
router.delete('/:id', autorizarRoles('admin'), incidenteController.deleteIncidente);

module.exports = router;
