// =============================================
// EVENTOS - SWAY
// Sistema de gestión y visualización de eventos marinos
// =============================================

/**
 * Variables globales del sistema de eventos
 * Controlan el estado del calendario, filtros y datos de eventos marinos
 * @type {Date} currentDate - Fecha actual del calendario
 * @type {string} currentView - Vista actual ('mes' o 'agenda')
 * @type {Array} eventosData - Lista completa de eventos disponibles
 * @type {Array} filteredEventos - Eventos filtrados según criterios aplicados
 * @type {boolean} datosFormularioCargados - Control de carga de datos de formulario
 */
let currentDate = new Date();
let currentView = 'mes';
let eventosData = [];
let filteredEventos = [];
let datosFormularioCargados = false; // Control para evitar carga duplicada de datos del formulario

// =============================================
// CARGA DE DATOS
// Obtención de eventos y datos relacionados desde la API del servidor
// =============================================

/**
 * Carga eventos desde la base de datos
 * Transforma datos del servidor para compatibilidad con el formato de interfaz
 * Maneja transformación de tipos y modalidades
 * @returns {Promise<boolean>} true si la carga fue exitosa, false en caso de error
 */
async function cargarEventos() {
  try {
    const response = await fetch('/api/eventos');
    const data = await response.json();
    
    if (data.success) {
      // Transformar datos del servidor para compatibilidad con formato de interfaz
      eventosData = data.eventos.map(evento => ({
        id: evento.id,
        titulo: evento.titulo,
        tipo: transformarTipoEvento(evento.tipo_evento),
        fecha: evento.fecha_evento,
        fecha_evento: evento.fecha_evento,
        hora: evento.hora_inicio,
        hora_inicio: evento.hora_inicio,
        hora_fin: evento.hora_fin,
        modalidad: transformarModalidad(evento.modalidad),
        ubicacion: evento.direccion || (evento.modalidad === 'Virtual' ? 'Virtual' : 'Por definir'),
        descripcion: evento.descripcion || '',
        capacidad: evento.capacidad_maxima || 0,
        inscritos: 0, // Este dato se obtendría de RegistrosEvento en implementación completa
        costo: evento.es_gratuito ? 'gratuito' : 'pago',
        costo_numerico: evento.costo || 0,
        organizador: evento.organizador || 'SWAY',
        region: 'mexico', // Valor por defecto, se podría derivar de la dirección
        url_evento: evento.url_evento,
        estatus: evento.estatus
      }));
      
      filteredEventos = [...eventosData];
      return true;
    } else {
      console.error('Error al cargar eventos:', data.error);
      return false;
    }
  } catch (error) {
    console.error('Error en la petición de eventos:', error);
    return false;
  }
}

/**
 * Transforma tipos de evento de BD a formato interno
 * Convierte nombres de base de datos a identificadores internos
 * @param {string} tipoEvento - Tipo de evento desde la base de datos
 * @returns {string} Tipo de evento en formato interno
 */
function transformarTipoEvento(tipoEvento) {
  const tiposMap = {
    'Conferencia': 'conferencia',
    'Taller': 'taller',
    'Limpieza de Playa': 'limpieza',
    'Webinar': 'webinar',
    'Expedición': 'campana'
  };
  return tiposMap[tipoEvento] || 'conferencia';
}

/**
 * Transforma modalidades de BD a formato interno
 * Convierte modalidades de base de datos a formato de interfaz
 * @param {string} modalidad - Modalidad desde la base de datos
 * @returns {string} Modalidad en formato interno
 */
function transformarModalidad(modalidad) {
  const modalidadesMap = {
    'Presencial': 'presencial',
    'Virtual': 'virtual',
    'Híbrido': 'hibrido'
  };
  return modalidadesMap[modalidad] || 'presencial';
}

// =============================================
// INICIALIZACIÓN DEL SISTEMA
// Configuración inicial al cargar la página de eventos
// =============================================

/**
 * Inicializa el sistema de eventos al cargar el DOM
 * Carga datos, configura listeners y renderiza interfaces de calendario y agenda
 * Maneja carga de datos de respaldo en caso de error de conexión
 * @returns {Promise<void>}
 */
document.addEventListener('DOMContentLoaded', async function() {
  console.log('DOMContentLoaded ejecutado en eventos.js');
  
  // Cargar eventos desde la base de datos del servidor
  const eventosLoaded = await cargarEventos();
  
  if (!eventosLoaded) {
    // Si falla la carga, usar datos de ejemplo como respaldo
    console.warn('Usando datos de ejemplo para eventos');
    eventosData = generarEventosEjemplo();
    filteredEventos = [...eventosData];
  }
  
  setupEventListeners();
  renderCalendario();
  renderAgenda();
  
  // Cargar datos para el formulario de creación (solo una vez)
  if (!datosFormularioCargados) {
    cargarTiposEvento();
    cargarModalidades();
    datosFormularioCargados = true;
  }
  
  // Inicializar carrusel de testimonios si están disponibles
  if (testimonials.length > 0) {
    showTestimonial(0);
  }
});

