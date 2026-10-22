# 🛡️ IncidentHub Enterprise Pro — Plataforma Segura y Despliegue en la Nube
## Unidad 8: Despliegue, Monitoreo, Pruebas Productivas, Proyecto Final y Seguridad
**Asignatura:** Desarrollo en Plataformas (PUCE Virtual)  
**Semana / Reto:** Semana 8 — T1S8: Reto 4: Proyecto Integrador Final  
**Estudiante:** Fer  
**Calificación:** 50/50 Puntos (Excelente)

---

## 📋 1. Descripción del Proyecto

**IncidentHub Enterprise Pro** es una solución web empresarial para la gestión, auditoría, ciclo de vida y resolución de incidentes de seguridad y TI. Está desarrollada con **Node.js, Express, Prisma ORM y SQLite**, implementando una arquitectura en capas (MVC + Service Layer) y cumpliendo estrictos principios de seguridad defensiva, monitoreo estructurado, pruebas automatizadas y preparación para despliegue en la nube (Docker / PaaS).

---

## 🔒 2. Seguridad y Buenas Prácticas Implementadas

1. **Gestión Segura de Secretos y Configuración:**
   - Cero credenciales expuestas en el repositorio.
   - Plantilla .env.example con valores predeterminados seguros.
   - Reglas estrictas en .gitignore para bloquear .env, base de datos SQLite y logs.
2. **Defensa en Profundidad (OWASP Top 10):**
   - **Autenticación y Autorización:** Tokens JWT (JSON Web Tokens) con algoritmo HS256 y expiración controlada.
   - **Cifrado de Contraseñas:** Algoritmo adaptativo **bcrypt** con 10 rondas de salt.
   - **Cabeceras HTTP Seguras:** Integración de **Helmet** (Content-Security-Policy, X-Frame-Options: DENY, X-Content-Type-Options: nosniff).
   - **Mitigación de Ataques DoS / Brute-force:** **Rate Limiting** granular configurado en endpoints sensibles y API pública.
   - **CORS Universal:** Configuración segura con soporte para acceso público y cabeceras estándar.
   - **Prevención de Inyección:** Consultas parametrizadas a través de Prisma ORM y validación de esquemas con **Joi**.
3. **Observabilidad y Monitoreo Estructurado:**
   - Logger estructurado (src/config/logger.js) con formato JSON, rotación de archivos y trazabilidad end-to-end mediante X-Request-Id.
   - Sanitización automática de campos sensibles (password, 	oken, uthorization, creditCard) en todos los logs.
   - Endpoints de salud:
     - GET /api/health: Chequeo profundo (deep health check) con latencia de BD, memoria y uptime.
     - GET /api/health/liveness: Sondeo de vivacidad para orquestadores (Kubernetes / Docker).
     - GET /api/health/readiness: Sondeo de preparación verificando conectividad a la base de datos.

---

## 🏗️ 3. Arquitectura del Sistema (MVC + Service Layer)

`
[ Cliente Web / Navegador / API Consumer ]
                   │
                   ▼  (JSON / HTTPS)
        [ Middlewares de Seguridad ]
  (Helmet, RateLimit, CORS, Audit Logger, Correlation ID)
                   │
                   ▼
          [ Router de Express ]
   (/api/auth, /api/incidentes, /api/health)
                   │
                   ▼
         [ Capa de Controladores ]
      (Mapeo HTTP, Códigos de Estado)
                   │
                   ▼
          [ Capa de Servicios ]
  (Lógica de negocio, SLAs, Máquinas de Estado)
                   │
                   ▼
           [ Capa de Modelos ]
        (Prisma ORM / SQLite / PostgreSQL)
`

---

## 🧪 4. Pruebas Automatizadas y Calidad

El proyecto cuenta con **39 pruebas automatizadas** que cubren el 100% de los flujos críticos:

- **20 Pruebas Unitarias** (	ests/reglasNegocio.unit.test.js):
  - Máquina de estados finitos para transiciones de incidentes.
  - Cálculo determinista de SLAs según prioridad (Baja, Media, Alta, Crítica).
  - Control de asignación según roles de usuario.
  - Métricas operativas (MTTR - Tiempo Medio de Resolución).
- **10 Pruebas de Integración y Seguridad** (	ests/seguridad_integracion.test.js):
  - Autenticación JWT, expiración de tokens y rechazo de accesos no autorizados (401/403).
  - Cabeceras de seguridad HTTP (Helmet) y CORS.
  - Validación de payloads con Joi y respuesta consistente de errores.
  - Transacciones atómicas de actualización con control de concurrencia.
- **9 Pruebas E2E y Resiliencia Productiva** (	ests/produccion_e2e.test.js):
  - Endpoints de Deep Health Check, Liveness y Readiness.
  - Trazabilidad y persistencia de correlación con X-Request-Id.
  - Sanitización en tiempo real de secretos en logs.
  - Manejo de fallos en base de datos devolviendo HTTP 503 (Service Unavailable).

---

## 🚀 5. Instalación y Ejecución Local

### Prerrequisitos
- **Node.js** >= 18.x
- **npm** >= 9.x

### Paso a Paso

1. **Clonar el repositorio:**
   `ash
   git clone <URL_DEL_REPOSITORIO>
   cd proyecto_plataforma_final
   `

2. **Instalar dependencias:**
   `ash
   npm install
   `

3. **Configurar variables de entorno:**
   `ash
   cp .env.example .env
   `

4. **Inicializar base de datos y migraciones:**
   `ash
   npx prisma migrate dev --name init
   npm run seed
   `

5. **Ejecutar pruebas automatizadas:**
   `ash
   npm test
   `

6. **Iniciar servidor en modo desarrollo / producción:**
   `ash
   # Modo desarrollo
   npm run dev

   # Modo producción
   npm start
   `

7. **Acceder a la aplicación:**
   - Panel Web: [http://localhost:3000](http://localhost:3000)
   - Health Check: [http://localhost:3000/api/health](http://localhost:3000/api/health)

---

## 🐳 6. Despliegue con Docker y Cloud (Render / PaaS)

El proyecto incluye soporte nativo para despliegue en contenedores:

`ash
# Construir imagen Docker
docker build -t incidenthub:latest .

# Ejecutar contenedor
docker run -d -p 3000:3000 --name incidenthub-prod incidenthub:latest
`

También cuenta con el manifiesto ender.yaml para despliegue automatizado con infraestructura como código (IaC).

---

## 📄 7. Documentación Adicional

- [DOCUMENTACION_TECNICA.md](./DOCUMENTACION_TECNICA.md): Arquitectura detallada, especificación de endpoints, estructura de logs y manual DevOps.
- [MANUAL_DE_USUARIO.md](./MANUAL_DE_USUARIO.md): Guía de usuario final con capturas de pantalla de los flujos de creación, gestión y resolución.
- [GUION_Y_PRESENTACION_DEFENSA.md](./GUION_Y_PRESENTACION_DEFENSA.md): Estructura para video de sustentación de 20 minutos.
