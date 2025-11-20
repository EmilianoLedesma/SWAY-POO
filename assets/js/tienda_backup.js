// =============================================
// TIENDA DINÁMICA - SWAY
// =============================================

console.log('Cargando tienda.js...');

// Detectar errores que puedan afectar el rendering
window.addEventListener('error', function(e) {
    console.error('Error detectado:', e.error);
    console.error('En:', e.filename, 'línea:', e.lineno);
});

// =============================================
// DROPDOWN DE USUARIO
// =============================================

class UserDropdown {
    constructor() {
        this.btnUser = document.getElementById('btn-user');
        this.userDropdown = document.getElementById('user-dropdown');
        this.userMenu = document.getElementById('user-menu');
        this.userName = document.getElementById('user-name');
        this.btnLogin = document.getElementById('btn-login');
        this.btnRegister = document.getElementById('btn-register');
        this.btnMyOrders = document.getElementById('btn-my-orders');
        this.btnLogout = document.getElementById('btn-logout');
        this.overlay = null;
        
        this.init();
    }
    
    init() {
        console.log('Inicializando UserDropdown...');
        
        // Crear overlay para cerrar dropdown
        this.createOverlay();
        
        // Verificar usuario logueado
        this.checkUserStatus();
        
        // Configurar eventos
        this.setupEvents();
        
        // Debug - verificar elementos
        this.debugElements();
        
        console.log('UserDropdown inicializado');
    }
    
    createOverlay() {
        this.overlay = document.createElement('div');
        this.overlay.className = 'dropdown-overlay';
        document.body.appendChild(this.overlay);
    }
    