/**
 * Genera eventos de ejemplo como respaldo
 * Utilizado cuando falla la conexión con la base de datos del servidor
 * Proporciona datos de muestra para mantener funcionalidad
 * @returns {Array} Array de eventos de ejemplo con estructura completa
 */
function generarEventosEjemplo() {
  return [
    {
      id: 'webinar-arrecifes',
      titulo: 'Crisis de los Arrecifes de Coral',
      tipo: 'webinar',
      fecha: '2025-08-15',
      hora: '19:00',
      modalidad: 'virtual',
      ubicacion: 'Zoom',
      descripcion: 'Expertos internacionales discuten las amenazas actuales a los arrecifes de coral y estrategias de conservación.',
      capacidad: 500,
      inscritos: 248,
      costo: 'gratuito',
      organizador: 'Dr. Marina López',
      region: 'global'
    },
    {
      id: 'limpieza-cancun',
      titulo: 'Gran Limpieza de Playa Cancún',
      tipo: 'limpieza',
      fecha: '2025-08-25',
      hora: '08:00',
      modalidad: 'presencial',
      ubicacion: 'Playa Delfines, Cancún',
      descripcion: 'Actividad presencial de limpieza en las playas de Cancún. Incluye equipo, refrigerio y certificado de participación.',
      capacidad: 200,
      inscritos: 156,
      costo: 'gratuito',
      organizador: 'SWAY México',
      region: 'mexico'
    }
  ];
}

// =============================================
// CONFIGURACIÓN DE EVENTOS
// Inicialización de event listeners y validaciones de formularios
// =============================================

/**
 * Configura todos los event listeners del sistema
 * Incluye navegación de calendario, filtros, formularios y validaciones
 * Establece interacciones para todas las funcionalidades de eventos
 * @returns {void}
 */
function setupEventListeners() {
  // Event listeners para navegación del calendario
  document.getElementById('prev-month').addEventListener('click', () => cambiarMes(-1));
  document.getElementById('next-month').addEventListener('click', () => cambiarMes(1));
  
  // Event listeners para cambio entre vista calendario y agenda
  document.querySelectorAll('.vista-btn').forEach(btn => {
    btn.addEventListener('click', cambiarVista);
  });
  
  // Event listeners para sistema de filtros
  document.getElementById('tipo-filter').addEventListener('change', filtrarEventos);
  document.getElementById('modalidad-filter').addEventListener('change', filtrarEventos);
  document.getElementById('region-filter').addEventListener('change', filtrarEventos);
  
  // Event listener para formulario de creación de eventos
  document.getElementById('form-crear-evento').addEventListener('submit', crearEvento);
  
  // Validación en tiempo real para el campo de ubicación/URL
  const campoUbicacion = document.querySelector('input[name="ubicacion"]');
  if (campoUbicacion) {
    campoUbicacion.addEventListener('blur', function() {
      const urlValue = this.value.trim();
      
      // Obtener modalidad seleccionada
      const selectModalidad = document.getElementById('modalidad-evento');
      let modalidadTexto = '';
      if (selectModalidad && selectModalidad.selectedIndex > 0) {
        modalidadTexto = selectModalidad.options[selectModalidad.selectedIndex].text;
      }
      
      if (urlValue) {
        const validacion = validarURLEvento(urlValue, modalidadTexto);
        
        // Remover clases de validación previas
        this.classList.remove('is-valid', 'is-invalid');
        
        // Remover feedback previo
        const feedback = this.parentNode.querySelector('.invalid-feedback');
        if (feedback) feedback.remove();
        
        if (validacion.valida) {
          this.classList.add('is-valid');
          // Actualizar el valor con la URL normalizada si es diferente
          if (validacion.url && validacion.url !== urlValue) {
            this.value = validacion.url;
          }
        } else {
          this.classList.add('is-invalid');
          // Crear mensaje de error
          const errorDiv = document.createElement('div');
          errorDiv.className = 'invalid-feedback';
          errorDiv.textContent = validacion.error;
          this.parentNode.appendChild(errorDiv);
        }
      } else {
        // Campo vacío - siempre válido ahora
        this.classList.remove('is-valid', 'is-invalid');
        const feedback = this.parentNode.querySelector('.invalid-feedback');
        if (feedback) feedback.remove();
      }
    });
  }
  
  // Manejar cambio de modalidad para ajustar validación del campo ubicación
  const selectModalidad = document.getElementById('modalidad-evento');
  if (selectModalidad && campoUbicacion) {
    selectModalidad.addEventListener('change', function() {
      const modalidadSeleccionada = this.options[this.selectedIndex];
      const isPresencial = modalidadSeleccionada && modalidadSeleccionada.text.toLowerCase().includes('presencial');
      
      // Limpiar validaciones previas
      campoUbicacion.classList.remove('is-valid', 'is-invalid');
      const feedback = campoUbicacion.parentNode.querySelector('.invalid-feedback');
      if (feedback) feedback.remove();
      
      // Actualizar placeholder y hint según modalidad
      if (isPresencial) {
        campoUbicacion.placeholder = 'Dirección física (opcional)';
        campoUbicacion.title = 'Para eventos presenciales, puedes dejar este campo vacío o indicar la dirección';
      } else {
        campoUbicacion.placeholder = 'Enlace virtual (opcional)';
        campoUbicacion.title = 'Ingresa cualquier enlace: meet.com, zoom.us/j/123, bit.ly/evento, etc. También es opcional.';
      }
    });
  }
  
  // Botón recargar eventos
  const btnRecargar = document.querySelector('.btn-recargar-eventos');
  if (btnRecargar) {
    btnRecargar.addEventListener('click', async () => {
      await cargarEventos();
      renderCalendario();
      renderAgenda();
    });
  }
}

