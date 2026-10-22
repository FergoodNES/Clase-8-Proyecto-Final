/**
 * ====================================================================================
 * CLIENTE WEB INTEGRADO - SEMANA 6 (RETO 3)
 * Tema 12: Seguridad (JWT, RBAC, Bcrypt)
 * Tema 13: Integración Cliente-Servidor (ApiService, 4 Estados de UI, textContent anti-XSS)
 * ====================================================================================
 */

// 1. SERVICIO CENTRALIZADO DE API (Tema 13.1)
const ApiService = {
  baseUrl: '/api',

  getToken() {
    return localStorage.getItem('jwt_token');
  },

  getUsuario() {
    try {
      const u = localStorage.getItem('jwt_user');
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  },

  setAuth(token, usuario) {
    localStorage.setItem('jwt_token', token);
    localStorage.setItem('jwt_user', JSON.stringify(usuario));
  },

  clearAuth() {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('jwt_user');
  },

  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers
    });

    // Manejo centralizado de 401 Unauthorized (Sesión expirada o ausente)
    if (response.status === 401) {
      this.clearAuth();
      actualizarInterfazSegunSesion();
      abrirModalLogin('Sesión expirada o no autenticada. Por favor inicie sesión.');
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error?.mensaje || 'Acceso denegado: Se requiere autenticación');
    }

    const data = await response.json().catch(() => ({}));

    // Manejo de errores HTTP 403, 400, 404, 500
    if (!response.ok) {
      const msg = data.error?.mensaje || data.error || 'Ocurrió un error en el servidor';
      const error = new Error(msg);
      error.status = response.status;
      error.detalles = data.error?.detalles;
      throw error;
    }

    return data;
  }
};

// Elementos del DOM
const loginModal = document.getElementById('loginModal');
const loginForm = document.getElementById('loginForm');
const loginEmail = document.getElementById('loginEmail');
const loginPassword = document.getElementById('loginPassword');
const loginErrorMessage = document.getElementById('loginErrorMessage');
const btnLoginSubmit = document.getElementById('btnLoginSubmit');

const userProfileBar = document.getElementById('userProfileBar');
const userAvatar = document.getElementById('userAvatar');
const userName = document.getElementById('userName');
const userRoleBadge = document.getElementById('userRoleBadge');
const btnLogout = document.getElementById('btnLogout');
const btnOpenLogin = document.getElementById('btnOpenLogin');
const btnNuevoIncidente = document.getElementById('btnNuevoIncidente');

const incidentesContainer = document.getElementById('incidentesContainer');
const searchInput = document.getElementById('searchInput');
const filtroEstado = document.getElementById('filtroEstado');
const filtroPrioridad = document.getElementById('filtroPrioridad');
const btnLimpiarFiltros = document.getElementById('btnLimpiarFiltros');
const btnRecargar = document.getElementById('btnRecargar');
const contadorResultados = document.getElementById('contadorResultados');

// KPIs
const kpiTotal = document.getElementById('kpiTotal');
const kpiAbiertos = document.getElementById('kpiAbiertos');
const kpiEnProceso = document.getElementById('kpiEnProceso');
const kpiResueltos = document.getElementById('kpiResueltos');
const kpiCriticos = document.getElementById('kpiCriticos');

// Modal Incidente
const incidenteModal = document.getElementById('incidenteModal');
const incidenteForm = document.getElementById('incidenteForm');
const modalTitle = document.getElementById('modalTitle');
const btnCerrarModal = document.getElementById('btnCerrarModal');
const btnCancelarModal = document.getElementById('btnCancelarModal');
const formErrorMessage = document.getElementById('formErrorMessage');
const btnGuardarIncidente = document.getElementById('btnGuardarIncidente');

const incidenteId = document.getElementById('incidenteId');
const tituloInput = document.getElementById('tituloInput');
const descripcionInput = document.getElementById('descripcionInput');
const prioridadInput = document.getElementById('prioridadInput');
const estadoInput = document.getElementById('estadoInput');
const asignadoAInput = document.getElementById('asignadoAInput');

