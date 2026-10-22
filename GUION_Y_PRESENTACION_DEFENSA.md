# GUION TÉCNICO Y PRESENTACIÓN PARA LA DEFENSA EN VIDEO
## Proyecto Integrador: Plataforma de Gestión de Incidentes — IncidentHub Enterprise Pro
**Asignatura:** Desarrollo en Plataformas (PUCE Virtual) 
**Evaluación:** T1S8: Reto 4 (Cierre y Defensa del Proyecto Integrador) 
**Estudiante:** Fer 
**Duración Recomendada del Video:** 12 a 18 minutos (Máximo permitido: 20 minutos) 
**Alineación Estricta:** Cumplimiento de los puntos 16.1, 16.2, 16.3, 16.4 y 16.5 de la Guía Oficial de la Semana 8.

---

## Estructura Cronológica del Video de Defensa

```
[00:00 - 02:30] BLOQUE 1: Introducción, Problema de Negocio y Arquitectura (Punto 16.1)
[02:30 - 07:00] BLOQUE 2: Demostración Práctica del Flujo CRUD y Seguridad RBAC (Punto 16.2)
[07:00 - 10:00] BLOQUE 3: Monitoreo, Health Checks, Logs y Rendimiento (Puntos 15.4 & 16.2)
[10:00 - 13:00] BLOQUE 4: Documentación Técnica, Manual de Usuario y Despliegue (Punto 16.3)
[13:00 - 16:30] BLOQUE 5: Justificación de Decisiones, Preguntas Clave y Contingencia (Punto 16.4)
[16:30 - 18:30] BLOQUE 6: Retrospectiva, Limitaciones y Lecciones Aprendidas (Punto 16.5)
```

---

## Diapositivas y Guion Paso a Paso (Palabra por Palabra)

---

### DIAPOSITIVA 1: Portada y Presentación Inicial (00:00 - 01:00)
* **Visual en Pantalla:** Título del proyecto "IncidentHub Enterprise Pro: Plataforma Web Segura de Gestión de Incidentes", nombre del estudiante Fer, PUCE Virtual, Octubre 2026.
* **Guion del Estudiante:**
 > "Buenas tardes estimados docentes y compañeros. Mi nombre es Fer y a continuación presento la defensa final de nuestro proyecto integrador para la asignatura de Desarrollo en Plataformas. El sistema desarrollado, IncidentHub Enterprise Pro, es una plataforma integral para la gestión y mitigación de incidentes operativos y de seguridad informática, construida bajo estándares rigurosos de ingeniería de software, arquitectura desacoplada, seguridad en profundidad y despliegue productivo continuo."

---

### DIAPOSITIVA 2: Planteamiento del Problema y Propuesta de Valor (Punto 16.1) (01:00 - 02:30)
* **Visual en Pantalla:** Diagrama del problema (Desorden en hojas de cálculo, tickets sin seguimiento de SLAs, falta de roles y trazabilidad) vs. Solución IncidentHub (Centralización en tiempo real, SLAs dinámicos, RBAC y auditoría).
* **Guion del Estudiante:**
 > "En las organizaciones actuales, la gestión manual o desarticulada de incidentes genera demoras críticas, pérdida de trazabilidad y riesgos de seguridad. Nuestra propuesta de valor resuelve este problema centralizando el ciclo de vida completo de cada ticket, desde su recepción hasta su cierre definitivo, calculando ventanas de SLA en tiempo real y garantizando que solo el personal con las atribuciones adecuadas pueda realizar cambios sensibles."

---

### DIAPOSITIVA 3: Arquitectura Integrada del Software (Punto 16.1) (02:30 - 04:00)
* **Visual en Pantalla:** Diagrama de bloques conectando Cliente Web $\rightarrow$ API REST Express $\rightarrow$ Controladores $\rightarrow$ Servicios $\rightarrow$ Modelos $\rightarrow$ SQLite, destacando Middlewares (Helmet, CORS, JWT, Logger, Gzip).
* **Guion del Estudiante:**
 > "Como podemos observar en la arquitectura de la solución, implementamos el patrón arquitectónico MVC desacoplado con una capa de servicio intermedia y principios de diseño guiado por el dominio. En el backend contamos con Node.js y Express 5, utilizando Prisma ORM para interactuar con SQLite mediante consultas indexadas. Todo el tráfico está protegido con cabeceras Helmet, control CORS estricto y compresión Gzip al vuelo. La autenticación se realiza mediante tokens JWT firmados criptográficamente y las contraseñas se almacenan con hashing bcrypt y salting."

---

