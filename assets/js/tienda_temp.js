// =============================================
// SWAY TIENDA - FUNCIONALIDAD COMPLETA
// =============================================

// Variables globales
let productos = [];
let categorias = [];
let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
let currentPage = 1;
let productsPerPage = 6; // Cambiar a 6 productos por página para hacer más visible la paginación
let filteredProducts = [];
let currentUser = null;

// =============================================
// INICIALIZACIÓN
// =============================================

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

document.addEventListener('DOMContentLoaded', function() {
    
    // Inicializar componentes
    initializeDropdown();
    initializeModals();
    initializeCart();
    checkUserStatus();
    
    // Cargar datos
    loadProducts();
    loadCategories();
    
    // Configurar eventos
    setupEventListeners();
    
    // Actualizar contador del carrito
    updateCartCounter();
    
});

// =============================================
// ESTADO DE USUARIO
// =============================================

async function checkUserStatus() {
    try {
        const response = await fetch('/api/user/status');
        const data = await response.json();
        
        if (data.success && data.user) {
            currentUser = data.user;
            updateUserDropdown(true);
        } else {
            currentUser = null;
            updateUserDropdown(false);
        }
    } catch (error) {
        console.error('Error al verificar estado del usuario:', error);
        updateUserDropdown(false);
    }
}

function updateUserDropdown(isLoggedIn) {
    const userDropdown = document.getElementById('user-dropdown');
    const userName = document.getElementById('user-name');
    
    if (!userDropdown) return;
    
    if (isLoggedIn) {
        if (userName) userName.textContent = currentUser.nombre;
        userDropdown.innerHTML = `
            <a href="#" onclick="showUserProfile()"><i class="bi bi-person"></i> Mi Perfil</a>
            <a href="#" onclick="showUserOrders()"><i class="bi bi-box"></i> Mis Pedidos</a>
            <a href="#" onclick="logout()"><i class="bi bi-box-arrow-right"></i> Cerrar Sesión</a>
        `;
    } else {
        if (userName) userName.textContent = 'Iniciar Sesión';
        userDropdown.innerHTML = `
            <a href="#" onclick="showLoginModal()"><i class="bi bi-box-arrow-in-right"></i> Iniciar Sesión</a>
            <a href="#" onclick="showRegisterModal()"><i class="bi bi-person-plus"></i> Registrarse</a>
        `;
    }
}

// =============================================
// CARGA DE PRODUCTOS Y CATEGORÍAS
// =============================================

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
            console.error('Error al cargar productos:', data.message);
            showError('Error al cargar productos');
        }
    } catch (error) {
        console.error('Error en loadProducts:', error);
        showError('Error de conexión al cargar productos');
    }
}

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
        // Si no hay categorías, usar filtros básicos
        categorias = [];
        renderFilters();
    }
}

// =============================================
// RENDERIZADO DE PRODUCTOS
// =============================================