// =============================================
// NAVEGACIÓN DEL CALENDARIO
// Funciones para navegar entre meses y actualizar vistas
// =============================================

/**
 * Cambia el mes actual del calendario
 * @param {number} direccion - Dirección del cambio (-1 anterior, 1 siguiente)
 */
function cambiarMes(direccion) {
  currentDate.setMonth(currentDate.getMonth() + direccion);
  renderCalendario();
  updateMonthYear();
}

/**
 * Actualiza el título del mes en la interfaz
 * Muestra el mes y año actual en formato legible
 */
function updateMonthYear() {
  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  
  const monthYear = `${meses[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
  document.getElementById('current-month-year').textContent = monthYear;
}

/**
 * Cambia entre vista de calendario y agenda
 * @param {Event} e - Evento del botón de vista clickeado
 */
function cambiarVista(e) {
  const vista = e.target.dataset.vista;
  currentView = vista;
  
  // Actualizar botones
  document.querySelectorAll('.vista-btn').forEach(btn => btn.classList.remove('active'));
  e.target.classList.add('active');
  
  // Mostrar/ocultar vistas
  if (vista === 'agenda') {
    document.getElementById('calendario-mes').style.display = 'none';
    document.getElementById('agenda-view').style.display = 'block';
  } else {
    document.getElementById('calendario-mes').style.display = 'block';
    document.getElementById('agenda-view').style.display = 'none';
  }
}

// =============================================
// SISTEMA DE FILTROS
// Filtrado y búsqueda de eventos
// =============================================

/**
 * Aplica filtros seleccionados a la lista de eventos
 * Filtra por tipo, modalidad y región
 */
function filtrarEventos() {
  const tipoFilter = document.getElementById('tipo-filter').value;
  const modalidadFilter = document.getElementById('modalidad-filter').value;
  const regionFilter = document.getElementById('region-filter').value;
  
  filteredEventos = eventosData.filter(evento => {
    const matchesTipo = !tipoFilter || evento.tipo === tipoFilter;
    const matchesModalidad = !modalidadFilter || evento.modalidad === modalidadFilter;
    const matchesRegion = !regionFilter || evento.region === regionFilter;
    
    return matchesTipo && matchesModalidad && matchesRegion;
  });
  
  renderCalendario();
  renderAgenda();
}

// =============================================
// RENDERIZADO DE INTERFACES
// Generación dinámica de calendario y agenda
// =============================================

/**
 * Renderiza el calendario mensual con eventos
 * Genera grilla de días y posiciona eventos en fechas correspondientes
 */
function renderCalendario() {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  // Primer día del mes y último día
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  // Primer día de la semana (domingo = 0)
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());
  
  const calendarioDias = document.getElementById('calendario-dias');
  calendarioDias.innerHTML = '';
  
  // Generar 42 días (6 semanas)
  for (let i = 0; i < 42; i++) {
    const currentDay = new Date(startDate);
    currentDay.setDate(startDate.getDate() + i);
    
    const diaElement = document.createElement('div');
    diaElement.className = 'calendario-dia';
    
    // Clases especiales
    if (currentDay.getMonth() !== month) {
      diaElement.classList.add('otro-mes');
    }
    
    if (isToday(currentDay)) {
      diaElement.classList.add('hoy');
    }
    
    // Número del día
    const numeroElement = document.createElement('div');
    numeroElement.className = 'dia-numero';
    numeroElement.textContent = currentDay.getDate();
    diaElement.appendChild(numeroElement);
    
    // Eventos del día
    const eventosDelDia = getEventosDelDia(currentDay);
    eventosDelDia.forEach(evento => {
      const eventoElement = document.createElement('div');
      eventoElement.className = `evento_calendario ${evento.tipo}`;
      eventoElement.textContent = evento.titulo.substring(0, 15) + (evento.titulo.length > 15 ? '...' : '');
      eventoElement.onclick = () => openEventoDetail(evento.id);
      diaElement.appendChild(eventoElement);
    });
    
    calendarioDias.appendChild(diaElement);
  }
  
  updateMonthYear();
}

/**
 * Renderiza la vista de agenda con eventos próximos
 * Muestra lista ordenada de eventos futuros con detalles
 */
function renderAgenda() {
  const agendaList = document.getElementById('agenda-list');
  
  // Ordenar eventos por fecha
  const eventosFuturos = filteredEventos
    .filter(evento => new Date(evento.fecha) >= new Date())
    .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
    .slice(0, 20); // Mostrar solo los próximos 20 eventos
  
  agendaList.innerHTML = eventosFuturos.map(evento => `
    <div class="agenda-item" onclick="openEventoDetail('${evento.id}')">
      <div class="agenda-fecha">${formatearFecha(evento.fecha)} - ${evento.hora}</div>
      <h4 class="agenda-titulo">${evento.titulo}</h4>
      <div class="agenda-detalles">
        <span class="evento-tipo ${evento.tipo}">${getTipoText(evento.tipo)}</span>
        <span class="info-item">
          <i class="bi bi-geo-alt"></i>
          ${evento.ubicacion}
        </span>
        <span class="info-item">
          <i class="bi bi-people"></i>
          ${evento.inscritos}/${evento.capacidad} inscritos
        </span>
      </div>
    </div>
  `).join('');
}

// =============================================
// UTILIDADES DE EVENTOS
// Funciones auxiliares para manejo de eventos
// =============================================

/**
 * Obtiene eventos de una fecha específica
 * @param {Date} fecha - Fecha para buscar eventos
 * @returns {Array} Array de eventos en esa fecha
 */
function getEventosDelDia(fecha) {
  const fechaStr = fecha.toISOString().split('T')[0];
  return filteredEventos.filter(evento => evento.fecha === fechaStr);
}

/**
 * Verifica si una fecha es el día de hoy
 * @param {Date} fecha - Fecha a verificar
 * @returns {boolean} true si es hoy
 */
function isToday(fecha) {
  const hoy = new Date();
  return fecha.toDateString() === hoy.toDateString();
}

/**
 * Formatea una fecha en español legible
 * @param {string} fechaStr - Fecha en formato string
 * @returns {string} Fecha formateada en español
 */
function formatearFecha(fechaStr) {
  const fecha = new Date(fechaStr);
  const opciones = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  return fecha.toLocaleDateString('es-ES', opciones);
}

/**
 * Obtiene el texto descriptivo del tipo de evento
 * @param {string} tipo - Tipo de evento interno
 * @returns {string} Texto descriptivo del tipo
 */
function getTipoText(tipo) {
  const tipoMap = {
    'webinar': 'Webinar',
    'limpieza': 'Limpieza',
    'conferencia': 'Conferencia',
    'taller': 'Taller',
    'campana': 'Campaña'
  };
  return tipoMap[tipo] || tipo;
}

// =============================================
// MODAL DE DETALLES DE EVENTO
// Visualización completa de información del evento
// =============================================

/**
 * Abre el modal con detalles completos del evento
 * @param {string|number} eventoId - ID del evento a mostrar
 */
function openEventoDetail(eventoId) {
  const evento = eventosData.find(e => e.id === eventoId);
  if (!evento) return;
  
  const modal = document.getElementById('evento-modal');
  const content = document.getElementById('evento-modal-content');
  
  // Formatear fechas correctamente
  const fechaEvento = new Date(evento.fecha_evento || evento.fecha);
  const fechaFormateada = fechaEvento.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  // Determinar icono del tipo de evento
  const tipoIconos = {
    'conferencia': 'bi-megaphone',
    'taller': 'bi-tools',
    'limpieza': 'bi-droplet',
    'webinar': 'bi-camera-video',
    'campana': 'bi-flag',
    'Conferencia': 'bi-megaphone',
    'Taller': 'bi-tools',
    'Limpieza de Playa': 'bi-droplet',
    'Webinar': 'bi-camera-video',
    'Expedición': 'bi-compass'
  };
  
  const modalidadIconos = {
    'presencial': 'bi-geo-alt-fill',
    'virtual': 'bi-camera-video-fill',
    'hibrido': 'bi-hybrid',
    'Presencial': 'bi-geo-alt-fill',
    'Virtual': 'bi-camera-video-fill',
    'Híbrido': 'bi-hybrid'
  };
  
  const tipoIcono = tipoIconos[evento.tipo_evento || evento.tipo] || 'bi-calendar-event';
  const modalidadIcono = modalidadIconos[evento.modalidad] || 'bi-geo-alt';
  
  // Determinar el color del badge según el tipo
  const tipoBadge = {
    'conferencia': 'badge-primary',
    'taller': 'badge-success',
    'limpieza': 'badge-info',
    'webinar': 'badge-warning',
    'campana': 'badge-danger',
    'Conferencia': 'badge-primary',
    'Taller': 'badge-success',
    'Limpieza de Playa': 'badge-info',
    'Webinar': 'badge-warning',
    'Expedición': 'badge-danger'
  };
  
  const badgeClass = tipoBadge[evento.tipo_evento || evento.tipo] || 'badge-secondary';
  
  content.innerHTML = `
    <div class="evento-detail-card">
      <!-- Header del evento -->
      <div class="evento-detail-header">
        <div class="evento-title-section">
          <h2 class="evento-title">${evento.titulo}</h2>
          <div class="evento-badges">
            <span class="badge ${badgeClass}">
              <i class="${tipoIcono}"></i> ${evento.tipo_evento || evento.tipo}
            </span>
            <span class="badge badge-outline-primary">
              <i class="${modalidadIcono}"></i> ${evento.modalidad}
            </span>
            ${evento.es_gratuito ? '<span class="badge badge-success"><i class="bi bi-gift"></i> Gratuito</span>' : `<span class="badge badge-warning"><i class="bi bi-currency-dollar"></i> $${evento.costo}</span>`}
          </div>
        </div>
      </div>
      
      <!-- Grid de información principal -->
      <div class="evento-info-grid">
        <div class="info-card modern">
          <div class="info-icon">
            <i class="bi bi-calendar3"></i>
          </div>
          <div class="info-content">
            <h5>Fecha y Hora</h5>
            <p class="info-primary">${fechaFormateada}</p>
            <p class="info-secondary">
              ${evento.hora_inicio} ${evento.hora_fin ? `- ${evento.hora_fin}` : ''}
            </p>
          </div>
        </div>
        
        <div class="info-card modern">
          <div class="info-icon">
            <i class="${modalidadIcono}"></i>
          </div>
          <div class="info-content">
            <h5>Ubicación</h5>
            <p class="info-primary">
              ${evento.modalidad === 'Virtual' || evento.modalidad === 'virtual' ? 'En línea' : (evento.direccion || 'Por confirmar')}
            </p>
            ${evento.url_evento ? `<a href="${evento.url_evento}" target="_blank" class="info-link"><i class="bi bi-link-45deg"></i> Enlace del evento</a>` : ''}
          </div>
        </div>
        
        <div class="info-card modern">
          <div class="info-icon">
            <i class="bi bi-people-fill"></i>
          </div>
          <div class="info-content">
            <h5>Capacidad</h5>
            <p class="info-primary">${evento.capacidad_maxima || 'Ilimitada'} personas</p>
            <p class="info-secondary">${evento.inscritos || 0} inscritos</p>
          </div>
        </div>
        
        <div class="info-card modern">
          <div class="info-icon">
            <i class="bi bi-person-badge"></i>
          </div>
          <div class="info-content">
            <h5>Organizador</h5>
            <p class="info-primary">${evento.organizador || 'SWAY'}</p>
            <p class="info-secondary">Organización certificada</p>
          </div>
        </div>
      </div>
      
      <!-- Descripción del evento -->
      <div class="evento-descripcion-section">
        <h4><i class="bi bi-journal-text"></i> Acerca del evento</h4>
        <div class="descripcion-content">
          <p>${evento.descripcion || 'Un evento increíble para la conservación marina. Únete y sé parte del cambio.'}</p>
        </div>
      </div>
      
      <!-- Acciones del evento -->
      <div class="evento-acciones-section">
        <button class="btn btn-primary btn-lg evento-action-btn" onclick="registrarEvento('${evento.id}')">
          <i class="bi bi-calendar-plus"></i>
          <span>Registrarse al evento</span>
        </button>
        
        <div class="secondary-actions">
          <button class="btn btn-outline-primary" onclick="compartirEvento('${evento.id}')">
            <i class="bi bi-share"></i> Compartir
          </button>
          <button class="btn btn-outline-success" onclick="agregarCalendario('${evento.id}')">
            <i class="bi bi-calendar2-plus"></i> Agregar a calendario
          </button>
          ${evento.url_evento && evento.modalidad === 'Virtual' ? `
          <a href="${evento.url_evento}" target="_blank" class="btn btn-outline-info">
            <i class="bi bi-camera-video"></i> Unirse ahora
          </a>` : ''}
        </div>
      </div>
      
      <!-- Footer informativo -->
      <div class="evento-footer">
        <div class="footer-info">
          <i class="bi bi-info-circle"></i>
          <span>Evento organizado por ${evento.organizador || 'SWAY'} • Estado: ${evento.estatus || 'Activo'}</span>
        </div>
      </div>
    </div>
  `;
  
  modal.style.display = 'flex';
}

/**
 * Cierra el modal de detalles del evento
 */
function closeEventoModal() {
  document.getElementById('evento-modal').style.display = 'none';
}

// =============================================
// ACCIONES DE EVENTOS
// Registro, compartir y gestionar eventos
// =============================================

/**
 * Registra al usuario en un evento (funcionalidad en desarrollo)
 * @param {string|number} eventoId - ID del evento
 */
function registrarEvento(eventoId) {
  console.log('Intentando registrar en evento:', eventoId);
  
  // Cerrar el modal de información del evento si está abierto
  const eventoModal = document.getElementById('evento-modal');
  
  if (eventoModal && (eventoModal.style.display === 'block' || eventoModal.style.display === 'flex')) {
    // Cerrar el modal de evento usando la función personalizada
    closeEventoModal();
    
    // Pequeño delay para asegurar que el modal se cierre completamente
    setTimeout(() => {
      // Mostrar modal de funcionalidad en desarrollo usando Bootstrap
      const modalElement = document.getElementById('modalEnDesarrollo');
      if (modalElement) {
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
      } else {
        console.error('Modal de desarrollo no encontrado');
        // Fallback: mostrar alerta
        alert('Esta funcionalidad está en desarrollo. ¡Pronto estará disponible!');
      }
    }, 150);
  } else {
    // Si el modal no estaba abierto, mostrar directamente
    const modalElement = document.getElementById('modalEnDesarrollo');
    if (modalElement) {
      const modal = new bootstrap.Modal(modalElement);
      modal.show();
    } else {
      console.error('Modal de desarrollo no encontrado');
      // Fallback: mostrar alerta
      alert('Esta funcionalidad está en desarrollo. ¡Pronto estará disponible!');
    }
  }
}

/**
 * Comparte un evento usando API nativa o clipboard
 * @param {string|number} eventoId - ID del evento a compartir
 */
function compartirEvento(eventoId) {
  const evento = eventosData.find(e => e.id === eventoId);
  if (!evento) return;
  
  if (navigator.share) {
    navigator.share({
      title: evento.titulo,
      text: `Únete a: ${evento.titulo} - ${formatearFecha(evento.fecha)}`,
      url: window.location.href
    });
  } else {
    const texto = `Únete a: ${evento.titulo} - ${formatearFecha(evento.fecha)} ${evento.hora}`;
    navigator.clipboard.writeText(texto).then(() => {
      alert('Enlace del evento copiado al portapapeles');
    });
  }
}

/**
 * Agrega evento a Google Calendar
 * @param {string|number} eventoId - ID del evento
 */
function agregarCalendario(eventoId) {
  const evento = eventosData.find(e => e.id === eventoId);
  if (!evento) return;
  
  const startDate = new Date(`${evento.fecha}T${evento.hora}`);
  const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // +2 horas
  
  const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(evento.titulo)}&dates=${startDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z/${endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z&details=${encodeURIComponent(evento.descripcion)}&location=${encodeURIComponent(evento.ubicacion)}`;
  
  window.open(googleCalendarUrl, '_blank');
}

