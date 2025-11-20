// =============================================
// ESPECIES MARINAS - SWAY
// Sistema de catálogo y visualización de especies marinas
// =============================================

/**
 * Variables globales del sistema de especies marinas
 * Almacenan datos de especies, filtros activos y configuración de búsqueda
 * @type {Array} especiesData - Lista completa de especies marinas
 * @type {Array} filteredEspecies - Especies filtradas según criterios aplicados
 * @type {number} currentPage - Página actual de la paginación
 * @type {number} itemsPerPage - Cantidad de especies por página
 * @type {number} totalPages - Total de páginas disponibles
 * @type {number|null} searchTimeout - Control de timeout para búsqueda diferida
 * @type {boolean} isLoading - Estado de carga de datos
 * @type {Object} activeFilters - Filtros actualmente aplicados
 */
let especiesData = [];
let filteredEspecies = [];
let currentPage = 1;
const itemsPerPage = 12; // Cantidad optimizada de especies por página
let totalPages = 0;
let searchTimeout = null;
let isLoading = false;
let activeFilters = {};

// =============================================
// INICIALIZACIÓN DEL SISTEMA
// Carga inicial de datos y configuración de eventos
// =============================================

/**
 * Inicialización del sistema de especies marinas
 * Ejecuta cuando el DOM está completamente cargado
 * Configura todos los componentes necesarios para el catálogo de especies
 * @returns {void}
 */
document.addEventListener('DOMContentLoaded', function() {
  cargarEspecies();
  setupEventListeners();
  initializeActiveFiltersDisplay();
  
  // Inicializar vista por defecto (garantiza que el DOM esté completamente cargado)
  setTimeout(() => {
    cargarPreferenciaVista();
  }, 100);
});

// =============================================
// CARGA DE DATOS
// Obtención de información de especies marinas desde la API
// =============================================

/**
 * Carga las especies marinas desde la base de datos
 * Utiliza sistema de filtros, ordenamiento y paginación
 * Maneja errores de conexión y estados de carga
 * @returns {Promise<void>} Especies cargadas y renderizadas
 */
async function cargarEspecies() {
  setLoadingState(true);
  
  try {
    // Usar parámetros por defecto para la carga inicial de especies
    const params = new URLSearchParams();
    params.append('page', currentPage);
    params.append('limit', itemsPerPage);
    params.append('sort', 'nombre'); // Ordenamiento alfabético por defecto
    
    const response = await fetch(`/api/especies?${params}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }
    
    especiesData = data.especies || [];
    filteredEspecies = [...especiesData];
    totalPages = data.total_pages || Math.ceil((data.total || 0) / itemsPerPage);
    
    renderEspecies();
    updatePagination();
    actualizarContadorEspecies(data.total || especiesData.length);
    
    // Cargar estadísticas globales de conservación
    loadStatistics();
    
    // Sincronizar datos con el mapa interactivo si está disponible
    if (window.mapInitialized && mapSpeciesData) {
      mapSpeciesData = convertEspeciesToMapData(especiesData);
      applyMapFilters();
    }
    
  } catch (error) {
    console.error('Error al cargar especies:', error);
    
    // Mostrar mensaje de error - no usar datos de fallback para mantener integridad
    showErrorMessage('Error al conectar con la base de datos. Por favor, intenta recargar la página.');
    especiesData = [];
    filteredEspecies = [];
    totalPages = 0;
    
    renderEspecies();
    updatePagination();
    actualizarContadorEspecies(0);
  } finally {
    setLoadingState(false);
  }
}

/**
 * Carga estadísticas globales de especies desde la API
 * Obtiene métricas de conservación y biodiversidad marina
 * @returns {Promise<void>} Estadísticas cargadas y mostradas
 */
async function loadStatistics() {
  try {
    const response = await fetch('/api/estadisticas');
    const data = await response.json();
    
    if (data && !data.error) {
      updateStatisticsDisplay(data);
    }
  } catch (error) {
    console.error('Error al cargar estadísticas:', error);
  }
}

/**
 * Actualiza la visualización de estadísticas en la interfaz
 * Muestra métricas importantes de conservación marina con formato numérico
 * @param {Object} stats - Objeto con estadísticas de especies
 * @param {number} stats.especies_catalogadas - Total de especies catalogadas
 * @param {number} stats.en_peligro - Especies en peligro de extinción
 * @param {number} stats.especies_protegidas - Especies bajo protección
 * @param {number} stats.descubiertas_este_ano - Especies descubiertas este año
 * @returns {void}
 */
function updateStatisticsDisplay(stats) {
  const statsNumbers = document.querySelectorAll('.stats-number');
  if (statsNumbers.length >= 4) {
    statsNumbers[0].textContent = stats.especies_catalogadas?.toLocaleString() || '2,847';
    statsNumbers[1].textContent = stats.en_peligro?.toLocaleString() || '456';
    statsNumbers[2].textContent = stats.especies_protegidas?.toLocaleString() || '1,234';
    statsNumbers[3].textContent = stats.descubiertas_este_ano?.toLocaleString() || '5';
  }
}

/**
 * Muestra un mensaje de advertencia temporal al usuario
 * Utiliza alertas de Bootstrap con auto-cierre después de 5 segundos
 * @param {string} message - Mensaje de advertencia a mostrar
 * @returns {void}
 */
function showWarningMessage(message) {
  const notification = document.createElement('div');
  notification.className = 'alert alert-warning alert-dismissible fade show position-fixed';
  notification.style.cssText = 'top: 100px; right: 20px; z-index: 1050; max-width: 400px;';
  notification.innerHTML = `
    <i class="bi bi-exclamation-triangle me-2"></i>
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;
  
  document.body.appendChild(notification);
  
  // Auto-eliminación automática después de 5 segundos
  setTimeout(() => {
    if (notification.parentNode) {
      notification.remove();
    }
  }, 5000);
}

// Los datos de especies estáticos fueron eliminados - ahora todo se obtiene dinámicamente de la base de datos

// =============================================
// CONFIGURACIÓN DE EVENTOS
// Inicialización de event listeners para interacción del usuario
// =============================================

/**
 * Configura todos los event listeners del sistema de especies
 * Inicializa eventos de búsqueda, filtros, paginación y navegación
 * Establece interacciones responsive para móviles y escritorio
 * @returns {void}
 */
function setupEventListeners() {
  // Control de expansión/colapso de filtros avanzados
  const toggleFiltersBtn = document.getElementById('toggle-filters');
  if (toggleFiltersBtn) {
    toggleFiltersBtn.addEventListener('click', toggleAdvancedFilters);
  }
  
  // Búsqueda con retraso para optimizar rendimiento
  document.getElementById('search-especies').addEventListener('input', debouncedSearch);
  
  // Event listeners para filtros de categorías
  document.getElementById('habitat-filter').addEventListener('change', applyFilters);
  document.getElementById('conservation-filter').addEventListener('change', applyFilters);
  
  // Botón manual de activación de búsqueda
  document.querySelector('.btn-search').addEventListener('click', applyFilters);
  
  // Control de ordenamiento de resultados
  document.getElementById('sort-especies').addEventListener('change', handleSortChange);
  
  // Controles de vista - Event listeners mejorados con data-vista
  document.querySelectorAll('[data-vista]').forEach(btn => {
    btn.addEventListener('click', cambiarVista);
  });
  
  // Controles de navegación entre páginas
  document.getElementById('prev-page').addEventListener('click', () => changePage(-1));
  document.getElementById('next-page').addEventListener('click', () => changePage(1));
  
  // Activación de búsqueda con tecla Enter
  document.getElementById('search-especies').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      clearTimeout(searchTimeout);
      applyFilters();
    }
  });
  
  // Cargar preferencia de vista guardada del usuario
  cargarPreferenciaVista();
}

/**
 * Implementa búsqueda con retraso (debounce) para optimizar rendimiento
 * Evita múltiples consultas mientras el usuario continúa escribiendo
 * @returns {void}
 */
function debouncedSearch() {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    applyFilters();
  }, 500); // Esperar 500ms después de que el usuario termine de escribir
}

// =============================================
// SISTEMA DE FILTROS
// Aplicación de filtros y búsqueda avanzada de especies
// =============================================