### DIAPOSITIVA 4: Demostración en Vivo: Autenticación y Flujo CRUD (Punto 16.2) (04:00 - 07:00)
* **Visual en Pantalla:** Compartir pantalla del navegador en `http://localhost:3000` (o la URL desplegada en Render).
* **Recorrido Práctico de Demostración:**
 1. **Inicio de sesión:** Demostrar el login con `admin@plataforma.edu` y mostrar cómo se recibe el token JWT y se actualiza el perfil en la barra superior.
 2. **Creación de un incidente:** Registrar un ticket titulado *"Falla en enlace de contingencia perimetral"* con prioridad Alta (SLA de 8 horas). Mostrar el toast de éxito.
 3. **Consulta y filtros:** Utilizar el filtro reactivo por prioridad y por estado para ubicar el ticket creado.
 4. **Demostración de SLAs en Vivo:** Explicar cómo el badge cromático calcula automáticamente los minutos restantes según la máquina de estados.
 5. **Prueba de Seguridad RBAC (403 Forbidden):** Cerrar sesión e iniciar como `analista@plataforma.edu`. Intentar eliminar el incidente y mostrar cómo la interfaz y el servidor backend rechazan la acción devolviendo un error `403 Forbidden`, demostrando el principio de menor privilegio.
 6. **Eliminación autorizada:** Iniciar sesión nuevamente como `admin@plataforma.edu` y eliminar el incidente con éxito (200 OK).

---

### DIAPOSITIVA 5: Monitoreo, Health Checks y Logs Estructurados (Puntos 15.4 & 16.2) (07:00 - 10:00)
* **Visual en Pantalla:** Abrir una pestaña en `/api/health` y mostrar la terminal con los logs en `logs/app.log`.
* **Guion del Estudiante:**
 > "Cumpliendo con los requerimientos del Tema 15, la plataforma cuenta con telemetría y observabilidad en tiempo real. Al consultar nuestro endpoint `GET /api/health`, podemos ver que la API ejecuta un ping activo a la base de datos midiendo la latencia en milisegundos, reporta el tiempo de actividad del proceso y el consumo de memoria heap en megabytes. Además, contamos con sondas de liveness y readiness para balanceadores de carga como Render o Kubernetes. En cuanto al logging estructurado, cada solicitud HTTP recibe un Request-Id único y se registra en disco sanitizando automáticamente contraseñas y tokens para prevenir cualquier fuga de información sensible."

---

### DIAPOSITIVA 6: Documentación Técnica y Manual de Usuario (Punto 16.3) (10:00 - 12:30)
* **Visual en Pantalla:** Mostrar en VS Code los archivos `DOCUMENTACION_TECNICA.md` y `MANUAL_DE_USUARIO.md`, así como el documento oficial de entrega.
* **Guion del Estudiante:**
 > "Una solución de software no está completa sin una documentación reproducible. Hemos elaborado una Documentación Técnica exhaustiva con fecha y versión que describe requisitos, variables de entorno sin exponer secretos, especificación OpenAPI de endpoints y comandos de despliegue con Docker y Render. Adicionalmente, creamos un Manual de Usuario escrito desde la perspectiva del operador final, guiándolo paso a paso en el acceso, búsqueda y resolución de incidentes, complementado con una guía de solución a problemas frecuentes."

---

### DIAPOSITIVA 7: Justificación de Decisiones y Plan de Contingencia (Punto 16.4) (12:30 - 15:00)
* **Visual en Pantalla:** Tabla comparativa de decisiones (¿Por qué SQLite vs PostgreSQL?, ¿Por qué JWT sin estado?, ¿Por qué WebP y Gzip?) y diagrama del Plan de Contingencia.
* **Guion del Estudiante:**
 > "Si la audiencia o el comité evaluador nos pregunta: ¿Por qué elegimos esta arquitectura? La respuesta es clara: buscamos un equilibrio óptimo entre robustez, portabilidad y velocidad. Elegimos SQLite con Prisma para garantizar cero latencia de red en entornos autocontenidos y consistencia ACID. Para la contingencia durante la defensa, preparamos un respaldo local idéntico con scripts de reinicio y una base de datos pre-sembrada que permite restablecer la operación en menos de 5 segundos en caso de cualquier corte de red en el hosting."

---

### DIAPOSITIVA 8: Retrospectiva, Limitaciones y Lecciones Aprendidas (Punto 16.5) (15:00 - 17:30)
* **Visual en Pantalla:** Matriz de lecciones aprendidas y mejoras planificadas para post-evaluación.
* **Guion del Estudiante:**
 > "Finalmente, en concordancia con el punto 16.5, reconocemos con madurez técnica las limitaciones actuales y el camino de evolución de la plataforma:
 > 1. Limitación actual: La base SQLite es ideal para instancias individuales pero requeriría migrar a PostgreSQL gestionado para escalabilidad horizontal multi-región.
 > 2. Lección aprendida: La importancia de las pruebas automatizadas; nuestra suite de 39 pruebas en Jest fue el factor clave que evitó regresiones durante la refactorización a MVC.
 > 3. Mejoras futuras: Integración de notificaciones push vía WebSockets ante incidentes críticos y autenticación biométrica WebAuthn."

---

### DIAPOSITIVA 9: Cierre y Conclusiones (17:30 - 18:00)
* **Visual en Pantalla:** Conclusiones ejecutivas, enlaces al repositorio y agradecimiento.
* **Guion del Estudiante:**
 > "En conclusión, IncidentHub demuestra la integración exitosa de todas las competencias del ciclo: diseño centrado en el usuario, seguridad en backend, calidad verificable con 100% de pruebas aprobadas y preparación para despliegue productivo. Muchas gracias por su atención y quedo atento a sus preguntas."
