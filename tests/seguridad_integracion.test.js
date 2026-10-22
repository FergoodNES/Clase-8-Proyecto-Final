const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/config/db');

describe('SUITE DE EVALUACIÓN: RETO 3 - SEGURIDAD E INTEGRACIÓN CLIENTE-SERVIDOR', () => {
  let tokenAdmin = null;
  let tokenSupervisor = null;
  let tokenAnalista = null;
  let incidenteCreadoId = null;

  beforeAll(async () => {
    await prisma.$connect();

    // Obtener tokens para cada rol
    const resAdmin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@plataforma.edu', password: 'Admin123*' });
    tokenAdmin = resAdmin.body.token;

    const resSupervisor = await request(app)
      .post('/api/auth/login')
      .send({ email: 'supervisor@plataforma.edu', password: 'Supervisor123*' });
    tokenSupervisor = resSupervisor.body.token;

    const resAnalista = await request(app)
      .post('/api/auth/login')
      .send({ email: 'analista@plataforma.edu', password: 'Analista123*' });
    tokenAnalista = resAnalista.body.token;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // =========================================================================
  // CASO 1: Autenticación Exitosa con Bcrypt y JWT (200 OK)
  // =========================================================================
  it('CASO 1: Login exitoso con verificación de hash bcrypt y retorno de JWT firmado (200 OK)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@plataforma.edu',
        password: 'Admin123*'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body).toHaveProperty('token');
    expect(res.body.usuario.rol).toBe('admin');
  });

  // =========================================================================
  // CASO 2: Rechazo de Autenticación con Credenciales Inválidas (401 Unauthorized)
  // =========================================================================
  it('CASO 2: Rechazo de acceso por contraseña incorrecta sin revelar vector de error (401 Unauthorized)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@plataforma.edu',
        password: 'PasswordErronea123*'
      });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.mensaje).toContain('Credenciales incorrectas');
  });

  // =========================================================================
  // CASO 3: Acceso Denegado por Ausencia de Token JWT (401 Unauthorized)
  // =========================================================================
  it('CASO 3: Intento de consulta a endpoint protegido sin enviar cabecera Authorization (401 Unauthorized)', async () => {
    const res = await request(app).get('/api/incidentes');

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.mensaje).toContain('Token no proporcionado');
  });

  // =========================================================================
  // CASO 4: Acceso Denegado por Token Malformado o Inválido (401 Unauthorized)
  // =========================================================================
  it('CASO 4: Intento de consulta con token adulterado o firma criptográfica inválida (401 Unauthorized)', async () => {
    const res = await request(app)
      .get('/api/incidentes')
      .set('Authorization', 'Bearer token_falso_o_manipulado_criptograficamente.xyz.123');

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.mensaje).toContain('Token inválido');
  });

  // =========================================================================
  // CASO 5: Permisos Insuficientes por Rol - RBAC (403 Forbidden)
  // =========================================================================
  it('CASO 5: Usuario con rol "analista" intenta eliminar un incidente -> Bloqueado por menor privilegio (403 Forbidden)', async () => {
    // Primero obtenemos un incidente existente
    const lista = await request(app)
      .get('/api/incidentes')
      .set('Authorization', `Bearer ${tokenAnalista}`);
    const primerId = lista.body.data[0].id;

    const res = await request(app)
      .delete(`/api/incidentes/${primerId}`)
      .set('Authorization', `Bearer ${tokenAnalista}`);

    expect(res.statusCode).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.mensaje).toContain('Permiso denegado');
    expect(res.body.error.mensaje).toContain('analista');
  });

  // =========================================================================
  // CASO 6: Eliminación Autorizada Exclusiva para Administrador (200 OK)
  // =========================================================================
  it('CASO 6: Usuario con rol "admin" elimina exitosamente un incidente con autorización completa (200 OK)', async () => {
    // Crear un incidente temporal para eliminar
    const tempIncidente = await prisma.incidente.create({
      data: {
        titulo: 'Incidente temporal para prueba de eliminación admin',
        descripcion: 'Registro temporal creado para certificar la autorización exclusiva de admin.',
        prioridad: 'BAJA',
        reportadoPor: 'Admin Prueba'
      }
    });

    const res = await request(app)
      .delete(`/api/incidentes/${tempIncidente.id}`)
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.mensaje).toContain('eliminado exitosamente');

    // Confirmar en la base de datos física que ya no existe
    const enBD = await prisma.incidente.findUnique({ where: { id: tempIncidente.id } });
    expect(enBD).toBeNull();
  });

  // =========================================================================
  // CASO 7: Rechazo de Datos Inválidos por Validación de Esquema (400 Bad Request)
  // =========================================================================
  it('CASO 7: Intento de creación con título corto y prioridad no permitida -> Rechazado por Zod (400 Bad Request)', async () => {
    const res = await request(app)
      .post('/api/incidentes')
      .set('Authorization', `Bearer ${tokenAnalista}`)
      .send({
        titulo: 'Abc', // Menor a 5 caracteres
        descripcion: 'Breve', // Menor a 10 caracteres
        prioridad: 'EXTREMA' // Valor inválido
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.codigo).toBe('ValidationError');
    expect(Array.isArray(res.body.error.detalles)).toBe(true);
  });

  // =========================================================================
  // CASO 8: Creación y Sanitización de Entrada contra XSS (201 Created)
  // =========================================================================
  it('CASO 8: Creación con sanitización activa de scripts maliciosos XSS e inyección de autoría (201 Created)', async () => {
    const payloadConXss = {
      titulo: 'Vulnerabilidad detectada <script>alert("XSS")</script> en login',
      descripcion: 'El analista reporta código inyectado en el campo de texto perimetral.',
      prioridad: 'ALTA',
      estado: 'ABIERTO'
    };

    const res = await request(app)
      .post('/api/incidentes')
      .set('Authorization', `Bearer ${tokenAnalista}`)
      .send(payloadConXss);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    // Verificar que la etiqueta <script> fue removida por sanitización
    expect(res.body.data.titulo).not.toContain('<script>');
    // Verificar que el usuario creador se asignó automáticamente del JWT
    expect(res.body.data.creadoPor.rol).toBe('analista');

    incidenteCreadoId = res.body.data.id;
  });

  // =========================================================================
  // CASO 9: Consulta y Filtrado con Token Válido (200 OK)
  // =========================================================================
  it('CASO 9: Consulta de incidentes con filtro por prioridad y token autenticado (200 OK)', async () => {
    const res = await request(app)
      .get('/api/incidentes?prioridad=CRITICA')
      .set('Authorization', `Bearer ${tokenSupervisor}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    res.body.data.forEach(inc => {
      expect(inc.prioridad).toBe('CRITICA');
    });
  });

  // =========================================================================
  // CASO 10: Actualización de Incidente por Supervisor (200 OK)
  // =========================================================================
  it('CASO 10: Actualización de estado a RESUELTO por usuario supervisor autorizado (200 OK)', async () => {
    const res = await request(app)
      .patch(`/api/incidentes/${incidenteCreadoId}`)
      .set('Authorization', `Bearer ${tokenSupervisor}`)
      .send({ estado: 'RESUELTO' });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.estado).toBe('RESUELTO');
  });
});