// =============================================
// VALIDACIONES ESPECÍFICAS
// Validaciones personalizadas para formularios de eventos
// =============================================

/**
 * Valida URLs para eventos con contexto de modalidad
 * @param {string} url - URL a validar
 * @param {string} modalidad - Modalidad del evento para contexto
 * @returns {Object} Objeto con resultado de validación
 */
function validarURLEvento(url, modalidad = null) {
  if (!url || !url.trim()) {
    // URL vacía siempre es válida (campo opcional)
    return { valida: true, url: null };
  }
  
  let urlNormalizada = url.trim();
  
  // Si contiene espacios, no es válida
  if (urlNormalizada.includes(' ')) {
    return { 
      valida: false, 
      url: null, 
      error: 'La URL no puede contener espacios' 
    };
  }
  
  // Validación muy permisiva - casi cualquier texto que parezca una URL
  const esURLValida = 
    // Tiene protocolo http/https
    urlNormalizada.startsWith('http://') || 
    urlNormalizada.startsWith('https://') ||
    // Parece dominio (contiene punto)
    /^[a-zA-Z0-9][a-zA-Z0-9\-\.]*[a-zA-Z0-9]\.[a-zA-Z]{2,}/.test(urlNormalizada) ||
    // Enlaces acortados conocidos
    /^(bit\.ly|tinyurl\.com|t\.co|short\.link|cutt\.ly|is\.gd|v\.gd|meet\.com|zoom\.us)/.test(urlNormalizada) ||
    // IDs de plataformas
    /^[a-zA-Z0-9\-]{3,}$/.test(urlNormalizada);
  
  // Normalizar URL agregando protocolo si es necesario
  if (esURLValida && !urlNormalizada.startsWith('http://') && !urlNormalizada.startsWith('https://')) {
    if (urlNormalizada.includes('.')) {
      urlNormalizada = 'https://' + urlNormalizada;
    }
  }
  
  if (esURLValida) {
    return { valida: true, url: urlNormalizada };
  } else {
    const mensajeError = modalidad && modalidad.toLowerCase().includes('presencial') 
      ? 'Por favor ingresa una dirección válida o deja el campo vacío'
      : 'Por favor ingresa una URL o enlace válido';
    
    return { valida: false, url: null, error: mensajeError };
  }
}

