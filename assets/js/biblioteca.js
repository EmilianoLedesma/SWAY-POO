// =============================================
// BIBLIOTECA - SISTEMA DE FILTROS Y BÚSQUEDA
// Funcionalidades específicas para la página de biblioteca educativa
// =============================================

/**
 * Variables globales para el sistema de biblioteca
 * Controlan el estado de filtros, búsqueda y recursos disponibles
 * @type {string} currentFilter - Filtro de categoría actualmente seleccionado
 * @type {string} currentSearchTerm - Término de búsqueda actual
 * @type {Array} allResources - Lista completa de recursos disponibles
 */
let currentFilter = 'all';
let currentSearchTerm = '';
let allResources = [];

// =============================================
// INICIALIZACIÓN DE LA BIBLIOTECA
// Configuración inicial del sistema de recursos educativos
// =============================================

/**
 * Inicializa el sistema de biblioteca cuando el DOM está completamente cargado
 * Punto de entrada principal para toda la funcionalidad de la biblioteca
 * @returns {void}
 */
document.addEventListener('DOMContentLoaded', function() {
  initializeBiblioteca();
});

/**
 * Configuración inicial de la biblioteca
 * Establece todos los componentes necesarios para el funcionamiento
 * @returns {void}
 */
function initializeBiblioteca() {
  // Capturar y catalogar todas las tarjetas de recursos disponibles
  getAllResources();
  
  // Configurar event listeners para sistema de filtros
  setupFilterButtons();
  
  // Configurar sistema de búsqueda en tiempo real
  setupSearchSystem();
  
  // Configurar botones de tags populares para búsqueda rápida
  setupPopularTags();
  
  console.log('Sistema de biblioteca inicializado correctamente');
}

// =============================================
// SISTEMA DE RECURSOS
// Gestión y catalogación de recursos educativos
// =============================================

/**
 * Captura y almacena información de todos los recursos disponibles
 * Analiza el contenido para determinar categorías automáticamente
 * @returns {void}
 */
function getAllResources() {
  const resourceCards = document.querySelectorAll('.resource-card');
  allResources = [];
  
  resourceCards.forEach((card, index) => {
    const parentCol = card.closest('.col-lg-4, .col-md-6');
    const title = card.querySelector('.card-title')?.textContent || '';
    const description = card.querySelector('.card-text')?.textContent || '';
    const meta = card.querySelector('.resource-meta')?.textContent || '';
    
    // Determinar categoría automáticamente basada en el contenido
    let category = determineCategory(title, description);
    
    // Añadir atributos de datos al elemento padre para filtrado
    if (parentCol) {
      parentCol.setAttribute('data-category', category);
      parentCol.setAttribute('data-title', title.toLowerCase());
      parentCol.setAttribute('data-description', description.toLowerCase());
      parentCol.setAttribute('data-meta', meta.toLowerCase());
    }
    
    allResources.push({
      element: parentCol,
      title: title.toLowerCase(),
      description: description.toLowerCase(),
      meta: meta.toLowerCase(),
      category: category,
      index: index
    });
  });
  
  console.log(`Se encontraron ${allResources.length} recursos`);
}

/**
 * Determina la categoría de un recurso basado en su contenido
 * Utiliza palabras clave para clasificar automáticamente el recurso
 * @param {string} title - Título del recurso
 * @param {string} description - Descripción del recurso
 * @returns {string} Categoría determinada según el contenido
 */
function determineCategory(title, description) {
  const content = (title + ' ' + description).toLowerCase();
  
  if (content.includes('guía') || content.includes('manual') || content.includes('técnicas')) {
    return 'guides';
  } else if (content.includes('investigación') || content.includes('científico') || content.includes('estudio') || content.includes('cambio climático')) {
    return 'research';
  } else if (content.includes('educativo') || content.includes('infantil') || content.includes('didáctico') || content.includes('enseñar')) {
    return 'educational';
  } else if (content.includes('infografía') || content.includes('estadística') || content.includes('datos')) {
    return 'infographics';
  } else if (content.includes('video') || content.includes('documental') || content.includes('visualizaciones')) {
    return 'videos';
  }
  
  return 'guides'; // Categoría por defecto si no coincide con ninguna otra
}

