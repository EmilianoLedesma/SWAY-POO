// =============================================
// SWAY TIENDA - FUNCIONALIDAD COMPLETA
// Sistema de comercio electrónico para productos marinos sostenibles
// =============================================

/**
 * Variables globales del sistema de tienda
 * Almacenan el estado de productos, categorías, carrito de compras y configuración general
 * @type {Array} productos - Lista completa de productos disponibles
 * @type {Array} categorias - Categorías de productos para filtrado
 * @type {Array} carrito - Items del carrito de compras almacenados en localStorage
 * @type {number} currentPage - Página actual de la paginación
 * @type {number} productsPerPage - Cantidad de productos por página
 * @type {Array} filteredProducts - Productos filtrados según criterios de búsqueda
 * @type {Object|null} currentUser - Información del usuario autenticado
 */
let productos = [];
let categorias = [];
let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
let currentPage = 1;
let productsPerPage = 6; // Cantidad de productos por página (optimizado para visualización)
let filteredProducts = [];
let currentUser = null;

// =============================================
// INICIALIZACIÓN DEL SISTEMA
// =============================================

/**
 * Actualiza el botón "Mostrar más" según productos disponibles
 * Controla la visibilidad y texto del botón de paginación
 * @returns {void}
 */

function updateShowMoreButton() {
    const showMoreBtn = document.getElementById('load-more-btn');
    if (!showMoreBtn) return;
    
    const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
    const hasMoreProducts = currentPage < totalPages;
    
    if (hasMoreProducts) {
        showMoreBtn.style.display = 'block';
        showMoreBtn.textContent = `Cargar Más Productos (${filteredProducts.length - (currentPage * productsPerPage)} restantes)`;
    } else {
        showMoreBtn.style.display = 'none';
    }
}

/**
 * Inicialización del sistema de tienda
 * Se ejecuta cuando el DOM está completamente cargado
 * Configura todos los componentes necesarios para el funcionamiento de la tienda
 */
document.addEventListener('DOMContentLoaded', function() {
    // Verificar inmediatamente si hay logout manual
    const manualLogout = localStorage.getItem('manual-logout');
    if (manualLogout === 'true') {
        // Limpiar cualquier dato de sesión residual
        localStorage.removeItem('usuario-sway');
        localStorage.removeItem('carrito-sway');
        sessionStorage.removeItem('usuario-sway');
        sessionStorage.removeItem('carrito-sway');
        currentUser = null;
    }
    
    // Inicializar componentes
    initializeDropdown();
    initializeModals();
    initializeCart();
    checkUserStatus();
    
    // Cargar datos esenciales desde la API
    loadProducts();
    loadCategories();
    loadImpactoSostenible();
    
    // Configurar event listeners para interacciones del usuario
    setupEventListeners();
    
    // Actualizar contador visual del carrito de compras
    updateCartCounter();
});

// =============================================
// GESTIÓN DEL ESTADO DE USUARIO
// Manejo de sesiones, autenticación y estado de login del usuario
// =============================================

/**
 * Verifica el estado de autenticación del usuario
 * Gestiona logout manual, sesiones y sincronización con servidor
 * Maneja la persistencia de sesiones y limpieza de datos
 * @returns {Promise<void>} Estado de autenticación actualizado
 */
