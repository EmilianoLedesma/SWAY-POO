// Variables globales
let especiesData = [];
let filteredEspecies = [];
let currentPage = 1;
const itemsPerPage = 12;
let totalPages = 0;
let searchTimeout = null;
let isLoading = false;
let activeFilters = {};

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
  cargarEspecies();
  setupEventListeners();
  initializeActiveFiltersDisplay();
  
  // Inicializar vista por defecto (después de que el DOM esté listo)
  setTimeout(() => {
    cargarPreferenciaVista();
  }, 100);
});

// Cargar especies desde la API
async function cargarEspecies() {
  setLoadingState(true);
  
  try {
    const response = await fetch('/api/especies');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }
    
    especiesData = data.especies || [];
    filteredEspecies = [...especiesData];
    totalPages = Math.ceil(especiesData.length / itemsPerPage);
    
    renderEspecies();
    updatePagination();
    actualizarContadorEspecies(data.total || especiesData.length);
    
    // Cargar estadísticas
    loadStatistics();
    
  } catch (error) {
    console.error('Error al cargar especies:', error);
    
    // Fallback a datos simulados si falla la API
    console.log('Usando datos de fallback...');
    especiesData = especiesSimuladas;
    filteredEspecies = [...especiesData];
    totalPages = Math.ceil(especiesData.length / itemsPerPage);
    
    renderEspecies();
    updatePagination();
    actualizarContadorEspecies(especiesData.length);
    
    // Mostrar mensaje de advertencia sobre fallback
    showWarningMessage('Conectado con datos de demostración. Algunas funciones pueden estar limitadas.');
  } finally {
    setLoadingState(false);
  }
}

// Cargar estadísticas desde la API
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

// Actualizar display de estadísticas
function updateStatisticsDisplay(stats) {
  const statsNumbers = document.querySelectorAll('.stats-number');
  if (statsNumbers.length >= 4) {
    statsNumbers[0].textContent = stats.especies_catalogadas?.toLocaleString() || '2,847';
    statsNumbers[1].textContent = stats.en_peligro?.toLocaleString() || '456';
    statsNumbers[2].textContent = stats.especies_protegidas?.toLocaleString() || '1,234';
    statsNumbers[3].textContent = stats.descubiertas_este_ano?.toLocaleString() || '89';
  }
}

// Mostrar mensaje de advertencia
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
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.remove();
    }
  }, 5000);
}

// Datos simulados de especies (fallback)
const especiesSimuladas = [
  {
    id: 'tortuga-verde',
    nombre: 'Tortuga Marina Verde',
    nombre_cientifico: 'Chelonia mydas',
    habitat: 'costero',
    estado_conservacion: 'vulnerable',
    tipo: 'reptiles',
    longitud: '1.5m',
    ubicacion: 'Océanos tropicales',
    esperanza_vida: '80 años',
    imagen: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400',
    descripcion: 'La tortuga verde es una de las especies de tortugas marinas más grandes...',
    amenazas: ['Contaminación plástica', 'Pérdida de playas de anidación', 'Pesca incidental'],
    poblacion: '85,000-90,000 hembras anidadoras'
  },
  {
    id: 'ballena-azul',
    nombre: 'Ballena Azul',
    nombre_cientifico: 'Balaenoptera musculus',
    habitat: 'aguas-abiertas',
    estado_conservacion: 'peligro',
    tipo: 'mamiferos',
    longitud: '30m',
    ubicacion: 'Todos los océanos',
    esperanza_vida: '90 años',
    imagen: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400',
    descripcion: 'El animal más grande que ha existido en la Tierra...',
    amenazas: ['Colisiones con barcos', 'Contaminación acústica', 'Cambio climático'],
    poblacion: '10,000-25,000 individuos'
  }
  // Más especies...
];

