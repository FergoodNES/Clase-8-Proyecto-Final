# MANUAL DE USUARIO
## Plataforma de Gestión de Incidentes — IncidentHub Enterprise Pro
**Asignatura:** Desarrollo en Plataformas (PUCE Virtual) 
**Semana / Reto:** Semana 8 — T1S8: Reto 4 
**Versión del Manual:** `v4.0.0` 
**Fecha de Publicación:** Octubre de 2026 
**Autor:** Fer 

---

## 1. Introducción y Objetivo de la Plataforma

**IncidentHub** es una aplicación web empresarial diseñada para la recepción, triaje, asignación, seguimiento y resolución de incidentes operativos y de seguridad informática. Permite a las organizaciones monitorear el cumplimiento de acuerdos de nivel de servicio (SLAs) en tiempo real, garantizando la trazabilidad de cada acción mediante control de acceso basado en roles (RBAC).

---

## 2. Acceso a la Plataforma e Inicio de Sesión

### 2.1. Ingreso a la Aplicación
1. Abra su navegador web (Google Chrome, Microsoft Edge, Mozilla Firefox o Safari).
2. Ingrese a la dirección oficial: `http://localhost:3000` (o la URL de producción proporcionada por el evaluador).
3. En la barra superior, haga clic en el botón **" Iniciar Sesión"**.

### 2.2. Perfiles de Demostración Disponibles
Para facilitar las pruebas y la evaluación, la pantalla de autenticación dispone de perfiles de acceso rápido:

| Perfil | Correo Electrónico | Contraseña | Nivel de Acceso y Facultades |
| :--- | :--- | :--- | :--- |
| **Administrador** | `admin@plataforma.edu` | `Admin123*` | **Control Total:** Creación, lectura, actualización y eliminación de incidentes. |
| **Supervisor** | `supervisor@plataforma.edu` | `Supervisor123*` | **Gestión Operativa:** Creación, lectura y transición de estados. Bloqueado para eliminar. |
| **Analista (SOC)** | `analista@plataforma.edu` | `Analista123*` | **Operador Inicial:** Creación y consulta de incidentes. Bloqueado para eliminar. |

4. Haga clic en uno de los botones de perfil rápido (ej. **"Admin"**) y presione **"Iniciar Sesión y Obtener Token"**.
5. Tras validar las credenciales con hash criptográfico en el servidor, se generará una sesión segura con token JWT, visualizándose el avatar y el rol en la barra superior.

---

## 3. Navegación en el Panel Principal y Métricas en Tiempo Real

Una vez autenticado, el panel presenta cuatro secciones clave:
1. **Hero Banner de Rendimiento:** Informa el estado de alta disponibilidad, latencia de base de datos, compresión de red y cumplimiento de SLAs.
2. **Tarjetas de KPIs:**
 * **Total Incidentes:** Conteo global de registros en base de datos protegida.
 * **Abiertos:** Tickets pendientes de asignación o inicio de atención.
 * **En Proceso:** Tickets actualmente bajo investigación técnica.
 * **Resueltos / Cerrados:** Tickets cuya solución fue implementada o formalmente validada.
 * **Prioridad Crítica:** Incidentes de alto impacto institucional.
3. **Barra de Búsqueda y Filtros Reactivos:**
 * **Búsqueda por texto:** Escriba palabras clave del título, descripción o personal involucrado.
 * **Filtro por Estado:** Seleccione entre Abierto, En Proceso, Resuelto o Cerrado.
 * **Filtro por Prioridad:** Filtre por Baja, Media, Alta o Crítica.
 * **Botón Restablecer:** Limpia todos los filtros y recarga la vista original.

---

## 4. Registro de un Nuevo Incidente

1. En la barra superior, haga clic en el botón azul **"+ Registrar Incidente"**.
2. Complete los campos obligatorios del formulario:
 * **Título del Incidente:** Resumen conciso de la falla (mínimo 5 caracteres).
 * **Prioridad:** Seleccione entre *Baja (SLA 72h)*, *Media (SLA 24h)*, *Alta (SLA 8h)* o *Crítica (SLA 4h)*.
 * **Estado Inicial:** Seleccione `ABIERTO` o `EN_PROCESO`.
 * **Asignado a (Opcional):** Nombre del técnico o especialista a cargo.
 * **Descripción Detallada:** Explicación técnica del suceso (mínimo 10 caracteres).
3. Presione **"Guardar en Base de Datos"**.
4. El sistema sanitizará automáticamente cualquier código potencialmente dañino y creará el registro, mostrando un mensaje verde de confirmación (*Toast notification*).

---

## 5. Seguimiento, Transición de Estados y SLAs Dinámicos

Cada tarjeta de incidente cuenta con indicadores visuales avanzados:
* **Badge de SLA en Vivo:** Informa el tiempo restante en minutos (` SLA: 240m restantes`) con código cromático:
 * **Verde (`DENTRO_DE_TIEMPO`):** Atención normal dentro de ventana programada.
 * **Amarillo (`EN_RIESGO`):** Resta menos del 25% del tiempo establecido.
 * **Rojo (`VENCIDO`):** Plazo de resolución expirado.
* **Cambio Rápido de Estado:** En el selector de la tarjeta, puede cambiar el estado siguiendo la máquina de estados formal:
 * `ABIERTO` $\rightarrow$ `EN_PROGRESO` $\rightarrow$ `RESUELTO` $\rightarrow$ `CERRADO`.
 * *Nota de regla de negocio:* No es posible cerrar un incidente sin haber sido resuelto previamente.

---

## 6. Eliminación de Incidentes (Control RBAC)

1. En la tarjeta del incidente, presione el botón **"Eliminar"**.
2. **Si ha iniciado sesión como Administrador:** El sistema solicitará confirmación y procederá a borrar permanentemente el registro en base de datos.
3. **Si ha iniciado sesión como Analista o Supervisor:** El servidor backend rechazará la operación con un error `403 Forbidden` (Acceso denegado por menor privilegio), protegiendo la integridad de los datos.

---

## 7. Solución de Problemas Frecuentes (FAQ)

### P1: ¿Por qué aparece el mensaje "Sesión expirada o no autenticada"?
* **Causa:** El token de seguridad JWT tiene un tiempo de vida límite por seguridad (4 horas).
* **Solución:** Haga clic en **"Iniciar Sesión"**, seleccione su perfil y vuelva a ingresar.

### P2: ¿Por qué no se activa el botón de guardar y sale un mensaje rojo?
* **Causa:** La descripción o el título no cumplen con la longitud mínima requerida por las reglas de validación Zod.
* **Solución:** Complete la descripción con al menos 10 caracteres explicativos y vuelva a presionar Guardar.

### P3: ¿Cómo compruebo si el servidor está operativo?
* **Solución:** Abra una pestaña en su navegador y visite `http://localhost:3000/api/health`. Deberá observar el estado `HEALTHY` con los detalles de base de datos y memoria.