async function checkUserStatus() {
    try {
        // Verificar si existe un flag de logout manual activo
        const logoutFlag = localStorage.getItem('logout-flag');
        if (logoutFlag) {
            localStorage.removeItem('logout-flag');
            
            // Limpiar almacenamiento local por si acaso
            localStorage.removeItem('usuario-sway');
            localStorage.removeItem('carrito-sway');
            sessionStorage.removeItem('usuario-sway');
            sessionStorage.removeItem('carrito-sway');
            
            // Actualizar UI
            currentUser = null;
            updateUserDropdown(false);
            showNotification('Sesión cerrada exitosamente', 'success');
            return;
        }
        
        // Verificar si el usuario cerró sesión manualmente y evitar auto-login
        const manualLogout = localStorage.getItem('manual-logout');
        if (manualLogout === 'true') {
            // Verificar si ha pasado suficiente tiempo desde el logout manual
            const logoutTime = localStorage.getItem('manual-logout-time');
            if (logoutTime) {
                const timeSinceLogout = Date.now() - parseInt(logoutTime);
                // Si han pasado más de 30 minutos, permitir verificación del servidor nuevamente
                if (timeSinceLogout > 30 * 60 * 1000) {
                    localStorage.removeItem('manual-logout');
                    localStorage.removeItem('manual-logout-time');
                } else {
                    // No verificar el servidor, mantener estado de sesión cerrada
                    currentUser = null;
                    updateUserDropdown(false);
                    return;
                }
            } else {
                // Si no hay timestamp, remover el flag
                localStorage.removeItem('manual-logout');
            }
        }
        
        // Verificar si existe un parámetro de logout en la URL actual
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('logout') === 'true') {
            // Limpiar almacenamiento local por si acaso
            localStorage.removeItem('usuario-sway');
            localStorage.removeItem('carrito-sway');
            sessionStorage.removeItem('usuario-sway');
            sessionStorage.removeItem('carrito-sway');
            
            // Marcar logout manual con timestamp para control de tiempo
            localStorage.setItem('manual-logout', 'true');
            localStorage.setItem('manual-logout-time', Date.now().toString());
            
            // Limpiar la URL de parámetros de logout
            window.history.replaceState({}, document.title, window.location.pathname);
            
            // Actualizar UI
            currentUser = null;
            updateUserDropdown(false);
            showNotification('Sesión cerrada exitosamente', 'success');
            return;
        }
        
        // Verificar el estado actual del usuario en el servidor
        const response = await fetch('/api/user/status', {
            method: 'GET',
            credentials: 'same-origin', // Incluir cookies de sesión
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        });
        
        if (!response.ok) {
            // Si hay error 401, limpiar datos locales pero no marcar como logout manual
            if (response.status === 401) {
                currentUser = null;
                updateUserDropdown(false);
                return;
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Verificar nuevamente el flag de logout manual antes de establecer el usuario
        const manualLogoutCheck = localStorage.getItem('manual-logout');
        if (manualLogoutCheck === 'true') {
            currentUser = null;
            updateUserDropdown(false);
            return;
        }
        
        if (data.success && data.user) {
            currentUser = data.user;
            updateUserDropdown(true);
        } else {
            currentUser = null;
            updateUserDropdown(false);
        }
    } catch (error) {
        console.error('Error al verificar estado del usuario:', error);
        // No mostrar como error si es un problema de red, simplemente mantener estado offline
        currentUser = null;
        updateUserDropdown(false);
    }
}

/**
 * Actualiza la interfaz del menú desplegable de usuario
 * Controla la visibilidad de opciones según el estado de autenticación
 * @param {boolean} isLoggedIn - Estado de autenticación del usuario
 * @returns {void}
 */
function updateUserDropdown(isLoggedIn) {
    const userName = document.getElementById('user-name');
    const btnLogin = document.getElementById('btn-login');
    const btnRegister = document.getElementById('btn-register');
    const btnMyOrders = document.getElementById('btn-my-orders');
    const btnLogout = document.getElementById('btn-logout');
    
    if (isLoggedIn && currentUser) {
        // Usuario autenticado - mostrar nombre y opciones disponibles
        if (userName) userName.textContent = currentUser.nombre;
        
        // Ocultar opciones de login y registro para usuarios autenticados
        if (btnLogin) {
            btnLogin.style.display = 'none';
            btnLogin.hidden = true;
        }
        if (btnRegister) {
            btnRegister.style.display = 'none';
            btnRegister.hidden = true;
        }
        
        // Mostrar opciones de pedidos y cerrar sesión
        if (btnMyOrders) {
            btnMyOrders.style.display = 'block';
            btnMyOrders.hidden = false;
        }
        if (btnLogout) {
            btnLogout.style.display = 'block';
            btnLogout.hidden = false;
        }
    } else {
        // Usuario no autenticado - mostrar opciones de acceso
        if (userName) userName.textContent = 'Iniciar Sesión';
        
        // Mostrar opciones de acceso y registro
        if (btnLogin) {
            btnLogin.style.display = 'block';
            btnLogin.hidden = false;
        }
        if (btnRegister) {
            btnRegister.style.display = 'block';
            btnRegister.hidden = false;
        }
        
        // Ocultar opciones que requieren autenticación
        if (btnMyOrders) {
            btnMyOrders.style.display = 'none';
            btnMyOrders.hidden = true;
        }
        if (btnLogout) {
            btnLogout.style.display = 'none';
            btnLogout.hidden = true;
        }
    }
}

// =============================================
// CARGA DE PRODUCTOS Y CATEGORÍAS
// Obtención y procesamiento de datos desde la API del servidor
// =============================================

/**
 * Carga la lista de productos desde la API
 * Actualiza las variables globales y renderiza la interfaz de productos
 * Maneja errores de conexión y estados de carga
 * @returns {Promise<void>} Productos cargados y renderizados
 */
async function loadProducts() {
    try {
        const response = await fetch('/api/productos');
        const data = await response.json();
        
        if (data.success) {
            productos = data.products;
            filteredProducts = [...productos];
            renderProducts();
            updateSustainabilityMetrics();
        } else {
            showError('Error al cargar productos');
        }
    } catch (error) {
        showError('Error de conexión al cargar productos');
    }
}

/**
 * Carga las categorías de productos desde la API
 * Renderiza los filtros de categorías en la interfaz de usuario
 * Implementa filtros básicos como fallback en caso de error
 * @returns {Promise<void>} Categorías cargadas y filtros renderizados
 */
async function loadCategories() {
    try {
        const response = await fetch('/api/categorias');
        const data = await response.json();
        
        if (data.success) {
            categorias = data.categories;
            renderFilters();
        }
    } catch (error) {
        console.error('Error al cargar categorías:', error);
        // Si no hay categorías disponibles, usar filtros básicos como fallback
        categorias = [];
        renderFilters();
    }
}

// =============================================
// RENDERIZADO DE PRODUCTOS
// Generación dinámica de la interfaz de productos
// =============================================

/**
 * Renderiza los productos en la grilla de la interfaz
 * Genera HTML dinámico con información de productos, precios y stock disponible
 * Maneja la paginación y estados vacíos de productos
 * @returns {void} Productos renderizados en el DOM
 */
function renderProducts() {
    const productGrid = document.querySelector('.productos-grid');
    if (!productGrid) {
        console.error('No se encontró el grid de productos');
        return;
    }
    
    console.log('Grid encontrado:', productGrid);
    
    // Calcular productos a mostrar para la página actual
    const startIndex = (currentPage - 1) * productsPerPage;
    const endIndex = startIndex + productsPerPage;
    const productsToShow = filteredProducts.slice(startIndex, endIndex);
    
    console.log(`Mostrando productos ${startIndex} a ${endIndex} de ${filteredProducts.length} total`);
    console.log('Productos a mostrar:', productsToShow);
    
    if (filteredProducts.length === 0) {
        productGrid.innerHTML = '<div class="col-12 text-center"><p>No se encontraron productos.</p></div>';
        updateShowMoreButton();
        return;
    }
    
    // Limpiar contenido previo (incluyendo spinner de carga) si es la primera página
    if (currentPage === 1) {
        console.log('Limpiando grid para página 1');
        productGrid.innerHTML = '';
    }
    
    // Agregar productos con diseño responsivo y accesible
    productsToShow.forEach((product, index) => {
        const stock = product.stock || 0;
        const stockStatus = stock > 0 ? 'En Stock' : 'Agotado';
        const stockClass = stock > 0 ? 'in-stock' : 'out-of-stock';
        const sustainableIcon = (product.is_sustainable || product.es_sostenible) ? '<i class="bi bi-leaf sustainable-icon" title="Producto Sostenible"></i>' : '';
        const rating = product.average_rating || product.calificacion_promedio || product.rating_average || 0;
        const reviewsCount = product.total_reviews || product.total_reseñas || 0;
        
        // Formatear precio en moneda mexicana
        const price = product.price || product.precio;
        const formattedPrice = parseFloat(price).toLocaleString('es-MX', {
            style: 'currency',
            currency: 'MXN'
        });
        
        // Truncar descripción para mantener consistencia visual
        const description = product.description || product.descripcion || '';
        const truncatedDescription = description && description.length > 100 
            ? description.substring(0, 100) + '...' 
            : description;
            
        const productHTML = `
            <div class="col-lg-4 col-md-6 producto-item" data-aos="fade-up" data-aos-delay="${index * 100}">
                <div class="producto-card-new" onclick="showProductModal(${product.id})" style="cursor: pointer;">
                    <div class="producto-image-container">
                        <img src="${product.image_url || product.imagen_url || '/static/img/default-product.jpg'}" 
                             alt="${product.name || product.nombre}" 
                             class="producto-image">
                        ${sustainableIcon}
                        <div class="producto-overlay">
                            <button class="btn-overlay btn-quick-view" onclick="event.stopPropagation(); showProductModal(${product.id})" title="Vista Rápida">
                                <i class="bi bi-eye"></i>
                            </button>
                            <button class="btn-overlay btn-add-cart" onclick="event.stopPropagation(); addToCart(${product.id})" title="Agregar al Carrito" ${stock <= 0 ? 'disabled' : ''}>
                                <i class="bi bi-cart-plus"></i>
                            </button>
                        </div>
                        <div class="stock-badge ${stockClass}">
                            <span>${stockStatus}</span>
                        </div>
                    </div>
                    <div class="producto-content">
                        <div class="producto-category">${product.category || product.categoria_nombre || 'General'}</div>
                        <h5 class="producto-title" onclick="showProductModal(${product.id})">${product.name || product.nombre}</h5>
                        <p class="producto-description">${truncatedDescription}</p>
                        
                        ${reviewsCount > 0 ? `
                        <div class="producto-rating">
                            <span class="rating-number">${rating.toFixed(1)}</span>
                            <span class="rating-text">(${reviewsCount} ${reviewsCount === 1 ? 'reseña' : 'reseñas'})</span>
                        </div>
                        ` : ''}
                        
                        <div class="producto-details">
                            ${(product.material_nombre || product.material_name) ? `<span class="detail-item"><i class="bi bi-box"></i> ${product.material_nombre || product.material_name}</span>` : ''}
                            ${(product.peso_gramos || product.weight_grams) ? `<span class="detail-item"><i class="bi bi-speedometer2"></i> ${product.peso_gramos || product.weight_grams}g</span>` : ''}
                            ${(product.dimensiones || product.dimensions) ? `<span class="detail-item"><i class="bi bi-rulers"></i> ${product.dimensiones || product.dimensions}</span>` : ''}
                        </div>
                        
                        <div class="producto-footer">
                            <div class="producto-price-container">
                                <span class="producto-price">${formattedPrice}</span>
                                <span class="stock-count">${stock > 0 ? `Stock: ${stock}` : ''}</span>
                            </div>
                            <div class="producto-actions">
                                <button class="btn-primary-custom" onclick="event.stopPropagation(); addToCart(${product.id})" ${stock <= 0 ? 'disabled' : ''}>
                                    <i class="bi bi-cart-plus"></i>
                                    ${stock <= 0 ? 'Agotado' : 'Agregar'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        productGrid.insertAdjacentHTML('beforeend', productHTML);
        console.log(`Producto ${index + 1} agregado:`, product.name);
    });
    
    console.log(`Grid después de agregar productos:`, productGrid.children.length, 'elementos');
    
    updateShowMoreButton();
    console.log(`Renderizados ${productsToShow.length} productos en la página ${currentPage}`);
}

// =============================================
// IMPACTO SOSTENIBLE
// Métricas y visualización del impacto ambiental positivo
// =============================================

/**
 * Carga y muestra las métricas de impacto sostenible
 * Obtiene datos ambientales desde la API y los visualiza con animaciones
 * Implementa valores por defecto en caso de error de conexión
 * @returns {Promise<void>} Métricas de impacto cargadas
 */
async function loadImpactoSostenible() {
    try {
        console.log('Cargando datos de impacto sostenible...');
        const response = await fetch('/api/impacto-sostenible');
        const data = await response.json();
        
        if (data.success) {
            updateImpactoUI(data.impacto);
        } else {
            console.error('Error al cargar impacto sostenible:', data.error);
            // Usar valores por defecto
            updateImpactoUI({
                agua_limpiada: 15420,
                corales_plantados: 892,
                familias_beneficiadas: 127,
                plastico_reciclado: 3250
            });
        }
    } catch (error) {
        console.error('Error al cargar impacto sostenible:', error);
        // Usar valores por defecto
        updateImpactoUI({
            agua_limpiada: 15420,
            corales_plantados: 892,
            familias_beneficiadas: 127,
            plastico_reciclado: 3250
        });
    }
}

/**
 * Actualiza la interfaz con datos de impacto sostenible
 * @param {Object} impacto - Objeto con métricas ambientales
 * @param {number} impacto.agua_limpiada - Litros de agua limpiada
 * @param {number} impacto.corales_plantados - Número de corales plantados
 * @param {number} impacto.familias_beneficiadas - Familias beneficiadas
 * @param {number} impacto.plastico_reciclado - Kilogramos de plástico reciclado
 */
function updateImpactoUI(impacto) {
    // Formatear números con separadores de miles
    const formatNumber = (num) => {
        return num.toLocaleString('es-MX');
    };
    
    // Actualizar cada métrica con animación
    animateNumber('agua-limpiada', impacto.agua_limpiada, formatNumber);
    animateNumber('corales-plantados', impacto.corales_plantados, formatNumber);
    animateNumber('familias-beneficiadas', impacto.familias_beneficiadas, formatNumber);
    animateNumber('plastico-reciclado', impacto.plastico_reciclado, formatNumber);
}

/**
 * Anima numeralmente un contador hacia un valor objetivo
 * @param {string} elementId - ID del elemento HTML a animar
 * @param {number} targetValue - Valor numérico objetivo
 * @param {Function} formatter - Función para formatear el número
 */
function animateNumber(elementId, targetValue, formatter) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const startValue = 0;
    const duration = 2000; // 2 segundos
    const startTime = performance.now();
    
    function updateValue(currentTime) {
        const elapsedTime = currentTime - startTime;
        const progress = Math.min(elapsedTime / duration, 1);
        
        // Easing function (ease-out)
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        
        const currentValue = Math.floor(startValue + (targetValue - startValue) * easeProgress);
        element.textContent = formatter(currentValue);
        
        if (progress < 1) {
            requestAnimationFrame(updateValue);
        } else {
            element.textContent = formatter(targetValue);
        }
    }
    
    requestAnimationFrame(updateValue);
}

// =============================================
// UTILIDADES DE INTERFAZ DE USUARIO
// Funciones auxiliares para la experiencia de usuario
// =============================================

/**
 * Renderiza los botones de filtrado de categorías
 * Genera HTML dinámico para filtros basados en categorías disponibles
 */
function renderFilters() {
    const filterContainer = document.querySelector('.filtros-botones');
    if (!filterContainer) return;
    
    const filtersHTML = `
        <button class="filtro-btn active" onclick="filterByCategory('all')">
            Todos
        </button>
        ${categorias.map(cat => `
            <button class="filtro-btn" onclick="filterByCategory(${cat.id})">
                ${cat.name}
            </button>
        `).join('')}
    `;
    
    filterContainer.innerHTML = filtersHTML;
}

// =============================================
// FILTROS Y BÚSQUEDA
// Sistema de filtrado y búsqueda de productos
// =============================================

/**
 * Filtra productos por categoría seleccionada
 * @param {string|number} categoryId - ID de la categoría o 'all' para todas
 */
function filterByCategory(categoryId) {
    // Actualizar botones activos
    document.querySelectorAll('.filtro-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Filtrar productos
    if (categoryId === 'all') {
        filteredProducts = [...productos];
    } else {
        // Buscar el nombre de la categoría por ID
        const categoria = categorias.find(cat => cat.id === categoryId);
        if (categoria) {
            filteredProducts = productos.filter(product => product.category === categoria.name);
        }
    }
    
    currentPage = 1;
    renderProducts();
    updateShowMoreButton();
}

/**
 * Configura todos los event listeners de la tienda
 * Inicializa eventos de búsqueda, filtros y paginación
 */
function setupEventListeners() {
    // Búsqueda
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase();
            
            if (searchTerm === '') {
                filteredProducts = [...productos];
            } else {
                filteredProducts = productos.filter(product => 
                    product.name.toLowerCase().includes(searchTerm) ||
                    product.description.toLowerCase().includes(searchTerm)
                );
            }
            
            currentPage = 1;
            renderProducts();
            updateShowMoreButton();
        });
    }
    
    // Botón "Mostrar más"
    const showMoreBtn = document.getElementById('load-more-btn');
    if (showMoreBtn) {
        showMoreBtn.addEventListener('click', function() {
            currentPage++;
            renderProducts();
            updateShowMoreButton();
        });
    }
}

// =============================================
// MODAL DE PRODUCTO
// Visualización detallada de productos individuales
// =============================================

/**
 * Muestra el modal con detalles completos del producto
 * @param {number} productId - ID del producto a mostrar
 * @returns {Promise<void>} Modal cargado con información del producto
 */
async function showProductModal(productId) {
    const modal = document.getElementById('modal-overlay');
    const modalBody = document.getElementById('modal-body');
    
    // Mostrar loading
    modalBody.innerHTML = `
        <div class="text-center py-5">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Cargando...</span>
            </div>
            <p class="mt-3">Cargando detalles del producto...</p>
        </div>
    `;
    
    modal.classList.add('show');
    
    try {
        // Obtener detalles completos del producto desde el servidor
        const response = await fetch(`/api/producto/${productId}`);
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error || 'Error al cargar el producto');
        }
        
        const product = data.producto;
        
        // Formatear precio
        const formattedPrice = parseFloat(product.precio).toLocaleString('es-MX', {
            style: 'currency',
            currency: 'MXN'
        });
        
        const stockStatus = product.stock > 0 ? 'En Stock' : 'Agotado';
        const stockClass = product.stock > 0 ? 'in-stock' : 'out-of-stock';
        const sustainableIcon = product.es_sostenible ? '<i class="bi bi-leaf sustainable-icon-large" title="Producto Sostenible"></i>' : '';
        const rating = product.calificacion_promedio || 0;
        const reviewsCount = product.total_reseñas || 0;
        
        modalBody.innerHTML = `
            <div class="product-modal-content">
                <div class="row g-4">
                    <div class="col-lg-5">
                        <div class="product-image-container">
                            <img src="${product.imagen_url || '/static/img/default-product.jpg'}" 
                                 alt="${product.nombre}" 
                                 class="img-fluid product-modal-image">
                            ${sustainableIcon}
                        </div>
                    </div>
                    <div class="col-lg-7">
                        <div class="product-modal-info">
                            <!-- Header Section -->
                            <div class="product-header-modal">
                                <div class="d-flex justify-content-between align-items-start mb-2">
                                    <div class="product-category-modal">${product.categoria_nombre || 'General'}</div>
                                    ${reviewsCount > 0 ? `
                                    <div class="product-rating-modal">
                                        <span class="rating-number-modal">${rating.toFixed(1)}</span>
                                        <span class="rating-text">(${reviewsCount} ${reviewsCount === 1 ? 'reseña' : 'reseñas'})</span>
                                    </div>
                                    ` : ''}
                                </div>
                                <h2 class="product-modal-title mb-3">${product.nombre}</h2>
                                
                                <div class="product-price-modal mb-3">
                                    <span class="price">${formattedPrice}</span>
                                    <div class="stock-info ${stockClass}">
                                        <i class="bi bi-circle-fill"></i>
                                        <span>${stockStatus}</span>
                                        ${product.stock > 0 ? `<span class="stock-number">(${product.stock} disponibles)</span>` : ''}
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Main Content Row -->
                            <div class="row">
                                <div class="col-12 col-xl-6 mb-3">
                                    <div class="product-description-modal">
                                        <h6><i class="bi bi-file-text me-2"></i>Descripción</h6>
                                        <p class="small">${product.descripcion || 'Sin descripción disponible.'}</p>
                                    </div>
                                </div>
                                <div class="col-12 col-xl-6 mb-3">
                                    <div class="product-specs-modal">
                                        <h6><i class="bi bi-gear me-2"></i>Especificaciones</h6>
                                        <div class="specs-grid-compact">
                                            ${product.material_nombre ? `
                                                <div class="spec-item-compact">
                                                    <i class="bi bi-box"></i>
                                                    <span class="spec-label">Material:</span>
                                                    <span class="spec-value">${product.material_nombre}</span>
                                                </div>
                                            ` : ''}
                                            ${product.peso_gramos ? `
                                                <div class="spec-item-compact">
                                                    <i class="bi bi-speedometer2"></i>
                                                    <span class="spec-label">Peso:</span>
                                                    <span class="spec-value">${product.peso_gramos}g</span>
                                                </div>
                                            ` : ''}
                                            ${product.dimensiones ? `
                                                <div class="spec-item-compact">
                                                    <i class="bi bi-rulers"></i>
                                                    <span class="spec-label">Dimensiones:</span>
                                                    <span class="spec-value">${product.dimensiones}</span>
                                                </div>
                                            ` : ''}
                                            <div class="spec-item-compact">
                                                <i class="bi bi-calendar-plus"></i>
                                                <span class="spec-label">Agregado:</span>
                                                <span class="spec-value">${new Date(product.fecha_agregado).toLocaleDateString('es-MX')}</span>
                                            </div>
                                            ${product.es_sostenible ? `
                                                <div class="spec-item-compact sustainable">
                                                    <i class="bi bi-leaf"></i>
                                                    <span class="spec-label">Sostenible:</span>
                                                    <span class="spec-value">Producto ecológico</span>
                                                </div>
                                            ` : ''}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Actions Section -->
                            <div class="product-actions-modal mt-3 pt-3 border-top">
                                <div class="d-flex align-items-center gap-3">
                                    <div class="quantity-selector">
                                        <label for="quantity" class="form-label small mb-1">Cantidad:</label>
                                        <div class="quantity-controls">
                                            <button type="button" class="btn-quantity" onclick="changeQuantity(-1, ${product.stock})">-</button>
                                            <input type="number" id="modal-quantity" value="1" min="1" max="${product.stock || 1}" class="quantity-input">
                                            <button type="button" class="btn-quantity" onclick="changeQuantity(1, ${product.stock})">+</button>
                                        </div>
                                    </div>
                                    <button class="btn-add-to-cart-modal flex-grow-1" 
                                            onclick="addToCartFromModal(${product.id})" 
                                            ${product.stock <= 0 ? 'disabled' : ''}>
                                        <i class="bi bi-cart-plus"></i>
                                        ${product.stock <= 0 ? 'Producto Agotado' : 'Agregar al Carrito'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
    } catch (error) {
        console.error('Error al cargar producto:', error);
        modalBody.innerHTML = `
            <div class="text-center py-5">
                <i class="bi bi-exclamation-triangle text-warning" style="font-size: 3rem;"></i>
                <h4 class="mt-3">Error al cargar el producto</h4>
                <p class="text-muted">${error.message}</p>
                <button class="btn btn-primary" onclick="closeQuickView()">Cerrar</button>
            </div>
        `;
    }
}

/**
 * Cambia la cantidad seleccionada en el modal de producto
 * @param {number} change - Cambio en la cantidad (+1 o -1)
 * @param {number} maxStock - Stock máximo disponible
 */
function changeQuantity(change, maxStock) {
    const quantityInput = document.getElementById('modal-quantity');
    if (!quantityInput) return;
    
    let newValue = parseInt(quantityInput.value) + change;
    newValue = Math.max(1, Math.min(newValue, maxStock));
    quantityInput.value = newValue;
}

/**
 * Agrega producto al carrito desde el modal
 * @param {number} productId - ID del producto a agregar
 */
function addToCartFromModal(productId) {
    const quantityInput = document.getElementById('modal-quantity');
    const quantity = quantityInput ? parseInt(quantityInput.value) : 1;
    
    addToCart(productId, quantity);
    closeQuickView();
    
    // Mostrar notificación
    showNotification(`Producto agregado al carrito (${quantity} ${quantity === 1 ? 'unidad' : 'unidades'})`, 'success');
}

// =============================================
// CARRITO DE COMPRAS
// Sistema completo de gestión del carrito de compras
// ==============================================

/**
 * Agrega un producto al carrito de compras
 * @param {number} productId - ID del producto a agregar
 * @param {number} quantity - Cantidad a agregar (por defecto 1)
 */
function addToCart(productId, quantity = 1) {
    const product = productos.find(p => p.id === productId);
    if (!product) return;
    
    const existingItem = carrito.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        carrito.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image_url: product.image_url,
            quantity: quantity
        });
    }
    
    updateCartUI();
    showNotification('Producto agregado al carrito');
}