/**
 * Aplica todos los filtros activos y realiza búsqueda de especies
 * Maneja paginación, ordenamiento y actualización de interfaz
 * Sincroniza resultados con el mapa interactivo
 * @returns {Promise<void>} Filtros aplicados y resultados mostrados
 */
async function applyFilters() {
  if (isLoading) return;
  
  setLoadingState(true);
  
  try {
    const searchTerm = document.getElementById('search-especies').value.trim();
    const habitatFilter = document.getElementById('habitat-filter').value;
    const conservationFilter = document.getElementById('conservation-filter').value;
    const sortBy = document.getElementById('sort-especies').value;
    
    // Si se aplica un filtro nuevo, resetear a la primera página
    const hasActiveFilter = searchTerm || habitatFilter || conservationFilter;
    if (hasActiveFilter && (
        activeFilters.search !== searchTerm ||
        activeFilters.habitat !== habitatFilter ||
        activeFilters.conservation !== conservationFilter
    )) {
      currentPage = 1;
    }
    
    // Actualizar objeto de filtros activos
    activeFilters = {
      search: searchTerm,
      habitat: habitatFilter,
      conservation: conservationFilter,
      sort: sortBy
    };
    
    // Construir parámetros de consulta para la API
    const params = new URLSearchParams();
    if (searchTerm) params.append('search', searchTerm);
    if (habitatFilter) params.append('habitat', habitatFilter);
    if (conservationFilter) params.append('conservation', conservationFilter);
    if (sortBy) params.append('sort', sortBy);
    params.append('page', currentPage);
    params.append('limit', itemsPerPage);
    
    console.log('Aplicando filtros:', {
      search: searchTerm,
      habitat: habitatFilter,
      conservation: conservationFilter,
      sort: sortBy,
      page: currentPage,
      limit: itemsPerPage
    });
    
    const response = await fetch(`/api/especies?${params}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }
    
    console.log('Respuesta del servidor:', data);
    
    // Actualizar datos de especies filtradas
    filteredEspecies = data.especies || [];
    totalPages = data.total_pages || Math.ceil((data.total || 0) / itemsPerPage);
    
    // Renderizar resultados en la interfaz
    renderEspecies();
    updatePagination();
    actualizarContadorEspecies(data.total || filteredEspecies.length);
    updateActiveFiltersDisplay();
    
    // Sincronizar resultados con el mapa interactivo si está activo
    syncMapWithMainFilters();
    
  } catch (error) {
    console.error('Error al aplicar filtros:', error);
    showErrorMessage('Error al buscar especies. Intenta de nuevo.');
    
    // En caso de error, mostrar estado vacío para mantener interfaz
    filteredEspecies = [];
    totalPages = 0;
    renderEspecies();
    updatePagination();
    actualizarContadorEspecies(0);
  } finally {
    setLoadingState(false);
  }
}

// Función de filtrado local eliminada - ahora todo se maneja en el servidor

/**
 * Maneja el cambio de criterio de ordenamiento
 * Resetea la paginación y aplica filtros con nuevo orden
 * @returns {void}
 */
function handleSortChange() {
  currentPage = 1; // Resetear a la primera página al cambiar orden
  applyFilters();
}

// La función de ordenado local fue eliminada - ahora se maneja dinámicamente en el servidor

// =============================================
// SISTEMA DE VISTAS
// Cambio entre diferentes modos de visualización
// =============================================

/**
 * Cambia entre diferentes vistas de visualización (grilla, lista, mapa)
 * @param {Event} e - Evento del botón de vista clickeado
 */
function cambiarVista(e) {
  const vista = e.target.closest('[data-vista]').dataset.vista;
  
  // Actualizar botones activos
  actualizarBotonesVista(vista);
  
  // Aplicar la vista correspondiente
  aplicarVista(vista);
  
  // Guardar preferencia en localStorage
  guardarPreferenciaVista(vista);
}

/**
 * Actualiza los botones de vista para mostrar el estado activo
 * @param {string} vistaActiva - Tipo de vista seleccionada ('grid', 'list', 'mapa')
 */
function actualizarBotonesVista(vistaActiva) {
  document.querySelectorAll('[data-vista]').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.vista === vistaActiva) {
      btn.classList.add('active');
    }
  });
}

/**
 * Aplica la vista seleccionada modificando clases CSS y visibilidad
 * @param {string} vista - Tipo de vista a aplicar
 */
function aplicarVista(vista) {
  const especiesGrid = document.getElementById('especies-grid');
  const mapaSection = document.getElementById('mapa-section');
  
  // Resetear clases previas
  especiesGrid.classList.remove('vista-lista', 'vista-mapa');
  
  switch(vista) {
    case 'grid':
      // Vista Grid (por defecto)
      especiesGrid.style.display = 'grid';
      especiesGrid.classList.remove('list-view'); // Compatibilidad con CSS existente
      mapaSection.style.display = 'none';
      break;
      
    case 'list':
      // Vista Lista
      especiesGrid.style.display = 'block';
      especiesGrid.classList.add('vista-lista', 'list-view'); // Doble clase para compatibilidad
      mapaSection.style.display = 'none';
      break;
      
    case 'mapa':
      // Vista Mapa
      especiesGrid.style.display = 'none';
      especiesGrid.classList.add('vista-mapa');
      mapaSection.style.display = 'block';
      
      // Inicializar mapa si no se ha hecho antes
      if (!window.mapInitialized) {
        initializeMap();
        window.mapInitialized = true;
      } else {
        // Si el mapa ya está inicializado, aplicar filtros actuales
        syncMapWithMainFilters();
      }
      break;
      
    default:
      // Fallback a vista grid
      aplicarVista('grid');
      return;
  }
  
  // Trigger resize event para que otros componentes se ajusten
  window.dispatchEvent(new Event('resize'));
}

/**
 * Guarda la preferencia de vista del usuario en localStorage
 * @param {string} vista - Vista preferida del usuario
 */
function guardarPreferenciaVista(vista) {
  try {
    localStorage.setItem('sway-especies-vista-preferida', vista);
  } catch (error) {
    console.warn('No se pudo guardar la preferencia de vista:', error);
  }
}

/**
 * Carga la preferencia de vista guardada del usuario
 * Aplica la vista por defecto si no hay preferencia guardada
 */
function cargarPreferenciaVista() {
  try {
    const vistaGuardada = localStorage.getItem('sway-especies-vista-preferida');
    if (vistaGuardada && ['grid', 'list', 'mapa'].includes(vistaGuardada)) {
      // Aplicar vista guardada
      actualizarBotonesVista(vistaGuardada);
      aplicarVista(vistaGuardada);
    } else {
      // Vista por defecto: grid
      actualizarBotonesVista('grid');
      aplicarVista('grid');
    }
  } catch (error) {
    console.warn('No se pudo cargar la preferencia de vista:', error);
    // Fallback a vista grid
    actualizarBotonesVista('grid');
    aplicarVista('grid');
  }
}

/**
 * Función de compatibilidad con versiones anteriores
 * Mantiene compatibilidad con código existente
 * @param {Event} e - Evento del botón de vista
 */
function changeView(e) {
  cambiarVista(e);
}

/**
 * Función de depuración para probar vistas (solo desarrollo)
 * @param {string} vista - Vista a probar
 */
function debugCambiarVista(vista) {
  if (['grid', 'list', 'mapa'].includes(vista)) {
    actualizarBotonesVista(vista);
    aplicarVista(vista);
    guardarPreferenciaVista(vista);
    console.log(`Vista cambiada a: ${vista}`);
  } else {
    console.warn(`Vista no válida: ${vista}. Usa 'grid', 'list' o 'mapa'`);
  }
}

/**
 * Obtiene la vista actualmente seleccionada
 * @returns {string} Vista actual ('grid', 'list', 'mapa')
 */
function obtenerVistaActual() {
  try {
    const vistaGuardada = localStorage.getItem('sway-especies-vista-preferida');
    return vistaGuardada || 'grid';
  } catch (error) {
    return 'grid';
  }
}

// =============================================
// RENDERIZADO DE ESPECIES
// Generación dinámica de la interfaz de especies
// =============================================

/**
 * Renderiza las especies en la grilla de la interfaz
 * Genera HTML dinámico con información de especies y sus detalles
 */
function renderEspecies() {
  const grid = document.getElementById('especies-grid');
  
  if (!filteredEspecies || filteredEspecies.length === 0) {
    // Mostrar mensaje cuando no hay resultados
    grid.innerHTML = `
      <div class="no-results-container" style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
        <div class="no-results-content">
          <i class="bi bi-search fs-1 text-muted mb-3"></i>
          <h3>No se encontraron especies</h3>
          <p class="text-muted mb-4">No hay especies que coincidan con los filtros aplicados.</p>
          <div class="no-results-actions">
            <button class="btn btn-primary me-2" onclick="clearAllFilters()">
              <i class="bi bi-filter-circle"></i> Limpiar Filtros
            </button>
            <button class="btn btn-outline-secondary" onclick="location.reload()">
              <i class="bi bi-arrow-clockwise"></i> Actualizar Página
            </button>
          </div>
        </div>
      </div>
    `;
    return;
  }
  
  // Para paginación local (cuando se usa como fallback)
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  let currentEspecies;
  
  // Si totalPages está definido, significa que estamos usando paginación del servidor
  if (totalPages > 0) {
    currentEspecies = filteredEspecies; // Ya viene paginado del servidor
  } else {
    currentEspecies = filteredEspecies.slice(startIndex, endIndex); // Paginación local
  }
  
  grid.innerHTML = currentEspecies.map(especie => `
    <div class="especie-card" data-habitat="${especie.habitat}" data-conservation="${especie.estado_conservacion}" data-type="${especie.tipo}">
      <div class="especie-image">
        <img src="${especie.imagen || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjZjBmMGYwIi8+Cjx0ZXh0IHg9IjIwMCIgeT0iMTUwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOTk5IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiPkVzcGVjaWUgTWFyaW5hPC90ZXh0Pgo8L3N2Zz4K'}" 
             alt="${especie.nombre}" 
             onerror="this.onerror=null; this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjZmZmZmZmIiBzdHJva2U9IiNkZGQiLz4KPHN2ZyB4PSIxNzUiIHk9IjEyNSIgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9IiM5OTkiPgo8cGF0aCBkPSJNMTIgMkM2LjQ4IDIgMiA2LjQ4IDIgMTJzNC40OCAxMCAxMCAxMCAxMC00LjQ4IDEwLTEwUzE3LjUyIDIgMTIgMnptLTIgMTVsLTUtNSAxLjQxLTEuNDFMMTAgMTQuMTdsNy41OS03LjU5TDE5IDhsLTkgOXoiLz4KPHN2Zz4KPHN2ZyB4PSIxNzAiIHk9IjE2NSIgd2lkdGg9IjYwIiBoZWlnaHQ9IjIwIj4KPHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iMTUiIHZpZXdCb3g9IjAgMCA2MCAyMCI+Cjx0ZXh0IHg9IjMwIiB5PSIxMiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzk5OSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEwIj5TaW4gaW1hZ2VuPC90ZXh0Pgo8L3N2Zz4KPHN2Zz4KPC9zdmc+'"
             loading="lazy">
        <div class="conservation-badge ${especie.estado_conservacion}">${getConservationText(especie.estado_conservacion)}</div>
      </div>
      <div class="especie-content">
        <h3>${especie.nombre}</h3>
        <p class="scientific-name">${especie.nombre_cientifico}</p>
        <div class="especie-stats">
          <div class="stat">
            <i class="bi bi-rulers"></i>
            <span>${especie.longitud || 'Variable'}</span>
          </div>
          <div class="stat">
            <i class="bi bi-geo-alt"></i>
            <span>${especie.ubicacion || 'Global'}</span>
          </div>
          <div class="stat">
            <i class="bi bi-heart-pulse"></i>
            <span>Vida: ${especie.esperanza_vida || 'No disponible'}</span>
          </div>
        </div>
        <p class="especie-description">${(especie.descripcion || 'Descripción no disponible').substring(0, 150)}${especie.descripcion && especie.descripcion.length > 150 ? '...' : ''}</p>
        <div class="especie-actions">
          <button class="btn-primary" onclick="openSpeciesDetail('${especie.id}')">
            Ver Detalles
          </button>
          <button class="btn-secondary" onclick="reportSighting('${especie.id}')">
            <i class="bi bi-camera"></i> Reportar Avistamiento
          </button>
        </div>
      </div>
    </div>
  `).join('');
  
  updatePagination();
}

// Limpiar todos los filtros
function clearAllFilters() {
  // Limpiar campos de entrada
  document.getElementById('search-especies').value = '';
  document.getElementById('habitat-filter').value = '';
  document.getElementById('conservation-filter').value = '';
  document.getElementById('sort-especies').value = 'nombre';
  
  // Limpiar filtros activos
  activeFilters = {};
  currentPage = 1;
  
  // Aplicar filtros vacíos (mostrar todo)
  applyFilters();
}

// =============================================
// PAGINACIÓN
// Sistema de navegación entre páginas de resultados
// =============================================

/**
 * Actualiza los controles de paginación
 * Muestra botones de navegación y estado actual
 */
function updatePagination() {
  document.getElementById('current-page').textContent = currentPage;
  document.getElementById('total-pages').textContent = totalPages || 1;
  
  document.getElementById('prev-page').disabled = currentPage === 1;
  document.getElementById('next-page').disabled = currentPage === totalPages || totalPages === 0;
}

/**
 * Cambia de página en la paginación de especies
 * @param {number} direction - Dirección del cambio (-1 para anterior, 1 para siguiente)
 */
function changePage(direction) {
  const newPage = currentPage + direction;
  
  if (newPage >= 1 && newPage <= totalPages) {
    currentPage = newPage;
    applyFilters(); // Recargar datos para la nueva página
    
    // Scroll suave al inicio de la sección de especies
    const especiesSection = document.getElementById('especies');
    if (especiesSection) {
      especiesSection.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
}

// =============================================
// NEWSLETTER
// Funcionalidad de suscripción al boletín
// =============================================

/**
 * Muestra confirmación de suscripción al newsletter
 * Valida email y procesa la suscripción
 */
function showNewsletterConfirmation() {
  const email = document.getElementById('newsletter-email').value;
  
  if (!email) {
    alert('Por favor, ingresa tu email');
    return;
  }
  
  // Enviar a la API
  suscribirNewsletter(email).then(result => {
    if (result.success) {
      // Verificar si el email ya estaba suscrito
      if (result.already_subscribed) {
        showNewsletterMessage(result.message, 'info');
        document.getElementById('newsletter-email').value = '';
      } else {
        // Nueva suscripción o reactivación exitosa
        document.getElementById('newsletter-popup').style.display = 'block';
        document.getElementById('newsletter-email').value = '';
      }
    } else {
      showNewsletterMessage('Error: ' + result.message, 'error');
    }
  });
}

/**
 * Cierra el popup de confirmación del newsletter
 */
function closeNewsletterPopup() {
  document.getElementById('newsletter-popup').style.display = 'none';
}


// =============================================
// MODAL DE AVISTAMIENTO
// Sistema de reporte de avistamientos de especies
// =============================================

/**
 * Previene conflictos con Bootstrap Modal
 * Sobrescribe funciones existentes para evitar interferencias
 */
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM loaded - ensuring no Bootstrap modal conflicts');
  
  // Sobrescribir cualquier función reportSighting existente de Bootstrap
  window.reportSighting = function(speciesId) {
    console.log('Custom reportSighting called (override active)');
    return openSightingModal(speciesId);
  };
});

// Mapeo de especies eliminado - los datos ahora vienen directamente de la API

/**
 * Abre el modal de reporte de avistamiento para una especie
 * @param {number} speciesId - ID de la especie para reportar avistamiento
 */
function openSightingModal(speciesId) {
  console.log('=== FUNCIÓN REPORTAR AVISTAMIENTO INICIADA ===');
  console.log('reportSighting called with:', speciesId);
  console.log('Function location: especies.js - custom implementation');
  
  // Verificar que no estamos usando Bootstrap
  if (typeof bootstrap !== 'undefined') {
    console.warn('Bootstrap detected - but NOT using it for modal');
  }
  
  const modal = document.getElementById('sighting-modal');
  if (!modal) {
    console.error('Modal sighting-modal not found');
    return;
  }
  
  console.log('Modal found:', modal);
  
  // Pre-llenar los datos de la especie obtenidos de la API
  if (speciesId) {
    // Buscar la especie en especiesData
    const especieData = especiesData.find(e => e.id == speciesId);
    if (especieData) {
      // Llenar nombre de especie (campo de solo lectura)
      const especieNombreInput = document.getElementById('especie-nombre');
      if (especieNombreInput) {
        especieNombreInput.value = especieData.nombre;
        console.log('Species name filled:', especieData.nombre);
      }
      
      // Llenar ID de especie (campo oculto)
      const idEspecieInput = document.getElementById('id-especie');
      if (idEspecieInput) {
        idEspecieInput.value = especieData.id;
        console.log('Species ID filled:', especieData.id);
      }
    }
  }
  
  // Pre-llenar fecha con fecha/hora actual y establecer límites
  const fechaInput = document.getElementById('fecha-avistamiento');
  if (fechaInput) {
    const now = new Date();
    const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString().slice(0, 16);
    
    // Establecer fecha actual como valor por defecto
    fechaInput.value = localDateTime;
    
    // Establecer fecha máxima como ahora (no permite fechas futuras)
    fechaInput.max = localDateTime;
    
    console.log('Sighting date filled with current time:', localDateTime);
  }
  
  console.log('Opening modal with custom implementation...');
  // Mostrar modal - CUSTOM IMPLEMENTATION, NO BOOTSTRAP
  modal.style.display = 'flex';
  setTimeout(() => {
    modal.classList.add('show');
    console.log('Modal opened successfully');
  }, 10);
  
  console.log('=== FUNCIÓN COMPLETADA ===');
}

/**
 * Alias para abrir modal de avistamiento (compatibilidad)
 * @param {number} speciesId - ID de la especie
 * @returns {Function} Llamada a openSightingModal
 */
function reportSighting(speciesId) {
  return openSightingModal(speciesId);
}

/**
 * Cierra el modal de reporte de avistamiento
 * Limpia el formulario y oculta el modal
 */
function closeSightingModal() {
  const modal = document.getElementById('sighting-modal');
  modal.classList.remove('show');
  setTimeout(() => {
    modal.style.display = 'none';
    // Limpiar formulario y resetear validaciones
    resetSightingForm();
  }, 400);
}

/**
 * Resetea completamente el formulario de avistamientos
 * Limpia datos, validaciones y mensajes
 */
function resetSightingForm() {
  const form = document.getElementById('sighting-form');
  if (!form) return;
  
  // Resetear valores del formulario
  form.reset();
  
  // Limpiar mensajes de error/éxito
  clearFormMessages();
  
  // Resetear validaciones usando el sistema de validaciones
  if (typeof validacionesSway !== 'undefined') {
    // Limpiar todas las validaciones visuales
    const inputs = form.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
      validacionesSway.limpiarValidacion(input);
    });
  }
  
  // Limpiar clases adicionales del sistema de formularios
  const inputs = form.querySelectorAll('.form-group input, .form-group textarea, .form-group select');
  inputs.forEach(input => {
    input.classList.remove('form-success', 'form-error', 'campo-error', 'campo-valido');
  });
  
  // Remover cualquier estado de loading
  form.classList.remove('form-loading');
  
  console.log('Formulario de avistamientos resetado completamente');
}

/**
 * Limpia todos los mensajes del formulario
 */
function clearFormMessages() {
  const existingMessages = document.querySelectorAll('.success-message, .error-message, .mensaje-error, .mensaje-exito, .mensaje-formulario');
  existingMessages.forEach(msg => msg.remove());
}

/**
 * Muestra un mensaje en el formulario
 * @param {string} message - Mensaje a mostrar
 * @param {string} type - Tipo de mensaje ('success', 'error')
 */
function showFormMessage(message, type = 'success') {
  clearFormMessages();
  
  const messageElement = document.createElement('div');
  messageElement.className = `${type}-message`;
  messageElement.textContent = message;
  
  const form = document.getElementById('sighting-form');
  form.insertBefore(messageElement, form.firstChild);
}

// Función para validar formato de coordenadas
function validateCoordinates(coordinates) {
  if (!coordinates.trim()) return true; // Opcional
  
  const coordPattern = /^-?\d+\.?\d*,\s*-?\d+\.?\d*$/;
  return coordPattern.test(coordinates.trim());
}

/**
 * Envía el formulario de avistamiento al servidor
 * Valida datos y procesa la respuesta
 * @param {Event} event - Evento del formulario
 * @returns {Promise<void>} Formulario procesado
 */
async function submitSightingForm(event) {
  event.preventDefault();
  
  const form = event.target;
  const formData = new FormData(form);
  
  // Validar que los campos requeridos estén presentes
  const idEspecie = formData.get('id_especie');
  const fechaAvistamiento = formData.get('fecha_avistamiento');
  const latitud = formData.get('latitud');
  const longitud = formData.get('longitud');  
  const nombre = formData.get('nombre_usuario');
  const apellidoPaterno = formData.get('apellido_paterno_usuario');
  const apellidoMaterno = formData.get('apellido_materno_usuario');
  const nombreUsuario = nombre + ' ' + apellidoPaterno + (apellidoMaterno ? ' ' + apellidoMaterno : '');
  const emailUsuario = formData.get('email_usuario');
  
  if (!idEspecie || !fechaAvistamiento || !latitud || !longitud || !nombre || !apellidoPaterno || !emailUsuario) {
    showFormMessage('Por favor completa todos los campos requeridos.', 'error');
    return;
  }
  
  // Validar formato de coordenadas
  if (isNaN(parseFloat(latitud)) || isNaN(parseFloat(longitud))) {
    showFormMessage('Las coordenadas deben ser números válidos.', 'error');
    return;
  }
  
  // Preparar datos para envío
  const sightingData = {
    id_especie: parseInt(idEspecie),
    fecha_avistamiento: fechaAvistamiento,
    latitud: parseFloat(latitud),
    longitud: parseFloat(longitud),
    notas: formData.get('notas') || '',
    nombre_usuario: nombreUsuario,
    nombre: nombre,
    apellido_paterno: apellidoPaterno,
    apellido_materno: apellidoMaterno,
    email_usuario: emailUsuario
  };
  
  console.log('Datos a enviar:', sightingData);
  
  // Mostrar estado de carga
  form.classList.add('form-loading');
  const submitBtn = form.querySelector('button[type="submit"]');
  const originalText = submitBtn.innerHTML;
  submitBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> Enviando...';
  
  try {
    const response = await fetch('/api/reportar-avistamiento', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sightingData)
    });
    
    const result = await response.json();
    console.log('Respuesta del servidor:', result);
    
    if (response.ok) {
      showFormMessage('¡Avistamiento reportado exitosamente! Gracias por contribuir a la conservación marina.', 'success');
      
      // Limpiar formulario después de 2 segundos
      setTimeout(() => {
        resetSightingForm();
        closeSightingModal();
      }, 2000);
    } else {
      console.error('Error del servidor:', result.error);
      showFormMessage(result.error || 'Error al reportar el avistamiento. Inténtalo de nuevo.', 'error');
    }
  } catch (error) {
    console.error('Error al enviar avistamiento:', error);
    showFormMessage('Error de conexión. Verifica tu conexión a internet e inténtalo de nuevo.', 'error');
  } finally {
    // Restaurar estado del formulario
    form.classList.remove('form-loading');
    submitBtn.innerHTML = originalText;
  }
}

// Inicializar el formulario de avistamiento cuando se carga la página
document.addEventListener('DOMContentLoaded', function() {
  const sightingForm = document.getElementById('sighting-form');
  if (sightingForm) {
    sightingForm.addEventListener('submit', submitSightingForm);
  }
});

// ===== FUNCIONES DEL MODAL DE DETALLES DE ESPECIES =====

// Función para abrir detalles de especie
async function openSpeciesDetail(specieId) {
  console.log('Abriendo detalles para especie ID:', specieId);
  const respuesta = await obtenerDetallesEspecie(specieId);
  
  console.log('Datos de respuesta obtenidos:', respuesta);
  
  if (respuesta) {
    // Extraer los datos de la especie del objeto respuesta
    let especie;
    if (respuesta.especie) {
      // Si viene con la estructura {success: true, especie: {...}}
      especie = respuesta.especie;
    } else {
      // Si viene directamente la especie
      especie = respuesta;
    }
    
    console.log('Datos de especie extraídos:', especie);
    
    // Crear y mostrar modal con detalles
    mostrarModalDetalles(especie);
  } else {
    console.error('No se pudieron cargar los detalles de la especie');
    alert('No se pudieron cargar los detalles de la especie');
  }
}

// Función para obtener detalles de una especie
async function obtenerDetallesEspecie(especieId) {
  try {
    console.log('Haciendo fetch a /api/especies/' + especieId);
    
    // Agregar headers para evitar problemas de cache
    const response = await fetch(`/api/especies/${especieId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
    
    console.log('Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Raw data from server:', data);
      
      // Devolver toda la respuesta, será procesada en openSpeciesDetail
      return data;
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.error('Error del servidor:', response.status, errorData);
      return null;
    }
  } catch (error) {
    console.error('Error de red al obtener detalles:', error);
    // Si hay error de red, intentar una vez más
    try {
      console.log('Reintentando fetch...');
      const retryResponse = await fetch(`/api/especies/${especieId}`);
      if (retryResponse.ok) {
        const retryData = await retryResponse.json();
        console.log('Retry successful:', retryData);
        return retryData;
      }
    } catch (retryError) {
      console.error('Retry también falló:', retryError);
    }
    return null;
  }
}

// Función para mostrar modal de detalles
function mostrarModalDetalles(especie) {
  console.log('=== FUNCIÓN mostrarModalDetalles INICIADA ===');
  console.log('Datos de especie recibidos:', especie);
  console.log('Tipo de datos:', typeof especie);
  console.log('Es array?', Array.isArray(especie));
  console.log('Keys del objeto:', Object.keys(especie || {}));
  
  // Validar que tengamos datos válidos
  if (!especie || typeof especie !== 'object') {
    console.error('Datos de especie inválidos:', especie);
    alert('Error: Datos de especie inválidos');
    return;
  }
  
  // Normalizar nombres de campos con múltiples opciones de fallback
  const nombre = especie.nombre_comun || especie.nombre || 'Sin nombre';
  const imagen = especie.imagen_url || especie.imagen || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjZjBmMGYwIi8+Cjx0ZXh0IHg9IjIwMCIgeT0iMTUwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOTk5IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiPkVzcGVjaWUgTWFyaW5hPC90ZXh0Pgo8L3N2Zz4K';
  const nombreCientifico = especie.nombre_cientifico || 'Sin clasificación';
  const descripcion = especie.descripcion || 'Sin descripción disponible';
  
  console.log('Datos procesados:');
  console.log('- Nombre:', nombre);
  console.log('- Nombre científico:', nombreCientifico);
  console.log('- Imagen:', imagen);
  console.log('- Descripción:', descripcion);
  
  // Manejar esperanza de vida - puede venir como número o string
  let esperanzaVida = 'No disponible';
  if (especie.esperanza_vida) {
    if (typeof especie.esperanza_vida === 'number') {
      esperanzaVida = `${especie.esperanza_vida} años`;
    } else if (typeof especie.esperanza_vida === 'string') {
      esperanzaVida = especie.esperanza_vida.includes('años') ? especie.esperanza_vida : `${especie.esperanza_vida} años`;
    }
  }
  
  // Manejar hábitat - puede venir como string o array de nombres
  let habitatLabel = 'No disponible';
  if (especie.habitats && Array.isArray(especie.habitats) && especie.habitats.length > 0) {
    // Si viene como array de nombres (del endpoint individual)
    habitatLabel = especie.habitats.join(', ');
  } else if (especie.habitat) {
    // Si viene como string o ID (del endpoint de lista)
    habitatLabel = getHabitatLabel(especie.habitat);
  }
  
  // Manejar longitud/tamaño - priorizar datos más específicos
  let longitud = 'Variable';
  if (especie.longitud && especie.longitud !== 'Variable') {
    longitud = especie.longitud;
  } else if (especie.peso && especie.peso !== 'Variable') {
    longitud = `Peso: ${especie.peso}`;
  }
  
  // Determinar estado de conservación
  let estadoConservacion = 'preocupacion-menor';
  if (especie.estado_conservacion) {
    // Si ya viene procesado del endpoint
    estadoConservacion = especie.estado_conservacion;
  } else if (especie.id_estado_conservacion) {
    // Mapeo por ID según tu BD - ajusta estos números según corresponda
    const estadosMap = {
      1: 'extincion-critica',
      2: 'peligro', 
      3: 'vulnerable',
      4: 'casi-amenazada',
      5: 'preocupacion-menor'
    };
    estadoConservacion = estadosMap[especie.id_estado_conservacion] || 'preocupacion-menor';
  }
  
  const modalContent = `
    <div class="species-detail-header">
      <img src="${imagen}" alt="${nombre}" class="species-detail-image" onerror="this.onerror=null; this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjZmZmZmZmIiBzdHJva2U9IiNkZGQiLz4KPHN2ZyB4PSIxNzUiIHk9IjEyNSIgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9IiM5OTkiPgo8cGF0aCBkPSJNMTIgMkM2LjQ4IDIgMiA2LjQ4IDIgMTJzNC40OCAxMCAxMCAxMCAxMC00LjQ4IDEwLTEwUzE3LjUyIDIgMTIgMnptLTIgMTVsLTUtNSAxLjQxLTEuNDFMMTAgMTQuMTdsNy41OS03LjU5TDE5IDhsLTkgOXoiLz4KPHN2Zz4KPHN2ZyB4PSIxNzAiIHk9IjE2NSIgd2lkdGg9IjYwIiBoZWlnaHQ9IjIwIj4KPHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iMTUiIHZpZXdCb3g9IjAgMCA2MCAyMCI+Cjx0ZXh0IHg9IjMwIiB5PSIxMiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzk5OSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEwIj5TaW4gaW1hZ2VuPC90ZXh0Pgo8L3N2Zz4KPHN2Zz4KPC9zdmc+'"
      <div class="species-detail-info">
        <h2>${nombre}</h2>
        <p class="scientific-name">${nombreCientifico}</p>
        <span class="conservation-badge ${estadoConservacion}">${getConservationLabel(estadoConservacion)}</span>
      </div>
    </div>
    <div class="species-detail-content">
      <div class="row">
        <div class="col-md-6">
          <h4>Información General</h4>
          <ul>
            <li><strong>Hábitat:</strong> ${habitatLabel}</li>
            <li><strong>Tamaño:</strong> ${longitud}</li>
            <li><strong>Esperanza de vida:</strong> ${esperanzaVida}</li>
            ${especie.poblacion_estimada ? `<li><strong>Población estimada:</strong> ${especie.poblacion_estimada.toLocaleString()}</li>` : ''}
          </ul>
        </div>
        <div class="col-md-6">
          <h4>Descripción</h4>
          <p>${descripcion}</p>
          ${especie.amenazas && Array.isArray(especie.amenazas) && especie.amenazas.length > 0 ? `
            <h5>Principales Amenazas:</h5>
            <ul>
              ${especie.amenazas.map(amenaza => {
                // Si la amenaza es un objeto con nombre, usar amenaza.nombre
                // Si es solo un string, usarlo directamente
                // Si es un número (ID), mostrar un mensaje genérico
                if (typeof amenaza === 'object' && amenaza.nombre) {
                  return `<li>${amenaza.nombre}</li>`;
                } else if (typeof amenaza === 'string') {
                  return `<li>${amenaza}</li>`;
                } else if (typeof amenaza === 'number') {
                  return `<li>Amenaza ID: ${amenaza}</li>`;
                } else {
                  return `<li>Amenaza no especificada</li>`;
                }
              }).join('')}
            </ul>
          ` : '<p><em>No hay información de amenazas disponible</em></p>'}
          ${especie.habitats && Array.isArray(especie.habitats) && especie.habitats.length > 1 ? `
            <h5>Otros Hábitats:</h5>
            <ul>
              ${especie.habitats.slice(1).map(habitat => `<li>${habitat}</li>`).join('')}
            </ul>
          ` : ''}
        </div>
      </div>
    </div>
  `;
  
  document.getElementById('species-modal-content').innerHTML = modalContent;
  const modal = document.getElementById('species-modal');
  modal.style.display = 'flex';
  // Pequeño delay para permitir que la animación funcione correctamente
  setTimeout(() => {
    modal.classList.add('show');
  }, 10);
}

// Función para obtener etiqueta de conservación
function getConservationLabel(estado) {
  const labels = {
    'extincion-critica': 'Extinción Crítica',
    'peligro': 'En Peligro',
    'vulnerable': 'Vulnerable',
    'casi-amenazada': 'Casi Amenazada',
    'preocupacion-menor': 'Preocupación Menor'
  };
  return labels[estado] || estado;
}

// Función para obtener etiqueta de hábitat
function getHabitatLabel(habitat) {
  const labels = {
    'arrecife': 'Arrecifes de Coral',
    'aguas-profundas': 'Aguas Profundas',
    'aguas-abiertas': 'Aguas Abiertas',
    'costero': 'Zona Costera',
    'polar': 'Aguas Polares',
    'manglar': 'Manglares',
    'estuario': 'Estuarios',
    'praderas-marinas': 'Praderas Marinas'
  };
  return labels[habitat] || habitat;
}

// Función para cerrar modal de detalles
function closeSpeciesModal() {
  const modal = document.getElementById('species-modal');
  modal.classList.remove('show');
  // Delay para permitir que la animación de salida termine
  setTimeout(() => {
    modal.style.display = 'none';
  }, 400);
}

// Función para actualizar el contador de especies
function actualizarContadorEspecies(total = null) {
  const contador = document.getElementById('especies-count');
  if (contador) {
    const count = total !== null ? total : filteredEspecies.length;
    contador.textContent = count.toLocaleString();
    
    // Actualizar también las estadísticas si están disponibles
    updateStats(count);
  }
}

// Actualizar estadísticas dinámicamente
function updateStats(especiesEncontradas) {
  // Solo actualizar si hay elementos de estadísticas
  const statCards = document.querySelectorAll('.stats-number');
  if (statCards.length > 0 && especiesEncontradas !== undefined) {
    // Calcular estadísticas basadas en los resultados filtrados
    const porcentajeEncontradas = Math.round((especiesEncontradas / 2847) * 100);
    
    // Actualizar solo el primer stat card si es necesario
    // statCards[0].textContent = especiesEncontradas.toLocaleString();
  }
}

// ===== FUNCIONES DE INTERFAZ Y ESTADO =====

// Inicializar display de filtros activos
function initializeActiveFiltersDisplay() {
  const tagsContainer = document.querySelector('.tags-activos');
  if (tagsContainer) {
    tagsContainer.innerHTML = '';
  }
}

// Actualizar display de filtros activos
function updateActiveFiltersDisplay() {
  const tagsContainer = document.querySelector('.tags-activos');
  if (!tagsContainer) return;
  
  tagsContainer.innerHTML = '';
  
  const filterLabels = {
    search: 'Búsqueda',
    habitat: 'Hábitat',
    conservation: 'Conservación'
  };
  
  const habitatLabels = {
    'arrecife': 'Arrecifes de Coral',
    'aguas-profundas': 'Aguas Profundas',
    'aguas-abiertas': 'Aguas Abiertas',
    'costero': 'Zona Costera',
    'polar': 'Aguas Polares',
    'manglar': 'Manglares',
    'estuario': 'Estuarios'
  };
  
  const conservationLabels = {
    'extincion-critica': 'Extinción Crítica',
    'peligro': 'En Peligro',
    'vulnerable': 'Vulnerable',
    'casi-amenazada': 'Casi Amenazada',
    'preocupacion-menor': 'Preocupación Menor'
  };
  
  
  Object.keys(activeFilters).forEach(filterType => {
    const filterValue = activeFilters[filterType];
    if (filterValue && filterType !== 'sort') {
      let displayValue = filterValue;
      
      // Obtener label apropiado según el tipo de filtro
      switch(filterType) {
        case 'habitat':
          displayValue = habitatLabels[filterValue] || filterValue;
          break;
        case 'conservation':
          displayValue = conservationLabels[filterValue] || filterValue;
          break;
        case 'search':
          displayValue = `"${filterValue}"`;
          break;
      }
      
      const tag = document.createElement('span');
      tag.className = 'tag-filter';
      tag.innerHTML = `${displayValue} <i class="bi bi-x" data-filter="${filterType}"></i>`;
      
      // Agregar event listener para remover filtro
      tag.querySelector('i').addEventListener('click', function() {
        removeFilter(filterType);
      });
      
      tagsContainer.appendChild(tag);
    }
  });
}

// Remover filtro específico
function removeFilter(filterType) {
  switch(filterType) {
    case 'search':
      document.getElementById('search-especies').value = '';
      break;
    case 'habitat':
      document.getElementById('habitat-filter').value = '';
      break;
    case 'conservation':
      document.getElementById('conservation-filter').value = '';
      break;
  }
  
  // Actualizar filtros activos y aplicar
  delete activeFilters[filterType];
  currentPage = 1;
  applyFilters();
}

// Establecer estado de carga
function setLoadingState(loading) {
  isLoading = loading;
  const grid = document.getElementById('especies-grid');
  const searchBtn = document.querySelector('.btn-search');
  const prevBtn = document.getElementById('prev-page');
  const nextBtn = document.getElementById('next-page');
  
  if (loading) {
    // Mostrar indicador de carga
    if (grid) {
      grid.innerHTML = `
        <div class="loading-container" style="grid-column: 1 / -1; text-align: center; padding: 2rem;">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Cargando...</span>
          </div>
          <p class="mt-2">Buscando especies...</p>
        </div>
      `;
    }
    
    // Deshabilitar botones
    if (searchBtn) searchBtn.disabled = true;
    if (prevBtn) prevBtn.disabled = true;
    if (nextBtn) nextBtn.disabled = true;
  } else {
    // Habilitar botones
    if (searchBtn) searchBtn.disabled = false;
    if (prevBtn) prevBtn.disabled = currentPage === 1;
    if (nextBtn) nextBtn.disabled = currentPage === totalPages;
  }
}

// Mostrar mensaje de error
function showErrorMessage(message) {
  const grid = document.getElementById('especies-grid');
  if (grid) {
    grid.innerHTML = `
      <div class="error-container" style="grid-column: 1 / -1; text-align: center; padding: 2rem;">
        <div class="alert alert-warning" role="alert">
          <i class="bi bi-exclamation-triangle fs-2"></i>
          <h4 class="mt-2">Error de búsqueda</h4>
          <p>${message}</p>
          <button class="btn btn-primary" onclick="location.reload()">
            <i class="bi bi-arrow-clockwise"></i> Reintentar
          </button>
        </div>
      </div>
    `;
  }
}

// Función para reportar avistamiento a la API
async function reportarAvistamiento(formData) {
  try {
    const response = await fetch('/api/reportar-avistamiento', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData)
    });
    
    const result = await response.json();
    
    if (response.ok) {
      alert('¡Gracias por reportar este avistamiento! Tu contribución ayuda a nuestros esfuerzos de conservación.');
      return true;
    } else {
      alert('Error al reportar avistamiento: ' + result.error);
      return false;
    }
  } catch (error) {
    console.error('Error al reportar avistamiento:', error);
    alert('Error de conexión. Por favor, intenta de nuevo.');
    return false;
  }
}