// Event listeners
function setupEventListeners() {
  // Toggle de filtros avanzados
  const toggleFiltersBtn = document.getElementById('toggle-filters');
  if (toggleFiltersBtn) {
    toggleFiltersBtn.addEventListener('click', toggleAdvancedFilters);
  }
  
  // Búsqueda con debounce
  document.getElementById('search-especies').addEventListener('input', debouncedSearch);
  
  // Filtros
  document.getElementById('habitat-filter').addEventListener('change', applyFilters);
  document.getElementById('conservation-filter').addEventListener('change', applyFilters);
  document.getElementById('type-filter').addEventListener('change', applyFilters);
  document.getElementById('region-filter').addEventListener('change', applyFilters);
  
  // Botón de búsqueda
  document.querySelector('.btn-search').addEventListener('click', applyFilters);
  
  // Ordenar
  document.getElementById('sort-especies').addEventListener('change', handleSortChange);
  
  // Vista - Event listeners mejorados con data-vista
  document.querySelectorAll('[data-vista]').forEach(btn => {
    btn.addEventListener('click', cambiarVista);
  });
  
  // Paginación
  document.getElementById('prev-page').addEventListener('click', () => changePage(-1));
  document.getElementById('next-page').addEventListener('click', () => changePage(1));
  
  // Enter key para búsqueda
  document.getElementById('search-especies').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      clearTimeout(searchTimeout);
      applyFilters();
    }
  });
  
  // Cargar preferencia de vista guardada
  cargarPreferenciaVista();
}

// Búsqueda con debounce
function debouncedSearch() {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    applyFilters();
  }, 500); // Esperar 500ms después de que el usuario deje de escribir
}