    setupEvents() {
        // Toggle dropdown
        if (this.btnUser) {
            this.btnUser.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.toggleDropdown();
            });
        }
        
        // Cerrar dropdown al hacer clic fuera
        this.overlay.addEventListener('click', () => {
            this.hideDropdown();
        });
        
        // Cerrar dropdown con escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideDropdown();
            }
        });
        
        // Eventos de los botones del dropdown
        if (this.btnLogin) {
            this.btnLogin.addEventListener('click', (e) => {
                e.preventDefault();
                this.showLoginModal();
                this.hideDropdown();
            });
        }
        
        if (this.btnRegister) {
            this.btnRegister.addEventListener('click', (e) => {
                e.preventDefault();
                this.showRegisterModal();
                this.hideDropdown();
            });
        }
        
        if (this.btnMyOrders) {
            this.btnMyOrders.addEventListener('click', (e) => {
                e.preventDefault();
                window.location.href = '/mis-pedidos';
                this.hideDropdown();
            });
        }
        
        if (this.btnLogout) {
            this.btnLogout.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
                this.hideDropdown();
            });
        }
    }
    
    toggleDropdown() {
        console.log('Toggling dropdown...');
        if (this.userDropdown.classList.contains('show')) {
            this.hideDropdown();
        } else {
            this.showDropdown();
        }
    }
    
    showDropdown() {
        console.log('Mostrando dropdown...');
        console.log('Elemento dropdown:', this.userDropdown);
        console.log('Clases actuales:', this.userDropdown?.classList);
        
        if (this.userDropdown) {
            this.userDropdown.classList.add('show');
            this.userDropdown.setAttribute('data-visible', 'true');
            this.overlay.classList.add('show');
            
            // Forzar visibilidad con estilos inline
            setTimeout(() => {
                this.userDropdown.style.display = 'block';
                this.userDropdown.style.opacity = '1';
                this.userDropdown.style.visibility = 'visible';
                this.userDropdown.style.transform = 'translateY(0)';
                this.userDropdown.style.pointerEvents = 'auto';
                
                console.log('Dropdown forzado a visible');
                console.log('Estilos aplicados:', this.userDropdown.style);
            }, 10);
        } else {
            console.error('Elemento dropdown no encontrado');
        }
    }
    
    hideDropdown() {
        console.log('Ocultando dropdown...');
        if (this.userDropdown) {
            this.userDropdown.classList.remove('show');
            this.userDropdown.setAttribute('data-visible', 'false');
            this.overlay.classList.remove('show');
            
            // Limpiar estilos inline después de la transición
            setTimeout(() => {
                this.userDropdown.style.display = '';
                this.userDropdown.style.opacity = '';
                this.userDropdown.style.visibility = '';
                this.userDropdown.style.transform = '';
                this.userDropdown.style.pointerEvents = '';
            }, 300);
        }
    }
    
    async checkUserStatus() {
        try {
            const response = await fetch('/api/user/status', {
                method: 'GET',
                credentials: 'include'
            });
            
            if (response.ok) {
                const userData = await response.json();
                this.updateUserInterface(userData);
            } else {
                this.updateUserInterface(null);
            }
        } catch (error) {
            console.error('Error verificando estado del usuario:', error);
            this.updateUserInterface(null);
        }
    }
    
    updateUserInterface(userData) {
        if (userData && userData.user) {
            // Usuario logueado
            this.userName.textContent = userData.user.nombre || 'Usuario';
            this.btnLogin.style.display = 'none';
            this.btnRegister.style.display = 'none';
            this.btnMyOrders.style.display = 'block';
            this.btnLogout.style.display = 'block';
        } else {
            // Usuario no logueado
            this.userName.textContent = 'Iniciar Sesión';
            this.btnLogin.style.display = 'block';
            this.btnRegister.style.display = 'block';
            this.btnMyOrders.style.display = 'none';
            this.btnLogout.style.display = 'none';
        }
    }
    
    showLoginModal() {
        console.log('Mostrando modal de login...');
        // Aquí se puede implementar el modal de login
        // Por ahora, redirigir a una página de login
        window.location.href = '/login';
    }
    
    showRegisterModal() {
        console.log('Mostrando modal de registro...');
        // Aquí se puede implementar el modal de registro
        // Por ahora, redirigir a una página de registro
        window.location.href = '/register';
    }
    
    async logout() {
        try {
            const response = await fetch('/api/user/logout', {
                method: 'POST',
                credentials: 'include'
            });
            
            if (response.ok) {
                // Limpiar localStorage
                localStorage.removeItem('carrito-sway');
                
                // Actualizar interfaz
                this.updateUserInterface(null);
                
                // Mostrar mensaje de éxito
                this.showMessage('Sesión cerrada exitosamente', 'success');
                
                // Opcional: recargar página
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            } else {
                this.showMessage('Error al cerrar sesión', 'error');
            }
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
            this.showMessage('Error al cerrar sesión', 'error');
        }
    }
    
    showMessage(message, type = 'info') {
        // Crear elemento de mensaje
        const messageDiv = document.createElement('div');
        messageDiv.className = `alert alert-${type === 'error' ? 'danger' : 'success'} alert-dismissible fade show`;
        messageDiv.style.position = 'fixed';
        messageDiv.style.top = '20px';
        messageDiv.style.right = '20px';
        messageDiv.style.zIndex = '10002';
        messageDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(messageDiv);
        
        // Remover después de 3 segundos
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.parentNode.removeChild(messageDiv);
            }
        }, 3000);
    }
    
    // Método de debug para verificar elementos
    debugElements() {
        console.log('=== DEBUG DROPDOWN ELEMENTS ===');
        console.log('btnUser:', this.btnUser);
        console.log('userDropdown:', this.userDropdown);
        
        // Verificar que los elementos existen en el DOM
        const domElements = [
            'btn-user',
            'user-dropdown',
            'user-menu',
            'user-name'
        ];
        
        console.log('=== VERIFICACIÓN EN DOM ===');
        domElements.forEach(id => {
            const element = document.getElementById(id);
            console.log(`${id}:`, element ? 'ENCONTRADO' : 'NO ENCONTRADO');
        });
        
        // Hacer el dropdown visible para debug
        if (this.userDropdown) {
            console.log('=== FORZANDO VISIBILIDAD PARA DEBUG ===');
            setTimeout(() => {
                this.userDropdown.style.background = '#ff0000';
                this.userDropdown.style.opacity = '1';
                this.userDropdown.style.visibility = 'visible';
                this.userDropdown.style.transform = 'translateY(0)';
                this.userDropdown.style.display = 'block';
                this.userDropdown.style.zIndex = '99999';
                
                setTimeout(() => {
                    this.userDropdown.style.background = '';
                }, 3000);
            }, 1000);
        }
    }

    async checkUserStatus() {
        try {
            const response = await fetch('/api/user/status', {
                method: 'GET',
                credentials: 'include'
            });
            
            if (response.ok) {
                const userData = await response.json();
                this.updateUserInterface(userData);
            } else {
                this.updateUserInterface(null);
            }
        } catch (error) {
            console.error('Error verificando estado del usuario:', error);
            this.updateUserInterface(null);
        }
    }
    
    updateUserInterface(userData) {
        if (userData && userData.user) {
            // Usuario logueado
            this.userName.textContent = userData.user.nombre || 'Usuario';
            this.btnLogin.style.display = 'none';
            this.btnRegister.style.display = 'none';
            this.btnMyOrders.style.display = 'block';
            this.btnLogout.style.display = 'block';
        } else {
            // Usuario no logueado
            this.userName.textContent = 'Iniciar Sesión';
            this.btnLogin.style.display = 'block';
            this.btnRegister.style.display = 'block';
            this.btnMyOrders.style.display = 'none';
            this.btnLogout.style.display = 'none';
        }
    }
    
    showLoginModal() {
        console.log('Mostrando modal de login...');
        // Aquí se puede implementar el modal de login
        // Por ahora, redirigir a una página de login
        window.location.href = '/login';
    }
    
    showRegisterModal() {
        console.log('Mostrando modal de registro...');
        // Aquí se puede implementar el modal de registro
        // Por ahora, redirigir a una página de registro
        window.location.href = '/register';
    }
    
    async logout() {
        try {
            const response = await fetch('/api/user/logout', {
                method: 'POST',
                credentials: 'include'
            });
            
            if (response.ok) {
                // Limpiar localStorage
                localStorage.removeItem('carrito-sway');
                
                // Actualizar interfaz
                this.updateUserInterface(null);
                
                // Mostrar mensaje de éxito
                this.showMessage('Sesión cerrada exitosamente', 'success');
                
                // Opcional: recargar página
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            } else {
                this.showMessage('Error al cerrar sesión', 'error');
            }
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
            this.showMessage('Error al cerrar sesión', 'error');
        }
    }
    
    showMessage(message, type = 'info') {
        // Crear elemento de mensaje
        const messageDiv = document.createElement('div');
        messageDiv.className = `alert alert-${type === 'error' ? 'danger' : 'success'} alert-dismissible fade show`;
        messageDiv.style.position = 'fixed';
        messageDiv.style.top = '20px';
        messageDiv.style.right = '20px';
        messageDiv.style.zIndex = '10002';
        messageDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(messageDiv);
        
        // Remover después de 3 segundos
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.parentNode.removeChild(messageDiv);
            }
        }, 3000);
    }
}

// =============================================
// TIENDA PRINCIPAL
// =============================================

class TiendaSway {
    constructor() {
        console.log('Inicializando TiendaSway...');
        this.productos = [];
        this.categorias = [];
        this.carritoItems = JSON.parse(localStorage.getItem('carrito-sway') || '[]');
        this.paginaActual = 1;
        this.limite = 6;
        this.totalPaginas = 1;
        this.filtroCategoria = null;
        this.terminoBusqueda = '';
        this.ordenamiento = 'fecha_agregado';
        
        this.init();
    }

    async init() {
        try {
            console.log('Iniciando TiendaSway...');
            
            // IMPORTANTE: Forzar ocultación del preloader INMEDIATAMENTE
            this.ocultarPreloader();
            
            // Backup: Ocultar preloader después de 500ms
            setTimeout(() => this.ocultarPreloader(), 500);
            
            // Backup adicional: Ocultar preloader después de 1 segundo
            setTimeout(() => this.ocultarPreloader(), 1000);
            
            // Verificar elementos del DOM
            this.verificarElementos();
            
            // Mostrar loading
            this.mostrarLoading();
            
            // Cargar datos iniciales
            await this.cargarCategorias();
            await this.cargarProductos();
            
            // Actualizar métricas de impacto
            await this.cargarImpactoSostenible();
            
            // Inicializar eventos después de cargar datos
            this.initEventListeners();
            
            // Actualizar contador de carrito
            this.actualizarContadorCarrito();
            
            // Ocultar loading
            this.ocultarLoading();
            
            console.log('TiendaSway inicializada correctamente');
            
        } catch (error) {
            console.error('Error inicializando tienda:', error);
            this.mostrarError('Error al cargar la tienda. Por favor, recarga la página.');
        }
    }