// Función para suscribir al newsletter
async function suscribirNewsletter(email) {
  try {
    const response = await fetch('/api/newsletter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: email })
    });
    
    const result = await response.json();
    
    if (response.ok) {
      return { success: true, message: result.message };
    } else {
      return { success: false, message: result.error };
    }
  } catch (error) {
    console.error('Error al suscribir al newsletter:', error);
    return { success: false, message: 'Error de conexión' };
  }
}

// Función para obtener detalles de una especie
async function obtenerDetallesEspecie(especieId) {
  try {
    const response = await fetch(`/api/especies/${especieId}`);
    const especie = await response.json();
    
    if (response.ok) {
      return especie;
    } else {
      console.error('Error al obtener detalles de la especie:', especie.error);
      return null;
    }
  } catch (error) {
    console.error('Error al obtener detalles de la especie:', error);
    return null;
  }
}

// Funciones auxiliares
function getConservationText(status) {
  const statusMap = {
    'extincion-critica': 'Extinción Crítica',
    'peligro': 'En Peligro',
    'vulnerable': 'Vulnerable',
    'casi-amenazada': 'Casi Amenazada',
    'preocupacion-menor': 'Preocupación Menor'
  };
  return statusMap[status] || status;
}

function getHabitatText(habitat) {
  const habitatMap = {
    'arrecife': 'Arrecifes de Coral',
    'aguas-profundas': 'Aguas Profundas',
    'aguas-abiertas': 'Aguas Abiertas',
    'costero': 'Zona Costera',
    'polar': 'Aguas Polares'
  };
  return habitatMap[habitat] || habitat;
}

