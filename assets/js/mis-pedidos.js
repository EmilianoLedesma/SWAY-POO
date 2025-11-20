// =============================================
// MIS PEDIDOS - SWAY
// Sistema de gestión y visualización de pedidos de usuario
// =============================================

console.log('Cargando mis-pedidos.js...');

/**
 * Clase principal para gestionar pedidos del usuario
 * Maneja autenticación, carga de datos y visualización de pedidos
 * Implementa patrón orientado a objetos para organización del código
 */
class MisPedidos {
    /**
     * Constructor de la clase MisPedidos
     * Inicializa propiedades y ejecuta configuración inicial automáticamente
     * @returns {void}
     */
    constructor() {
        this.usuario = null;
        this.pedidos = [];
        this.init();
    }

    /**
     * Inicializa el sistema de pedidos
     * Verifica autenticación, carga datos y configura interfaz de usuario
     * Maneja logout manual y redirección en caso de no autenticación
     * @returns {Promise<void>} Sistema inicializado completamente
     */
    async init() {
        try {
            // Verificar inmediatamente si existe un logout manual activo
            const manualLogout = localStorage.getItem('manual-logout');
            if (manualLogout === 'true') {
                // Limpiar cualquier dato de sesión residual del almacenamiento
                localStorage.removeItem('usuario-sway');
                localStorage.removeItem('carrito-sway');
                sessionStorage.removeItem('usuario-sway');
                sessionStorage.removeItem('carrito-sway');
                this.usuario = null;
            }
            
            // Verificar si el usuario está logueado mediante el servidor
            await this.verificarUsuario();
            
            if (!this.usuario) {
                // Mostrar mensaje de error y ocultar secciones principales de pedidos
                this.mostrarSeccionError();
                this.mostrarError('Debes iniciar sesión para ver tus pedidos');
                setTimeout(() => {
                    window.location.href = '/tienda';
                }, 3000);
                return;
            }

            // Inicializar event listeners de la interfaz
            this.initEventListeners();
            
            // Cargar y mostrar información del usuario autenticado
            this.cargarInfoUsuario();
            
            // Cargar lista de pedidos del usuario desde el servidor
            await this.cargarPedidos();
            
        } catch (error) {
            console.error('Error inicializando página de pedidos:', error);
            this.mostrarError('Error al cargar la página. Por favor, recarga la página.');
        }
    }

    /**
     * Verifica el estado de autenticación del usuario
     * Consulta el servidor y maneja casos de logout manual
     * Actualiza el dropdown de usuario según el estado
     * @returns {Promise<void>} Estado de usuario verificado y actualizado
     */
    async verificarUsuario() {
        try {
            // Verificar si el usuario cerró sesión manualmente desde otra pestaña
            const manualLogout = localStorage.getItem('manual-logout');
            if (manualLogout === 'true') {
                // No verificar el servidor, mantener estado de sesión cerrada
                this.usuario = null;
                this.updateUserDropdown(false);
                return;
            }
            
            const response = await fetch('/api/user/status');
            const data = await response.json();
            
            // Verificar nuevamente el flag de logout manual antes de autenticar
            // (protección contra race conditions durante la consulta al servidor)
            const manualLogoutCheck = localStorage.getItem('manual-logout');
            if (manualLogoutCheck === 'true') {
                this.usuario = null;
                this.updateUserDropdown(false);
                return;
            }
            
            if (data.success && data.user) {
                this.usuario = data.user;
                this.updateUserDropdown(true);
            } else {
                this.usuario = null;
                this.updateUserDropdown(false);
            }
        } catch (error) {
            console.error('Error al verificar estado del usuario:', error);
            this.usuario = null;
        }
    }