// =============================================
// SISTEMA DE FILTROS
// Filtrado dinámico de recursos por categoría
// =============================================

/**
 * Configura los botones de filtro de categorías
 * Establece event listeners para cada botón de filtro
 * @returns {void}
 */
function setupFilterButtons() {
  const filterButtons = document.querySelectorAll('.filter-btn');
  
  filterButtons.forEach(button => {
    button.addEventListener('click', function() {
      const filter = this.getAttribute('data-filter');
      applyFilter(filter);
      updateActiveFilter(this);
    });
  });
}

/**
 * Aplica un filtro específico a los recursos
 * Actualiza la visualización según la categoría seleccionada
 * @param {string} filter - Filtro a aplicar ('all', 'guides', 'research', etc.)
 * @returns {void}
 */
function applyFilter(filter) {
  currentFilter = filter;
  filterAndSearchResources();
}

/**
 * Actualiza el botón de filtro activo
 * Maneja el estado visual de los botones de filtro
 * @param {HTMLElement} activeButton - Botón que debe marcarse como activo
 * @returns {void}
 */
function updateActiveFilter(activeButton) {
  // Remover clase active de todos los botones de filtro
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  
  // Añadir clase active al botón recién seleccionado
  activeButton.classList.add('active');
}

// =============================================
// SISTEMA DE BÚSQUEDA
// Búsqueda en tiempo real de recursos educativos
// =============================================

/**
 * Configura el sistema de búsqueda en tiempo real
 * Establece event listeners para campo de búsqueda y botón
 * @returns {void}
 */
function setupSearchSystem() {
  const searchInput = document.querySelector('.search-box input[type="text"]');
  const searchButton = document.querySelector('.search-box .btn-primary');
  
  if (searchInput) {
    // Añadir ID al input de búsqueda para mejor acceso
    searchInput.id = 'biblioteca-search-input';
    
    // Búsqueda en tiempo real mientras se escribe
    searchInput.addEventListener('input', function() {
      currentSearchTerm = this.value.toLowerCase().trim();
      debounceSearch();
    });
    
    // Búsqueda al presionar Enter
    searchInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        performSearch();
      }
    });
  }
  
  if (searchButton) {
    searchButton.addEventListener('click', function(e) {
      e.preventDefault();
      performSearch();
    });
  }
}

/**
 * Variable para el debounce de búsqueda
 */
let searchTimeout;

/**
 * Implementa debounce para la búsqueda (evita búsquedas excesivas)
 */
function debounceSearch() {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    filterAndSearchResources();
  }, 300); // Esperar 300ms después de que el usuario deje de escribir
}

/**
 * Ejecuta la búsqueda inmediatamente
 */
function performSearch() {
  const searchInput = document.getElementById('biblioteca-search-input');
  if (searchInput) {
    currentSearchTerm = searchInput.value.toLowerCase().trim();
    filterAndSearchResources();
  }
}

// =============================================
// SISTEMA COMBINADO DE FILTROS Y BÚSQUEDA
// =============================================

/**
 * Aplica tanto filtros como búsqueda a los recursos
 */