let searchDebounce = null;

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
  configurarEventos();
  actualizarInterfazSegunSesion();

  // Si no hay token guardado, abrir el modal de login de bienvenida
  if (!ApiService.getToken()) {
    abrirModalLogin();
  } else {
    cargarDatos();
  }
});

function configurarEventos() {
  loginForm.addEventListener('submit', manejarLogin);
  btnLogout.addEventListener('click', manejarLogout);
  btnOpenLogin.addEventListener('click', () => abrirModalLogin());

  btnNuevoIncidente.addEventListener('click', abrirModalCrear);
  btnCerrarModal.addEventListener('click', cerrarModalIncidente);
  btnCancelarModal.addEventListener('click', cerrarModalIncidente);
  incidenteForm.addEventListener('submit', manejarGuardarIncidente);

  filtroEstado.addEventListener('change', () => cargarIncidentes());
  filtroPrioridad.addEventListener('change', () => cargarIncidentes());

  searchInput.addEventListener('input', () => {
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => cargarIncidentes(), 300);
  });

  btnLimpiarFiltros.addEventListener('click', () => {
    searchInput.value = '';
    filtroEstado.value = '';
    filtroPrioridad.value = '';
    cargarIncidentes();
  });

  btnRecargar.addEventListener('click', () => {
    cargarDatos();
    mostrarToast('Datos sincronizados con base de datos segura', 'success');
  });
}

function actualizarInterfazSegunSesion() {
  const usuario = ApiService.getUsuario();
  const token = ApiService.getToken();

  if (token && usuario) {
    userProfileBar.style.display = 'flex';
    btnOpenLogin.style.display = 'none';
    btnNuevoIncidente.style.display = 'inline-flex';

    userName.textContent = usuario.nombre;
    userAvatar.textContent = usuario.nombre.charAt(0).toUpperCase();

    userRoleBadge.textContent = usuario.rol.toUpperCase();
    userRoleBadge.className = `role-badge ${usuario.rol}`;
  } else {
    userProfileBar.style.display = 'none';
    btnOpenLogin.style.display = 'inline-flex';
    btnNuevoIncidente.style.display = 'none';
  }
}

// 2. CONTROLADOR DE LOGIN (Bcrypt + JWT)
async function manejarLogin(e) {
  e.preventDefault();
  loginErrorMessage.style.display = 'none';

  btnLoginSubmit.disabled = true;
  btnLoginSubmit.textContent = 'Verificando hash y generando JWT...';

  try {
    const payload = {
      email: loginEmail.value.trim(),
      password: loginPassword.value
    };

    const res = await ApiService.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    ApiService.setAuth(res.token, res.usuario);
    cerrarModalLogin();
    actualizarInterfazSegunSesion();
    mostrarToast(`¡Bienvenido ${res.usuario.nombre}! Sesión iniciada como [${res.usuario.rol.toUpperCase()}].`, 'success');
    cargarDatos();

  } catch (error) {
    loginErrorMessage.textContent = error.message;
    loginErrorMessage.style.display = 'block';
  } finally {
    btnLoginSubmit.disabled = false;
    btnLoginSubmit.textContent = 'Iniciar Sesión y Obtener Token';
  }
}

function seleccionarPerfilDemo(email, password) {
  loginEmail.value = email;
  loginPassword.value = password;
  loginErrorMessage.style.display = 'none';
}

function abrirModalLogin(mensajeError = null) {
  loginModal.classList.add('show');
  if (mensajeError) {
    loginErrorMessage.textContent = mensajeError;
    loginErrorMessage.style.display = 'block';
  } else {
    loginErrorMessage.style.display = 'none';
  }
}

function cerrarModalLogin() {
  loginModal.classList.remove('show');
}

