/**
 * ====================================================================================
 * SUITE DE PRUEBAS UNITARIAS CON JEST - REGLAS DE NEGOCIO (UNIDAD 7)
 * Cobertura de lógica de negocio pura: Máquina de estados, SLAs, asignación y métricas
 * ====================================================================================
 */

const {
  validarTransicionEstado,
  calcularSLA,
  validarAsignacionTecnica,
  calcularMTTR,
  calcularIndiceImpacto
} = require('../src/domain/reglasNegocio');

describe('PRUEBAS UNITARIAS: Reglas de Negocio del Sistema de Incidentes (Jest)', () => {

  describe('1. Regla de Transición de Estados (Máquina de Estados Finita)', () => {
    test('Permite transición legal de ABIERTO a EN_PROGRESO', () => {
      const resultado = validarTransicionEstado('ABIERTO', 'EN_PROGRESO');
      expect(resultado.permitida).toBe(true);
    });

    test('Permite transición legal de EN_PROGRESO a RESUELTO', () => {
      const resultado = validarTransicionEstado('EN_PROGRESO', 'RESUELTO');
      expect(resultado.permitida).toBe(true);
    });

    test('Permite transición legal de RESUELTO a CERRADO', () => {
      const resultado = validarTransicionEstado('RESUELTO', 'CERRADO');
      expect(resultado.permitida).toBe(true);
    });

    test('Permite reapertura controlada de RESUELTO a EN_PROGRESO', () => {
      const resultado = validarTransicionEstado('RESUELTO', 'EN_PROGRESO');
      expect(resultado.permitida).toBe(true);
      expect(resultado.mensaje).toContain('Reapertura');
    });

    test('Prohíbe transición directa ilegal de ABIERTO a CERRADO', () => {
      const resultado = validarTransicionEstado('ABIERTO', 'CERRADO');
      expect(resultado.permitida).toBe(false);
      expect(resultado.mensaje).toContain('No se permite transicionar de ABIERTO a CERRADO');
    });

    test('Prohíbe transiciones salientes desde el estado terminal CERRADO', () => {
      const resultado = validarTransicionEstado('CERRADO', 'ABIERTO');
      expect(resultado.permitida).toBe(false);
      expect(resultado.mensaje).toContain('terminal e inmutable');
    });

    test('Rechaza estados inválidos arrojando una excepción defensiva', () => {
      expect(() => validarTransicionEstado('INEXISTENTE', 'ABIERTO')).toThrow('no es válido');
      expect(() => validarTransicionEstado('ABIERTO', 'ESTADO_FALSO')).toThrow('no es válido');
    });
  });

  describe('2. Regla de Cálculo y Cumplimiento de SLA por Criticidad', () => {
    const FECHA_BASE = '2026-10-15T10:00:00.000Z';

    test('Calcula límite exacto de 4 horas para prioridad CRITICA', () => {
      const ref = '2026-10-15T11:00:00.000Z'; // 1 hora después
      const sla = calcularSLA('CRITICA', FECHA_BASE, ref);
      expect(sla.horasSLA).toBe(4);
      expect(sla.estadoSLA).toBe('DENTRO_DE_TIEMPO');
      expect(sla.minutosRestantes).toBe(180); // 3 horas restantes
      expect(sla.esVencido).toBe(false);
    });

    test('Detecta estado EN_RIESGO cuando queda menos del 25% del tiempo', () => {
      const ref = '2026-10-15T13:30:00.000Z'; // 3.5 horas de 4 transcurridas (quedan 30 min = 12.5%)
      const sla = calcularSLA('CRITICA', FECHA_BASE, ref);
      expect(sla.estadoSLA).toBe('EN_RIESGO');
      expect(sla.minutosRestantes).toBe(30);
      expect(sla.esVencido).toBe(false);
    });

    test('Detecta estado VENCIDO cuando la fecha de referencia supera la fecha límite', () => {
      const ref = '2026-10-15T14:30:00.000Z'; // 4.5 horas transcurridas
      const sla = calcularSLA('CRITICA', FECHA_BASE, ref);
      expect(sla.estadoSLA).toBe('VENCIDO');
      expect(sla.esVencido).toBe(true);
      expect(sla.minutosRestantes).toBeLessThan(0);
    });

    test('Calcula límites estándar de 24 horas para prioridad MEDIA', () => {
      const ref = '2026-10-15T12:00:00.000Z';
      const sla = calcularSLA('MEDIA', FECHA_BASE, ref);
      expect(sla.horasSLA).toBe(24);
      expect(sla.estadoSLA).toBe('DENTRO_DE_TIEMPO');
    });

    test('Lanza excepción si se envía una prioridad no válida o fecha malformada', () => {
      expect(() => calcularSLA('SUPER_URGENTE', FECHA_BASE)).toThrow('no reconocida');
      expect(() => calcularSLA('ALTA', 'FECHA_CORRUPTA')).toThrow('Fecha de creación inválida');
    });
  });

  describe('3. Regla de Validación de Asignación por Rol Operativo', () => {
    test('Permite asignación a personal con rol TECNICO', () => {
      const usuario = { id: 2, nombre: 'Carlos Técnico', rol: 'TECNICO' };
      const resultado = validarAsignacionTecnica(usuario, 'EN_PROGRESO');
      expect(resultado.valido).toBe(true);
    });

    test('Permite asignación a personal con rol ADMIN', () => {
      const usuario = { id: 1, nombre: 'Admin Master', rol: 'ADMIN' };
      const resultado = validarAsignacionTecnica(usuario, 'ABIERTO');
      expect(resultado.valido).toBe(true);
    });

    test('Rechaza asignación a usuarios con roles no operativos (e.g. AUDITOR o INVITADO)', () => {
      const usuario = { id: 5, nombre: 'Laura Auditora', rol: 'AUDITOR' };
      const resultado = validarAsignacionTecnica(usuario, 'ABIERTO');
      expect(resultado.valido).toBe(false);
      expect(resultado.razon).toContain('no posee facultades operativas');
    });

    test('Rechaza cambio de asignación si el incidente ya se encuentra CERRADO', () => {
      const usuario = { id: 2, nombre: 'Carlos Técnico', rol: 'TECNICO' };
      const resultado = validarAsignacionTecnica(usuario, 'CERRADO');
      expect(resultado.valido).toBe(false);
      expect(resultado.razon).toContain('ya cerrado');
    });
  });

  describe('4. Regla de Métricas de Calidad y Rendimiento (MTTR e Impacto)', () => {
    test('Calcula MTTR promedio correctamente a partir de incidentes resueltos', () => {
      const incidentes = [
        {
          id: 1,
          fechaCreacion: '2026-10-10T08:00:00.000Z',
          fechaResolucion: '2026-10-10T10:00:00.000Z' // 120 min = 2 horas
        },
        {
          id: 2,
          fechaCreacion: '2026-10-10T08:00:00.000Z',
          fechaResolucion: '2026-10-10T12:00:00.000Z' // 240 min = 4 horas
        }
      ];
      const resultado = calcularMTTR(incidentes);
      expect(resultado.totalAnalizados).toBe(2);
      expect(resultado.promedioMinutos).toBe(180); // (120 + 240) / 2
      expect(resultado.mttrHoras).toBe(3);
    });

    test('Retorna cero cuando el arreglo está vacío o no hay incidentes resueltos', () => {
      const resVacio = calcularMTTR([]);
      expect(resVacio.mttrHoras).toBe(0);

      const sinResolucion = [{ id: 3, fechaCreacion: '2026-10-10T08:00:00.000Z', fechaResolucion: null }];
      const resSin = calcularMTTR(sinResolucion);
      expect(resSin.mttrHoras).toBe(0);
    });

    test('Detecta inconsistencia temporal arrojando error si resolución es anterior a creación', () => {
      const inconsistente = [{
        id: 99,
        fechaCreacion: '2026-10-10T12:00:00.000Z',
        fechaResolucion: '2026-10-10T08:00:00.000Z'
      }];
      expect(() => calcularMTTR(inconsistente)).toThrow('Inconsistencia temporal');
    });

    test('Calcula puntaje y nivel de impacto según prioridad y número de afectados', () => {
      const impactoBajo = calcularIndiceImpacto('BAJA', 1);
      expect(impactoBajo.nivelImpacto).toBe('BAJO');

      const impactoCritico = calcularIndiceImpacto('CRITICA', 200);
      expect(impactoCritico.nivelImpacto).toBe('CRITICO');
      expect(impactoCritico.score).toBeGreaterThan(70);
    });
  });

});