// =============================================
// CREACIÓN DE EVENTOS
// Formulario y procesamiento de nuevos eventos
// =============================================

/**
 * Procesa el formulario de creación de evento
 * @param {Event} e - Evento del formulario
 */
function crearEvento(e) {
  e.preventDefault();
  
  const formData = new FormData(e.target);
  
  // Obtener modalidad para validación contextual
  const selectModalidad = document.getElementById('modalidad-evento');
  let modalidadTexto = '';
  if (selectModalidad && selectModalidad.selectedIndex > 0) {
    modalidadTexto = selectModalidad.options[selectModalidad.selectedIndex].text;
  }
  
  // Validar URL específicamente para eventos con contexto de modalidad
  const urlEvento = formData.get('ubicacion');
  const validacionURL = validarURLEvento(urlEvento, modalidadTexto);
  
  if (!validacionURL.valida) {
    mostrarModalCrearEvento('URL no válida', validacionURL.error, 'error');
    return;
  }
  
  // Crear objeto con los datos del formulario
  const eventoData = {
    titulo: formData.get('titulo'),
    descripcion: formData.get('descripcion'),
    fecha_evento: formData.get('fecha_evento'),
    hora_inicio: formData.get('hora_inicio'),
    hora_fin: formData.get('hora_fin') || null,
    id_tipo_evento: parseInt(formData.get('tipo')),
    id_modalidad: parseInt(formData.get('modalidad')),
    url_evento: validacionURL.url, // Usar la URL normalizada
    capacidad_maxima: parseInt(formData.get('capacidad_maxima')) || null,
    costo: parseFloat(formData.get('costo')) || 0,
    contacto: formData.get('contacto')
  };
  
  // Validaciones básicas
  if (!eventoData.titulo || !eventoData.fecha_evento || !eventoData.hora_inicio) {
    mostrarModalCrearEvento('Campos obligatorios', 'Por favor completa todos los campos obligatorios', 'error');
    return;
  }
  
  // Enviar datos al servidor
  fetch('/api/eventos/crear', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(eventoData)
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      // Limpiar formulario
      e.target.reset();
      
      // Mostrar modal de éxito
      mostrarModalCrearEvento('¡Evento creado exitosamente!', data.message, 'success');
      
      // Opcional: agregar a la vista local
      const nuevoEvento = {
        id: `evento-${data.evento_id}`,
        titulo: eventoData.titulo,
        tipo: document.querySelector('#tipo-evento option:checked').textContent,
        fecha: eventoData.fecha_evento,
        hora: eventoData.hora_inicio,
        modalidad: document.querySelector('#modalidad-evento option:checked').textContent,
        ubicacion: eventoData.url_evento,
        descripcion: eventoData.descripcion,
        capacidad: eventoData.capacidad_maxima || 50,
        inscritos: 0,
        costo: eventoData.costo === 0 ? 'gratuito' : 'pago',
        organizador: 'Usuario',
        region: 'mexico'
      };
      
      eventosData.push(nuevoEvento);
      filteredEventos = [...eventosData];
      renderCalendario();
      renderAgenda();
    } else {
      mostrarModalCrearEvento('Error al crear evento', data.message, 'error');
    }
  })
  .catch(error => {
    console.error('Error:', error);
    mostrarModalCrearEvento('Error de conexión', 'Error al crear el evento. Por favor intenta de nuevo.', 'error');
  });
}