    ocultarPreloader() {
        console.log('Intentando ocultar preloader...');
        const preloader = document.querySelector('#preloader');
        if (preloader) {
            console.log('Preloader encontrado, ocultándolo...');
            preloader.style.display = 'none';
            preloader.style.visibility = 'hidden';
            preloader.style.opacity = '0';
            preloader.style.zIndex = '-9999';
            preloader.remove();
            console.log('Preloader removido exitosamente');
        } else {
            console.log('Preloader no encontrado');
        }
        
        // Forzar que body sea visible
        document.body.style.visibility = 'visible';
        document.body.style.opacity = '1';
    }

    verificarElementos() {
        const heroSection = document.querySelector('#hero');
        const heroH1 = document.querySelector('#hero h1');
        const heroP = document.querySelector('#hero p');
        const preloader = document.querySelector('#preloader');
        
        console.log('Hero section encontrada:', !!heroSection);
        console.log('Hero H1 encontrado:', !!heroH1);
        console.log('Hero P encontrado:', !!heroP);
        console.log('Preloader encontrado:', !!preloader);
        
        if (preloader) {
            const preloaderStyles = window.getComputedStyle(preloader);
            console.log('Preloader visible:', preloaderStyles.display !== 'none');
            console.log('Preloader z-index:', preloaderStyles.zIndex);
        }
        
        if (heroH1) {
            console.log('Texto H1:', heroH1.textContent);
            console.log('Estilos H1:', window.getComputedStyle(heroH1));
        }
        
        if (heroP) {
            console.log('Texto P:', heroP.textContent);
            console.log('Estilos P:', window.getComputedStyle(heroP));
        }
    }

    mostrarLoading() {
        const productosGrid = document.querySelector('.productos-grid');
        if (productosGrid) {
            productosGrid.innerHTML = `
                <div class="col-12 text-center py-5">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Cargando...</span>
                    </div>
                    <p class="mt-3">Cargando productos...</p>
                </div>
            `;
        }
    }

    ocultarLoading() {
        // El loading se oculta automáticamente cuando se renderizan los productos
    }

    mostrarError(mensaje) {
        const productosGrid = document.querySelector('.productos-grid');
        if (productosGrid) {
            productosGrid.innerHTML = `
                <div class="col-12 text-center py-5">
                    <div class="alert alert-danger" role="alert">
                        <i class="bi bi-exclamation-triangle-fill me-2"></i>
                        ${mensaje}
                    </div>
                    <button class="btn btn-primary" onclick="location.reload()">
                        <i class="bi bi-arrow-clockwise me-2"></i>Reintentar
                    </button>
                </div>
            `;
        }
    }

    async cargarCategorias() {
        try {
            const response = await fetch('/api/categorias');
            const data = await response.json();
            
            if (data.categorias) {
                this.categorias = data.categorias;
                this.renderizarFiltrosCategorias();
            }
        } catch (error) {
            console.error('Error cargando categorías:', error);
        }
    }

    renderizarFiltrosCategorias() {
        const filtrosBotones = document.querySelector('.filtros-botones');
        if (!filtrosBotones) return;

        let html = '<button class="filtro-btn active" data-filter="*">Todos</button>';
        
        this.categorias.forEach(categoria => {
            html += `
                <button class="filtro-btn" data-filter="${categoria.id}">
                    ${categoria.nombre}
                </button>
            `;
        });

        filtrosBotones.innerHTML = html;
    }

    async cargarProductos() {
        try {
            const params = new URLSearchParams({
                pagina: this.paginaActual,
                limite: this.limite,
                ordenar: this.ordenamiento
            });

            if (this.filtroCategoria) {
                params.append('categoria_id', this.filtroCategoria);
            }

            if (this.terminoBusqueda) {
                params.append('busqueda', this.terminoBusqueda);
            }

            const response = await fetch(`/api/productos?${params}`);
            const data = await response.json();

            if (data.productos) {
                this.productos = data.productos;
                this.totalPaginas = data.total_paginas;
                this.renderizarProductos();
                this.actualizarPaginacion();
            }
        } catch (error) {
            console.error('Error cargando productos:', error);
            this.mostrarError('Error al cargar los productos');
        }
    }

    renderizarProductos() {
        const productosGrid = document.querySelector('.productos-grid');
        if (!productosGrid) return;

        if (this.productos.length === 0) {
            productosGrid.innerHTML = `
                <div class="col-12 text-center py-5">
                    <div class="alert alert-info" role="alert">
                        <i class="bi bi-info-circle-fill me-2"></i>
                        No se encontraron productos que coincidan con tu búsqueda.
                    </div>
                </div>
            `;
            return;
        }

        let html = '';
        this.productos.forEach(producto => {
            html += this.crearTarjetaProducto(producto);
        });

        productosGrid.innerHTML = html;
    }