function renderProducts() {
    const productGrid = document.querySelector('.productos-grid');
    if (!productGrid) {
        console.error('No se encontró el grid de productos');
        return;
    }
    
    
    // Calcular productos para la página actual
    const startIndex = (currentPage - 1) * productsPerPage;
    const endIndex = startIndex + productsPerPage;
    const productsToShow = filteredProducts.slice(startIndex, endIndex);
    
    
    if (filteredProducts.length === 0) {
        productGrid.innerHTML = '<div class="col-12 text-center"><p>No se encontraron productos.</p></div>';
        updateShowMoreButton();
        return;
    }
    
    // Limpiar todo el contenido (incluyendo spinner de carga) si es la primera página
    if (currentPage === 1) {
        productGrid.innerHTML = '';
    }
    
    // Agregar productos directamente
    productsToShow.forEach((product, index) => {
        const productHTML = `
            <div class="col-lg-4 col-md-6 producto-item">
                <div class="producto-card">
                    <div class="producto-image">
                        <img src="${product.image_url}" alt="${product.name}" class="img-fluid">
                        <div class="producto-overlay">
                            <button class="btn btn-outline-light btn-sm" onclick="showProductModal(${product.id})">
                                <i class="bi bi-eye"></i> Vista Rápida
                            </button>
                        </div>
                    </div>
                    <div class="producto-info">
                        <h5 class="producto-title">${product.name}</h5>
                        <p class="producto-description">${product.description}</p>
                        <div class="producto-price">$${product.price}</div>
                        <div class="producto-actions">
                            <button class="btn btn-primary" onclick="addToCart(${product.id})">
                                <i class="bi bi-cart-plus"></i> Agregar al Carrito
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        productGrid.insertAdjacentHTML('beforeend', productHTML);
    });
    
    
    updateShowMoreButton();
}

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
// =============================================

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
// =============================================

function showProductModal(productId) {
    const product = productos.find(p => p.id === productId);
    if (!product) return;
    
    const modal = document.getElementById('modal-overlay');
    const modalBody = document.getElementById('modal-body');
    
    modalBody.innerHTML = `
        <div class="row">
            <div class="col-md-6">
                <img src="${product.image_url}" alt="${product.name}" class="img-fluid rounded">
            </div>
            <div class="col-md-6">
                <h4>${product.name}</h4>
                <p class="text-muted">${product.description}</p>
                <h3 class="text-primary">$${product.price}</h3>
                <div class="mt-3">
                    <button class="btn btn-primary btn-lg" onclick="addToCart(${product.id}); closeQuickView()">
                        <i class="bi bi-cart-plus"></i> Agregar al Carrito
                    </button>
                </div>
            </div>
        </div>
    `;
    
    modal.style.display = 'block';
}

// =============================================
// CARRITO DE COMPRAS
// =============================================

function addToCart(productId) {
    const product = productos.find(p => p.id === productId);
    if (!product) return;
    
    const existingItem = carrito.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        carrito.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image_url: product.image_url,
            quantity: 1
        });
    }
    
    updateCartUI();
    showNotification('Producto agregado al carrito');
}

function removeFromCart(productId) {
    carrito = carrito.filter(item => item.id !== productId);
    updateCartUI();
    showNotification('Producto eliminado del carrito');
}

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

function clearCart() {
    carrito = [];
    updateCartUI();
    showNotification('Carrito vaciado');
}

function updateCartUI() {
    localStorage.setItem('carrito', JSON.stringify(carrito));
    updateCartCounter();
    updateCartModal();
}

function updateCartCounter() {
    const cartCount = carrito.reduce((total, item) => total + item.quantity, 0);
    const counters = document.querySelectorAll('.carrito-count');
    counters.forEach(counter => {
        counter.textContent = cartCount;
    });
}

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

function showCartModal() {
    updateCartModal();
    openModal('cart-modal');
}

function proceedToCheckout() {
    if (!currentUser) {
        showNotification('Debes iniciar sesión para realizar una compra');
        openModal('login-modal');
        return;
    }
    
    if (carrito.length === 0) {
        showNotification('Tu carrito está vacío');
        return;
    }
    
    loadCheckoutData();
    closeModal('cart-modal');
    openModal('checkout-modal');
}

async function loadCheckoutData() {
    // Cargar estados
    try {
        const response = await fetch('/api/direcciones/estados');
        const data = await response.json();
        
        const stateSelect = document.getElementById('shipping-state');
        stateSelect.innerHTML = '<option value="">Seleccionar Estado</option>';
        
        if (data.estados) {
            data.estados.forEach(estado => {
                stateSelect.innerHTML += `<option value="${estado.id}">${estado.nombre}</option>`;
            });
        }
    } catch (error) {
        console.error('Error loading states:', error);
    }
    
    // Actualizar resumen del checkout
    updateCheckoutSummary();
}

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
// =============================================

function showLoginModal() {
    const modal = document.getElementById('login-modal');
    if (modal) {
        modal.style.display = 'block';
    }
}

function showRegisterModal() {
    const modal = document.getElementById('register-modal');
    if (modal) {
        modal.style.display = 'block';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

function closeQuickView() {
    closeModal('modal-overlay');
}

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
// =============================================

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
            closeModal('login-modal');
            checkUserStatus();
            showNotification('Sesión iniciada correctamente');
        } else {
            showError(data.message || 'Error al iniciar sesión');
        }
    } catch (error) {
        console.error('Error en login:', error);
        showError('Error de conexión');
    }
}

async function register(event) {
    event.preventDefault();
    
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    
    try {
        const response = await fetch('/api/user/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, email, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            closeModal('register-modal');
            checkUserStatus();
            showNotification('Cuenta creada exitosamente');
        } else {
            showError(data.message || 'Error al registrar usuario');
        }
    } catch (error) {
        console.error('Error en register:', error);
        showError('Error de conexión');
    }
}

async function logout() {
    try {
        const response = await fetch('/api/user/logout', {
            method: 'POST'
        });
        
        if (response.ok) {
            currentUser = null;
            updateUserDropdown(false);
            showNotification('Sesión cerrada correctamente');
        }
    } catch (error) {
        console.error('Error en logout:', error);
    }
}

// =============================================
// DROPDOWN DE USUARIO
// =============================================

function initializeDropdown() {
    const userButton = document.getElementById('btn-user');
    const userDropdown = document.getElementById('user-dropdown');
    
    if (userButton && userDropdown) {
        userButton.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            userDropdown.classList.toggle('show');
        });
        
        // Cerrar dropdown al hacer clic fuera
        document.addEventListener('click', function(e) {
            if (!userButton.contains(e.target) && !userDropdown.contains(e.target)) {
                userDropdown.classList.remove('show');
            }
        });
    }
}

// =============================================
// MÉTRICAS DE SOSTENIBILIDAD
// =============================================

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

function updatePagination() {
    // Mantener compatibilidad con versiones anteriores
    updateShowMoreButton();
}

// =============================================
// FUNCIONES AUXILIARES
// =============================================

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

function showError(message) {
    console.error(message);
    // Aquí podrías mostrar un toast o modal con el error
    alert(message);
}

function showNotification(message) {
    // Aquí podrías mostrar un toast con la notificación
    alert(message);
}

// =============================================
// FUNCIONES ADICIONALES DE USUARIO
// =============================================

function showUserProfile() {
    // Placeholder para mostrar perfil de usuario
    showNotification('Funcionalidad de perfil en desarrollo');
}

function showUserOrders() {
    // Placeholder para mostrar pedidos del usuario
    showNotification('Funcionalidad de pedidos en desarrollo');
}

// =============================================
// CONFIGURACIÓN DE FORMULARIOS
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
// =============================================

function initializeCheckout() {
    const checkoutForm = document.getElementById('checkout-form');
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', handleCheckoutSubmit);
    }
}

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
// =============================================

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

function closeQuickView() {
    closeModal('modal-overlay');
}