    /**
     * Inicializa todos los event listeners del sistema
     * Configura eventos de menú, botones y dropdown de usuario
     * Establece navegación y manejo de clics fuera del dropdown
     * @returns {void}
     */
    initEventListeners() {
        // Event listeners para el menú desplegable de usuario
        const btnUser = document.getElementById('btn-user');
        const userDropdown = document.getElementById('user-dropdown');
        const btnLogin = document.getElementById('btn-login');
        const btnRegister = document.getElementById('btn-register');
        const btnLogout = document.getElementById('btn-logout');
        const btnMyOrders = document.getElementById('btn-my-orders');

        if (btnUser) {
            btnUser.addEventListener('click', () => {
                userDropdown.style.display = userDropdown.style.display === 'block' ? 'none' : 'block';
            });
        }

        if (btnLogin) {
            btnLogin.addEventListener('click', (e) => {
                e.preventDefault();
                window.location.href = '/tienda';
            });
        }

        if (btnRegister) {
            btnRegister.addEventListener('click', (e) => {
                e.preventDefault();
                window.location.href = '/tienda';
            });
        }

        if (btnLogout) {
            btnLogout.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        }

        if (btnMyOrders) {
            btnMyOrders.addEventListener('click', (e) => {
                e.preventDefault();
                // Ya estamos en la página de pedidos, no hay acción necesaria
            });
        }

        // Cerrar dropdown automáticamente si se hace clic fuera del menú
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.user-menu')) {
                userDropdown.style.display = 'none';
            }
        });
    }

    /**
     * Carga y muestra la información del usuario en la interfaz
     * Actualiza detalles personales y estado de autenticación
     * Gestiona visibilidad de botones según estado de login
     * @returns {void}
     */
    cargarInfoUsuario() {
        const userDetails = document.getElementById('user-details');
        const userName = document.getElementById('user-name');
        const btnLogin = document.getElementById('btn-login');
        const btnRegister = document.getElementById('btn-register');
        const btnMyOrders = document.getElementById('btn-my-orders');
        const btnLogout = document.getElementById('btn-logout');

        if (this.usuario) {
            // Mostrar información completa del usuario autenticado
            userDetails.innerHTML = `
                <div class="row">
                    <div class="col-md-6">
                        <p><strong>Nombre:</strong> ${this.usuario.nombre}</p>
                        <p><strong>Email:</strong> ${this.usuario.email}</p>
                    </div>
                    <div class="col-md-6">
                        <p><strong>Teléfono:</strong> ${this.usuario.telefono || 'No registrado'}</p>
                        <p><strong>Miembro desde:</strong> ${this.formatearFechaSolo(this.usuario.fecha_registro)}</p>
                    </div>
                </div>
            `;

            // Actualizar interfaz del dropdown de usuario
            userName.textContent = this.usuario.nombre;
            btnLogin.style.display = 'none';
            btnRegister.style.display = 'none';
            btnMyOrders.style.display = 'block';
            btnLogout.style.display = 'block';
        }
    }

    /**
     * Carga los pedidos del usuario desde la API
     * Maneja estados de carga, errores y casos sin pedidos
     * Utiliza endpoint seguro que valida autenticación
     * @returns {Promise<void>} Pedidos cargados y mostrados en interfaz
     */
    async cargarPedidos() {
        const ordersLoading = document.getElementById('orders-loading');
        const ordersContainer = document.getElementById('orders-container');
        const noOrders = document.getElementById('no-orders');

        try {
            // Usar endpoint seguro que obtiene pedidos del usuario autenticado
            const response = await fetch('/api/pedidos/mis-pedidos');
            const data = await response.json();

            ordersLoading.style.display = 'none';

            if (data.pedidos && data.pedidos.length > 0) {
                this.pedidos = data.pedidos;
                this.mostrarPedidos();
                ordersContainer.style.display = 'block';
            } else {
                noOrders.style.display = 'block';
            }

        } catch (error) {
            console.error('Error cargando pedidos:', error);
            ordersLoading.style.display = 'none';
            this.mostrarError('Error al cargar los pedidos');
        }
    }

    /**
     * Renderiza los pedidos en la interfaz
     * Genera HTML dinámico para cada pedido con sus detalles
     * Incluye fecha, estatus, total y botones de acción
     * @returns {void}
     */
    mostrarPedidos() {
        const ordersContainer = document.getElementById('orders-container');
        
        let pedidosHTML = '';
        
        this.pedidos.forEach(pedido => {
            const fecha = this.formatearFecha(pedido.fecha_pedido);
            const estatusClass = this.getEstatusClass(pedido.estatus);
            
            pedidosHTML += `
                <div class="order-card mb-3">
                    <div class="order-header d-flex justify-content-between align-items-center">
                        <div>
                            <h5>Pedido #${pedido.id}</h5>
                            <p class="mb-0 text-muted">${fecha}</p>
                        </div>
                        <div class="text-end">
                            <span class="badge ${estatusClass}">${pedido.estatus}</span>
                            <div class="order-total">
                                <strong>$${pedido.total.toFixed(2)}</strong>
                            </div>
                        </div>
                    </div>
                    <div class="order-actions mt-3">
                        <button class="btn btn-outline-primary btn-sm" onclick="misPedidos.verDetallesPedido(${pedido.id})">
                            <i class="bi bi-eye"></i> Ver Detalles
                        </button>
                        <button class="btn btn-outline-secondary btn-sm" onclick="misPedidos.reordenar(${pedido.id})">
                            <i class="bi bi-arrow-repeat"></i> Reordenar
                        </button>
                    </div>
                </div>
            `;
        });

        ordersContainer.innerHTML = pedidosHTML;
    }

    /**
     * Carga y muestra los detalles completos de un pedido
     * Obtiene información detallada desde el servidor
     * @param {number} pedidoId - ID del pedido a mostrar
     * @returns {Promise<void>} Detalles del pedido mostrados en modal
     */
    async verDetallesPedido(pedidoId) {
        try {
            const response = await fetch(`/api/pedidos/detalle/${pedidoId}`);
            const data = await response.json();

            if (data.pedido) {
                this.mostrarModalDetalles(data.pedido);
            } else {
                this.mostrarError('No se pudieron cargar los detalles del pedido');
            }
        } catch (error) {
            console.error('Error cargando detalles del pedido:', error);
            this.mostrarError('Error al cargar los detalles del pedido');
        }
    }

    /**
     * Muestra modal personalizado con detalles del pedido
     * Crea modal dinámico sin dependencias de Bootstrap
     * Incluye productos, dirección y acciones disponibles
     * @param {Object} pedido - Objeto con datos completos del pedido
     * @returns {void}
     */
    mostrarModalDetalles(pedido) {
        // Crear modal personalizado completamente sin Bootstrap
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'modal-overlay-custom';
        modalOverlay.id = 'modal-overlay-custom';
        
        modalOverlay.innerHTML = `
            <div class="modal-custom">
                <div class="modal-header-custom">
                    <h2>Detalles del Pedido #${pedido.id}</h2>
                    <button class="modal-close-btn" onclick="document.getElementById('modal-overlay-custom').remove()">
                        <i class="bi bi-x-lg"></i>
                    </button>
                </div>
                
                <div class="modal-body-custom">
                    <div class="info-cards-row">
                        <div class="info-card-custom">
                            <div class="info-label-custom">Fecha</div>
                            <div class="info-value-custom">${this.formatearFecha(pedido.fecha_pedido)}</div>
                        </div>
                        <div class="info-card-custom">
                            <div class="info-label-custom">Estatus</div>
                            <div class="info-value-custom">
                                <span class="status-badge ${this.getEstatusClass(pedido.estatus)}">${pedido.estatus}</span>
                            </div>
                        </div>
                        <div class="info-card-custom">
                            <div class="info-label-custom">Total</div>
                            <div class="info-value-custom">
                                <span class="total-amount-custom">$${pedido.total.toFixed(2)}</span>
                            </div>
                        </div>
                        <div class="info-card-custom">
                            <div class="info-label-custom">Teléfono</div>
                            <div class="info-value-custom">${pedido.telefono_contacto || 'No especificado'}</div>
                        </div>
                    </div>
                    
                    <div class="content-row">
                        <div class="products-section-custom">
                            <h3>Productos del Pedido</h3>
                            <div class="products-table-custom">
                                <div class="table-header-custom">
                                    <div class="th-custom">Producto</div>
                                    <div class="th-custom">Cantidad</div>
                                    <div class="th-custom">Precio Unit.</div>
                                    <div class="th-custom">Subtotal</div>
                                </div>
                                <div class="table-body-custom">
                                    ${pedido.detalles ? pedido.detalles.map(detalle => `
                                        <div class="table-row-custom">
                                            <div class="td-custom product-name">${detalle.producto_nombre}</div>
                                            <div class="td-custom">
                                                <span class="quantity-badge">${detalle.cantidad}</span>
                                            </div>
                                            <div class="td-custom">$${detalle.precio_unitario.toFixed(2)}</div>
                                            <div class="td-custom subtotal-cell">$${detalle.subtotal.toFixed(2)}</div>
                                        </div>
                                    `).join('') : '<div class="no-products">No se encontraron productos</div>'}
                                </div>
                            </div>
                        </div>
                        
                        <div class="sidebar-custom">
                            ${pedido.direccion ? `
                                <div class="address-section-custom">
                                    <h3>Dirección de Entrega</h3>
                                    <div class="address-card-custom">
                                        <i class="bi bi-geo-alt-fill"></i>
                                        <span>${pedido.direccion}</span>
                                    </div>
                                </div>
                            ` : ''}
                            
                            <div class="actions-section-custom">
                                <h3>Acciones</h3>
                                <div class="action-buttons-custom">
                                    <button class="btn-custom btn-primary-custom" onclick="misPedidos.reordenar(${pedido.id})">
                                        <i class="bi bi-arrow-repeat"></i>
                                        Reordenar
                                    </button>
                                    <button class="btn-custom btn-secondary-custom" onclick="window.print()">
                                        <i class="bi bi-printer"></i>
                                        Imprimir
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modalOverlay);
        
        // Cerrar modal al hacer clic en el overlay
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                modalOverlay.remove();
            }
        });
        
        // Cerrar modal con Escape
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && document.getElementById('modal-overlay-custom')) {
                document.getElementById('modal-overlay-custom').remove();
            }
        });
    }

    /**
     * Reordena un pedido agregando sus productos al carrito
     * @param {number} pedidoId - ID del pedido a reordenar
     * @returns {Promise<void>} Pedido reordenado
     */
    async reordenar(pedidoId) {
        try {
            const response = await fetch(`/api/pedidos/reordenar/${pedidoId}`, {
                method: 'POST'
            });
            const data = await response.json();

            if (data.success) {
                // Agregar productos al carrito
                this.agregarProductosAlCarrito(data.productos);
                
                this.mostrarNotificacion(`Se agregaron ${data.productos.length} productos al carrito`, 'success');
                // Redirigir a la tienda
                setTimeout(() => {
                    window.location.href = '/tienda';
                }, 1500);
            } else {
                this.mostrarError(data.error || 'Error al reordenar');
            }
        } catch (error) {
            console.error('Error al reordenar:', error);
            this.mostrarError('Error al reordenar el pedido');
        }
    }

    /**
     * Agrega productos al carrito local
     * @param {Array} productos - Array de productos a agregar
     */
    agregarProductosAlCarrito(productos) {
        // Obtener carrito actual o crear uno vacío
        let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
        
        // Agregar cada producto al carrito
        productos.forEach(producto => {
            const existingItem = carrito.find(item => item.id === producto.id);
            
            if (existingItem) {
                // Si el producto ya existe, sumar las cantidades
                existingItem.quantity += producto.cantidad;
            } else {
                // Si no existe, agregarlo al carrito
                carrito.push({
                    id: producto.id,
                    name: producto.nombre,
                    price: producto.precio,
                    image_url: producto.imagen_url,
                    quantity: producto.cantidad
                });
            }
        });
        
        // Guardar carrito actualizado en localStorage
        localStorage.setItem('carrito', JSON.stringify(carrito));
    }

    /**
     * Cierra la sesión del usuario
     * Limpia datos locales y notifica al servidor
     * @returns {Promise<void>} Sesión cerrada
     */
    async logout() {
        try {
            // Cerrar sesión en el servidor
            await fetch('/api/logout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            // Limpiar almacenamiento local
            localStorage.removeItem('usuario-sway');
            localStorage.removeItem('carrito-sway');
            sessionStorage.removeItem('usuario-sway');
            sessionStorage.removeItem('carrito-sway');
            
            // Marcar logout manual para evitar auto-login
            localStorage.setItem('manual-logout', 'true');
            localStorage.setItem('logout-flag', Date.now().toString());
            
            // Disparar evento personalizado para notificar a otras páginas
            window.dispatchEvent(new CustomEvent('sway-logout', {
                detail: { timestamp: Date.now() }
            }));
            
            this.mostrarNotificacion('Sesión cerrada exitosamente', 'success');
            
            // Redirigir a la tienda sin parámetros
            setTimeout(() => {
                window.location.href = '/tienda';
            }, 1000);
            
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
            // Aunque haya error, limpiar el almacenamiento local
            localStorage.removeItem('usuario-sway');
            localStorage.removeItem('carrito-sway');
            sessionStorage.removeItem('usuario-sway');
            sessionStorage.removeItem('carrito-sway');
            
            // Marcar logout manual
            localStorage.setItem('manual-logout', 'true');
            localStorage.setItem('logout-flag', Date.now().toString());
            
            // Disparar evento personalizado para notificar a otras páginas
            window.dispatchEvent(new CustomEvent('sway-logout', {
                detail: { timestamp: Date.now() }
            }));
            
            this.mostrarNotificacion('Sesión cerrada', 'info');
            setTimeout(() => {
                window.location.href = '/tienda';
            }, 1000);
        }
    }

    /**
     * Formatea una fecha sin hora
     * @param {string} fechaString - Fecha en formato string
     * @returns {string} Fecha formateada en español
     */
    formatearFechaSolo(fechaString) {
        if (!fechaString) return 'Fecha no disponible';
        const fecha = new Date(fechaString);
        return fecha.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    /**
     * Formatea una fecha con hora
     * @param {string} fechaString - Fecha en formato string
     * @returns {string} Fecha y hora formateadas en español
     */
    formatearFecha(fechaString) {
        if (!fechaString) return 'Fecha no disponible';
        const fecha = new Date(fechaString);
        return fecha.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    getEstatusClass(estatus) {
        const estatusMap = {
            'Pendiente': 'bg-warning',
            'Procesando': 'bg-info',
            'Pagado': 'bg-success',
            'Preparando': 'bg-primary',
            'Enviado': 'bg-secondary',
            'Entregado': 'bg-success',
            'Cancelado': 'bg-danger',
            'Reembolsado': 'bg-dark'
        };
        return estatusMap[estatus] || 'bg-secondary';
    }

    mostrarError(mensaje) {
        this.mostrarNotificacion(mensaje, 'error');
    }

    mostrarSeccionError() {
        const userInfoCard = document.getElementById('user-info-card');
        const ordersSection = document.getElementById('orders-section');
        const errorMessage = document.getElementById('error-message');
        
        if (userInfoCard) userInfoCard.style.display = 'none';
        if (ordersSection) ordersSection.style.display = 'none';
        if (errorMessage) errorMessage.style.display = 'block';
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

    updateUserDropdown(isLoggedIn) {
        const userName = document.getElementById('user-name');
        const btnLogin = document.getElementById('btn-login');
        const btnRegister = document.getElementById('btn-register');
        const btnMyOrders = document.getElementById('btn-my-orders');
        const btnLogout = document.getElementById('btn-logout');
        
        if (isLoggedIn && this.usuario) {
            // Usuario logueado - mostrar nombre y opciones de usuario logueado
            if (userName) userName.textContent = this.usuario.nombre;
            if (btnLogin) {
                btnLogin.style.display = 'none';
                btnLogin.hidden = true;
            }
            if (btnRegister) {
                btnRegister.style.display = 'none';
                btnRegister.hidden = true;
            }
            if (btnMyOrders) {
                btnMyOrders.style.display = 'block';
                btnMyOrders.hidden = false;
            }
            if (btnLogout) {
                btnLogout.style.display = 'block';
                btnLogout.hidden = false;
            }
        } else {
            // Usuario no logueado - mostrar opciones de login/registro
            if (userName) userName.textContent = 'Iniciar Sesión';
            if (btnLogin) {
                btnLogin.style.display = 'block';
                btnLogin.hidden = false;
            }
            if (btnRegister) {
                btnRegister.style.display = 'block';
                btnRegister.hidden = false;
            }
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
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.misPedidos = new MisPedidos();
});

// Listener para evento personalizado de logout desde otras páginas
window.addEventListener('sway-logout', function(e) {
    if (window.misPedidos) {
        window.misPedidos.usuario = null;
        window.misPedidos.updateUserDropdown(false);
        window.misPedidos.mostrarNotificacion('Sesión cerrada en otra pestaña', 'info');
        
        // Redirigir a la tienda después de un momento
        setTimeout(() => {
            window.location.href = '/tienda';
        }, 2000);
    }
});

// Listener para cambios en localStorage
window.addEventListener('storage', function(e) {
    if (e.key === 'manual-logout' && e.newValue === 'true') {
        if (window.misPedidos) {
            window.misPedidos.usuario = null;
            window.misPedidos.updateUserDropdown(false);
        }
    }
});