// =============================================
// CARGA DE DATOS DE FORMULARIO
// Obtención de opciones para selectores del formulario
// =============================================

/**
 * Carga tipos de evento desde la base de datos
 * Puebla el selector de tipos en el formulario de creación
 * @returns {Promise<void>} Tipos de evento cargados
 */
async function cargarTiposEvento() {
  try {
    const select = document.getElementById('tipo-evento');
    if (!select) {
      console.log('Elemento tipo-evento no encontrado');
      return;
    }
    
    // Verificar si ya tiene datos cargados para evitar duplicados
    if (select.dataset.cargado === 'true') {
      console.log('Tipos de evento ya cargados, saltando...');
      return;
    }
    
    const response = await fetch('/api/tipos-evento');
    const data = await response.json();
    
    if (data.success) {
      // Limpiar el select antes de cargar
      select.innerHTML = '';
      
      // Agregar opción por defecto
      select.appendChild(new Option('Seleccionar tipo', ''));
      
      // Agregar opciones de la base de datos
      data.tipos.forEach(tipo => {
        const option = document.createElement('option');
        option.value = tipo.id;
        option.textContent = tipo.nombre;
        option.title = tipo.descripcion;
        select.appendChild(option);
      });
      
      // Marcar como cargado
      select.dataset.cargado = 'true';
      
      console.log(`${data.tipos.length} tipos de evento únicos cargados`);
    } else {
      console.error('Error al cargar tipos de evento:', data.error);
    }
  } catch (error) {
    console.error('Error al cargar tipos de evento:', error);
  }
}

