/**
 * ====================================================================================
 * MÓDULO DE REGLAS DE NEGOCIO DEL DOMINIO DE INCIDENTES (UNIDAD 7)
 * Lógica pura de negocio desacoplada de frameworks y bases de datos.
 * ====================================================================================
 */

const ESTADOS_VALIDOS = ['ABIERTO', 'EN_PROGRESO', 'RESUELTO', 'CERRADO'];
const PRIORIDADES_VALIDAS = ['BAJA', 'MEDIA', 'ALTA', 'CRITICA'];

const SLA_CONFIG_HORAS = {
  CRITICA: 4,
  ALTA: 8,
  MEDIA: 24,
  BAJA: 72
};

const ROLES_OPERATIVOS = ['ADMIN', 'SUPERVISOR', 'TECNICO', 'ANALISTA'];

/**
 * Valida si una transición de estado de un incidente es permitida según la máquina de estados.
 * Regla:
 *  - ABIERTO -> EN_PROGRESO o RESUELTO (resolución directa de primer contacto)
 *  - EN_PROGRESO -> RESUELTO o ABIERTO
 *  - RESUELTO -> CERRADO o EN_PROGRESO (reapertura)
 *  - CERRADO es terminal y no permite transiciones
 *  - PROHIBIDO: ABIERTO -> CERRADO (no se puede cerrar sin resolución previa)
 */
function validarTransicionEstado(estadoActual, nuevoEstado) {
  if (!ESTADOS_VALIDOS.includes(estadoActual)) {
    throw new Error(`Estado actual '${estadoActual}' no es válido`);
  }
  if (!ESTADOS_VALIDOS.includes(nuevoEstado)) {
    throw new Error(`Nuevo estado '${nuevoEstado}' no es válido`);
  }

  if (estadoActual === nuevoEstado) {
    return { permitida: true, mensaje: 'Sin cambio de estado' };
  }

  if (estadoActual === 'CERRADO') {
    return {
      permitida: false,
      mensaje: 'Un incidente en estado CERRADO es terminal e inmutable'
    };
  }

  if (estadoActual === 'ABIERTO') {
    if (nuevoEstado === 'EN_PROGRESO') {
      return { permitida: true, mensaje: 'Transición válida a atención operativa' };
    }
    if (nuevoEstado === 'RESUELTO') {
      return { permitida: true, mensaje: 'Resolución directa de primer contacto (FCR)' };
    }
    return {
      permitida: false,
      mensaje: `No se permite transicionar de ABIERTO a ${nuevoEstado} directamente sin resolver el problema`
    };
  }

  if (estadoActual === 'EN_PROGRESO') {
    if (nuevoEstado === 'RESUELTO') {
      return { permitida: true, mensaje: 'Incidente solucionado por el técnico' };
    }
    if (nuevoEstado === 'ABIERTO') {
      return { permitida: true, mensaje: 'Devolución de incidente a bandeja inicial' };
    }
    return {
      permitida: false,
      mensaje: 'Un incidente en progreso debe ser RESUELTO antes de cerrarse formalmente'
    };
  }

  if (estadoActual === 'RESUELTO') {
    if (nuevoEstado === 'CERRADO') {
      return { permitida: true, mensaje: 'Cierre formal y conformidad del usuario' };
    }
    if (nuevoEstado === 'EN_PROGRESO') {
      return { permitida: true, mensaje: 'Reapertura de incidente por inconformidad o falla recurrente' };
    }
    return {
      permitida: false,
      mensaje: `Transición no válida de RESUELTO a ${nuevoEstado}`
    };
  }

  return { permitida: false, mensaje: 'Transición no contemplada' };
}

/**
 * Calcula el SLA límite y el estado de cumplimiento en base a la prioridad y fecha de creación.
 */