function manejarLogout() {
  ApiService.clearAuth();
  actualizarInterfazSegunSesion();
  mostrarToast('Sesión cerrada correctamente. Token revocado en cliente.', 'warning');
  renderizarEstadoVacio('Debes iniciar sesión con un usuario autorizado para visualizar los incidentes.');
  kpiTotal.textContent = '-';
  kpiAbiertos.textContent = '-';
  kpiEnProceso.textContent = '-';
  kpiResueltos.textContent = '-';
  kpiCriticos.textContent = '-';
  abrirModalLogin();
}

// 3. CARGA DE DATOS Y LOS 4 ESTADOS DE LA UI (Tema 13.3 & 13.4)
async function cargarDatos() {
  cargarEstadisticas();
  cargarIncidentes();
}

async function cargarEstadisticas() {
  try {
    const res = await ApiService.request('/incidentes/estadisticas');
    if (res.success && res.data) {
      const { total, porEstado, porPrioridad } = res.data;
      kpiTotal.textContent = total;
      kpiAbiertos.textContent = porEstado?.ABIERTO || 0;
      kpiEnProceso.textContent = porEstado?.EN_PROCESO || 0;
      kpiResueltos.textContent = (porEstado?.RESUELTO || 0) + (porEstado?.CERRADO || 0);
      kpiCriticos.textContent = porPrioridad?.CRITICA || 0;
    }
  } catch (e) {
    console.error('Error al cargar KPIs:', e);
  }
}

async function cargarIncidentes() {
  // 1. ESTADO: CARGANDO (Loading State)
  renderizarEstadoCargando();

  try {
    const params = new URLSearchParams();
    if (filtroEstado.value) params.append('estado', filtroEstado.value);
    if (filtroPrioridad.value) params.append('prioridad', filtroPrioridad.value);
    if (searchInput.value.trim()) params.append('buscar', searchInput.value.trim());

    const res = await ApiService.request(`/incidentes?${params.toString()}`);
    const incidentes = res.data || [];

    // 2. ESTADO: VACÍO (Empty State)
    if (incidentes.length === 0) {
      renderizarEstadoVacio('No hay incidentes que coincidan con los filtros seleccionados.');
      contadorResultados.textContent = '(0)';
      return;
    }

    // 3. ESTADO: ÉXITO (Success State)
    renderizarListaIncidentes(incidentes);
    contadorResultados.textContent = `(${res.total})`;

  } catch (error) {
    // 4. ESTADO: ERROR (Error State)
    renderizarEstadoError(error.message);
    contadorResultados.textContent = '(Error)';
  }
}

function renderizarEstadoCargando() {
  incidentesContainer.innerHTML = `
    <div class="loading-state">
      <div class="spinner"></div>
      <p>Validando token JWT y consultando base de datos persistente...</p>
    </div>
  `;
}

function renderizarEstadoVacio(mensaje) {
  incidentesContainer.innerHTML = `
    <div class="empty-state">
      <p style="font-size: 16px; font-weight: 600;">Sin registros</p>
      <p style="margin-top: 6px;">${escapeHtml(mensaje)}</p>
      <button class="btn btn-secondary" style="margin-top: 14px;" onclick="document.getElementById('btnLimpiarFiltros').click()">
        Limpiar Filtros
      </button>
    </div>
  `;
}

function renderizarEstadoError(mensaje) {
  incidentesContainer.innerHTML = `
    <div class="error-state">
      <p style="color: var(--accent-rose); font-weight: 700; font-size: 16px;">⚠️ Error de Consulta</p>
      <p style="margin-top: 6px;">${escapeHtml(mensaje)}</p>
      <button class="btn btn-primary" style="margin-top: 14px;" onclick="abrirModalLogin()">
        Reintentar / Iniciar Sesión
      </button>
    </div>
  `;
}