/**
 * Elimina un producto del carrito de compras
 * @param {number} productId - ID del producto a eliminar
 */
function removeFromCart(productId) {
    carrito = carrito.filter(item => item.id !== productId);
    updateCartUI();
    showNotification('Producto eliminado del carrito');
}

/**
 * Actualiza la cantidad de un producto en el carrito
 * @param {number} productId - ID del producto
 * @param {number} quantity - Nueva cantidad
 */
function updateCartQuantity(productId, quantity) {
    const item = carrito.find(item => item.id === productId);
    if (item) {
        if (quantity <= 0) {
            removeFromCart(productId);
        } else {
            item.quantity = quantity;
            updateCartUI();
        }
    }
}

/**
 * Vacía completamente el carrito de compras
 */
function clearCart() {
    carrito = [];
    updateCartUI();
    showNotification('Carrito vaciado');
}

/**
 * Actualiza toda la interfaz relacionada con el carrito
 * Sincroniza localStorage y actualiza contadores y modal
 */
function updateCartUI() {
    localStorage.setItem('carrito', JSON.stringify(carrito));
    updateCartCounter();
    updateCartModal();
}

/**
 * Actualiza el contador visual del carrito
 * Muestra el número total de productos en el carrito
 */
function updateCartCounter() {
    const cartCount = carrito.reduce((total, item) => total + item.quantity, 0);
    const counters = document.querySelectorAll('.carrito-count');
    counters.forEach(counter => {
        counter.textContent = cartCount;
    });
}

