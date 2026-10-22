/**
 * ====================================================================================
 * CONTROLADOR REFACTORIZADO BAJO MVC (C EN MVC): IncidenteController
 * Orquesta peticiones HTTP delegando lógica de negocio y persistencia a servicios/modelos.
 * ====================================================================================
 */

const IncidenteService = require('../services/incidente.service');
const { BadRequestError } = require('../errors/AppError');

const getIncidentes = async (req, res, next) => {
  try {
    const { estado, prioridad, buscar, ordenarPor, direccion, take, skip, resumen } = req.query;

    const { total, incidentes } = await IncidenteService.listarIncidentes({
      estado,
      prioridad,
      buscar,
      ordenarPor,
      direccion,
      take,
      skip,
      soloResumen: resumen === 'true'
    });

    // Optimización de red: Cabeceras de control de caché condicional (HTTP 304)
    res.setHeader('Cache-Control', 'public, max-age=15, stale-while-revalidate=30');

    res.status(200).json({
      success: true,
      total,
      data: incidentes
    });
  } catch (error) {
    next(error);
  }
};

const getIncidenteById = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      throw new BadRequestError('El parámetro ID debe ser un número entero válido');
    }

    const incidente = await IncidenteService.obtenerPorId(id);

    res.status(200).json({
      success: true,
      data: incidente
    });
  } catch (error) {
    next(error);
  }
};

const createIncidente = async (req, res, next) => {
  try {
    const nuevoIncidente = await IncidenteService.registrarIncidente(req.body, req.usuario);

    res.status(201).json({
      success: true,
      mensaje: 'Incidente registrado exitosamente',
      data: nuevoIncidente
    });
  } catch (error) {
    next(error);
  }
};

const updateIncidente = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      throw new BadRequestError('El parámetro ID debe ser un número entero válido');
    }

    const actualizado = await IncidenteService.actualizarIncidente(id, req.body, req.usuario);

    res.status(200).json({
      success: true,
      mensaje: `Incidente #${id} actualizado exitosamente`,
      data: actualizado
    });
  } catch (error) {
    next(error);
  }
};

const deleteIncidente = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      throw new BadRequestError('El parámetro ID debe ser un número entero válido');
    }

    await IncidenteService.eliminarIncidente(id);

    res.status(200).json({
      success: true,
      mensaje: `Incidente #${id} eliminado exitosamente`
    });
  } catch (error) {
    next(error);
  }
};

const getEstadisticas = async (req, res, next) => {
  try {
    const stats = await IncidenteService.obtenerKPIs();
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getIncidentes,
  getIncidenteById,
  createIncidente,
  updateIncidente,
  deleteIncidente,
  getEstadisticas
};
