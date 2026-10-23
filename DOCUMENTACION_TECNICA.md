# DOCUMENTACIÓN TÉCNICA DEL PROYECTO INTEGRADOR
## Plataforma Segura de Gestión de Incidentes — IncidentHub Enterprise Pro
**Asignatura:** Desarrollo en Plataformas (PUCE Virtual) 
**Semana / Reto:** Semana 8 — T1S8: Reto 4: Integración, Despliegue y Defensa de la Plataforma Web Segura 
**Versión del Sistema:** `v4.0.0-production` 
**Fecha de Publicación:** Octubre de 2026 
**Autor:** Fer 
**Calificación Objetivo:** 50/50 Puntos (Excelente)

---

## 1. Arquitectura del Sistema

La solución implementa una **Arquitectura en Capas desacoplada bajo el Patrón MVC (Model-View-Controller) con Service Layer y Domain-Driven Design (DDD)**, asegurando alta cohesión, bajo acoplamiento y máxima mantenibilidad.

```
 [ CLIENTE WEB ]
 Navegador (HTML5, CSS3 Glassmorphism, JS Modular)
 4 Estados de UI (Loading, Empty, Data, Error)
 │
 │ HTTPS / TLS (Gzip + ETag)
 ▼
 [ SERVIDOR EXPRESS ]
 CORS (Whitelist) + Helmet Security Headers
 Logger Estructurado (Auditoría con Request-Id)
 │
 ┌──────────────────────┴──────────────────────┐
 ▼ ▼
 [ CONTROLADORES (C) ] [ RUTAS DE SALUD ]
 Auth / Incidentes / Health /api/health (Deep Check)
 Manejo de HTTP Status & DTOs /api/health/liveness
 │ /api/health/readiness
 ▼
 [ SERVICIOS (Service) ]
 Lógica de Aplicación & SLAs
 │
 ┌─────────┴─────────┐
 ▼ ▼
 [ DOMINIO DE NEGOCIO ] [ MODELOS (M) ]
 Máquina de estados Prisma ORM (Data Access)
 Reglas de asignación Proyección selectiva
 Cálculo de MTTR Consultas indexadas
 │ │
 └─────────┬─────────┘
 ▼
 [ BASE DE DATOS ]
 SQLite con Índices B-Tree
```

---

## 2. Requisitos del Sistema y Pila Tecnológica

| Componente | Tecnología | Versión | Justificación Técnica |
| :--- | :--- | :--- | :--- |
| **Entorno de Ejecución** | Node.js | `>= 18.x / 20.x` | Motor asíncrono no bloqueante de alto rendimiento. |
| **Framework Backend** | Express.js | `^5.2.1` | Ruteo modular, middlewares de seguridad y compresión. |
| **Capa de Persistencia** | Prisma ORM | `^6.19.3` | Type-safe queries, migraciones deterministas y control de esquemas. |
| **Motor de Base de Datos** | SQLite | `v3.x` | Base embebida confiable, indexación B-Tree y cero latencia de red. |
| **Autenticación** | JWT (jsonwebtoken) | `^9.0.3` | Tokens sin estado firmados con HMAC-SHA256 (expiración 4h). |
| **Hashing de Contraseñas**| Bcrypt.js | `^3.0.3` | Algoritmo resistente a GPU/ASIC con salting (Work Factor 10). |
| **Validación de Esquemas** | Zod | `^4.6.5` | Validación estricta en tiempo de ejecución y sanitización anti-XSS. |
| **Seguridad de Cabeceras** | Helmet | `^8.3.0` | Mitigación de XSS, Clickjacking y MIME-sniffing. |
| **Optimización de Red** | Compression | `^1.8.2` | Compresión Gzip/Deflate al vuelo para respuestas > 512 bytes. |
| **Auditoría de Código** | ESLint | `v10.13.0` | Formato Flat Config estandarizado con 0 errores y 0 advertencias. |
| **Suite de Pruebas** | Jest + Supertest | `^30.5.2` | 39 pruebas automatizadas (Unitarias, Integración y E2E). |

---

## 3. Configuración de Entorno y Variables

Siguiendo las directrices del **Tema 15.2**, todas las credenciales y parámetros de infraestructura se gestionan fuera del código mediante variables de entorno:

| Variable | Descripción | Entorno Local (Ejemplo) | Entorno Producción (Ejemplo) |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | Entorno de ejecución (`development`, `production`, `test`) | `development` | `production` |
| `PORT` | Puerto de escucha HTTP | `3000` | `10000` (Render) / `443` |
| `DATABASE_URL` | Cadena de conexión al motor de base de datos | `file:./dev.db` | `file:./prod.db` |
| `JWT_SECRET` | Clave criptográfica para firmas digitales de tokens | *(Clave interna local)* | *(Generada por el proveedor > 32 caracteres)* |
| `ALLOWED_ORIGINS` | Lista blanca de dominios para control CORS | `http://localhost:3000` | `https://incidenthub.onrender.com` |