/**
 * Actualiza el contenido del modal del carrito
 * Regenera HTML con productos actuales y calcula totales
 */
function updateCartModal() {
    const cartContainer = document.getElementById('cart-items-container');
    const cartTotal = document.getElementById('cart-total');
    
    if (!cartContainer || !cartTotal) return;
    
    if (carrito.length === 0) {
        cartContainer.innerHTML = '<p class="text-center text-muted">Tu carrito está vacío</p>';
        cartTotal.textContent = '0.00';
        return;
    }
    
    let total = 0;
    cartContainer.innerHTML = carrito.map(item => {
        const subtotal = item.price * item.quantity;
        total += subtotal;
        
        return `
            <div class="cart-item d-flex align-items-center mb-3 p-3 border rounded">
                <img src="${item.image_url}" alt="${item.name}" class="cart-item-image me-3" style="width: 80px; height: 80px; object-fit: cover;">
                <div class="cart-item-details flex-grow-1">
                    <h6 class="mb-1">${item.name}</h6>
                    <p class="text-muted mb-1">$${item.price}</p>
                    <div class="quantity-controls d-flex align-items-center">
                        <button class="btn btn-sm btn-outline-secondary me-2" onclick="updateCartQuantity(${item.id}, ${item.quantity - 1})">
                            <i class="bi bi-dash"></i>
                        </button>
                        <span class="quantity mx-2">${item.quantity}</span>
                        <button class="btn btn-sm btn-outline-secondary ms-2" onclick="updateCartQuantity(${item.id}, ${item.quantity + 1})">
                            <i class="bi bi-plus"></i>
                        </button>
                    </div>
                </div>
                <div class="cart-item-actions ms-3">
                    <div class="cart-item-subtotal mb-2">
                        <strong>$${subtotal.toFixed(2)}</strong>
                    </div>
                    <button class="btn btn-sm btn-outline-danger" onclick="removeFromCart(${item.id})">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    cartTotal.textContent = total.toFixed(2);
}

/**
 * Muestra el modal del carrito de compras
 */
function showCartModal() {
    updateCartModal();
    openModal('cart-modal');
}

/**
 * Inicia el proceso de checkout para finalizar la compra
 * Verifica autenticación y redirige al modal de pago
 */
function proceedToCheckout() {
    console.log('proceedToCheckout() called'); // Debug
    
    if (!currentUser) {
        // Cerrar el modal del carrito antes de mostrar el login
        closeModal('cart-modal');
        // Guardar que el usuario estaba intentando hacer checkout
        sessionStorage.setItem('pendingCheckout', 'true');
        showNotification('Debes iniciar sesión para realizar una compra');
        openModal('login-modal');
        return;
    }
    
    if (carrito.length === 0) {
        showNotification('Tu carrito está vacío');
        return;
    }
    
    console.log('Proceeding to payment modal...'); // Debug
    
    // Ir directamente al modal de pago fusionado
    loadCheckoutData();
    
    // Calcular total y mostrar modal de pago
    const cartTotal = getTotalCart();
    console.log('Cart total:', cartTotal); // Debug
    updatePaymentAmounts(cartTotal);
    
    closeModal('cart-modal');
    console.log('Opening payment modal...'); // Debug
    openModal('payment-modal');
    
    // Inicializar datos de envío en el modal de pago
    setTimeout(() => {
        initializeShippingInPaymentModal();
    }, 100); // Pequeño delay para asegurar que el modal esté abierto
}

/**
 * Carga los datos necesarios para el proceso de checkout
 * Obtiene estados, municipios y configura dropdowns en cascada
 * @returns {Promise<void>} Datos de checkout cargados
 */
async function loadCheckoutData() {
    console.log('Loading checkout data for unified modal...');
    // Cargar estados
    try {
        const response = await fetch('/api/direcciones/estados');
        const data = await response.json();
        
        const stateSelect = document.getElementById('shipping-state');
        if (stateSelect) {
            stateSelect.innerHTML = '<option value="">Seleccionar Estado</option>';
            
            if (data.estados) {
                data.estados.forEach(estado => {
                    stateSelect.innerHTML += `<option value="${estado.id}">${estado.nombre}</option>`;
                });
            }
            
            // Add event listeners for cascading dropdowns
            stateSelect.addEventListener('change', loadMunicipios);
            console.log('States loaded and event listener added');
        } else {
            console.warn('shipping-state select not found');
        }
    } catch (error) {
        console.error('Error loading states:', error);
    }
}

/**
 * Actualiza el resumen de productos en el checkout
 * Calcula totales y muestra items seleccionados
 */
function updateCheckoutSummary() {
    const checkoutItems = document.getElementById('checkout-items');
    const checkoutTotal = document.getElementById('checkout-total');
    
    if (!checkoutItems || !checkoutTotal) return;
    
    let total = 0;
    checkoutItems.innerHTML = carrito.map(item => {
        const subtotal = item.price * item.quantity;
        total += subtotal;
        
        return `
            <div class="checkout-item d-flex justify-content-between">
                <span>${item.name} (x${item.quantity})</span>
                <span>$${subtotal.toFixed(2)}</span>
            </div>
        `;
    }).join('');
    
    checkoutTotal.textContent = total.toFixed(2);
}

/**
 * Carga municipios basados en el estado seleccionado
 * Actualiza dropdown de municipios dinámicamente
 * @returns {Promise<void>} Municipios cargados
 */
async function loadMunicipios() {
    const stateId = document.getElementById('shipping-state').value;
    const municipioSelect = document.getElementById('shipping-municipio');
    
    municipioSelect.innerHTML = '<option value="">Seleccionar Municipio</option>';
    document.getElementById('shipping-colonia').innerHTML = '<option value="">Seleccionar Colonia</option>';
    document.getElementById('shipping-calle').innerHTML = '<option value="">Seleccionar Calle</option>';
    
    if (!stateId) return;
    
    try {
        const response = await fetch(`/api/direcciones/municipios/${stateId}`);
        const data = await response.json();
        
        if (data.municipios) {
            data.municipios.forEach(municipio => {
                municipioSelect.innerHTML += `<option value="${municipio.id}">${municipio.nombre}</option>`;
            });
        }
    } catch (error) {
        console.error('Error loading municipios:', error);
    }
}

/**
 * Carga colonias basadas en el municipio seleccionado
 * @returns {Promise<void>} Colonias cargadas
 */
async function loadColonias() {
    const municipioId = document.getElementById('shipping-municipio').value;
    const coloniaSelect = document.getElementById('shipping-colonia');
    
    coloniaSelect.innerHTML = '<option value="">Seleccionar Colonia</option>';
    document.getElementById('shipping-calle').innerHTML = '<option value="">Seleccionar Calle</option>';
    
    if (!municipioId) return;
    
    try {
        const response = await fetch(`/api/direcciones/colonias/${municipioId}`);
        const data = await response.json();
        
        if (data.colonias) {
            data.colonias.forEach(colonia => {
                coloniaSelect.innerHTML += `<option value="${colonia.id}">${colonia.nombre}</option>`;
            });
        }
    } catch (error) {
        console.error('Error loading colonias:', error);
    }
}

/**
 * Carga calles basadas en la colonia seleccionada
 * @returns {Promise<void>} Calles cargadas
 */
async function loadCalles() {
    const coloniaId = document.getElementById('shipping-colonia').value;
    const calleSelect = document.getElementById('shipping-calle');
    
    calleSelect.innerHTML = '<option value="">Seleccionar Calle</option>';
    
    if (!coloniaId) return;
    
    try {
        const response = await fetch(`/api/direcciones/calles/${coloniaId}`);
        const data = await response.json();
        
        if (data.calles) {
            data.calles.forEach(calle => {
                calleSelect.innerHTML += `<option value="${calle.id}">${calle.nombre}</option>`;
            });
        }
    } catch (error) {
        console.error('Error loading calles:', error);
    }
}

function updateCartCounter() {
    const counter = document.querySelector('.carrito-count');
    if (counter) {
        const totalItems = carrito.reduce((sum, item) => sum + item.quantity, 0);
        counter.textContent = totalItems;
        
        // Mostrar/ocultar el carrito flotante
        const carritoFlotante = document.getElementById('carrito-flotante');
        if (carritoFlotante) {
            carritoFlotante.style.display = totalItems > 0 ? 'block' : 'none';
        }
    }
}

/**
 * Inicializa el sistema de carrito de compras
 * Configura eventos y actualiza interfaz inicial
 */
function initializeCart() {
    // Configurar evento click en carrito flotante
    const carritoFlotante = document.getElementById('carrito-flotante');
    if (carritoFlotante) {
        carritoFlotante.addEventListener('click', showCartModal);
        carritoFlotante.style.cursor = 'pointer';
    }
    
    // Inicializar checkout
    initializeCheckout();
    
    // Actualizar UI del carrito
    updateCartCounter();
    updateCartModal();
}

// =============================================
// MODALES DE AUTENTICACIÓN
// Sistema de login, registro y gestión de sesiones
// ==============================================

/**
 * Muestra el modal de inicio de sesión
 */
function showLoginModal() {
    const modal = document.getElementById('login-modal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

/**
 * Muestra el modal de registro de usuario
 */
function showRegisterModal() {
    const modal = document.getElementById('register-modal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

/**
 * Cierra el modal de vista rápida de producto
 */
function closeQuickView() {
    const modal = document.getElementById('modal-overlay');
    if (modal) {
        modal.classList.remove('show');
    }
}

/**
 * Inicializa el comportamiento de todos los modales
 * Configura eventos para cerrar modales al hacer clic fuera
 */
function initializeModals() {
    // Cerrar modales al hacer clic fuera
    window.onclick = function(event) {
        const modals = ['modal-overlay', 'login-modal', 'register-modal'];
        modals.forEach(modalId => {
            const modal = document.getElementById(modalId);
            if (event.target === modal) {
                closeModal(modalId);
            }
        });
    }
}

// =============================================
// AUTENTICACIÓN
// Funciones de login, registro y logout de usuarios
// =============================================

/**
 * Procesa el inicio de sesión del usuario
 * @param {Event} event - Evento del formulario de login
 * @returns {Promise<void>} Proceso de autenticación completado
 */
async function login(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const response = await fetch('/api/user/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Remover todos los flags de logout manual al iniciar sesión exitosamente
            localStorage.removeItem('manual-logout');
            localStorage.removeItem('manual-logout-time');
            localStorage.removeItem('logout-flag');
            
            console.log('Login exitoso, todos los flags de logout removidos');
            
            closeModal('login-modal');
            checkUserStatus();
            showNotification('Sesión iniciada correctamente');
            
            // Si el usuario estaba intentando hacer checkout, continuar con el proceso
            if (sessionStorage.getItem('pendingCheckout') === 'true') {
                sessionStorage.removeItem('pendingCheckout');
                setTimeout(() => {
                    proceedToCheckout();
                }, 1000); // Esperar un segundo para que se complete la actualización del estado
            }
        } else {
            showError(data.message || 'Error al iniciar sesión');
        }
    } catch (error) {
        console.error('Error en login:', error);
        showError('Error de conexión');
    }
}

/**
 * Procesa el registro de nuevo usuario
 * @param {Event} event - Evento del formulario de registro
 * @returns {Promise<void>} Proceso de registro completado
 */
async function register(event) {
    event.preventDefault();
    
    const nombre = document.getElementById('registerName').value;
    const apellidoPaterno = document.getElementById('registerApellidoPaterno').value;
    const apellidoMaterno = document.getElementById('registerApellidoMaterno').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const telefono = document.getElementById('registerTelefono').value;
    const fecha_nacimiento = document.getElementById('registerFechaNacimiento').value;
    const newsletter = document.getElementById('registerNewsletter').checked;
    
    // Validación básica
    if (!nombre || !apellidoPaterno || !email || !password) {
        showError('Nombre, apellido paterno, email y contraseña son requeridos');
        return;
    }
    
    try {
        const response = await fetch('/api/user/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                nombre, 
                apellidoPaterno,
                apellidoMaterno,
                email, 
                password, 
                telefono, 
                fecha_nacimiento, 
                newsletter 
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            currentUser = data.user;
            
            // Remover flag de logout manual al registrarse exitosamente
            localStorage.removeItem('manual-logout');
            localStorage.removeItem('logout-flag');
            
            console.log('Registro exitoso, flags removidos');
            
            closeModal('register-modal');
            updateUserDropdown(true);
            showNotification('Cuenta creada exitosamente');
            
            // Si el usuario estaba intentando hacer checkout, continuar con el proceso
            if (sessionStorage.getItem('pendingCheckout') === 'true') {
                sessionStorage.removeItem('pendingCheckout');
                setTimeout(() => {
                    proceedToCheckout();
                }, 1000); // Esperar un segundo para que se complete la actualización del estado
            }
        } else {
            showError(data.message || 'Error al registrar usuario');
        }
    } catch (error) {
        showError('Error de conexión');
    }
}

/**
 * Cierra la sesión del usuario actual
 * Limpia datos locales y notifica al servidor
 * @returns {Promise<void>} Proceso de logout completado
 */
async function logout() {
    try {
        // Hacer logout en el servidor
        const response = await fetch('/api/logout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        // Limpiar datos locales independientemente de la respuesta del servidor
        currentUser = null;
        localStorage.removeItem('usuario-sway');
        localStorage.removeItem('carrito-sway');
        sessionStorage.removeItem('usuario-sway');
        sessionStorage.removeItem('carrito-sway');
        
        // Marcar que el usuario cerró sesión manualmente con timestamp
        localStorage.setItem('manual-logout', 'true');
        localStorage.setItem('manual-logout-time', Date.now().toString());
        localStorage.setItem('logout-flag', Date.now().toString());
        
        // Disparar evento personalizado para notificar a otras páginas
        window.dispatchEvent(new CustomEvent('sway-logout', {
            detail: { timestamp: Date.now() }
        }));
        
        // Limpiar cookies si existen
        document.cookie.split(";").forEach(function(c) { 
            document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
        });
        
        // Actualizar interfaz inmediatamente
        updateUserDropdown(false);
        showNotification('Sesión cerrada correctamente', 'success');
        
        // NO recargar la página, solo actualizar la UI
        
    } catch (error) {
        // Incluso si hay error, limpiar datos locales
        currentUser = null;
        localStorage.removeItem('usuario-sway');
        localStorage.removeItem('carrito-sway');
        sessionStorage.removeItem('usuario-sway');
        sessionStorage.removeItem('carrito-sway');
        localStorage.setItem('manual-logout', 'true');
        localStorage.setItem('logout-flag', Date.now().toString());
        
        // Disparar evento personalizado para notificar a otras páginas
        window.dispatchEvent(new CustomEvent('sway-logout', {
            detail: { timestamp: Date.now() }
        }));
        
        updateUserDropdown(false);
        showNotification('Sesión cerrada correctamente', 'success');
    }
}

// =============================================
// DROPDOWN DE USUARIO
// Configuración y manejo del menú desplegable de usuario
// =============================================

/**
 * Inicializa el menú desplegable de usuario
 * Configura eventos de click y navegación
 */
function initializeDropdown() {
    const btnUser = document.getElementById('btn-user');
    const userDropdown = document.getElementById('user-dropdown');
    const btnLogin = document.getElementById('btn-login');
    const btnRegister = document.getElementById('btn-register');
    const btnMyOrders = document.getElementById('btn-my-orders');
    const btnLogout = document.getElementById('btn-logout');
    
    // Manejar click en el botón de usuario
    if (btnUser) {
        btnUser.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            userDropdown.style.display = userDropdown.style.display === 'block' ? 'none' : 'block';
        });
    }
    
    // Manejar click en iniciar sesión
    if (btnLogin) {
        btnLogin.addEventListener('click', (e) => {
            e.preventDefault();
            showLoginModal();
            userDropdown.style.display = 'none';
        });
    }
    
    // Manejar click en registrarse
    if (btnRegister) {
        btnRegister.addEventListener('click', (e) => {
            e.preventDefault();
            showRegisterModal();
            userDropdown.style.display = 'none';
        });
    }
    
    // Manejar click en mis pedidos
    if (btnMyOrders) {
        btnMyOrders.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = '/mis-pedidos';
            userDropdown.style.display = 'none';
        });
    }
    
    // Manejar click en cerrar sesión
    if (btnLogout) {
        btnLogout.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
            userDropdown.style.display = 'none';
        });
    }
    
    // Cerrar dropdown al hacer clic fuera
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.user-menu')) {
            userDropdown.style.display = 'none';
        }
    });
}

// =============================================
// MÉTRICAS DE SOSTENIBILIDAD
// Cálculos y actualización de indicadores ambientales
// =============================================

/**
 * Actualiza las métricas de sostenibilidad basadas en productos
 * Calcula CO2 ahorrado, plástico reducido y árboles plantados
 */
function updateSustainabilityMetrics() {
    // Calcular métricas basadas en productos
    const totalProducts = productos.length;
    const avgPrice = productos.reduce((sum, p) => sum + p.price, 0) / totalProducts;
    
    // Simular métricas de impacto
    const co2Saved = Math.round(totalProducts * 2.5);
    const plasticReduced = Math.round(totalProducts * 0.8);
    const treesPlanted = Math.round(totalProducts * 0.3);
    
    // Actualizar en el DOM
    const metricsElements = {
        'co2Metric': `${co2Saved} kg`,
        'plasticMetric': `${plasticReduced} kg`,
        'treesMetric': `${treesPlanted} árboles`
    };
    
    Object.entries(metricsElements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    });
}

// =============================================
// PAGINACIÓN
// Sistema de paginación para navegación de productos
// =============================================

function updateShowMoreButton() {
    const showMoreBtn = document.getElementById('load-more-btn');
    if (!showMoreBtn) return;
    
    const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
    const hasMoreProducts = currentPage < totalPages;
    
    if (hasMoreProducts) {
        showMoreBtn.style.display = 'block';
        showMoreBtn.textContent = `Mostrar más productos (${filteredProducts.length - (currentPage * productsPerPage)} restantes)`;
    } else {
        showMoreBtn.style.display = 'none';
    }
}

/**
 * Actualiza los controles de paginación
 * Mantiene compatibilidad con versiones anteriores
 */
function updatePagination() {
    // Mantener compatibilidad con versiones anteriores
    updateShowMoreButton();
}

// =============================================
// FUNCIONES AUXILIARES
// Utilidades generales y funciones de soporte
// =============================================

/**
 * Genera HTML para mostrar calificación con estrellas
 * @param {number} rating - Calificación numérica (0-5)
 * @returns {string} HTML con iconos de estrellas
 */
function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 !== 0;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    
    let stars = '';
    
    // Estrellas completas
    for (let i = 0; i < fullStars; i++) {
        stars += '<i class="bi bi-star-fill text-warning"></i>';
    }
    
    // Media estrella
    if (halfStar) {
        stars += '<i class="bi bi-star-half text-warning"></i>';
    }
    
    // Estrellas vacías
    for (let i = 0; i < emptyStars; i++) {
        stars += '<i class="bi bi-star text-warning"></i>';
    }
    
    return stars;
}

/**
 * Muestra un mensaje de error al usuario
 * @param {string} message - Mensaje de error a mostrar
 */
function showError(message) {
    console.error(message);
    // Aquí podrías mostrar un toast o modal con el error
    alert(message);
}

/**
 * Muestra una notificación temporal al usuario
 * @param {string} message - Mensaje de la notificación
 * @param {string} type - Tipo de notificación ('success', 'error', 'warning', 'info')
 */
function showNotification(message, type = 'success') {
    // Crear notificación temporal
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    
    // Determinar color según el tipo
    let backgroundColor = '#28a745'; // success por defecto
    if (type === 'error') backgroundColor = '#dc3545';
    if (type === 'warning') backgroundColor = '#ffc107';
    if (type === 'info') backgroundColor = '#17a2b8';
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${backgroundColor};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        z-index: 10000;
        animation: slideIn 0.3s ease;
        font-weight: 500;
        max-width: 350px;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 3000);
}

// =============================================
// FUNCIONES ADICIONALES DE USUARIO
// Funcionalidades extendidas del perfil de usuario
// =============================================

/**
 * Muestra el perfil del usuario (funcionalidad futura)
 */
function showUserProfile() {
    // Placeholder para mostrar perfil de usuario
    showNotification('Funcionalidad de perfil en desarrollo');
}

/**
 * Muestra los pedidos del usuario (funcionalidad futura)
 */
function showUserOrders() {
    // Placeholder para mostrar pedidos del usuario
    showNotification('Funcionalidad de pedidos en desarrollo');
}

// =============================================
// CONFIGURACIÓN DE FORMULARIOS
// Inicialización de eventos de formularios de autenticación
// =============================================

document.addEventListener('DOMContentLoaded', function() {
    // Configurar eventos de formularios
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', login);
    }
    
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', register);
    }
});

// =============================================
// PROCESO DE CHECKOUT
// Sistema completo de procesamiento de compras
// =============================================

/**
 * Inicializa el sistema de checkout
 * Configura eventos del formulario de compra
 */
function initializeCheckout() {
    const checkoutForm = document.getElementById('checkout-form');
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', handleCheckoutSubmit);
    }
}

/**
 * Maneja el envío del formulario de checkout
 * Procesa la compra y envía datos al servidor
 * @param {Event} e - Evento del formulario
 * @returns {Promise<void>} Compra procesada
 */
async function handleCheckoutSubmit(e) {
    e.preventDefault();
    
    if (!currentUser) {
        showNotification('Debes iniciar sesión para completar la compra');
        return;
    }
    
    const formData = {
        user_id: currentUser.id,
        productos: carrito,
        direccion: {
            id_calle: document.getElementById('shipping-calle').value,
            nombre_destinatario: document.getElementById('shipping-name').value,
            telefono_contacto: document.getElementById('shipping-phone').value
        },
        pago: {
            numero_tarjeta: document.getElementById('card-number').value.replace(/\s/g, ''),
            fecha_expiracion: document.getElementById('card-expiry').value,
            cvv: document.getElementById('card-cvv').value,
            nombre_tarjeta: document.getElementById('card-name').value,
            tipo_tarjeta: document.getElementById('card-type').value
        }
    };
    
    // Validar formulario
    if (!validateCheckoutForm(formData)) {
        return;
    }
    
    try {
        // Mostrar loading
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> Procesando...';
        submitBtn.disabled = true;
        
        const response = await fetch('/api/pedidos/crear', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Limpiar carrito
            clearCart();
            
            // Cerrar modal
            closeModal('checkout-modal');
            
            // Mostrar mensaje de éxito
            showNotification(`¡Pedido creado exitosamente! ID: ${result.pedido_id}`);
            
            // Opcional: redirigir a página de confirmación
            // window.location.href = `/pedido-confirmacion/${result.pedido_id}`;
            
        } else {
            showError(result.error || 'Error al procesar el pedido');
        }
        
    } catch (error) {
        console.error('Error in checkout:', error);
        showError('Error de conexión al procesar el pedido');
    } finally {
        // Restaurar botón
        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.innerHTML = '<i class="bi bi-credit-card"></i> Confirmar Compra';
        submitBtn.disabled = false;
    }
}

/**
 * Valida los datos del formulario de checkout
 * @param {Object} formData - Datos del formulario de compra
 * @returns {boolean} true si todos los datos son válidos
 */
function validateCheckoutForm(formData) {
    // Validar dirección
    if (!formData.direccion.id_calle || !formData.direccion.nombre_destinatario || !formData.direccion.telefono_contacto) {
        showError('Por favor completa toda la información de envío');
        return false;
    }
    
    // Validar pago
    if (!formData.pago.numero_tarjeta || !formData.pago.fecha_expiracion || !formData.pago.cvv || !formData.pago.nombre_tarjeta || !formData.pago.tipo_tarjeta) {
        showError('Por favor completa toda la información de pago');
        return false;
    }
    
    // Validar formato de tarjeta (básico)
    if (formData.pago.numero_tarjeta.length < 13 || formData.pago.numero_tarjeta.length > 19) {
        showError('Número de tarjeta inválido');
        return false;
    }
    
    // Validar CVV
    if (formData.pago.cvv.length < 3 || formData.pago.cvv.length > 4) {
        showError('CVV inválido');
        return false;
    }
    
    // Validar fecha de expiración
    const expiryRegex = /^(0[1-9]|1[0-2])\/\d{2}$/;
    if (!expiryRegex.test(formData.pago.fecha_expiracion)) {
        showError('Fecha de expiración inválida (formato: MM/YY)');
        return false;
    }
    
    return true;
}

// =============================================
// FUNCIONES DE MODALES
// Utilidades generales para manejo de modales
// =============================================

/**
 * Abre un modal específico
 * @param {string} modalId - ID del modal a abrir
 */
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// Verificar estado de usuario menos frecuentemente
setInterval(function() {
    const manualLogout = localStorage.getItem('manual-logout');
    if (manualLogout !== 'true') {
        checkUserStatus();
    }
}, 15000);

// Listener para detectar cambios en el focus de la ventana
window.addEventListener('focus', function() {
    const manualLogout = localStorage.getItem('manual-logout');
    if (manualLogout !== 'true') {
        checkUserStatus();
    }
});

// Listener para detectar cambios en la URL
window.addEventListener('popstate', function() {
    const manualLogout = localStorage.getItem('manual-logout');
    if (manualLogout !== 'true') {
        checkUserStatus();
    }
});

// Listener para detectar cambios en localStorage (logout desde otra página)
window.addEventListener('storage', function(e) {
    if (e.key === 'logout-flag') {
        checkUserStatus();
    }
    // Si se establece el flag de logout manual, actualizar UI inmediatamente
    if (e.key === 'manual-logout' && e.newValue === 'true') {
        currentUser = null;
        updateUserDropdown(false);
    }
});

// Listener para evento personalizado de logout
window.addEventListener('sway-logout', function(e) {
    currentUser = null;
    updateUserDropdown(false);
    showNotification('Sesión cerrada en otra pestaña', 'info');
});

// =============================================
// UTILIDADES DE SESIÓN
// =============================================

/**
 * Verifica si el usuario cerró sesión manualmente
 * @returns {boolean} true si hay logout manual activo
 */
function isManualLogoutActive() {
    return localStorage.getItem('manual-logout') === 'true';
}

/**
 * Limpia todos los datos de sesión
 */
function clearSessionData() {
    localStorage.removeItem('usuario-sway');
    localStorage.removeItem('carrito-sway');
    sessionStorage.removeItem('usuario-sway');
    sessionStorage.removeItem('carrito-sway');
}

/**
 * Establece el estado de logout manual
 */
function setManualLogout() {
    localStorage.setItem('manual-logout', 'true');
    localStorage.setItem('logout-flag', Date.now().toString());
}

/**
 * Limpia el estado de logout manual (para login exitoso)
 */
/**
 * Limpia el estado de logout manual (para login exitoso)
 */
function clearManualLogout() {
    localStorage.removeItem('manual-logout');
    localStorage.removeItem('logout-flag');
}

/**
 * Precarga los datos del usuario en el formulario de checkout
 */
/**
 * Precarga los datos del usuario en el formulario de checkout
 */
function preloadUserData() {
    if (!currentUser) {
        return;
    }

    try {
        // Prellenar campos de información personal
        const nombreField = document.getElementById('shipping-nombre');
        const apellidoPaternoField = document.getElementById('shipping-apellido-paterno');
        const apellidoMaternoField = document.getElementById('shipping-apellido-materno');
        const emailField = document.getElementById('shipping-email');
        const telefonoField = document.getElementById('shipping-phone');

        if (nombreField && currentUser.nombre) {
            nombreField.value = currentUser.nombre;
            nombreField.classList.add('user-preloaded');
        }

        if (apellidoPaternoField && currentUser.apellido_paterno) {
            apellidoPaternoField.value = currentUser.apellido_paterno;
            apellidoPaternoField.classList.add('user-preloaded');
        }

        if (apellidoMaternoField && currentUser.apellido_materno) {
            apellidoMaternoField.value = currentUser.apellido_materno || '';
            if (currentUser.apellido_materno) {
                apellidoMaternoField.classList.add('user-preloaded');
            }
        }

        if (emailField && currentUser.email) {
            emailField.value = currentUser.email;
            emailField.classList.add('user-preloaded');
            emailField.readOnly = true; // Email no debería cambiar
        }

        if (telefonoField && currentUser.telefono) {
            telefonoField.value = currentUser.telefono;
            telefonoField.classList.add('user-preloaded');
        }

        // Mostrar mensaje informativo
        showUserDataPreloadedMessage();

    } catch (error) {
        console.error('Error al precargar datos del usuario:', error);
    }
}

/**
 * Inicializa la información de envío en el modal de pago fusionado
 */
function initializeShippingInPaymentModal() {
    // Mostrar datos del usuario en el resumen
    // updateUserSummary(); // Comentado - elemento no existe en el HTML
    
    // Mostrar resumen del pedido
    updateOrderSummaryInPayment();
    
    // Mostrar mensaje informativo
    showUnifiedCheckoutMessage();
}

/**
 * Actualiza el resumen de datos del usuario
 */
function updateUserSummary() {
    const summaryContent = document.getElementById('user-summary-content');
    if (!summaryContent || !currentUser) {
        console.warn('No user summary element or no user data');
        return;
    }
    
    const nombreCompleto = `${currentUser.nombre} ${currentUser.apellido_paterno}${currentUser.apellido_materno ? ' ' + currentUser.apellido_materno : ''}`;
    
    summaryContent.innerHTML = `
        <div class="row">
            <div class="col-md-4">
                <strong>Nombre:</strong><br>
                <span class="text-muted">${nombreCompleto}</span>
            </div>
            <div class="col-md-4">
                <strong>Email:</strong><br>
                <span class="text-muted">${currentUser.email || 'No especificado'}</span>
            </div>
            <div class="col-md-4">
                <strong>Teléfono:</strong><br>
                <span class="text-muted">${currentUser.telefono || 'No especificado'}</span>
            </div>
        </div>
    `;
}

/**
 * Actualiza el resumen del pedido en el modal de pago
 */
function updateOrderSummaryInPayment() {
    const summaryContainer = document.getElementById('payment-order-summary');
    if (!summaryContainer) {
        console.warn('payment-order-summary element not found');
        return;
    }
    
    if (!carrito || carrito.length === 0) {
        summaryContainer.innerHTML = '<p class="text-muted">No hay productos en el carrito</p>';
        return;
    }
    
    let summaryHTML = '';
    let total = 0;
    
    carrito.forEach(item => {
        const precio = parseFloat(item.price) || 0;
        const cantidad = parseInt(item.quantity) || 0;
        const subtotal = precio * cantidad;
        total += subtotal;
        
        summaryHTML += `
            <div class="order-item d-flex justify-content-between align-items-center py-2">
                <div class="item-info">
                    <strong>${item.name || 'Producto sin nombre'}</strong>
                    <small class="text-muted d-block">Cantidad: ${cantidad}</small>
                </div>
                <div class="item-price">
                    <span class="fw-bold">$${subtotal.toFixed(2)}</span>
                </div>
            </div>
        `;
    });
    
    summaryHTML += `
        <hr>
        <div class="order-total d-flex justify-content-between align-items-center py-2">
            <strong>Total:</strong>
            <strong class="fs-5 text-success">$${total.toFixed(2)}</strong>
        </div>
    `;
    
    summaryContainer.innerHTML = summaryHTML;
    console.log('Order summary updated, total:', total);
}

/**
 * Muestra mensaje para el checkout unificado
 */
function showUnifiedCheckoutMessage() {
    let infoMessage = document.getElementById('unified-checkout-info');
    
    if (!infoMessage) {
        infoMessage = document.createElement('div');
        infoMessage.id = 'unified-checkout-info';
        infoMessage.className = 'alert alert-success d-flex align-items-center mb-3';
        infoMessage.innerHTML = `
            <i class="bi bi-check-circle me-2"></i>
            <div>
                <strong>Datos precargados:</strong> 
                Hemos completado tu información personal. Verifica tu dirección de envío y procede con el pago.
            </div>
        `;
        
        // Insertar al inicio del formulario de pago
        const shippingSection = document.querySelector('.shipping-section');
        if (shippingSection) {
            shippingSection.insertBefore(infoMessage, shippingSection.firstChild);
        }
    }
}

/**
 * Calcula el total del carrito
 */
function getTotalCart() {
    let total = 0;
    carrito.forEach(item => {
        const precio = parseFloat(item.price) || 0;
        const cantidad = parseInt(item.quantity) || 0;
        total += precio * cantidad;
    });
    console.log('Cart total calculated:', total, 'from cart:', carrito);
    return total;
}

/**
 * Obtiene los items del carrito en el formato esperado
 */
function getCartItems() {
    return carrito.map(item => ({
        id: item.id,
        nombre: item.name,
        precio: item.price,
        cantidad: item.quantity,
        quantity: item.quantity // Backend expects 'quantity'
    }));
}

/**
 * Actualiza los montos mostrados en el modal de pago
 */
function updatePaymentAmounts(amount) {
    console.log('updatePaymentAmounts called with:', amount);
    
    const formattedAmount = amount.toLocaleString('es-MX', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    const displayElement = document.getElementById('payment-display-amount');
    const buttonElement = document.getElementById('payment-button-amount');
    const successElement = document.getElementById('success-amount');

    if (displayElement) {
        displayElement.textContent = `$${formattedAmount}`;
        console.log('Updated display amount');
    }
    if (buttonElement) {
        buttonElement.textContent = `$${formattedAmount}`;
        console.log('Updated button amount');
    }
    if (successElement) {
        successElement.textContent = `$${formattedAmount}`;
    }

    // Store amount for later use
    window.currentPaymentAmount = amount;
}

/**
 * Muestra un mensaje informativo sobre los datos precargados
 */
function showUserDataPreloadedMessage() {
    // Crear o actualizar el mensaje informativo
    let infoMessage = document.getElementById('user-preload-info');
    
    if (!infoMessage) {
        infoMessage = document.createElement('div');
        infoMessage.id = 'user-preload-info';
        infoMessage.className = 'alert alert-info d-flex align-items-center mb-3';
        infoMessage.innerHTML = `
            <i class="bi bi-info-circle me-2"></i>
            <div>
                <strong>Información prellenada:</strong> 
                Hemos completado automáticamente tus datos personales. 
                Solo necesitas agregar tu dirección de envío.
            </div>
        `;
        
        // Insertar al inicio del formulario de checkout
        const checkoutForm = document.getElementById('checkout-form');
        if (checkoutForm) {
            checkoutForm.insertBefore(infoMessage, checkoutForm.firstChild);
        }
    }
}

// =============================================