function downloadFactSheet(especieId) {
  alert(`Descargando ficha técnica de ${especieId}...`);
}

function shareSpecies(especieId) {
  if (navigator.share) {
    navigator.share({
      title: `Especie Marina - ${especieId}`,
      text: 'Descubre esta increíble especie marina en SWAY',
      url: window.location.href
    });
  } else {
    alert('Función de compartir no disponible en este navegador');
  }
}

// ===== FUNCIONALIDAD DEL MAPA INTERACTIVO =====

// Variables globales del mapa
let mapZoom = 1;
let mapPanX = 0;
let mapPanY = 0;
let mapSpeciesData = [];
let visibleConservationStates = new Set(['extincion-critica', 'peligro', 'vulnerable', 'casi-amenazada', 'preocupacion-menor']);
let mapTooltip = null;

// Función para convertir especies de la BD a datos del mapa
function convertEspeciesToMapData(especies) {
  // Mapeo de ubicaciones a coordenadas SVG aproximadas
  const locationCoords = {
    'Océanos tropicales': { x: 250, y: 200 },
    'Todos los océanos': { x: 400, y: 200 },
    'Mar Caribe': { x: 220, y: 180 },
    'Mediterráneo': { x: 500, y: 150 },
    'Océano Índico': { x: 600, y: 200 },
    'Caribe': { x: 200, y: 210 },
    'Antártida': { x: 500, y: 420 },
    'Océano Atlántico': { x: 400, y: 160 },
    'Pacífico Norte': { x: 150, y: 120 },
    'Pacífico Tropical': { x: 180, y: 220 },
    'Océano Ártico': { x: 400, y: 80 },
    'Pacífico Sur': { x: 80, y: 280 },
    // Ubicaciones por defecto
    'Global': { x: 400, y: 200 },
    'No disponible': { x: 300, y: 180 }
  };

  return especies.map((especie, index) => {
    // Obtener coordenadas basadas en ubicación o usar aleatorias
    const ubicacion = especie.ubicacion || 'Global';
    const coords = locationCoords[ubicacion] || { 
      x: 200 + (index * 50) % 500, 
      y: 150 + (index * 30) % 200 
    };

    return {
      id: `${especie.id}-1`,
      species_id: especie.id,
      nombre: especie.nombre,
      nombre_cientifico: especie.nombre_cientifico,
      estado_conservacion: especie.estado_conservacion,
      x: coords.x,
      y: coords.y,
      ubicacion: ubicacion,
      imagen: especie.imagen || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjZjBmMGYwIi8+Cjx0ZXh0IHg9IjIwMCIgeT0iMTUwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOTk5IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiPkVzcGVjaWUgTWFyaW5hPC90ZXh0Pgo8L3N2Zz4K'
    };
  });
}