function filterAndSearchResources() {
  let visibleCount = 0;
  
  allResources.forEach(resource => {
    let shouldShow = true;
    
    // Aplicar filtro de categoría
    if (currentFilter !== 'all' && resource.category !== currentFilter) {
      shouldShow = false;
    }
    
    // Aplicar búsqueda de texto
    if (currentSearchTerm && shouldShow) {
      const searchableContent = resource.title + ' ' + resource.description + ' ' + resource.meta;
      if (!searchableContent.includes(currentSearchTerm)) {
        shouldShow = false;
      }
    }
    
    // Mostrar/ocultar elemento con animación
    if (resource.element) {
      if (shouldShow) {
        showResource(resource.element);
        visibleCount++;
      } else {
        hideResource(resource.element);
      }
    }
  });
  
  // Mostrar mensaje si no hay resultados
  updateNoResultsMessage(visibleCount);
  
  // Reinicializar animaciones AOS si están disponibles
  if (typeof AOS !== 'undefined') {
    AOS.refresh();
  }
}

/**
 * Muestra un recurso con animación suave
 * @param {HTMLElement} element - Elemento a mostrar
 */
function showResource(element) {
  if (element) {
    element.style.display = 'block';
    element.style.opacity = '0';
    element.style.transform = 'translateY(20px)';
    
    // Animación de entrada
    setTimeout(() => {
      element.style.transition = 'all 0.3s ease';
      element.style.opacity = '1';
      element.style.transform = 'translateY(0)';
    }, 50);
  }
}

/**
 * Oculta un recurso con animación suave
 * @param {HTMLElement} element - Elemento a ocultar
 */
function hideResource(element) {
  if (element) {
    element.style.transition = 'all 0.3s ease';
    element.style.opacity = '0';
    element.style.transform = 'translateY(-20px)';
    
    setTimeout(() => {
      element.style.display = 'none';
    }, 300);
  }
}

// =============================================
// SISTEMA DE MENSAJES
// =============================================

/**
 * Actualiza el mensaje cuando no hay resultados
 * @param {number} visibleCount - Número de recursos visibles
 */
function updateNoResultsMessage(visibleCount) {
  let messageContainer = document.getElementById('no-results-message');
  
  if (visibleCount === 0) {
    // Crear mensaje si no existe
    if (!messageContainer) {
      messageContainer = createNoResultsMessage();
    }
    
    // Actualizar contenido del mensaje
    updateNoResultsContent(messageContainer);
    messageContainer.style.display = 'block';
  } else {
    // Ocultar mensaje si hay resultados
    if (messageContainer) {
      messageContainer.style.display = 'none';
    }
  }
}

/**
 * Crea el elemento de mensaje "no hay resultados"
 * @returns {HTMLElement} Elemento del mensaje creado
 */
function createNoResultsMessage() {
  const messageContainer = document.createElement('div');
  messageContainer.id = 'no-results-message';
  messageContainer.className = 'col-12 text-center py-5';
  messageContainer.style.display = 'none';
  
  // Insertar después de la fila de recursos
  const resourcesRow = document.querySelector('.row.g-4');
  if (resourcesRow && resourcesRow.parentNode) {
    resourcesRow.parentNode.insertBefore(messageContainer, resourcesRow.nextSibling);
  }
  
  return messageContainer;
}

/**
 * Actualiza el contenido del mensaje "no hay resultados"
 * @param {HTMLElement} container - Contenedor del mensaje
 */
function updateNoResultsContent(container) {
  let message = '';
  let suggestions = '';
  
  if (currentSearchTerm && currentFilter !== 'all') {
    message = `No se encontraron recursos que coincidan con "${currentSearchTerm}" en la categoría seleccionada.`;
    suggestions = `
      <div class="mt-3">
        <p class="text-muted mb-2">Sugerencias:</p>
        <button class="btn btn-outline-primary btn-sm me-2" onclick="clearSearch()">Limpiar búsqueda</button>
        <button class="btn btn-outline-primary btn-sm" onclick="clearFilter()">Ver todas las categorías</button>
      </div>
    `;
  } else if (currentSearchTerm) {
    message = `No se encontraron recursos que coincidan con "${currentSearchTerm}".`;
    suggestions = `
      <div class="mt-3">
        <p class="text-muted mb-2">Sugerencias:</p>
        <button class="btn btn-outline-primary btn-sm" onclick="clearSearch()">Limpiar búsqueda</button>
      </div>
    `;
  } else if (currentFilter !== 'all') {
    message = 'No se encontraron recursos en esta categoría.';
    suggestions = `
      <div class="mt-3">
        <button class="btn btn-outline-primary btn-sm" onclick="clearFilter()">Ver todos los recursos</button>
      </div>
    `;
  }
  
  container.innerHTML = `
    <div class="py-5">
      <i class="bi bi-search display-1 text-muted mb-3"></i>
      <h4 class="text-muted">${message}</h4>
      <p class="text-muted">Intenta con otros términos de búsqueda o explora diferentes categorías.</p>
      ${suggestions}
    </div>
  `;
}

