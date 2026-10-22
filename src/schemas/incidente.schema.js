const { z } = require('zod');

const ESTADOS_VALIDOS = ['ABIERTO', 'EN_PROCESO', 'RESUELTO', 'CERRADO'];
const PRIORIDADES_VALIDAS = ['BAJA', 'MEDIA', 'ALTA', 'CRITICA'];

const crearIncidenteSchema = z.object({
  titulo: z.string({
    required_error: 'El título es obligatorio'
  }).trim().min(5, 'El título debe tener al menos 5 caracteres').max(150, 'El título no puede exceder 150 caracteres'),

  descripcion: z.string({
    required_error: 'La descripción es obligatoria'
  }).trim().min(10, 'La descripción debe tener al menos 10 caracteres'),

  estado: z.enum(ESTADOS_VALIDOS, {
    errorMap: () => ({ message: `El estado debe ser uno de: ${ESTADOS_VALIDOS.join(', ')}` })
  }).default('ABIERTO'),

  prioridad: z.enum(PRIORIDADES_VALIDAS, {
    errorMap: () => ({ message: `La prioridad debe ser una de: ${PRIORIDADES_VALIDAS.join(', ')}` })
  }).default('MEDIA'),

  asignadoA: z.string().trim().nullable().optional()
});

const actualizarIncidenteSchema = z.object({
  titulo: z.string().trim().min(5, 'El título debe tener al menos 5 caracteres').max(150).optional(),
  descripcion: z.string().trim().min(10, 'La descripción debe tener al menos 10 caracteres').optional(),
  estado: z.enum(ESTADOS_VALIDOS, {
    errorMap: () => ({ message: `El estado debe ser uno de: ${ESTADOS_VALIDOS.join(', ')}` })
  }).optional(),
  prioridad: z.enum(PRIORIDADES_VALIDAS, {
    errorMap: () => ({ message: `La prioridad debe ser una de: ${PRIORIDADES_VALIDAS.join(', ')}` })
  }).optional(),
  asignadoA: z.string().trim().nullable().optional()
}).refine(data => Object.keys(data).length > 0, {
  message: 'Debe proporcionar al menos un campo para actualizar'
});

const filtroIncidentesSchema = z.object({
  estado: z.enum(ESTADOS_VALIDOS).optional(),
  prioridad: z.enum(PRIORIDADES_VALIDAS).optional(),
  buscar: z.string().trim().optional(),
  ordenarPor: z.enum(['fechaCreacion', 'fechaActualizacion', 'prioridad', 'id']).default('fechaCreacion'),
  direccion: z.enum(['asc', 'desc']).default('desc')
});

module.exports = {
  ESTADOS_VALIDOS,
  PRIORIDADES_VALIDAS,
  crearIncidenteSchema,
  actualizarIncidenteSchema,
  filtroIncidentesSchema
};