// Datos del mapa ahora se obtienen de la API de especies - no hay datos hardcodeados

// Inicializar el mapa
function initializeMap() {
  console.log('Inicializando mapa interactivo...');
  
  // Mostrar loading
  document.getElementById('map-loading').style.display = 'flex';
  
  // Cargar datos reales de especies para el mapa
  setTimeout(() => {
    // Usar los datos ya cargados de especies o cargarlos si no están disponibles
    if (especiesData && especiesData.length > 0) {
      mapSpeciesData = convertEspeciesToMapData(especiesData);
    } else {
      // Si no hay datos cargados, usar array vacío
      mapSpeciesData = [];
    }
    
    setupMapEventListeners();
    
    // Aplicar filtros actuales al inicializar
    applyMapFilters();
    
    // Ocultar loading
    document.getElementById('map-loading').style.display = 'none';
    
    console.log('Mapa inicializado correctamente con datos de la base de datos');
  }, 1000);
}

// Configurar event listeners del mapa
function setupMapEventListeners() {
  // Controles de zoom
  document.getElementById('zoom-in').addEventListener('click', zoomIn);
  document.getElementById('zoom-out').addEventListener('click', zoomOut);
  document.getElementById('reset-zoom').addEventListener('click', resetZoom);
  
  // Filtros de conservación
  document.querySelectorAll('.conservation-filters input[type="checkbox"]').forEach(checkbox => {
    checkbox.addEventListener('change', handleConservationFilter);
  });
  
  // Botones de selección de filtros
  document.getElementById('select-all-conservation').addEventListener('click', selectAllConservationFilters);
  document.getElementById('clear-all-conservation').addEventListener('click', clearAllConservationFilters);
  
  // Tooltip
  mapTooltip = document.getElementById('map-tooltip');
  
  // Event listeners para los elementos de la leyenda
  document.querySelectorAll('.legend-item').forEach(item => {
    item.addEventListener('click', toggleConservationFilter);
  });
}