// =============================================
// FUNCIONES DE UTILIDAD
// =============================================

/**
 * Limpia el término de búsqueda actual
 */
function clearSearch() {
  const searchInput = document.getElementById('biblioteca-search-input');
  if (searchInput) {
    searchInput.value = '';
  }
  currentSearchTerm = '';
  filterAndSearchResources();
}

/**
 * Limpia el filtro actual y muestra todos los recursos
 */
function clearFilter() {
  currentFilter = 'all';
  
  // Actualizar botón activo
  const allButton = document.querySelector('.filter-btn[data-filter="all"]');
  if (allButton) {
    updateActiveFilter(allButton);
  }
  
  filterAndSearchResources();
}

// =============================================
// SISTEMA DE TAGS POPULARES
// =============================================

/**
 * Configura los tags populares para búsqueda rápida
 */
function setupPopularTags() {
  const popularTags = document.querySelectorAll('.popular-tags .badge');
  
  popularTags.forEach(tag => {
    tag.addEventListener('click', function(e) {
      e.preventDefault();
      const searchTerm = this.textContent.trim();
      
      // Establecer término de búsqueda
      const searchInput = document.getElementById('biblioteca-search-input');
      if (searchInput) {
        searchInput.value = searchTerm;
      }
      
      currentSearchTerm = searchTerm.toLowerCase();
      filterAndSearchResources();
      
      // Efecto visual en el tag
      this.style.transform = 'scale(0.95)';
      setTimeout(() => {
        this.style.transform = 'scale(1)';
      }, 150);
    });
  });
}

// =============================================
// FUNCIONES ADICIONALES PARA MEJORAR UX
// =============================================

/**
 * Obtiene estadísticas de recursos por categoría
 * @returns {Object} Objeto con conteos por categoría
 */
function getResourceStats() {
  const stats = {
    all: allResources.length,
    guides: 0,
    research: 0,
    educational: 0,
    infographics: 0,
    videos: 0
  };
  
  allResources.forEach(resource => {
    if (stats.hasOwnProperty(resource.category)) {
      stats[resource.category]++;
    }
  });
  
  return stats;
}

/**
 * Actualiza los contadores en los botones de filtro (opcional)
 */
function updateFilterCounts() {
  const stats = getResourceStats();
  const filterButtons = document.querySelectorAll('.filter-btn');
  
  filterButtons.forEach(button => {
    const filter = button.getAttribute('data-filter');
    if (stats.hasOwnProperty(filter)) {
      const currentText = button.textContent;
      if (!currentText.includes('(')) {
        button.textContent = `${currentText} (${stats[filter]})`;
      }
    }
  });
}

/**
 * Función para debug - muestra información del sistema
 */
function debugBiblioteca() {
  console.log('=== DEBUG BIBLIOTECA ===');
  console.log('Filtro actual:', currentFilter);
  console.log('Término de búsqueda:', currentSearchTerm);
  console.log('Total recursos:', allResources.length);
  console.log('Estadísticas:', getResourceStats());
  console.log('Recursos:', allResources);
}

// Hacer disponible la función de debug globalmente
window.debugBiblioteca = debugBiblioteca;