    crearTarjetaProducto(producto) {
        const estrellas = this.generarEstrellas(producto.calificacion_promedio);
        const badgeSostenible = producto.es_sostenible ? 
            '<span class="badge bg-success mb-2"><i class="bi bi-leaf"></i> Sostenible</span>' : '';
        
        return `
            <div class="col-lg-4 col-md-6 producto-item" data-categoria="${producto.categoria}">
                <div class="producto-card">
                    <img src="${producto.imagen_url || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjVGNUY1Ii8+CjxyZWN0IHg9IjE1MCIgeT0iMTAwIiB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgcng9IjEwIiBmaWxsPSIjREREREREIi8+Cjx0ZXh0IHg9IjIwMCIgeT0iMjEwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOTk5OTk5IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiPkltYWdlbiBubyBkaXNwb25pYmxlPC90ZXh0Pgo8L3N2Zz4K'}" 
                         alt="${producto.nombre}" 
                         onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjVGNUY1Ii8+CjxyZWN0IHg9IjE1MCIgeT0iMTAwIiB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgcng9IjEwIiBmaWxsPSIjREREREREIi8+Cjx0ZXh0IHg9IjIwMCIgeT0iMjEwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOTk5OTk5IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiPkltYWdlbiBubyBkaXNwb25pYmxlPC90ZXh0Pgo8L3N2Zz4K'; this.onerror=null;" />
                    <div class="producto-info">
                        ${badgeSostenible}
                        <h4>${producto.nombre}</h4>
                        <p class="categoria">${producto.categoria}</p>
                        <p class="descripcion">${producto.descripcion}</p>
                        <div class="precio-rating">
                            <span class="precio">$${producto.precio.toFixed(2)}</span>
                            <div class="rating">
                                ${estrellas}
                                <span>(${producto.total_reseñas})</span>
                            </div>
                        </div>
                        <div class="d-flex gap-2 mb-2">
                            <button class="btn btn-outline-primary btn-sm flex-fill" onclick="tienda.abrirVistaRapida(${producto.id})">
                                <i class="bi bi-eye"></i> Ver Detalles
                            </button>
                        </div>
                        <button class="btn-add-cart" onclick="tienda.agregarAlCarrito(${producto.id})"
                                ${producto.stock <= 0 ? 'disabled' : ''}>
                            <i class="bi bi-cart-plus"></i> 
                            ${producto.stock <= 0 ? 'Agotado' : 'Agregar al Carrito'}
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    async abrirVistaRapida(productoId) {
        try {
            const response = await fetch(`/api/producto/${productoId}`);
            const data = await response.json();

            if (data.producto) {
                this.mostrarModalProducto(data.producto);
            }
        } catch (error) {
            console.error('Error cargando producto:', error);
            alert('Error al cargar los detalles del producto');
        }
    }

    mostrarModalProducto(producto) {
        const modal = document.getElementById('modal-overlay');
        const modalBody = document.getElementById('modal-body');
        
        const estrellas = this.generarEstrellas(producto.calificacion_promedio);
        const badgeSostenible = producto.es_sostenible ? 
            '<span class="badge bg-success mb-2"><i class="bi bi-leaf"></i> Sostenible</span>' : '';

        modalBody.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <img src="${producto.imagen_url || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjVGNUY1Ii8+CjxyZWN0IHg9IjE1MCIgeT0iMTAwIiB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgcng9IjEwIiBmaWxsPSIjREREREREIi8+Cjx0ZXh0IHg9IjIwMCIgeT0iMjEwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOTk5OTk5IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiPkltYWdlbiBubyBkaXNwb25pYmxlPC90ZXh0Pgo8L3N2Zz4K'}" 
                         alt="${producto.nombre}" 
                         class="img-fluid rounded"
                         onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjVGNUY1Ii8+CjxyZWN0IHg9IjE1MCIgeT0iMTAwIiB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgcng9IjEwIiBmaWxsPSIjREREREREIi8+Cjx0ZXh0IHg9IjIwMCIgeT0iMjEwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOTk5OTk5IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiPkltYWdlbiBubyBkaXNwb25pYmxlPC90ZXh0Pgo8L3N2Zz4K'; this.onerror=null;" />
                </div>
                <div class="col-md-6">
                    ${badgeSostenible}
                    <h3>${producto.nombre}</h3>
                    <p class="text-muted">${producto.categoria}</p>
                    <div class="mb-3">
                        ${estrellas}
                        <span class="ms-2">(${producto.total_reseñas} reseñas)</span>
                    </div>
                    <p class="mb-3">${producto.descripcion}</p>
                    <div class="mb-3">
                        <h4 class="text-primary">$${producto.precio.toFixed(2)}</h4>
                        <small class="text-muted">Stock: ${producto.stock} unidades</small>
                    </div>
                    ${producto.dimensiones ? `<p><strong>Dimensiones:</strong> ${producto.dimensiones}</p>` : ''}
                    ${producto.peso_gramos ? `<p><strong>Peso:</strong> ${producto.peso_gramos}g</p>` : ''}
                    ${producto.material ? `<p><strong>Material:</strong> ${producto.material}</p>` : ''}
                    <button class="btn btn-primary btn-lg w-100" 
                            onclick="tienda.agregarAlCarrito(${producto.id}); tienda.cerrarVistaRapida();"
                            ${producto.stock <= 0 ? 'disabled' : ''}>
                        <i class="bi bi-cart-plus"></i> 
                        ${producto.stock <= 0 ? 'Agotado' : 'Agregar al Carrito'}
                    </button>
                </div>
            </div>
        `;

        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    cerrarVistaRapida() {
        const modal = document.getElementById('modal-overlay');
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    agregarAlCarrito(productoId) {
        const producto = this.productos.find(p => p.id === productoId);
        if (!producto) return;

        // Verificar stock
        if (producto.stock <= 0) {
            alert('Este producto está agotado');
            return;
        }

        // Buscar si ya existe en el carrito
        const existente = this.carritoItems.find(item => item.id === productoId);
        
        if (existente) {
            if (existente.cantidad < producto.stock) {
                existente.cantidad++;
            } else {
                alert('No hay suficiente stock disponible');
                return;
            }
        } else {
            this.carritoItems.push({
                id: productoId,
                nombre: producto.nombre,
                precio: producto.precio,
                imagen_url: producto.imagen_url,
                cantidad: 1,
                stock: producto.stock
            });
        }

        // Guardar en localStorage
        localStorage.setItem('carrito-sway', JSON.stringify(this.carritoItems));
        
        // Actualizar contador
        this.actualizarContadorCarrito();
        
        // Mostrar confirmación
        this.mostrarConfirmacionCarrito(producto.nombre);
    }

    mostrarConfirmacionCarrito(nombreProducto) {
        // Crear notificación toast
        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        toast.innerHTML = `
            <div class="toast-content">
                <i class="bi bi-check-circle-fill text-success"></i>
                <span>${nombreProducto} agregado al carrito</span>
            </div>
        `;
        
        document.body.appendChild(toast);
        
        // Mostrar y ocultar después de 3 segundos
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }

    mostrarNotificacion(mensaje, tipo = 'info') {
        // Crear notificación toast
        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        
        let icono = 'bi-info-circle-fill';
        if (tipo === 'error') icono = 'bi-exclamation-circle-fill';
        if (tipo === 'success') icono = 'bi-check-circle-fill';
        if (tipo === 'warning') icono = 'bi-exclamation-triangle-fill';
        
        toast.innerHTML = `
            <div class="toast-content ${tipo}">
                <i class="bi ${icono}"></i>
                <span>${mensaje}</span>
            </div>
        `;
        
        document.body.appendChild(toast);
        
        // Mostrar y ocultar después de 3 segundos
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (document.body.contains(toast)) {
                    document.body.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }

    async cargarCategorias() {
        try {
            const response = await fetch('/api/categorias');
            const data = await response.json();
            
            if (data.categorias) {
                this.categorias = data.categorias;
                this.renderizarFiltrosCategorias();
            }
        } catch (error) {
            console.error('Error cargando categorías:', error);
        }
    }

    renderizarFiltrosCategorias() {
        const filtrosBotones = document.querySelector('.filtros-botones');
        if (!filtrosBotones) return;

        let html = '<button class="filtro-btn active" data-filter="*">Todos</button>';
        
        this.categorias.forEach(categoria => {
            html += `
                <button class="filtro-btn" data-filter="${categoria.id}">
                    ${categoria.nombre}
                </button>
            `;
        });

        filtrosBotones.innerHTML = html;
    }

    async cargarProductos() {
        try {
            const params = new URLSearchParams({
                pagina: this.paginaActual,
                limite: this.limite,
                ordenar: this.ordenamiento
            });

            if (this.filtroCategoria) {
                params.append('categoria_id', this.filtroCategoria);
            }

            if (this.terminoBusqueda) {
                params.append('busqueda', this.terminoBusqueda);
            }

            const response = await fetch(`/api/productos?${params}`);
            const data = await response.json();

            if (data.productos) {
                this.productos = data.productos;
                this.totalPaginas = data.total_paginas;
                this.renderizarProductos();
                this.actualizarPaginacion();
            }
        } catch (error) {
            console.error('Error cargando productos:', error);
            this.mostrarError('Error al cargar los productos');
        }
    }

    renderizarProductos() {
        const productosGrid = document.querySelector('.productos-grid');
        if (!productosGrid) return;

        if (this.productos.length === 0) {
            productosGrid.innerHTML = `
                <div class="col-12 text-center py-5">
                    <div class="alert alert-info" role="alert">
                        <i class="bi bi-info-circle-fill me-2"></i>
                        No se encontraron productos que coincidan con tu búsqueda.
                    </div>
                </div>
            `;
            return;
        }

        let html = '';
        this.productos.forEach(producto => {
            html += this.crearTarjetaProducto(producto);
        });

        productosGrid.innerHTML = html;
    }

    crearTarjetaProducto(producto) {
        const estrellas = this.generarEstrellas(producto.calificacion_promedio);
        const badgeSostenible = producto.es_sostenible ? 
            '<span class="badge bg-success mb-2"><i class="bi bi-leaf"></i> Sostenible</span>' : '';
        
        return `
            <div class="col-lg-4 col-md-6 producto-item" data-categoria="${producto.categoria}">
                <div class="producto-card">
                    <img src="${producto.imagen_url || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjVGNUY1Ii8+CjxyZWN0IHg9IjE1MCIgeT0iMTAwIiB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgcng9IjEwIiBmaWxsPSIjREREREREIi8+Cjx0ZXh0IHg9IjIwMCIgeT0iMjEwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOTk5OTk5IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiPkltYWdlbiBubyBkaXNwb25pYmxlPC90ZXh0Pgo8L3N2Zz4K'}" 
                         alt="${producto.nombre}" 
                         onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjVGNUY1Ii8+CjxyZWN0IHg9IjE1MCIgeT0iMTAwIiB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgcng9IjEwIiBmaWxsPSIjREREREREIi8+Cjx0ZXh0IHg9IjIwMCIgeT0iMjEwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOTk5OTk5IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiPkltYWdlbiBubyBkaXNwb25pYmxlPC90ZXh0Pgo8L3N2Zz4K'; this.onerror=null;" />
                    <div class="producto-info">
                        ${badgeSostenible}
                        <h4>${producto.nombre}</h4>
                        <p class="categoria">${producto.categoria}</p>
                        <p class="descripcion">${producto.descripcion}</p>
                        <div class="precio-rating">
                            <span class="precio">$${producto.precio.toFixed(2)}</span>
                            <div class="rating">
                                ${estrellas}
                                <span>(${producto.total_reseñas})</span>
                            </div>
                        </div>
                        <div class="d-flex gap-2 mb-2">
                            <button class="btn btn-outline-primary btn-sm flex-fill" onclick="tienda.abrirVistaRapida(${producto.id})">
                                <i class="bi bi-eye"></i> Ver Detalles
                            </button>
                        </div>
                        <button class="btn-add-cart" onclick="tienda.agregarAlCarrito(${producto.id})"
                                ${producto.stock <= 0 ? 'disabled' : ''}>
                            <i class="bi bi-cart-plus"></i> 
                            ${producto.stock <= 0 ? 'Agotado' : 'Agregar al Carrito'}
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    async abrirVistaRapida(productoId) {
        try {
            const response = await fetch(`/api/producto/${productoId}`);
            const data = await response.json();

            if (data.producto) {
                this.mostrarModalProducto(data.producto);
            }
        } catch (error) {
            console.error('Error cargando producto:', error);
            alert('Error al cargar los detalles del producto');
        }
    }

    mostrarModalProducto(producto) {
        const modal = document.getElementById('modal-overlay');
        const modalBody = document.getElementById('modal-body');
        
        const estrellas = this.generarEstrellas(producto.calificacion_promedio);
        const badgeSostenible = producto.es_sostenible ? 
            '<span class="badge bg-success mb-2"><i class="bi bi-leaf"></i> Sostenible</span>' : '';

        modalBody.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <img src="${producto.imagen_url || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjVGNUY1Ii8+CjxyZWN0IHg9IjE1MCIgeT0iMTAwIiB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgcng9IjEwIiBmaWxsPSIjREREREREIi8+Cjx0ZXh0IHg9IjIwMCIgeT0iMjEwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOTk5OTk5IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiPkltYWdlbiBubyBkaXNwb25pYmxlPC90ZXh0Pgo8L3N2Zz4K'}" 
                         alt="${producto.nombre}" 
                         class="img-fluid rounded"
                         onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjVGNUY1Ii8+CjxyZWN0IHg9IjE1MCIgeT0iMTAwIiB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgcng9IjEwIiBmaWxsPSIjREREREREIi8+Cjx0ZXh0IHg9IjIwMCIgeT0iMjEwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOTk5OTk5IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiPkltYWdlbiBubyBkaXNwb25pYmxlPC90ZXh0Pgo8L3N2Zz4K'; this.onerror=null;" />
                </div>
                <div class="col-md-6">
                    ${badgeSostenible}
                    <h3>${producto.nombre}</h3>
                    <p class="text-muted">${producto.categoria}</p>
                    <div class="mb-3">
                        ${estrellas}
                        <span class="ms-2">(${producto.total_reseñas} reseñas)</span>
                    </div>
                    <p class="mb-3">${producto.descripcion}</p>
                    <div class="mb-3">
                        <h4 class="text-primary">$${producto.precio.toFixed(2)}</h4>
                        <small class="text-muted">Stock: ${producto.stock} unidades</small>
                    </div>
                    ${producto.dimensiones ? `<p><strong>Dimensiones:</strong> ${producto.dimensiones}</p>` : ''}
                    ${producto.peso_gramos ? `<p><strong>Peso:</strong> ${producto.peso_gramos}g</p>` : ''}
                    ${producto.material ? `<p><strong>Material:</strong> ${producto.material}</p>` : ''}
                    <button class="btn btn-primary btn-lg w-100" 
                            onclick="tienda.agregarAlCarrito(${producto.id}); tienda.cerrarVistaRapida();"
                            ${producto.stock <= 0 ? 'disabled' : ''}>
                        <i class="bi bi-cart-plus"></i> 
                        ${producto.stock <= 0 ? 'Agotado' : 'Agregar al Carrito'}
                    </button>
                </div>
            </div>
        `;

        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    cerrarVistaRapida() {
        const modal = document.getElementById('modal-overlay');
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    agregarAlCarrito(productoId) {
        const producto = this.productos.find(p => p.id === productoId);
        if (!producto) return;

        // Verificar stock
        if (producto.stock <= 0) {
            alert('Este producto está agotado');
            return;
        }

        // Buscar si ya existe en el carrito
        const existente = this.carritoItems.find(item => item.id === productoId);
        
        if (existente) {
            if (existente.cantidad < producto.stock) {
                existente.cantidad++;
            } else {
                alert('No hay suficiente stock disponible');
                return;
            }
        } else {
            this.carritoItems.push({
                id: productoId,
                nombre: producto.nombre,
                precio: producto.precio,
                imagen_url: producto.imagen_url,
                cantidad: 1,
                stock: producto.stock
            });
        }

        // Guardar en localStorage
        localStorage.setItem('carrito-sway', JSON.stringify(this.carritoItems));
        
        // Actualizar contador
        this.actualizarContadorCarrito();
        
        // Mostrar confirmación
        this.mostrarConfirmacionCarrito(producto.nombre);
    }

    mostrarConfirmacionCarrito(nombreProducto) {
        // Crear notificación toast
        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        toast.innerHTML = `
            <div class="toast-content">
                <i class="bi bi-check-circle-fill text-success"></i>
                <span>${nombreProducto} agregado al carrito</span>
            </div>
        `;
        
        document.body.appendChild(toast);
        
        // Mostrar y ocultar después de 3 segundos
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }

    mostrarNotificacion(mensaje, tipo = 'info') {
        // Crear notificación toast
        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        
        let icono = 'bi-info-circle-fill';
        if (tipo === 'error') icono = 'bi-exclamation-circle-fill';
        if (tipo === 'success') icono = 'bi-check-circle-fill';
        if (tipo === 'warning') icono = 'bi-exclamation-triangle-fill';
        
        toast.innerHTML = `
            <div class="toast-content ${tipo}">
                <i class="bi ${icono}"></i>
                <span>${mensaje}</span>
            </div>
        `;
        
        document.body.appendChild(toast);
        
        // Mostrar y ocultar después de 3 segundos
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (document.body.contains(toast)) {
                    document.body.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }

    async cargarCategorias() {
        try {
            const response = await fetch('/api/categorias');
            const data = await response.json();
            
            if (data.categorias) {
                this.categorias = data.categorias;
                this.renderizarFiltrosCategorias();
            }
        } catch (error) {
            console.error('Error cargando categorías:', error);
        }
    }

    renderizarFiltrosCategorias() {
        const filtrosBotones = document.querySelector('.filtros-botones');
        if (!filtrosBotones) return;

        let html = '<button class="filtro-btn active" data-filter="*">Todos</button>';
        
        this.categorias.forEach(categoria => {
            html += `
                <button class="filtro-btn" data-filter="${categoria.id}">
                    ${categoria.nombre}
                </button>
            `;
        });

        filtrosBotones.innerHTML = html;
    }

    async cargarProductos() {
        try {
            const params = new URLSearchParams({
                pagina: this.paginaActual,
                limite: this.limite,
                ordenar: this.ordenamiento
            });

            if (this.filtroCategoria) {
                params.append('categoria_id', this.filtroCategoria);
            }

            if (this.terminoBusqueda) {
                params.append('busqueda', this.terminoBusqueda);
            }

            const response = await fetch(`/api/productos?${params}`);
            const data = await response.json();

            if (data.productos) {
                this.productos = data.productos;
                this.totalPaginas = data.total_paginas;
                this.renderizarProductos();
                this.actualizarPaginacion();
            }
        } catch (error) {
            console.error('Error cargando productos:', error);
            this.mostrarError('Error al cargar los productos');
        }
    }

    renderizarProductos() {
        const productosGrid = document.querySelector('.productos-grid');
        if (!productosGrid) return;

        if (this.productos.length === 0) {
            productosGrid.innerHTML = `
                <div class="col-12 text-center py-5">
                    <div class="alert alert-info" role="alert">
                        <i class="bi bi-info-circle-fill me-2"></i>
                        No se encontraron productos que coincidan con tu búsqueda.
                    </div>
                </div>
            `;
            return;
        }

        let html = '';
        this.productos.forEach(producto => {
            html += this.crearTarjetaProducto(producto);
        });

        productosGrid.innerHTML = html;
    }

    crearTarjetaProducto(producto) {
        const estrellas = this.generarEstrellas(producto.calificacion_promedio);
        const badgeSostenible = producto.es_sostenible ? 
            '<span class="badge bg-success mb-2"><i class="bi bi-leaf"></i> Sostenible</span>' : '';
        
        return `
            <div class="col-lg-4 col-md-6 producto-item" data-categoria="${producto.categoria}">
                <div class="producto-card">
                    <img src="${producto.imagen_url || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjVGNUY1Ii8+CjxyZWN0IHg9IjE1MCIgeT0iMTAwIiB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgcng9IjEwIiBmaWxsPSIjREREREREIi8+Cjx0ZXh0IHg9IjIwMCIgeT0iMjEwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOTk5OTk5IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiPkltYWdlbiBubyBkaXNwb25pYmxlPC90ZXh0Pgo8L3N2Zz4K'}" 
                         alt="${producto.nombre}" 
                         onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjVGNUY1Ii8+CjxyZWN0IHg9IjE1MCIgeT0iMTAwIiB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgcng9IjEwIiBmaWxsPSIjREREREREIi8+Cjx0ZXh0IHg9IjIwMCIgeT0iMjEwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOTk5OTk5IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiPkltYWdlbiBubyBkaXNwb25pYmxlPC90ZXh0Pgo8L3N2Zz4K'; this.onerror=null;" />
                    <div class="producto-info">
                        ${badgeSostenible}
                        <h4>${producto.nombre}</h4>
                        <p class="categoria">${producto.categoria}</p>
                        <p class="descripcion">${producto.descripcion}</p>
                        <div class="precio-rating">
                            <span class="precio">$${producto.precio.toFixed(2)}</span>
                            <div class="rating">
                                ${estrellas}
                                <span>(${producto.total_reseñas})</span>
                            </div>
                        </div>
                        <div class="d-flex gap-2 mb-2">
                            <button class="btn btn-outline-primary btn-sm flex-fill" onclick="tienda.abrirVistaRapida(${producto.id})">
                                <i class="bi bi-eye"></i> Ver Detalles
                            </button>
                        </div>
                        <button class="btn-add-cart" onclick="tienda.agregarAlCarrito(${producto.id})"
                                ${producto.stock <= 0 ? 'disabled' : ''}>
                            <i class="bi bi-cart-plus"></i> 
                            ${producto.stock <= 0 ? 'Agotado' : 'Agregar al Carrito'}
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    async abrirVistaRapida(productoId) {
        try {
            const response = await fetch(`/api/producto/${productoId}`);
            const data = await response.json();

            if (data.producto) {
                this.mostrarModalProducto(data.producto);
            }
        } catch (error) {
            console.error('Error cargando producto:', error);
            alert('Error al cargar los detalles del producto');
        }
    }

    mostrarModalProducto(producto) {
        const modal = document.getElementById('modal-overlay');
        const modalBody = document.getElementById('modal-body');
        
        const estrellas = this.generarEstrellas(producto.calificacion_promedio);
        const badgeSostenible = producto.es_sostenible ? 
            '<span class="badge bg-success mb-2"><i class="bi bi-leaf"></i> Sostenible</span>' : '';

        modalBody.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <img src="${producto.imagen_url || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjVGNUY1Ii8+CjxyZWN0IHg9IjE1MCIgeT0iMTAwIiB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgcng9IjEwIiBmaWxsPSIjREREREREIi8+Cjx0ZXh0IHg9IjIwMCIgeT0iMjEwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOTk5OTk5IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiPkltYWdlbiBubyBkaXNwb25pYmxlPC90ZXh0Pgo8L3N2Zz4K'}" 
                         alt="${producto.nombre}" 
                         class="img-fluid rounded"
                         onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjVGNUY1Ii8+CjxyZWN0IHg9IjE1MCIgeT0iMTAwIiB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgcng9IjEwIiBmaWxsPSIjREREREREIi8+Cjx0ZXh0IHg9IjIwMCIgeT0iMjEwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOTk5OTk5IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiPkltYWdlbiBubyBkaXNwb25pYmxlPC90ZXh0Pgo8L3N2Zz4K'; this.onerror=null;" />
                </div>
                <div class="col-md-6">
                    ${badgeSostenible}
                    <h3>${producto.nombre}</h3>
                    <p class="text-muted">${producto.categoria}</p>
                    <div class="mb-3">
                        ${estrellas}
                        <span class="ms-2">(${producto.total_reseñas} reseñas)</span>
                    </div>
                    <p class="mb-3">${producto.descripcion}</p>
                    <div class="mb-3">
                        <h4 class="text-primary">$${producto.precio.toFixed(2)}</h4>
                        <small class="text-muted">Stock: ${producto.stock} unidades</small>
                    </div>
                    ${producto.dimensiones ? `<p><strong>Dimensiones:</strong> ${producto.dimensiones}</p>` : ''}
                    ${producto.peso_gramos ? `<p><strong>Peso:</strong> ${producto.peso_gramos}g</p>` : ''}
                    ${producto.material ? `<p><strong>Material:</strong> ${producto.material}</p>` : ''}
                    <button class="btn btn-primary btn-lg w-100" 
                            onclick="tienda.agregarAlCarrito(${producto.id}); tienda.cerrarVistaRapida();"
                            ${producto.stock <= 0 ? 'disabled' : ''}>
                        <i class="bi bi-cart-plus"></i> 
                        ${producto.stock <= 0 ? 'Agotado' : 'Agregar al Carrito'}
                    </button>
                </div>
            </div>
        `;

        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    cerrarVistaRapida() {
        const modal = document.getElementById('modal-overlay');
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    agregarAlCarrito(productoId) {
        const producto = this.productos.find(p => p.id === productoId);
        if (!producto) return;

        // Verificar stock
        if (producto.stock <= 0) {
            alert('Este producto está agotado');
            return;
        }

        // Buscar si ya existe en el carrito
        const existente = this.carritoItems.find(item => item.id === productoId);
        
        if (existente) {
            if (existente.cantidad < producto.stock) {
                existente.cantidad++;
            } else {
                alert('No hay suficiente stock disponible');
                return;
            }
        } else {
            this.carritoItems.push({
                id: productoId,
                nombre: producto.nombre,
                precio: producto.precio,
                imagen_url: producto.imagen_url,
                cantidad: 1,
                stock: producto.stock
            });
        }

        // Guardar en localStorage
        localStorage.setItem('carrito-sway', JSON.stringify(this.carritoItems));
        
        // Actualizar contador
        this.actualizarContadorCarrito();
        
        // Mostrar confirmación
        this.mostrarConfirmacionCarrito(producto.nombre);
    }

    mostrarConfirmacionCarrito(nombreProducto) {
        // Crear notificación toast
        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        toast.innerHTML = `
            <div class="toast-content">
                <i class="bi bi-check-circle-fill text-success"></i>
                <span>${nombreProducto} agregado al carrito</span>
            </div>
        `;
        
        document.body.appendChild(toast);
        
        // Mostrar y ocultar después de 3 segundos
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }

    mostrarNotificacion(mensaje, tipo = 'info') {
        // Crear notificación toast
        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        
        let icono = 'bi-info-circle-fill';
        if (tipo === 'error') icono = 'bi-exclamation-circle-fill';
        if (tipo === 'success') icono = 'bi-check-circle-fill';
        if (tipo === 'warning') icono = 'bi-exclamation-triangle-fill';
        
        toast.innerHTML = `
            <div class="toast-content ${tipo}">
                <i class="bi ${icono}"></i>
                <span>${mensaje}</span>
            </div>
        `;
        
        document.body.appendChild(toast);
        
        // Mostrar y ocultar después de 3 segundos
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (document.body.contains(toast)) {
                    document.body.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }

    // Método de debug para verificar elementos
    debugElements() {
        console.log('=== DEBUG DROPDOWN ELEMENTS ===');
        console.log('btnUser:', this.btnUser);
        console.log('userDropdown:', this.userDropdown);
        
        // Verificar que los elementos existen en el DOM
        const domElements = [
            'btn-user',
            'user-dropdown',
            'user-menu',
            'user-name'
        ];
        
        console.log('=== VERIFICACIÓN EN DOM ===');
        domElements.forEach(id => {
            const element = document.getElementById(id);
            console.log(`${id}:`, element ? 'ENCONTRADO' : 'NO ENCONTRADO');
        });
        
        // Hacer el dropdown visible para debug
        if (this.userDropdown) {
            console.log('=== FORZANDO VISIBILIDAD PARA DEBUG ===');
            setTimeout(() => {
                this.userDropdown.style.background = '#ff0000';
                this.userDropdown.style.opacity = '1';
                this.userDropdown.style.visibility = 'visible';
                this.userDropdown.style.transform = 'translateY(0)';
                this.userDropdown.style.display = 'block';
                this.userDropdown.style.zIndex = '99999';
                
                setTimeout(() => {
                    this.userDropdown.style.background = '';
                }, 3000);
            }, 1000);
        }
    }

    async checkUserStatus() {
        try {
            const response = await fetch('/api/user/status', {
                method: 'GET',
                credentials: 'include'
            });
            
            if (response.ok) {
                const userData = await response.json();
                this.updateUserInterface(userData);
            } else {
                this.updateUserInterface(null);
            }
        } catch (error) {
            console.error('Error verificando estado del usuario:', error);
            this.updateUserInterface(null);
        }
    }
    
    updateUserInterface(userData) {
        if (userData && userData.user) {
            // Usuario logueado
            this.userName.textContent = userData.user.nombre || 'Usuario';
            this.btnLogin.style.display = 'none';
            this.btnRegister.style.display = 'none';
            this.btnMyOrders.style.display = 'block';
            this.btnLogout.style.display = 'block';
        } else {
            // Usuario no logueado
            this.userName.textContent = 'Iniciar Sesión';
            this.btnLogin.style.display = 'block';
            this.btnRegister.style.display = 'block';
            this.btnMyOrders.style.display = 'none';
            this.btnLogout.style.display = 'none';
        }
    }
    
    showLoginModal() {
        console.log('Mostrando modal de login...');
        // Aquí se puede implementar el modal de login
        // Por ahora, redirigir a una página de login
        window.location.href = '/login';
    }
    
    showRegisterModal() {
        console.log('Mostrando modal de registro...');
        // Aquí se puede implementar el modal de registro
        // Por ahora, redirigir a una página de registro
        window.location.href = '/register';
    }
    
    async logout() {
        try {
            const response = await fetch('/api/user/logout', {
                method: 'POST',
                credentials: 'include'
            });
            
            if (response.ok) {
                // Limpiar localStorage
                localStorage.removeItem('carrito-sway');
                
                // Actualizar interfaz
                this.updateUserInterface(null);
                
                // Mostrar mensaje de éxito
                this.showMessage('Sesión cerrada exitosamente', 'success');
                
                // Opcional: recargar página
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            } else {
                this.showMessage('Error al cerrar sesión', 'error');
            }
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
            this.showMessage('Error al cerrar sesión', 'error');
        }
    }
    
    showMessage(message, type = 'info') {
        // Crear elemento de mensaje
        const messageDiv = document.createElement('div');
        messageDiv.className = `alert alert-${type === 'error' ? 'danger' : 'success'} alert-dismissible fade show`;
        messageDiv.style.position = 'fixed';
        messageDiv.style.top = '20px';
        messageDiv.style.right = '20px';
        messageDiv.style.zIndex = '10002';
        messageDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(messageDiv);
        
        // Remover después de 3 segundos
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.parentNode.removeChild(messageDiv);
            }
        }, 3000);
    }
}

// =============================================
// INICIALIZACIÓN
// =============================================

// Instanciar el sistema de carrito cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Loaded - Inicializando sistemas...');
    
    window.tienda = new TiendaSway();
    window.userDropdown = new UserDropdown();
    
    // Exponer métodos para debug
    window.debugDropdown = () => {
        if (window.userDropdown) {
            window.userDropdown.debugElements();
        }
    };
    
    window.toggleDropdown = () => {
        if (window.userDropdown) {
            window.userDropdown.toggleDropdown();
        }
    };
    
    console.log('Sistemas inicializados correctamente');
});

// Backup de inicialización
window.addEventListener('load', () => {
    console.log('Window Load - Verificando inicialización...');
    
    if (!window.tienda) {
        console.log('Inicializando TiendaSway como backup');
        window.tienda = new TiendaSway();
    }
    
    if (!window.userDropdown) {
        console.log('Inicializando UserDropdown como backup');
        window.userDropdown = new UserDropdown();
    }
});