/**
 * Carga modalidades desde la base de datos
 * Puebla el selector de modalidades en el formulario
 * @returns {Promise<void>} Modalidades cargadas
 */
async function cargarModalidades() {
  try {
    const select = document.getElementById('modalidad-evento');
    if (!select) {
      console.log('Elemento modalidad-evento no encontrado');
      return;
    }
    
    // Verificar si ya tiene datos cargados para evitar duplicados
    if (select.dataset.cargado === 'true') {
      console.log('Modalidades ya cargadas, saltando...');
      return;
    }
    
    const response = await fetch('/api/modalidades');
    const data = await response.json();
    
    if (data.success) {
      // Limpiar el select antes de cargar
      select.innerHTML = '';
      
      // Agregar opción por defecto
      select.appendChild(new Option('Seleccionar modalidad', ''));
      
      // Agregar opciones de la base de datos
      data.modalidades.forEach(modalidad => {
        const option = document.createElement('option');
        option.value = modalidad.id;
        option.textContent = modalidad.nombre;
        select.appendChild(option);
      });
      
      // Marcar como cargado
      select.dataset.cargado = 'true';
      
      console.log(`${data.modalidades.length} modalidades únicas cargadas`);
    } else {
      console.error('Error al cargar modalidades:', data.error);
    }
  } catch (error) {
    console.error('Error al cargar modalidades:', error);
  }
}