// 4. RENDERIZADO SEGURO CON TEXTCONTENT / ESCAPADO (Prevención XSS - Tema 13.4)
function renderizarListaIncidentes(incidentes) {
  const usuarioActual = ApiService.getUsuario();
  const esAdmin = usuarioActual && usuarioActual.rol === 'admin';

  incidentesContainer.innerHTML = '';

  incidentes.forEach(inc => {
    const card = document.createElement('article');
    card.className = `incident-card ${inc.prioridad.toLowerCase()}`;

    const fecha = new Date(inc.fechaCreacion).toLocaleString('es-ES', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });

    const autorInfo = inc.creadoPor ? `${inc.creadoPor.nombre} (${inc.creadoPor.rol.toUpperCase()})` : (inc.reportadoPor || 'Sistema');

    const slaBadge = inc.sla ? `
      <span class="badge-sla badge-sla-${inc.sla.estadoSLA.toLowerCase()}">
        SLA: ${inc.sla.minutosRestantes > 0 ? inc.sla.minutosRestantes + 'm' : 'VENCIDO'}
      </span>` : '';

    // Estructura segura
    card.innerHTML = `
      <div class="card-top">
        <span class="card-id">#INC-${inc.id.toString().padStart(4, '0')}</span>
        <div class="card-badges">
          <span class="badge badge-prio-${inc.prioridad}">${inc.prioridad}</span>
          <span class="badge badge-estado-${inc.estado}">${inc.estado.replace('_', ' ')}</span>
          ${slaBadge}
        </div>
      </div>

      <h3 class="card-title">${escapeHtml(inc.titulo)}</h3>
      <p class="card-desc">${escapeHtml(inc.descripcion)}</p>

      <div class="card-meta">
        <div class="meta-row">
          <span>Creador (Token JWT):</span>
          <span class="meta-val">${escapeHtml(autorInfo)}</span>
        </div>
        <div class="meta-row">
          <span>Asignado a:</span>
          <span class="meta-val">${inc.asignadoA ? escapeHtml(inc.asignadoA) : '<em>Sin asignar</em>'}</span>
        </div>
        <div class="meta-row">
          <span>Fecha de auditoría:</span>
          <span class="meta-val">${fecha}</span>
        </div>
      </div>

      <div class="card-actions">
        <select class="quick-status-select" onchange="cambiarEstadoRapido(${inc.id}, this.value)" title="Cambiar estado del incidente">
          <option value="ABIERTO" ${inc.estado === 'ABIERTO' ? 'selected' : ''}>Abierto</option>
          <option value="EN_PROCESO" ${inc.estado === 'EN_PROCESO' ? 'selected' : ''}>En Proceso</option>
          <option value="RESUELTO" ${inc.estado === 'RESUELTO' ? 'selected' : ''}>Resuelto</option>
          <option value="CERRADO" ${inc.estado === 'CERRADO' ? 'selected' : ''}>Cerrado</option>
        </select>

        <div class="btn-group">
          <button class="btn btn-edit-sm" onclick="abrirModalEditar(${inc.id})">Editar</button>
          <button class="btn btn-danger-sm" onclick="intentarEliminar(${inc.id})" title="${esAdmin ? 'Eliminar incidente' : 'Requiere rol Administrador'}">
            ${esAdmin ? 'Eliminar' : 'Eliminar (Solo Admin)'}
          </button>
        </div>
      </div>
    `;

    incidentesContainer.appendChild(card);
  });
}

// 5. ENVÍO DE FORMULARIO CON CONTROL DE ESTADOS (Tema 13.3)
async function manejarGuardarIncidente(e) {
  e.preventDefault();
  formErrorMessage.style.display = 'none';

  // Deshabilitar botón durante el envío para evitar duplicados (Tema 13.3)
  btnGuardarIncidente.disabled = true;
  btnGuardarIncidente.textContent = 'Guardando y sanitizando...';

  const id = incidenteId.value;
  const esEdicion = Boolean(id);

  const payload = {
    titulo: tituloInput.value.trim(),
    descripcion: descripcionInput.value.trim(),
    prioridad: prioridadInput.value,
    estado: estadoInput.value,
    asignadoA: asignadoAInput.value.trim() || null
  };

  try {
    const url = esEdicion ? `/incidentes/${id}` : '/incidentes';
    const method = esEdicion ? 'PUT' : 'POST';

    const res = await ApiService.request(url, {
      method,
      body: JSON.stringify(payload)
    });

    // Éxito: limpiar formulario y cerrar modal
    incidenteForm.reset();
    cerrarModalIncidente();
    mostrarToast(res.mensaje || 'Operación realizada con éxito', 'success');
    cargarDatos();

  } catch (error) {
    // Error: PRESERVAR LOS VALORES DEL USUARIO (no hacemos reset)
    let msg = error.message;
    if (error.detalles && Array.isArray(error.detalles)) {
      msg += '<br>• ' + error.detalles.map(d => `${d.campo || d.parametro}: ${d.mensaje}`).join('<br>• ');
    }
    formErrorMessage.innerHTML = msg;
    formErrorMessage.style.display = 'block';

  } finally {
    btnGuardarIncidente.disabled = false;
    btnGuardarIncidente.textContent = 'Guardar en Base de Datos';
  }
}