function calcularSLA(prioridad, fechaCreacion, fechaReferencia = new Date()) {
  const prioridadNorm = (prioridad || '').toUpperCase();
  if (!PRIORIDADES_VALIDAS.includes(prioridadNorm)) {
    throw new Error(`Prioridad '${prioridad}' no reconocida para cálculo de SLA`);
  }

  const creacion = new Date(fechaCreacion);
  if (isNaN(creacion.getTime())) {
    throw new Error('Fecha de creación inválida');
  }

  const horasSLA = SLA_CONFIG_HORAS[prioridadNorm];
  const fechaLimite = new Date(creacion.getTime() + horasSLA * 60 * 60 * 1000);
  const referencia = new Date(fechaReferencia);

  const tiempoTotalMs = fechaLimite.getTime() - creacion.getTime();
  const tiempoRestanteMs = fechaLimite.getTime() - referencia.getTime();
  const minutosRestantes = Math.round(tiempoRestanteMs / (1000 * 60));

  let estadoSLA = 'DENTRO_DE_TIEMPO';
  if (tiempoRestanteMs <= 0) {
    estadoSLA = 'VENCIDO';
  } else if (tiempoRestanteMs / tiempoTotalMs <= 0.25) {
    estadoSLA = 'EN_RIESGO';
  }

  return {
    prioridad: prioridadNorm,
    horasSLA,
    fechaLimite: fechaLimite.toISOString(),
    minutosRestantes,
    estadoSLA,
    esVencido: estadoSLA === 'VENCIDO'
  };
}

/**
 * Valida la asignación operativa según el rol del usuario asignado y el estado del incidente.
 */
function validarAsignacionTecnica(usuario, estadoIncidente) {
  if (!usuario || typeof usuario !== 'object') {
    throw new Error('Datos de usuario requeridos para validación de asignación');
  }

  if (estadoIncidente === 'CERRADO') {
    return {
      valido: false,
      razon: 'No se puede modificar la asignación de un incidente ya cerrado'
    };
  }

  const rol = (usuario.rol || '').toUpperCase();
  if (!ROLES_OPERATIVOS.includes(rol)) {
    return {
      valido: false,
      razon: `El rol '${rol}' no posee facultades operativas para resolver incidentes`
    };
  }

  return {
    valido: true,
    razon: `Asignación autorizada para personal con rol ${rol}`
  };
}

/**
 * Calcula el MTTR (Mean Time to Resolve / Tiempo Medio de Resolución) en horas para una lista de incidentes resueltos.
 */
function calcularMTTR(incidentes) {
  if (!Array.isArray(incidentes) || incidentes.length === 0) {
    return { totalAnalizados: 0, mttrHoras: 0, promedioMinutos: 0 };
  }

  const resueltos = incidentes.filter(inc => inc.fechaResolucion && inc.fechaCreacion);
  if (resueltos.length === 0) {
    return { totalAnalizados: 0, mttrHoras: 0, promedioMinutos: 0 };
  }

  let acumuladorMinutos = 0;
  for (const inc of resueltos) {
    const fIni = new Date(inc.fechaCreacion).getTime();
    const fFin = new Date(inc.fechaResolucion).getTime();
    if (fFin < fIni) {
      throw new Error(`Inconsistencia temporal: fechaResolucion anterior a fechaCreacion en incidente ID ${inc.id || 'desconocido'}`);
    }
    const diffMin = (fFin - fIni) / (1000 * 60);
    acumuladorMinutos += diffMin;
  }

  const promedioMinutos = Math.round(acumuladorMinutos / resueltos.length);
  const mttrHoras = Number((promedioMinutos / 60).toFixed(2));

  return {
    totalAnalizados: resueltos.length,
    promedioMinutos,
    mttrHoras
  };
}

/**
 * Calcula el índice de severidad e impacto ponderado de un incidente.
 */
function calcularIndiceImpacto(prioridad, usuariosAfectados = 1) {
  const pesos = { BAJA: 1, MEDIA: 2.5, ALTA: 5, CRITICA: 10 };
  const peso = pesos[(prioridad || '').toUpperCase()] || 1;
  const afectados = Math.max(1, parseInt(usuariosAfectados, 10) || 1);

  // Score logarítmico calibrado de 1 a 100
  const score = Math.min(100, Math.round(peso * Math.log2(afectados + 1) * 10));

  let nivelImpacto = 'BAJO';
  if (score >= 70) nivelImpacto = 'CRITICO';
  else if (score >= 45) nivelImpacto = 'ALTO';
  else if (score >= 20) nivelImpacto = 'MEDIO';

  return { score, nivelImpacto, usuariosAfectados: afectados };
}

module.exports = {
  ESTADOS_VALIDOS,
  PRIORIDADES_VALIDAS,
  SLA_CONFIG_HORAS,
  validarTransicionEstado,
  calcularSLA,
  validarAsignacionTecnica,
  calcularMTTR,
  calcularIndiceImpacto
};