// Funciones de zoom
function zoomIn() {
  if (mapZoom < 3) {
    mapZoom += 0.5;
    applyMapTransform();
    updateZoomButtons();
  }
}

function zoomOut() {
  if (mapZoom > 0.5) {
    mapZoom -= 0.5;
    applyMapTransform();
    updateZoomButtons();
  }
}

function resetZoom() {
  mapZoom = 1;
  mapPanX = 0;
  mapPanY = 0;
  applyMapTransform();
  updateZoomButtons();
}

function applyMapTransform() {
  const svg = document.getElementById('world-map-svg');
  if (svg) {
    svg.style.transform = `scale(${mapZoom}) translate(${mapPanX}px, ${mapPanY}px)`;
  }
}

function updateZoomButtons() {
  document.getElementById('zoom-in').disabled = mapZoom >= 3;
  document.getElementById('zoom-out').disabled = mapZoom <= 0.5;
}

// Manejar filtros de conservación
function handleConservationFilter(event) {
  const value = event.target.value;
  const isChecked = event.target.checked;
  
  if (isChecked) {
    visibleConservationStates.add(value);
  } else {
    visibleConservationStates.delete(value);
  }
  
  renderMapMarkers();
  updateMapStats();
  updateLegendCounts();
}

function selectAllConservationFilters() {
  document.querySelectorAll('.conservation-filters input[type="checkbox"]').forEach(checkbox => {
    checkbox.checked = true;
    visibleConservationStates.add(checkbox.value);
  });
  
  renderMapMarkers();
  updateMapStats();
  updateLegendCounts();
}