> [!NOTE]
> La aplicación cuenta con un módulo de **Validación Estricta al Arranque (`src/config/envValidator.js`)**. Si alguna variable obligatoria falta en producción, el proceso se aborta inmediatamente antes de aceptar conexiones externas.

---

## 4. Monitoreo, Logging Estructurado y Health Checks

### 4.1. Niveles y Formato de Logs (`src/config/logger.js`)
El sistema emite registros estructurados en formato JSON persistidos en `logs/app.log`:
* **INFO:** Operaciones exitosas de negocio, inicio del servicio y respuestas HTTP 2xx.
* **WARN:** Intentos de acceso bloqueados por RBAC (403), peticiones inválidas (400) o alertas de SLA.
* **ERROR:** Excepciones no controladas (500), fallos de conectividad en base de datos.
* **Sanitización Activa:** Jamás se imprimen contraseñas, tokens JWT ni datos personales en los logs. Cada petición recibe un `X-Request-Id` único para trazabilidad.

### 4.2. Endpoints de Salud y Diagnóstico
* **`GET /api/health` (Deep Check):**
 * Retorna el estado global (`HEALTHY` o `DEGRADED`).
 * Ejecuta ping real a la base de datos (`SELECT 1`) midiendo latencia en milisegundos.
 * Informa consumo de memoria (RSS, Heap Used, Heap Total en MB).
 * Informa tiempo de actividad ininterrumpida (*Uptime* legible).
* **`GET /api/health/liveness`:** Retorna `200 UP` para sondas rápidas de balanceadores de carga.
* **`GET /api/health/readiness`:** Retorna `200 READY` confirmando que la base de datos está lista.

---

## 5. Especificación de Endpoints de la API REST

Todas las rutas operativas (excepto login y health) exigen cabecera `Authorization: Bearer <TOKEN_JWT>`:

| Método | Endpoint | Roles Permitidos | Código Éxito | Descripción de la Operación |
| :---: | :--- | :--- | :---: | :--- |
| `GET` | `/api/health` | Público | `200 OK` | Verificación de salud y telemetría de recursos. |
| `POST` | `/api/auth/login` | Público | `200 OK` | Autenticación con bcrypt y emisión de JWT. |
| `GET` | `/api/incidentes/estadisticas` | Analista, Supervisor, Admin | `200 OK` | Totales y métricas de incidentes para KPIs. |
| `GET` | `/api/incidentes` | Analista, Supervisor, Admin | `200 OK` | Consulta con paginación, filtros y cálculo dinámico de SLAs. |
| `GET` | `/api/incidentes/:id` | Analista, Supervisor, Admin | `200 OK` | Detalle íntegro de un incidente específico con score de impacto. |
| `POST` | `/api/incidentes` | Analista, Administrador | `201 Created` | Registro de nuevo ticket con sanitización anti-XSS e inyección de autoría. |
| `PUT` | `/api/incidentes/:id` | Analista, Supervisor, Admin | `200 OK` | Actualización de estado validando la máquina de estados finita. |
| `DELETE`| `/api/incidentes/:id` | Exclusivo Administrador | `200 OK` | Eliminación de registro. *(Si Analista o Supervisor intenta $\rightarrow$ `403 Forbidden`)*. |

---

## 6. Guía de Instalación y Despliegue

### Puesta en Marcha Local:
```bash
# 1. Instalar dependencias
npm install

# 2. Generar cliente Prisma y sincronizar base de datos
npm run build

# 3. Poblar usuarios y datos iniciales con hash bcrypt
npm run seed

# 4. Iniciar servidor en modo desarrollo
npm run dev
```

### Despliegue en la Nube (Render / Vercel / Docker):
* **Render:** Conectar el repositorio de GitHub y seleccionar **Web Service**. El archivo `render.yaml` preconfigura automáticamente el comando de construcción (`npm install && npx prisma db push && node prisma/seed.js`), el comando de inicio (`npm start`), la ruta de health check (`/api/health`) y las variables de entorno.
* **Docker:** Ejecutar `docker build -t incidenthub:latest .` y luego `docker run -p 3000:3000 incidenthub:latest`.

---

## 7. Pruebas Automatizadas y Verificación de Calidad

| Comando | Suite Ejecutada | Total de Pruebas | Resultado |
| :--- | :--- | :---: | :---: |
| `npm run test:unit` | Reglas de Negocio (Jest) | 20 Pruebas | **20/20 PASS (100%)** |
| `npm run test:integration` | Seguridad, JWT, RBAC y XSS | 10 Pruebas | **10/10 PASS (100%)** |
| `npm run test:prod` | Health Check y CRUD E2E | 9 Pruebas | **9/9 PASS (100%)** |
| `npm test` | Suite Integral Completa | **39 Pruebas** | **39/39 PASS (100%)** |
| `npm run lint` | Auditoría de Calidad ESLint v10 | Código Total | **0 Errores, 0 Warnings** |

