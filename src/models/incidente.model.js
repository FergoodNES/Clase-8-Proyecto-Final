/**
 * ====================================================================================
 * MODELO DE DATOS (M EN MVC): IncidenteModel
 * Encapsula el acceso a la base de datos (Prisma ORM) con optimización de consultas.
 * ====================================================================================
 */

const prisma = require('../config/db');

class IncidenteModel {
  /**
   * Consulta optimizada con proyección selectiva de campos, indexación y paginación.
   */
  static async findManyWithFilters({
    estado,
    prioridad,
    buscar,
    ordenarPor = 'fechaCreacion',
    direccion = 'desc',
    take = 50,
    skip = 0,
    soloResumen = false
  } = {}) {
    const where = {};

    if (estado) where.estado = estado;
    if (prioridad) where.prioridad = prioridad;
    if (buscar) {
      where.OR = [
        { titulo: { contains: buscar } },
        { descripcion: { contains: buscar } },
        { reportadoPor: { contains: buscar } },
        { asignadoA: { contains: buscar } }
      ];
    }

    // Proyección selectiva para optimizar el rendimiento y reducir el payload de red
    const select = soloResumen
      ? {
          id: true,
          titulo: true,
          estado: true,
          prioridad: true,
          reportadoPor: true,
          asignadoA: true,
          fechaCreacion: true
        }
      : {
          id: true,
          titulo: true,
          descripcion: true,
          estado: true,
          prioridad: true,
          reportadoPor: true,
          asignadoA: true,
          fechaCreacion: true,
          fechaActualizacion: true,
          creadoPor: {
            select: { id: true, nombre: true, email: true, rol: true }
          }
        };

    const [total, incidentes] = await Promise.all([
      prisma.incidente.count({ where }),
      prisma.incidente.findMany({
        where,
        select,
        orderBy: {
          [ordenarPor]: direccion
        },
        take: parseInt(take, 10),
        skip: parseInt(skip, 10)
      })
    ]);

    return { total, incidentes };
  }

  static async findById(id) {
    return prisma.incidente.findUnique({
      where: { id: parseInt(id, 10) },
      include: {
        creadoPor: {
          select: { id: true, nombre: true, email: true, rol: true }
        }
      }
    });
  }

  static async create(data) {
    return prisma.incidente.create({
      data,
      include: {
        creadoPor: {
          select: { id: true, nombre: true, email: true, rol: true }
        }
      }
    });
  }

  static async update(id, data) {
    return prisma.incidente.update({
      where: { id: parseInt(id, 10) },
      data,
      include: {
        creadoPor: {
          select: { id: true, nombre: true, email: true, rol: true }
        }
      }
    });
  }

  static async delete(id) {
    return prisma.incidente.delete({
      where: { id: parseInt(id, 10) }
    });
  }

  static async getEstadisticas() {
    const [total, abiertos, enProgreso, resueltos, cerrados] = await Promise.all([
      prisma.incidente.count(),
      prisma.incidente.count({ where: { estado: 'ABIERTO' } }),
      prisma.incidente.count({ where: { estado: 'EN_PROGRESO' } }),
      prisma.incidente.count({ where: { estado: 'RESUELTO' } }),
      prisma.incidente.count({ where: { estado: 'CERRADO' } })
    ]);

    return { total, abiertos, enProgreso, resueltos, cerrados };
  }
}

module.exports = IncidenteModel;