function clearAllConservationFilters() {
  document.querySelectorAll('.conservation-filters input[type="checkbox"]').forEach(checkbox => {
    checkbox.checked = false;
  });
  
  visibleConservationStates.clear();
  renderMapMarkers();
  updateMapStats();
  updateLegendCounts();
}

function toggleConservationFilter(event) {
  const conservationState = event.currentTarget.dataset.conservation;
  if (!conservationState) return;
  
  const checkbox = document.getElementById(`filter-${conservationState}`);
  if (checkbox) {
    checkbox.checked = !checkbox.checked;
    checkbox.dispatchEvent(new Event('change'));
  }
}

// Renderizar marcadores en el mapa
function renderMapMarkers() {
  const markersContainer = document.getElementById('species-markers');
  if (!markersContainer) return;
  
  // Limpiar marcadores existentes
  markersContainer.innerHTML = '';
  
  // Filtrar especies visibles
  const visibleSpecies = mapSpeciesData.filter(species => 
    visibleConservationStates.has(species.estado_conservacion)
  );
  
  // Crear marcadores
  visibleSpecies.forEach(species => {
    const marker = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    marker.setAttribute('cx', species.x);
    marker.setAttribute('cy', species.y);
    marker.setAttribute('r', '8');
    marker.classList.add('species-marker', species.estado_conservacion);
    marker.dataset.speciesId = species.id;
    
    // Event listeners para el marcador
    marker.addEventListener('mouseenter', (e) => showMapTooltip(e, species));
    marker.addEventListener('mouseleave', hideMapTooltip);
    marker.addEventListener('click', () => openSpeciesDetail(species.species_id));
    
    markersContainer.appendChild(marker);
  });
}

