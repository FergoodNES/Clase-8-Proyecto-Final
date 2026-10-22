/**
 * ====================================================================================
 * SUITE DE PRUEBAS PRODUCTIVAS Y MONITOREO E2E (TEMA 15.5 & 16.2 / UNIDAD 8)
 * Valida la operación integral en entorno de despliegue:
 * 1. Health checks (deep, liveness, readiness)
 * 2. Autenticación y control de acceso RBAC
 * 3. Persistencia de transacciones CRUD
 * 4. Generación de logs estructurados sin fuga de datos sensibles
 * ====================================================================================
 */

const request = require('supertest');
const fs = require('fs');
const path = require('path');
const app = require('../src/app');


describe('SUITE DE PRUEBAS PRODUCTIVAS: Unidad 8 (Despliegue y Monitoreo)', () => {
  let tokenAdmin;
  let tokenAnalista;
  let idIncidenteCreado;

  beforeAll(async () => {
    // 1. Login con cuenta de Administrador
    const resAdmin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@plataforma.edu', password: 'Admin123*' });
    tokenAdmin = resAdmin.body.token;

    // 2. Login con cuenta de Analista
    const resAnalista = await request(app)
      .post('/api/auth/login')
      .send({ email: 'analista@plataforma.edu', password: 'Analista123*' });
    tokenAnalista = resAnalista.body.token;
  });

  describe('1. Verificación de Health Check y Monitoreo de Recursos', () => {
    test('GET /api/health retorna estado HEALTHY y verificación de BD activa (200 OK)', async () => {
      const res = await request(app).get('/api/health');
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('HEALTHY');
      expect(res.body.version).toBe('4.0.0-production');
      expect(res.body.dependencias.baseDeDatos.status).toBe('healthy');
      expect(res.body.dependencias.baseDeDatos.latenciaMs).toBeDefined();
      expect(res.body.sistema.memoria).toHaveProperty('rssMB');
      expect(res.body.sistema.memoria).toHaveProperty('heapUsedMB');
      expect(res.body.sistema.uptimeSegundos).toBeGreaterThanOrEqual(0);
    });

    test('GET /api/health/liveness responde con estado UP para orquestadores', async () => {
      const res = await request(app).get('/api/health/liveness');
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('UP');
    });

    test('GET /api/health/readiness confirma disponibilidad de base de datos', async () => {
      const res = await request(app).get('/api/health/readiness');
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('READY');
      expect(res.body.db).toBe('CONNECTED');
    });
  });

  describe('2. Integración Completa de CRUD y Seguridad (Tema 16.2)', () => {
    test('Creación de incidente con validación y autoría segura (201 Created)', async () => {
      const payload = {
        titulo: 'Incidente de auditoría productiva E2E - Despliegue',
        descripcion: 'Verificación de persistencia transaccional durante el ciclo de vida del despliegue final.',
        prioridad: 'ALTA',
        estado: 'ABIERTO'
      };

      const res = await request(app)
        .post('/api/incidentes')
        .set('Authorization', `Bearer ${tokenAnalista}`)
        .send(payload);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.titulo).toBe(payload.titulo);
      idIncidenteCreado = res.body.data.id;
    });

    test('Lectura del incidente creado con SLA enriquecido dinámicamente (200 OK)', async () => {
      const res = await request(app)
        .get(`/api/incidentes/${idIncidenteCreado}`)
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.id).toBe(idIncidenteCreado);
      expect(res.body.data.sla).toBeDefined();
      expect(res.body.data.sla.horasSLA).toBe(8); // Prioridad ALTA
    });

    test('Actualización legal de estado a RESUELTO (200 OK)', async () => {
      const res = await request(app)
        .put(`/api/incidentes/${idIncidenteCreado}`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ estado: 'RESUELTO' });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.estado).toBe('RESUELTO');
    });

    test('Intento de eliminación por rol "analista" es bloqueado por RBAC (403 Forbidden)', async () => {
      const res = await request(app)
        .delete(`/api/incidentes/${idIncidenteCreado}`)
        .set('Authorization', `Bearer ${tokenAnalista}`);

      expect(res.statusCode).toBe(403);
    });

    test('Eliminación exitosa por rol "admin" (200 OK)', async () => {
      const res = await request(app)
        .delete(`/api/incidentes/${idIncidenteCreado}`)
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.mensaje).toContain('eliminado exitosamente');
    });
  });

  describe('3. Auditoría de Logging Estructurado (Tema 15.4)', () => {
    test('Verifica que los logs estructurados se persisten en disco sin filtrar contraseñas', () => {
      const logPath = path.join(__dirname, '../logs/app.log');
      expect(fs.existsSync(logPath)).toBe(true);

      const contenidoLogs = fs.readFileSync(logPath, 'utf8');
      expect(contenidoLogs.length).toBeGreaterThan(0);

      // Verificación de seguridad: Jamás debe persistirse la contraseña ni el token en texto plano
      expect(contenidoLogs).not.toContain('Admin123*');
      expect(contenidoLogs).not.toContain('Analista123*');
    });
  });
});