// Aplicar todos los filtros y realizar búsqueda
async function applyFilters() {
  if (isLoading) return;
  
  setLoadingState(true);
  
  try {
    const searchTerm = document.getElementById('search-especies').value.trim();
    const habitatFilter = document.getElementById('habitat-filter').value;
    const conservationFilter = document.getElementById('conservation-filter').value;
    const typeFilter = document.getElementById('type-filter').value;
    const regionFilter = document.getElementById('region-filter').value;
    const sortBy = document.getElementById('sort-especies').value;
    
    // Actualizar filtros activos
    activeFilters = {
      search: searchTerm,
      habitat: habitatFilter,
      conservation: conservationFilter,
      type: typeFilter,
      region: regionFilter,
      sort: sortBy
    };
    
    // Construir parámetros de consulta
    const params = new URLSearchParams();
    if (searchTerm) params.append('search', searchTerm);
    if (habitatFilter) params.append('habitat', habitatFilter);
    if (conservationFilter) params.append('conservation', conservationFilter);
    if (typeFilter) params.append('type', typeFilter);
    if (regionFilter) params.append('region', regionFilter);
    if (sortBy) params.append('sort', sortBy);
    params.append('page', currentPage);
    params.append('limit', itemsPerPage);
    
    const response = await fetch(`/api/especies?${params}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }
    
    // Actualizar datos
    filteredEspecies = data.especies || [];
    totalPages = Math.ceil((data.total || 0) / itemsPerPage);
    
    // Renderizar resultados
    renderEspecies();
    updatePagination();
    actualizarContadorEspecies(data.total || filteredEspecies.length);
    updateActiveFiltersDisplay();
    
    // Sincronizar con el mapa si está activo
    syncMapWithMainFilters();
    
  } catch (error) {
    console.error('Error al aplicar filtros:', error);
    showErrorMessage('Error al buscar especies. Intenta de nuevo.');
    
    // Fallback a búsqueda local si falla la API
    filterEspeciesLocal();
  } finally {
    setLoadingState(false);
  }
}

// Filtrado local como fallback
function filterEspeciesLocal() {
  const searchTerm = document.getElementById('search-especies').value.toLowerCase();
  const habitatFilter = document.getElementById('habitat-filter').value;
  const conservationFilter = document.getElementById('conservation-filter').value;
  const typeFilter = document.getElementById('type-filter').value;
  const regionFilter = document.getElementById('region-filter').value;
  
  filteredEspecies = especiesData.filter(especie => {
    const matchesSearch = !searchTerm || 
                         especie.nombre.toLowerCase().includes(searchTerm) ||
                         especie.nombre_cientifico.toLowerCase().includes(searchTerm);
    const matchesHabitat = !habitatFilter || especie.habitat === habitatFilter;
    const matchesConservation = !conservationFilter || especie.estado_conservacion === conservationFilter;
    const matchesType = !typeFilter || especie.tipo === typeFilter;
    const matchesRegion = !regionFilter || especie.region === regionFilter;
    
    return matchesSearch && matchesHabitat && matchesConservation && matchesType && matchesRegion;
  });
  
  currentPage = 1;
  totalPages = Math.ceil(filteredEspecies.length / itemsPerPage);
  renderEspecies();
  updatePagination();
  actualizarContadorEspecies(filteredEspecies.length);
  updateActiveFiltersDisplay();
  
  // Sincronizar con el mapa si está activo
  syncMapWithMainFilters();
}

// Manejar cambio de ordenamiento
function handleSortChange() {
  currentPage = 1; // Volver a la primera página al cambiar orden
  applyFilters();
}

// Ordenar especies localmente (fallback)
function sortEspeciesLocal() {
  const sortBy = document.getElementById('sort-especies').value;
  
  filteredEspecies.sort((a, b) => {
    switch(sortBy) {
      case 'nombre':
        return a.nombre.localeCompare(b.nombre);
      case 'conservation':
        const conservationOrder = {
          'extincion-critica': 0,
          'peligro': 1,
          'vulnerable': 2,
          'casi-amenazada': 3,
          'preocupacion-menor': 4
        };
        return conservationOrder[a.estado_conservacion] - conservationOrder[b.estado_conservacion];
      case 'size':
        return parseFloat(a.longitud || '0') - parseFloat(b.longitud || '0');
      case 'habitat':
        return a.habitat.localeCompare(b.habitat);
      case 'added':
        return new Date(b.fecha_agregado || 0) - new Date(a.fecha_agregado || 0);
      default:
        return 0;
    }
  });
  
  renderEspecies();
}

// Función principal para cambiar vista mejorada
function cambiarVista(e) {
  const vista = e.target.closest('[data-vista]').dataset.vista;
  
  // Actualizar botones activos
  actualizarBotonesVista(vista);
  
  // Aplicar la vista correspondiente
  aplicarVista(vista);
  
  // Guardar preferencia en localStorage
  guardarPreferenciaVista(vista);
}

// Actualizar estado visual de los botones de vista
function actualizarBotonesVista(vistaActiva) {
  document.querySelectorAll('[data-vista]').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.vista === vistaActiva) {
      btn.classList.add('active');
    }
  });
}

// Aplicar la vista seleccionada
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

// Guardar preferencia de vista en localStorage
function guardarPreferenciaVista(vista) {
  try {
    localStorage.setItem('sway-especies-vista-preferida', vista);
  } catch (error) {
    console.warn('No se pudo guardar la preferencia de vista:', error);
  }
}

// Cargar preferencia de vista desde localStorage
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

// Función de compatibilidad (mantener para no romper código existente)
function changeView(e) {
  cambiarVista(e);
}

// Función de debug para probar las vistas (solo para desarrollo)
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

// Función para obtener la vista actual
function obtenerVistaActual() {
  try {
    const vistaGuardada = localStorage.getItem('sway-especies-vista-preferida');
    return vistaGuardada || 'grid';
  } catch (error) {
    return 'grid';
  }
}

// Renderizar especies
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
        <img src="${especie.imagen || 'https://via.placeholder.com/400x300?text=Especie+Marina'}" 
             alt="${especie.nombre}" 
             onerror="this.src='https://via.placeholder.com/400x300?text=Imagen+no+disponible'"
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
  document.getElementById('type-filter').value = '';
  document.getElementById('region-filter').value = '';
  document.getElementById('sort-especies').value = 'nombre';
  
  // Limpiar filtros activos
  activeFilters = {};
  currentPage = 1;
  
  // Aplicar filtros vacíos (mostrar todo)
  applyFilters();
}

// Actualizar paginación
function updatePagination() {
  document.getElementById('current-page').textContent = currentPage;
  document.getElementById('total-pages').textContent = totalPages || 1;
  
  document.getElementById('prev-page').disabled = currentPage === 1;
  document.getElementById('next-page').disabled = currentPage === totalPages || totalPages === 0;
}

// Cambiar página
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

// Función para manejar el formulario de newsletter
function showNewsletterConfirmation() {
  const email = document.getElementById('newsletter-email').value;
  
  if (!email) {
    alert('Por favor, ingresa tu email');
    return;
  }
  
  // Enviar a la API
  suscribirNewsletter(email).then(result => {
    if (result.success) {
      document.getElementById('newsletter-popup').style.display = 'block';
      document.getElementById('newsletter-email').value = '';
    } else {
      alert('Error: ' + result.message);
    }
  });
}

// Función para cerrar el popup de newsletter
function closeNewsletterPopup() {
  document.getElementById('newsletter-popup').style.display = 'none';
}


// Función para crear el modal de reporte de avistamiento
function createSightingModal() {
  const modalHTML = `
    <div class="modal fade" id="reportSightingModal" tabindex="-1" aria-labelledby="reportSightingModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="reportSightingModalLabel">Reportar Avistamiento</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <form id="sightingForm">
              <div class="mb-3">
                <label for="species-name" class="form-label">Especie Avistada</label>
                <input type="text" class="form-control" id="species-name" readonly>
              </div>
              <div class="mb-3">
                <label for="sighting-date" class="form-label">Fecha del Avistamiento</label>
                <input type="date" class="form-control" id="sighting-date" required>
              </div>
              <div class="mb-3">
                <label for="sighting-location" class="form-label">Ubicación</label>
                <input type="text" class="form-control" id="sighting-location" placeholder="Ej: Golfo de México, frente a Veracruz" required>
              </div>
              <div class="mb-3">
                <label for="sighting-coordinates" class="form-label">Coordenadas (opcional)</label>
                <input type="text" class="form-control" id="sighting-coordinates" placeholder="Ej: 19.2465, -96.1015">
              </div>
              <div class="mb-3">
                <label for="observer-name" class="form-label">Tu Nombre</label>
                <input type="text" class="form-control" id="observer-name" required>
              </div>
              <div class="mb-3">
                <label for="observer-email" class="form-label">Tu Email</label>
                <input type="email" class="form-control" id="observer-email" required>
              </div>
              <div class="mb-3">
                <label for="sighting-description" class="form-label">Descripción del Avistamiento</label>
                <textarea class="form-control" id="sighting-description" rows="3" placeholder="Describe lo que viste: comportamiento, número de individuos, etc."></textarea>
              </div>
              <div class="mb-3">
                <label for="sighting-photo" class="form-label">URL de Foto (opcional)</label>
                <input type="url" class="form-control" id="sighting-photo" placeholder="https://ejemplo.com/foto.jpg">
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
            <button type="button" class="btn btn-primary" id="submit-sighting">Reportar Avistamiento</button>
          </div>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  
  // Agregar event listener para el botón de envío
  document.getElementById('submit-sighting').addEventListener('click', function() {
    const form = document.getElementById('sightingForm');
    if (form.checkValidity()) {
      const formData = {
        species_name: document.getElementById('species-name').value,
        sighting_date: document.getElementById('sighting-date').value,
        location: document.getElementById('sighting-location').value,
        coordinates: document.getElementById('sighting-coordinates').value,
        observer_name: document.getElementById('observer-name').value,
        observer_email: document.getElementById('observer-email').value,
        description: document.getElementById('sighting-description').value,
        photo_url: document.getElementById('sighting-photo').value
      };
      
      reportarAvistamiento(formData).then(success => {
        if (success) {
          const myModal = bootstrap.Modal.getInstance(document.getElementById('reportSightingModal'));
          myModal.hide();
          form.reset();
        }
      });
    } else {
      form.reportValidity();
    }
  });
}

// Función para abrir detalles de especie
async function openSpeciesDetail(specieId) {
  const especie = await obtenerDetallesEspecie(specieId);
  
  if (especie) {
    // Crear y mostrar modal con detalles
    mostrarModalDetalles(especie);
  } else {
    alert('No se pudieron cargar los detalles de la especie');
  }
}

// Función para mostrar modal de detalles
function mostrarModalDetalles(especie) {
  const modalContent = `
    <div class="species-detail-header">
      <img src="${especie.imagen}" alt="${especie.nombre}" class="species-detail-image">
      <div class="species-detail-info">
        <h2>${especie.nombre}</h2>
        <p class="scientific-name">${especie.nombre_cientifico}</p>
        <span class="conservation-badge ${especie.estado_conservacion}">${getConservationLabel(especie.estado_conservacion)}</span>
      </div>
    </div>
    <div class="species-detail-content">
      <div class="row">
        <div class="col-md-6">
          <h4>Información General</h4>
          <ul>
            <li><strong>Hábitat:</strong> ${getHabitatLabel(especie.habitat)}</li>
            <li><strong>Tamaño:</strong> ${especie.longitud || 'No disponible'}</li>
            <li><strong>Esperanza de vida:</strong> ${especie.esperanza_vida || 'No disponible'}</li>
            <li><strong>Ubicación:</strong> ${especie.ubicacion || 'No disponible'}</li>
          </ul>
        </div>
        <div class="col-md-6">
          <h4>Estado de Conservación</h4>
          <p>${especie.descripcion}</p>
          ${especie.amenazas ? `
            <h5>Principales Amenazas:</h5>
            <ul>
              ${especie.amenazas.map(amenaza => `<li>${amenaza}</li>`).join('')}
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
    'estuario': 'Estuarios'
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

// ===== FUNCIONES DEL MODAL DE AVISTAMIENTO =====

// Función para abrir modal de avistamiento
function reportSighting(speciesId) {
  const modal = document.getElementById('sighting-modal');
  
  // Pre-llenar el nombre de la especie si se conoce
  if (speciesId) {
    // Buscar la especie en los datos actuales
    const especie = filteredEspecies.find(esp => esp.id === speciesId);
    if (especie) {
      document.getElementById('species-name').value = especie.nombre;
    }
  }
  
  // Establecer fecha actual como predeterminada
  const now = new Date();
  const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString().slice(0, 16);
  document.getElementById('sighting-date').value = localDateTime;
  
  // Mostrar modal
  modal.style.display = 'flex';
  setTimeout(() => {
    modal.classList.add('show');
  }, 10);
}

// Función para cerrar modal de avistamiento
function closeSightingModal() {
  const modal = document.getElementById('sighting-modal');
  modal.classList.remove('show');
  setTimeout(() => {
    modal.style.display = 'none';
    // Limpiar formulario
    document.getElementById('sighting-form').reset();
    clearFormMessages();
  }, 400);
}

// Función para limpiar mensajes del formulario
function clearFormMessages() {
  const existingMessages = document.querySelectorAll('.success-message, .error-message');
  existingMessages.forEach(msg => msg.remove());
  
  // Quitar clases de estado de los campos
  const inputs = document.querySelectorAll('.form-group input, .form-group textarea');
  inputs.forEach(input => {
    input.classList.remove('form-success', 'form-error');
  });
}

// Función para mostrar mensaje en el formulario
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

// Función para enviar el formulario de avistamiento
async function submitSightingForm(event) {
  event.preventDefault();
  
  const form = event.target;
  const formData = new FormData(form);
  
  // Validar coordenadas si se proporcionaron
  const coordinates = formData.get('coordinates');
  if (coordinates && !validateCoordinates(coordinates)) {
    showFormMessage('Formato de coordenadas inválido. Use el formato: latitud, longitud (ej: 20.6296, -87.0739)', 'error');
    return;
  }
  
  // Preparar datos para envío
  const sightingData = {
    species_name: formData.get('species_name'),
    sighting_date: formData.get('sighting_date'),
    location: formData.get('location'),
    coordinates: coordinates,
    description: formData.get('description'),
    observer_name: formData.get('observer_name'),
    observer_email: formData.get('observer_email')
  };
  
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
    
    if (response.ok) {
      showFormMessage('¡Avistamiento reportado exitosamente! Gracias por contribuir a la conservación marina.', 'success');
      
      // Limpiar formulario después de 2 segundos
      setTimeout(() => {
        closeSightingModal();
      }, 2000);
    } else {
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
    conservation: 'Conservación',
    type: 'Tipo',
    region: 'Región'
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
  
  const typeLabels = {
    'mamiferos': 'Mamíferos Marinos',
    'peces': 'Peces',
    'reptiles': 'Reptiles Marinos',
    'invertebrados': 'Invertebrados',
    'corales': 'Corales',
    'algas': 'Algas Marinas',
    'aves': 'Aves Marinas'
  };
  
  const regionLabels = {
    'pacifico': 'Océano Pacífico',
    'atlantico': 'Océano Atlántico',
    'indico': 'Océano Índico',
    'artico': 'Océano Ártico',
    'antartico': 'Océano Antártico',
    'mediterraneo': 'Mar Mediterráneo',
    'caribe': 'Mar Caribe'
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
        case 'type':
          displayValue = typeLabels[filterValue] || filterValue;
          break;
        case 'region':
          displayValue = regionLabels[filterValue] || filterValue;
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
    case 'type':
      document.getElementById('type-filter').value = '';
      break;
    case 'region':
      document.getElementById('region-filter').value = '';
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

// Datos simulados de ubicaciones de especies
const speciesLocations = [
  {
    id: 'tortuga-verde-1',
    species_id: 'tortuga-verde',
    nombre: 'Tortuga Marina Verde',
    nombre_cientifico: 'Chelonia mydas',
    estado_conservacion: 'vulnerable',
    x: 250, // Coordenadas en el SVG
    y: 200,
    ubicacion: 'Golfo de México',
    imagen: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400'
  },
  {
    id: 'ballena-azul-1',
    species_id: 'ballena-azul',
    nombre: 'Ballena Azul',
    nombre_cientifico: 'Balaenoptera musculus',
    estado_conservacion: 'peligro',
    x: 150,
    y: 120,
    ubicacion: 'Pacífico Norte',
    imagen: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400'
  },
  {
    id: 'coral-cuerno-1',
    species_id: 'coral-cuerno',
    nombre: 'Coral Cuerno de Alce',
    nombre_cientifico: 'Acropora palmata',
    estado_conservacion: 'extincion-critica',
    x: 220,
    y: 180,
    ubicacion: 'Mar Caribe',
    imagen: 'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=400'
  },
  {
    id: 'delfin-mular-1',
    species_id: 'delfin-mular',
    nombre: 'Delfín Mular',
    nombre_cientifico: 'Tursiops truncatus',
    estado_conservacion: 'vulnerable',
    x: 500,
    y: 150,
    ubicacion: 'Mediterráneo',
    imagen: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400'
  },
  {
    id: 'tiburon-ballena-1',
    species_id: 'tiburon-ballena',
    nombre: 'Tiburón Ballena',
    nombre_cientifico: 'Rhincodon typus',
    estado_conservacion: 'peligro',
    x: 600,
    y: 200,
    ubicacion: 'Océano Índico',
    imagen: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400'
  },
  {
    id: 'foca-monje-1',
    species_id: 'foca-monje',
    nombre: 'Foca Monje del Mediterráneo',
    nombre_cientifico: 'Monachus monachus',
    estado_conservacion: 'extincion-critica',
    x: 480,
    y: 140,
    ubicacion: 'Mediterráneo Oriental',
    imagen: 'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=400'
  },
  {
    id: 'manatí-1',
    species_id: 'manati',
    nombre: 'Manatí del Caribe',
    nombre_cientifico: 'Trichechus manatus',
    estado_conservacion: 'vulnerable',
    x: 200,
    y: 210,
    ubicacion: 'Caribe',
    imagen: 'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=400'
  },
  {
    id: 'pingüino-emperador-1',
    species_id: 'pinguino-emperador',
    nombre: 'Pingüino Emperador',
    nombre_cientifico: 'Aptenodytes forsteri',
    estado_conservacion: 'casi-amenazada',
    x: 500,
    y: 420,
    ubicacion: 'Antártida',
    imagen: 'https://images.unsplash.com/photo-1551986782-d0169b3f8fa7?w=400'
  },
  // Especies adicionales para mayor variedad
  {
    id: 'tortuga-carey-1',
    species_id: 'tortuga-carey',
    nombre: 'Tortuga Carey',
    nombre_cientifico: 'Eretmochelys imbricata',
    estado_conservacion: 'extincion-critica',
    x: 270,
    y: 190,
    ubicacion: 'Caribe',
    imagen: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400'
  },
  {
    id: 'orca-1',
    species_id: 'orca',
    nombre: 'Orca',
    nombre_cientifico: 'Orcinus orca',
    estado_conservacion: 'preocupacion-menor',
    x: 120,
    y: 100,
    ubicacion: 'Pacífico Norte',
    imagen: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400'
  },
  {
    id: 'pez-napoleon-1',
    species_id: 'pez-napoleon',
    nombre: 'Pez Napoleón',
    nombre_cientifico: 'Cheilinus undulatus',
    estado_conservacion: 'peligro',
    x: 650,
    y: 180,
    ubicacion: 'Océano Índico',
    imagen: 'https://images.unsplash.com/photo-1544552866-d3ed42536cfd?w=400'
  },
  {
    id: 'atun-rojo-1',
    species_id: 'atun-rojo',
    nombre: 'Atún Rojo del Atlántico',
    nombre_cientifico: 'Thunnus thynnus',
    estado_conservacion: 'peligro',
    x: 400,
    y: 160,
    ubicacion: 'Océano Atlántico',
    imagen: 'https://images.unsplash.com/photo-1544552866-d3ed42536cfd?w=400'
  },
  {
    id: 'coral-cerebro-1',
    species_id: 'coral-cerebro',
    nombre: 'Coral Cerebro',
    nombre_cientifico: 'Diploria labyrinthiformis',
    estado_conservacion: 'vulnerable',
    x: 240,
    y: 170,
    ubicacion: 'Mar Caribe',
    imagen: 'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=400'
  },
  {
    id: 'tiburon-martillo-1',
    species_id: 'tiburon-martillo',
    nombre: 'Tiburón Martillo',
    nombre_cientifico: 'Sphyrna lewini',
    estado_conservacion: 'extincion-critica',
    x: 180,
    y: 220,
    ubicacion: 'Pacífico Tropical',
    imagen: 'https://images.unsplash.com/photo-1544552866-d3ed42536cfd?w=400'
  },
  {
    id: 'gaviota-artica-1',
    species_id: 'gaviota-artica',
    nombre: 'Gaviota Ártica',
    nombre_cientifico: 'Sterna paradisaea',
    estado_conservacion: 'preocupacion-menor',
    x: 400,
    y: 80,
    ubicacion: 'Océano Ártico',
    imagen: 'https://images.unsplash.com/photo-1551986782-d0169b3f8fa7?w=400'
  },
  {
    id: 'medusa-gigante-1',
    species_id: 'medusa-gigante',
    nombre: 'Medusa Gigante',
    nombre_cientifico: 'Chrysaora hysoscella',
    estado_conservacion: 'preocupacion-menor',
    x: 520,
    y: 170,
    ubicacion: 'Mediterráneo',
    imagen: 'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=400'
  },
  {
    id: 'alga-kelp-1',
    species_id: 'alga-kelp',
    nombre: 'Alga Kelp Gigante',
    nombre_cientifico: 'Macrocystis pyrifera',
    estado_conservacion: 'vulnerable',
    x: 80,
    y: 280,
    ubicacion: 'Pacífico Sur',
    imagen: 'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=400'
  }
];

// Inicializar el mapa
function initializeMap() {
  console.log('Inicializando mapa interactivo...');
  
  // Mostrar loading
  document.getElementById('map-loading').style.display = 'flex';
  
  // Simular carga de datos
  setTimeout(() => {
    mapSpeciesData = [...speciesLocations];
    setupMapEventListeners();
    
    // Aplicar filtros actuales al inicializar
    applyMapFilters();
    
    // Ocultar loading
    document.getElementById('map-loading').style.display = 'none';
    
    console.log('Mapa inicializado correctamente con filtros aplicados');
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
  const typeFilter = document.getElementById('type-filter')?.value;
  const regionFilter = document.getElementById('region-filter')?.value;
  const conservationFilter = document.getElementById('conservation-filter')?.value;
  const searchTerm = document.getElementById('search-especies')?.value?.toLowerCase();
  
  console.log('Aplicando filtros al mapa:', {
    habitat: habitatFilter,
    type: typeFilter,
    region: regionFilter,
    conservation: conservationFilter,
    search: searchTerm
  });
  
  // Comenzar con todas las especies y filtrar según los criterios principales
  let filteredMapData = [...speciesLocations];
  
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
  
  // Filtro por tipo de organismo
  if (typeFilter) {
    filteredMapData = filteredMapData.filter(species => {
      // Mapear especies a tipos (basado en los datos existentes)
      const typeMap = {
        'tortuga-verde': 'reptiles',
        'ballena-azul': 'mamiferos',
        'coral-cuerno': 'corales',
        'delfin-mular': 'mamiferos',
        'tiburon-ballena': 'peces',
        'foca-monje': 'mamiferos',
        'manati': 'mamiferos',
        'pinguino-emperador': 'aves',
        'tortuga-carey': 'reptiles',
        'orca': 'mamiferos',
        'pez-napoleon': 'peces',
        'atun-rojo': 'peces',
        'coral-cerebro': 'corales',
        'tiburon-martillo': 'peces',
        'gaviota-artica': 'aves',
        'medusa-gigante': 'invertebrados',
        'alga-kelp': 'algas'
      };
      return typeMap[species.species_id] === typeFilter;
    });
  }
  
  // Filtro por hábitat
  if (habitatFilter) {
    filteredMapData = filteredMapData.filter(species => {
      // Mapear ubicaciones a hábitats
      const habitatMap = {
        'Golfo de México': 'costero',
        'Pacífico Norte': 'aguas-abiertas',
        'Mar Caribe': 'arrecife',
        'Mediterráneo': 'costero',
        'Océano Índico': 'aguas-abiertas',
        'Mediterráneo Oriental': 'costero',
        'Caribe': 'arrecife',
        'Antártida': 'polar',
        'Océano Atlántico': 'aguas-abiertas',
        'Pacífico Tropical': 'aguas-abiertas',
        'Océano Ártico': 'polar',
        'Pacífico Sur': 'aguas-abiertas'
      };
      return habitatMap[species.ubicacion] === habitatFilter;
    });
  }
  
  // Filtro por región geográfica
  if (regionFilter) {
    filteredMapData = filteredMapData.filter(species => {
      // Mapear ubicaciones a regiones oceánicas
      const regionMap = {
        'Golfo de México': 'atlantico',
        'Pacífico Norte': 'pacifico',
        'Mar Caribe': 'caribe',
        'Mediterráneo': 'mediterraneo',
        'Océano Índico': 'indico',
        'Mediterráneo Oriental': 'mediterraneo',
        'Caribe': 'caribe',
        'Antártida': 'antartico',
        'Océano Atlántico': 'atlantico',
        'Pacífico Tropical': 'pacifico',
        'Océano Ártico': 'artico',
        'Pacífico Sur': 'pacifico'
      };
      return regionMap[species.ubicacion] === regionFilter;
    });
  }
  
  console.log(`Especies filtradas en mapa: ${filteredMapData.length} de ${speciesLocations.length}`);
  
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

// Llamar a la función de restauración cuando se carga el DOM
document.addEventListener('DOMContentLoaded', function() {
  // Esperar un poco para asegurarse de que todos los elementos estén cargados
  setTimeout(restaurarEstadoFiltros, 100);
});