// Mostrar tooltip del mapa
function showMapTooltip(event, species) {
  if (!mapTooltip) return;
  
  // Actualizar contenido del tooltip
  mapTooltip.querySelector('.tooltip-image').src = species.imagen;
  mapTooltip.querySelector('.tooltip-title').textContent = species.nombre;
  mapTooltip.querySelector('.tooltip-scientific').textContent = species.nombre_cientifico;
  mapTooltip.querySelector('.tooltip-location').textContent = species.ubicacion;
  mapTooltip.querySelector('.tooltip-conservation').textContent = getConservationText(species.estado_conservacion);
  
  // Posicionar tooltip
  const rect = event.target.getBoundingClientRect();
  const mapContainer = document.querySelector('.map-main');
  const containerRect = mapContainer.getBoundingClientRect();
  
  const x = rect.left - containerRect.left + (rect.width / 2);
  const y = rect.top - containerRect.top - 10;
  
  mapTooltip.style.left = x + 'px';
  mapTooltip.style.top = y + 'px';
  mapTooltip.classList.add('show');
}

function hideMapTooltip() {
  if (mapTooltip) {
    mapTooltip.classList.remove('show');
  }
}

// Actualizar estadísticas del mapa
function updateMapStats() {
  const visibleSpecies = mapSpeciesData.filter(species => 
    visibleConservationStates.has(species.estado_conservacion)
  );
  
  document.getElementById('visible-species-count').textContent = visibleSpecies.length;
  
  // Contar ubicaciones únicas
  const uniqueLocations = new Set(visibleSpecies.map(s => s.ubicacion));
  document.getElementById('total-locations').textContent = uniqueLocations.size;
}

// Actualizar contadores en la leyenda
function updateLegendCounts() {
  const conservationCounts = {};
  
  // Inicializar contadores
  ['extincion-critica', 'peligro', 'vulnerable', 'casi-amenazada', 'preocupacion-menor'].forEach(state => {
    conservationCounts[state] = 0;
  });
  
  // Contar especies por estado de conservación
  mapSpeciesData.forEach(species => {
    if (conservationCounts.hasOwnProperty(species.estado_conservacion)) {
      conservationCounts[species.estado_conservacion]++;
    }
  });
  
  // Actualizar contadores en la leyenda
  Object.keys(conservationCounts).forEach(state => {
    const countElement = document.getElementById(`count-${state}`);
    if (countElement) {
      countElement.textContent = conservationCounts[state];
    }
  });
}

// Integrar con filtros existentes
function applyMapFilters() {
  // Obtener filtros activos de la búsqueda principal
  const habitatFilter = document.getElementById('habitat-filter')?.value;
  const conservationFilter = document.getElementById('conservation-filter')?.value;
  const searchTerm = document.getElementById('search-especies')?.value?.toLowerCase();
  
  console.log('Aplicando filtros al mapa:', {
    habitat: habitatFilter,
    conservation: conservationFilter,
    search: searchTerm
  });
  
  // Comenzar con todas las especies de la base de datos
  let filteredMapData = mapSpeciesData ? [...mapSpeciesData] : [];
  
  // Filtro de búsqueda por texto
  if (searchTerm) {
    filteredMapData = filteredMapData.filter(species =>
      species.nombre.toLowerCase().includes(searchTerm) ||
      species.nombre_cientifico.toLowerCase().includes(searchTerm)
    );
  }
  
  // Filtro por estado de conservación
  if (conservationFilter) {
    filteredMapData = filteredMapData.filter(species =>
      species.estado_conservacion === conservationFilter
    );
  }
  
  // Filtro por hábitat - usar datos del servidor
  if (habitatFilter) {
    filteredMapData = filteredMapData.filter(species => {
      // Buscar la especie en especiesData para obtener su hábitat
      const especieCompleta = especiesData.find(e => e.id == species.species_id);
      return especieCompleta && especieCompleta.habitat === habitatFilter;
    });
  }
  
  console.log(`Especies filtradas en mapa: ${filteredMapData.length} de ${mapSpeciesData ? mapSpeciesData.length : 0}`);
  
  mapSpeciesData = filteredMapData;
  renderMapMarkers();
  updateMapStats();
  updateLegendCounts();
}

// Función para sincronizar con filtros principales (llamar desde applyFilters)
function syncMapWithMainFilters() {
  if (window.mapInitialized) {
    applyMapFilters();
  }
}

// ===== FUNCIONALIDAD DE TOGGLE DE FILTROS AVANZADOS =====

// Función para alternar mostrar/ocultar filtros avanzados
function toggleAdvancedFilters() {
  const toggleBtn = document.getElementById('toggle-filters');
  const advancedFilters = document.getElementById('advanced-filters');
  const filterArrow = document.getElementById('filter-arrow');
  
  if (!toggleBtn || !advancedFilters || !filterArrow) {
    console.error('Elementos del toggle de filtros no encontrados');
    return;
  }
  
  const isExpanded = advancedFilters.classList.contains('show');
  
  if (isExpanded) {
    // Ocultar filtros
    advancedFilters.classList.remove('show');
    toggleBtn.classList.remove('expanded');
    toggleBtn.innerHTML = '<i class="bi bi-funnel"></i> Filtros Avanzados <i class="bi bi-chevron-down" id="filter-arrow"></i>';
  } else {
    // Mostrar filtros
    advancedFilters.classList.add('show');
    toggleBtn.classList.add('expanded');
    toggleBtn.innerHTML = '<i class="bi bi-funnel"></i> Filtros Avanzados <i class="bi bi-chevron-up" id="filter-arrow"></i>';
  }
  
  // Guardar estado en localStorage
  try {
    localStorage.setItem('sway-filtros-expandidos', !isExpanded);
  } catch (error) {
    console.warn('No se pudo guardar el estado de los filtros:', error);
  }
}

// Función para restaurar el estado de los filtros al cargar la página
function restaurarEstadoFiltros() {
  try {
    const filtrosExpandidos = localStorage.getItem('sway-filtros-expandidos');
    if (filtrosExpandidos === 'true') {
      const advancedFilters = document.getElementById('advanced-filters');
      const toggleBtn = document.getElementById('toggle-filters');
      
      if (advancedFilters && toggleBtn) {
        advancedFilters.classList.add('show');
        toggleBtn.classList.add('expanded');
        toggleBtn.innerHTML = '<i class="bi bi-funnel"></i> Filtros Avanzados <i class="bi bi-chevron-up" id="filter-arrow"></i>';
      }
    }
  } catch (error) {
    console.warn('No se pudo restaurar el estado de los filtros:', error);
  }
}

// Función para mostrar mensajes del newsletter
function showNewsletterMessage(message, type = 'info') {
  // Crear elemento de mensaje temporal
  const messageDiv = document.createElement('div');
  messageDiv.style.cssText = `
    position: fixed;
    top: 2rem;
    right: 2rem;
    z-index: 10000;
    max-width: 400px;
    padding: 1rem 1.5rem;
    border-radius: 8px;
    color: white;
    font-weight: 500;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    transform: translateX(100%);
    transition: transform 0.3s ease;
  `;
  
  // Establecer colores según el tipo
  if (type === 'error') {
    messageDiv.style.backgroundColor = '#dc3545';
    messageDiv.innerHTML = `<i class="bi bi-exclamation-triangle" style="margin-right: 0.5rem;"></i>${message}`;
  } else {
    messageDiv.style.backgroundColor = '#0ea5e9';
    messageDiv.innerHTML = `<i class="bi bi-info-circle" style="margin-right: 0.5rem;"></i>${message}`;
  }
  
  document.body.appendChild(messageDiv);
  
  // Mostrar mensaje
  setTimeout(() => {
    messageDiv.style.transform = 'translateX(0)';
  }, 100);
  
  // Ocultar después de 4 segundos
  setTimeout(() => {
    messageDiv.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (messageDiv.parentNode) {
        messageDiv.parentNode.removeChild(messageDiv);
      }
    }, 300);
  }, 4000);
}

// Llamar a la función de restauración cuando se carga el DOM
document.addEventListener('DOMContentLoaded', function() {
  // Esperar un poco para asegurarse de que todos los elementos estén cargados
  setTimeout(restaurarEstadoFiltros, 100);
});
