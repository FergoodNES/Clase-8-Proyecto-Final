/**
 * ====================================================================================
 * CAPA DE SERVICIO DE NEGOCIO: IncidenteService
 * Conecta el controlador con el modelo aplicando las reglas de negocio y SLAs.
 * ====================================================================================
 */

const IncidenteModel = require('../models/incidente.model');
const {
  validarTransicionEstado,
  calcularSLA,
  validarAsignacionTecnica,
  calcularIndiceImpacto
} = require('../domain/reglasNegocio');
const { NotFoundError, BadRequestError } = require('../errors/AppError');

class IncidenteService {
  /**
   * Obtiene incidentes con cálculo dinámico de SLAs y métricas.
   */
  static async listarIncidentes(filtros = {}) {
    const { total, incidentes } = await IncidenteModel.findManyWithFilters(filtros);

    // Enriquecer cada incidente con el SLA dinámico
    const incidentesEnriquecidos = incidentes.map(inc => {
      let slaInfo = null;
      try {
        slaInfo = calcularSLA(inc.prioridad, inc.fechaCreacion);
      } catch {
        slaInfo = null;
      }

      return {
        ...inc,
        sla: slaInfo
      };
    });

    return { total, incidentes: incidentesEnriquecidos };
  }

  static async obtenerPorId(id) {
    const incidente = await IncidenteModel.findById(id);
    if (!incidente) {
      throw new NotFoundError(`El incidente #${id} no existe en la base de datos`);
    }

    const sla = calcularSLA(incidente.prioridad, incidente.fechaCreacion);
    const impacto = calcularIndiceImpacto(incidente.prioridad, 10);

    return {
      ...incidente,
      sla,
      impacto
    };
  }

  static async registrarIncidente(datos, usuarioAutenticado) {
    // Regla de autoría segura (previene suplantación de identidad)
    const payload = {
      ...datos,
      reportadoPor: usuarioAutenticado.nombre,
      creadoPorId: usuarioAutenticado.id
    };

    return IncidenteModel.create(payload);
  }

  static async actualizarIncidente(id, cambios, usuarioAutenticado) {
    const incidenteActual = await IncidenteModel.findById(id);
    if (!incidenteActual) {
      throw new NotFoundError(`El incidente #${id} no existe`);
    }

    // Regla de negocio: Validación de transición de estado
    if (cambios.estado && cambios.estado !== incidenteActual.estado) {
      const transicion = validarTransicionEstado(incidenteActual.estado, cambios.estado);
      if (!transicion.permitida) {
        throw new BadRequestError(`Transición rechazada: ${transicion.mensaje}`);
      }
    }

    // Regla de negocio: Validación de asignación técnica
    if (cambios.asignadoA && usuarioAutenticado) {
      const validacionAsign = validarAsignacionTecnica(usuarioAutenticado, incidenteActual.estado);
      if (!validacionAsign.valido) {
        throw new BadRequestError(`Asignación no permitida: ${validacionAsign.razon}`);
      }
    }

    return IncidenteModel.update(id, cambios);
  }

  static async eliminarIncidente(id) {
    const incidente = await IncidenteModel.findById(id);
    if (!incidente) {
      throw new NotFoundError(`El incidente #${id} no existe para ser eliminado`);
    }

    return IncidenteModel.delete(id);
  }

  static async obtenerKPIs() {
    return IncidenteModel.getEstadisticas();
  }
}

module.exports = IncidenteService;