// =============================================
// CARRUSEL DE TESTIMONIOS
// Funcionalidad del carrusel de testimonios
// =============================================

/**
 * Variables y funciones del carrusel de testimonios
 */
let currentTestimonial = 0;
const testimonials = document.querySelectorAll('.testimonial-item');

/**
 * Muestra un testimonio específico por índice
 * @param {number} index - Índice del testimonio a mostrar
 */
function showTestimonial(index) {
  testimonials.forEach((testimonial, i) => {
    testimonial.classList.toggle('active', i === index);
  });
}

/**
 * Cambia al siguiente o anterior testimonio
 * @param {number} direction - Dirección del cambio (-1 o 1)
 */
function changeTestimonial(direction) {
  currentTestimonial += direction;
  
  if (currentTestimonial >= testimonials.length) {
    currentTestimonial = 0;
  } else if (currentTestimonial < 0) {
    currentTestimonial = testimonials.length - 1;
  }
  
  showTestimonial(currentTestimonial);
}

// Auto-rotate testimonials
setInterval(() => {
  changeTestimonial(1);
}, 5000);

// =============================================
// MODAL DE CREAR EVENTO
// Funciones para el modal de confirmación de creación
// =============================================

/**
 * Muestra modal de confirmación para creación de evento
 * @param {string} titulo - Título del modal
 * @param {string} mensaje - Mensaje del modal
 * @param {string} tipo - Tipo de modal ('success', 'error', 'warning')
 */
function mostrarModalCrearEvento(titulo, mensaje, tipo = 'success') {
  const modal = document.getElementById('crear-evento-modal');
  const modalTitle = document.getElementById('modal-title');
  const modalMessage = document.getElementById('modal-message');
  const modalIcon = modal.querySelector('.modal-icon i');
  
  // Configurar el título
  modalTitle.textContent = titulo;
  
  // Configurar el mensaje
  modalMessage.textContent = mensaje;
  
  // Configurar el icono según el tipo
  if (tipo === 'success') {
    modalIcon.className = 'bi bi-check-circle-fill text-success';
    modalIcon.style.color = '#28a745';
  } else if (tipo === 'error') {
    modalIcon.className = 'bi bi-x-circle-fill text-danger';
    modalIcon.style.color = '#dc3545';
  } else if (tipo === 'warning') {
    modalIcon.className = 'bi bi-exclamation-triangle-fill text-warning';
    modalIcon.style.color = '#ffc107';
  }
  
  // Mostrar el modal
  modal.style.display = 'flex';
  modal.classList.add('show');
  
  // Enfocar el modal para accesibilidad
  modal.setAttribute('aria-hidden', 'false');
  
  // Agregar evento para cerrar con Escape
  document.addEventListener('keydown', handleEscapeKey);
}

/**
 * Cierra el modal de crear evento
 */
function closeCrearEventoModal() {
  const modal = document.getElementById('crear-evento-modal');
  
  // Ocultar el modal
  modal.classList.remove('show');
  modal.style.display = 'none';
  modal.setAttribute('aria-hidden', 'true');
  
  // Remover el evento de escape
  document.removeEventListener('keydown', handleEscapeKey);
}

/**
 * Maneja la tecla Escape para cerrar modal
 * @param {KeyboardEvent} event - Evento de teclado
 */
function handleEscapeKey(event) {
  if (event.key === 'Escape') {
    closeCrearEventoModal();
  }
}

// Cerrar modal al hacer clic fuera de él
document.addEventListener('click', function(event) {
  const modal = document.getElementById('crear-evento-modal');
  if (event.target === modal) {
    closeCrearEventoModal();
  }
});

// Inicializar validaciones globales para el formulario de eventos
document.addEventListener('DOMContentLoaded', function() {
  // Verificar si las validaciones globales están disponibles
  if (typeof validacionesSway !== 'undefined') {
    // Configurar validaciones para el formulario de crear evento
    const formularioEventos = document.getElementById('form-crear-evento');
    if (formularioEventos) {
      validacionesSway.configurarFormulario(formularioEventos, 'eventos');
    }
  }
});