function abrirModalCrear() {
  incidenteForm.reset();
  incidenteId.value = '';
  modalTitle.textContent = 'Registrar Nuevo Incidente';
  formErrorMessage.style.display = 'none';
  incidenteModal.classList.add('show');
  tituloInput.focus();
}

async function abrirModalEditar(id) {
  try {
    const res = await ApiService.request(`/incidentes/${id}`);
    const inc = res.data;

    incidenteId.value = inc.id;
    tituloInput.value = inc.titulo;
    descripcionInput.value = inc.descripcion;
    prioridadInput.value = inc.prioridad;
    estadoInput.value = inc.estado;
    asignadoAInput.value = inc.asignadoA || '';

    modalTitle.textContent = `Editar Incidente #INC-${inc.id.toString().padStart(4, '0')}`;
    formErrorMessage.style.display = 'none';
    incidenteModal.classList.add('show');
  } catch (error) {
    mostrarToast(error.message, 'error');
  }
}

function cerrarModalIncidente() {
  incidenteModal.classList.remove('show');
}

async function cambiarEstadoRapido(id, nuevoEstado) {
  try {
    await ApiService.request(`/incidentes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ estado: nuevoEstado })
    });
    mostrarToast(`Estado actualizado a ${nuevoEstado} exitosamente`, 'success');
    cargarDatos();
  } catch (error) {
    mostrarToast(error.message, 'error');
    cargarIncidentes();
  }
}

// 6. PRUEBA EN VIVO DE AUTORIZACIÓN POR ROLES (RBAC -> 403 Forbidden)
async function intentarEliminar(id) {
  const usuario = ApiService.getUsuario();

  if (usuario && usuario.rol !== 'admin') {
    // Si no es admin, enviamos la petición para comprobar que el backend rechaza con 403
    mostrarToast(`Enviando DELETE como rol [${usuario.rol.toUpperCase()}] para probar seguridad RBAC en backend...`, 'warning');
  } else {
    if (!confirm(`¿Confirmas eliminar permanentemente el incidente #${id}?`)) return;
  }

  try {
    const res = await ApiService.request(`/incidentes/${id}`, {
      method: 'DELETE'
    });
    mostrarToast(res.mensaje, 'success');
    cargarDatos();
  } catch (error) {
    if (error.status === 403) {
      mostrarToast(`BLOQUEO RBAC (403 Forbidden): ${error.message}`, 'error');
    } else {
      mostrarToast(error.message, 'error');
    }
  }
}

// Utilidades
function mostrarToast(mensaje, tipo = 'success') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${tipo}`;
  const icon = tipo === 'success' ? '✓' : (tipo === 'warning' ? '!' : '✕');
  toast.innerHTML = `<span>${icon}</span><span>${mensaje}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4500);
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, tag => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[tag] || tag));
}

// Exposición formal en window para manejadores inline del DOM (Conformidad ESLint)
window.seleccionarPerfilDemo = seleccionarPerfilDemo;
window.abrirModalEditar = abrirModalEditar;
window.cambiarEstadoRapido = cambiarEstadoRapido;
window.intentarEliminar = intentarEliminar;

