/**
 * Sistema de validaciones JavaScript reutilizable para todos los formularios del proyecto SWAY
 * Implementa validaciones en tiempo real, formateo automático y patrones de validación
 * Proporciona una experiencia de usuario mejorada con retroalimentación inmediata
 */

/**
 * Clase principal para manejo de validaciones en formularios
 * Implementa patrón Singleton con configuraciones predefinidas
 */
class ValidacionesSway {
    /**
     * Constructor de la clase ValidacionesSway
     * Inicializa patrones de validación, mensajes y configuraciones
     */
    constructor() {
        // Patrones de expresiones regulares para diferentes tipos de validación
        this.patrones = {
            soloTexto: /^[a-zA-ZÀ-ÿ\u00f1\u00d1\s]+$/,
            soloNumeros: /^\d+$/,
            numerosDecimales: /^\d+(\.\d{1,2})?$/,
            coordenadas: /^-?\d*\.?\d+$/,
            email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            telefono: /^[\+]?[\d\s\-\(\)]+$/,
            urlFlexible: /^[^\s]+$/, // Validación flexible para URLs (no permite espacios)
            // Patrones específicos para validación de tarjetas de crédito
            visa: /^4[0-9]{12}(?:[0-9]{3})?$/,
            mastercard: /^5[1-5][0-9]{14}$/,
            amex: /^3[47][0-9]{13}$/,
            // Patrón para fecha de vencimiento en formato MM/YY
            fechaVencimiento: /^(0[1-9]|1[0-2])\/\d{2}$/,
            // Patrón para código de verificación CVV
            cvv: /^\d{3,4}$/
        };

        // Mensajes de error personalizados para cada tipo de validación
        this.mensajes = {
            soloTexto: 'Este campo solo debe contener letras y espacios',
            soloNumeros: 'Este campo solo debe contener números',
            numerosDecimales: 'Ingrese un número válido (ej: 123.45)',
            latitud: 'Latitud debe estar entre -90 y 90 grados',
            longitud: 'Longitud debe estar entre -180 y 180 grados',
            email: 'Ingrese un email válido',
            telefono: 'Ingrese un teléfono válido',
            urlFlexible: 'Ingrese un enlace válido (no puede contener espacios)',
            fechaVencimiento: 'Formato válido: MM/YY',
            cvv: 'CVV debe tener 3 o 4 dígitos',
            tarjeta: 'Número de tarjeta inválido',
            fechaFutura: 'La fecha debe ser futura',
            fechaPasada: 'La fecha debe ser pasada',
            requerido: 'Este campo es obligatorio',
            passwordCorta: 'La contraseña debe tener al menos 6 caracteres'
        };

        // Inicializar configuraciones y estilos CSS
        this.init();
    }

    /**
     * Inicializa la clase y configura estilos CSS
     * Se ejecuta automáticamente al instanciar la clase
     * @returns {void}
     */
    init() {
        // Agregar estilos CSS dinámicos para mensajes de error y validación
        this.agregarEstilosCSS();
    }

    /**
     * Agrega estilos CSS dinámicos para validaciones
     * Crea estilos para campos con error, válidos y mensajes
     * @returns {void}
     */
    agregarEstilosCSS() {
        const estilos = `
            <style>
                .campo-error {
                    border: 2px solid #dc3545 !important;
                    box-shadow: 0 0 5px rgba(220, 53, 69, 0.3) !important;
                }
                
                .campo-valido {
                    border: 2px solid #28a745 !important;
                    box-shadow: 0 0 5px rgba(40, 167, 69, 0.3) !important;
                }
                
                .mensaje-error {
                    color: #dc3545;
                    font-size: 0.875rem;
                    margin-top: 0.25rem;
                    display: block;
                }
                
                .mensaje-exito {
                    color: #28a745;
                    font-size: 0.875rem;
                    margin-top: 0.25rem;
                    display: block;
                }
            </style>
        `;
        
        if (!document.querySelector('#validaciones-css')) {
            const head = document.head || document.getElementsByTagName('head')[0];
            const style = document.createElement('div');
            style.id = 'validaciones-css';
            style.innerHTML = estilos;
            head.appendChild(style);
        }
    }

    /**
     * Función principal para validar un campo individual
     * Aplica todas las reglas de validación y muestra errores
     * @param {HTMLElement} campo - Elemento del campo a validar
     * @param {string} tipoValidacion - Tipo de validación a aplicar
     * @param {Object} opciones - Opciones adicionales para la validación
     * @returns {boolean} true si el campo es válido, false en caso contrario
     */
    validarCampo(campo, tipoValidacion, opciones = {}) {
        const valor = campo.value.trim();
        const esRequerido = campo.hasAttribute('required') || opciones.requerido;
        
        // Limpiar validaciones previas del campo
        this.limpiarValidacion(campo);
        
        // Validar campos obligatorios vacíos
        if (esRequerido && !valor) {
            this.mostrarError(campo, this.mensajes.requerido);
            return false;
        }
        
        // Campos opcionales vacíos son válidos por defecto
        if (!valor && !esRequerido) {
            return true;
        }
        
        // Aplicar validación específica según el tipo
        let esValido = false;
        let mensajeError = '';
        
        switch (tipoValidacion) {
            case 'soloTexto':
                esValido = this.patrones.soloTexto.test(valor);
                mensajeError = this.mensajes.soloTexto;
                break;
                
            case 'urlFlexible':
                esValido = this.patrones.urlFlexible.test(valor);
                mensajeError = this.mensajes.urlFlexible;
                break;
                
            case 'soloNumeros':
                esValido = this.patrones.soloNumeros.test(valor);
                mensajeError = this.mensajes.soloNumeros;
                break;
                
            case 'numerosDecimales':
                esValido = this.patrones.numerosDecimales.test(valor);
                mensajeError = this.mensajes.numerosDecimales;
                break;
                
            case 'email':
                esValido = this.patrones.email.test(valor);
                mensajeError = this.mensajes.email;
                break;
                
            case 'telefono':
                esValido = this.patrones.telefono.test(valor) && valor.length >= 10;
                mensajeError = this.mensajes.telefono;
                break;
                
            case 'tarjeta':
                esValido = this.validarTarjeta(valor);
                mensajeError = this.mensajes.tarjeta;
                break;
                
            case 'fechaVencimiento':
                esValido = this.validarFechaVencimiento(valor);
                mensajeError = this.mensajes.fechaVencimiento;
                break;
                
            case 'cvv':
                esValido = this.patrones.cvv.test(valor);
                mensajeError = this.mensajes.cvv;
                break;
                
            case 'fechaFutura':
                esValido = this.validarFechaFutura(valor);
                mensajeError = this.mensajes.fechaFutura;
                break;
                
            case 'fechaPasada':
                esValido = this.validarFechaPasada(valor);
                mensajeError = this.mensajes.fechaPasada;
                break;
                
            case 'latitud':
                esValido = this.validarLatitud(valor);
                mensajeError = this.mensajes.latitud;
                break;
                
            case 'longitud':
                esValido = this.validarLongitud(valor);
                mensajeError = this.mensajes.longitud;
                break;
                
            case 'password':
                esValido = valor.length >= 6;
                mensajeError = this.mensajes.passwordCorta;
                break;
                
            case 'confirmPassword':
                const passwordField = opciones.passwordField;
                if (passwordField) {
                    const passwordValue = passwordField.value;
                    esValido = valor === passwordValue && valor.length >= 6;
                    mensajeError = valor !== passwordValue ? 'Las contraseñas no coinciden' : this.mensajes.passwordCorta;
                } else {
                    esValido = valor.length >= 6;
                    mensajeError = this.mensajes.passwordCorta;
                }
                break;
                
            default:
                esValido = true;
        }
        
        if (esValido) {
            this.mostrarExito(campo);
            return true;
        } else {
            this.mostrarError(campo, mensajeError);
            return false;
        }
    }

    // Validaciones específicas
    validarTarjeta(numero) {
        // Remover espacios y guiones
        const numeroLimpio = numero.replace(/[\s\-]/g, '');
        
        // Verificar longitud básica
        if (numeroLimpio.length < 13 || numeroLimpio.length > 19) {
            return false;
        }
        
        // Verificar que solo contenga números
        if (!/^\d+$/.test(numeroLimpio)) {
            return false;
        }
        
        // Algoritmo de Luhn para validar número de tarjeta
        let suma = 0;
        let alternar = false;
        
        for (let i = numeroLimpio.length - 1; i >= 0; i--) {
            let digito = parseInt(numeroLimpio.charAt(i), 10);
            
            if (alternar) {
                digito *= 2;
                if (digito > 9) {
                    digito = (digito % 10) + 1;
                }
            }
            
            suma += digito;
            alternar = !alternar;
        }
        
        return (suma % 10) === 0;
    }

    validarFechaVencimiento(fecha) {
        if (!this.patrones.fechaVencimiento.test(fecha)) {
            return false;
        }
        
        const [mes, año] = fecha.split('/');
        const fechaCompleta = new Date(2000 + parseInt(año), parseInt(mes) - 1);
        const fechaActual = new Date();
        
        return fechaCompleta > fechaActual;
    }

    validarFechaFutura(fecha) {
        const fechaSeleccionada = new Date(fecha);
        const fechaActual = new Date();
        fechaActual.setHours(0, 0, 0, 0);
        
        return fechaSeleccionada >= fechaActual;
    }

    validarFechaPasada(fecha) {
        const fechaSeleccionada = new Date(fecha);
        const fechaActual = new Date();
        
        return fechaSeleccionada <= fechaActual;
    }

    validarLatitud(valor) {
        if (!this.patrones.coordenadas.test(valor)) {
            return false;
        }
        
        const lat = parseFloat(valor);
        return lat >= -90 && lat <= 90;
    }

    validarLongitud(valor) {
        if (!this.patrones.coordenadas.test(valor)) {
            return false;
        }
        
        const lng = parseFloat(valor);
        return lng >= -180 && lng <= 180;
    }

    // Funciones de UI
    limpiarValidacion(campo) {
        campo.classList.remove('campo-error', 'campo-valido');
        
        // Remover TODOS los mensajes anteriores
        const mensajesAnteriores = campo.parentNode.querySelectorAll('.mensaje-error, .mensaje-exito');
        mensajesAnteriores.forEach(mensaje => mensaje.remove());
    }

    mostrarError(campo, mensaje) {
        // Limpiar mensajes previos antes de agregar uno nuevo
        this.limpiarValidacion(campo);
        
        campo.classList.add('campo-error');
        campo.classList.remove('campo-valido');
        
        const mensajeDiv = document.createElement('div');
        mensajeDiv.className = 'mensaje-error';
        mensajeDiv.textContent = mensaje;
        
        campo.parentNode.appendChild(mensajeDiv);
    }

    mostrarExito(campo) {
        // Limpiar mensajes previos antes de agregar uno nuevo
        this.limpiarValidacion(campo);
        
        campo.classList.add('campo-valido');
        campo.classList.remove('campo-error');
        
        const mensajeDiv = document.createElement('div');
        mensajeDiv.className = 'mensaje-exito';
        mensajeDiv.innerHTML = '<i class="bi bi-check-circle"></i>';
        
        campo.parentNode.appendChild(mensajeDiv);
    }

    // Función para formatear número de tarjeta automáticamente
    formatearTarjeta(campo) {
        let valor = campo.value.replace(/\s/g, '').replace(/[^0-9]/gi, '');
        let valorFormateado = valor.match(/.{1,4}/g)?.join(' ') || valor;
        
        if (valorFormateado !== campo.value) {
            campo.value = valorFormateado;
        }
    }

    // Función para formatear fecha de vencimiento MM/YY
    formatearFechaVencimiento(campo) {
        let valor = campo.value.replace(/\D/g, '');
        
        if (valor.length >= 2) {
            valor = valor.substring(0, 2) + '/' + valor.substring(2, 4);
        }
        
        campo.value = valor;
    }

    // Configurar validaciones automáticas para un formulario
    configurarFormulario(formulario, configuracion) {
        Object.keys(configuracion).forEach(nombreCampo => {
            const campo = formulario.querySelector(`[name="${nombreCampo}"], #${nombreCampo}`);
            if (!campo) return;
            
            const config = configuracion[nombreCampo];
            
            // Eventos de validación en tiempo real
            campo.addEventListener('blur', () => {
                this.validarCampo(campo, config.tipo, config.opciones || {});
            });
            
            campo.addEventListener('input', () => {
                // Formateo automático para algunos tipos
                if (config.tipo === 'tarjeta') {
                    this.formatearTarjeta(campo);
                } else if (config.tipo === 'fechaVencimiento') {
                    this.formatearFechaVencimiento(campo);
                }
                
                // Validación en tiempo real para algunos campos
                if (['email', 'soloTexto', 'soloNumeros', 'urlFlexible'].includes(config.tipo)) {
                    // Pequeño delay para no ser muy agresivo
                    clearTimeout(campo.validacionTimeout);
                    campo.validacionTimeout = setTimeout(() => {
                        this.validarCampo(campo, config.tipo, config.opciones || {});
                    }, 500);
                }
                
                // Para confirmación de contraseña, validar cuando cambie cualquiera de los dos campos
                if (config.tipo === 'confirmPassword' && config.opciones?.passwordField) {
                    clearTimeout(campo.validacionTimeout);
                    campo.validacionTimeout = setTimeout(() => {
                        this.validarCampo(campo, config.tipo, config.opciones || {});
                    }, 500);
                }
            });
        });
        
        // Para campos de confirmación de contraseña, también validar cuando cambie la contraseña original
        Object.keys(configuracion).forEach(nombreCampo => {
            const config = configuracion[nombreCampo];
            if (config.tipo === 'confirmPassword' && config.opciones?.passwordField) {
                const passwordField = config.opciones.passwordField;
                const confirmField = formulario.querySelector(`[name="${nombreCampo}"], #${nombreCampo}`);
                
                if (passwordField && confirmField) {
                    passwordField.addEventListener('input', () => {
                        clearTimeout(confirmField.validacionTimeout);
                        confirmField.validacionTimeout = setTimeout(() => {
                            this.validarCampo(confirmField, 'confirmPassword', { passwordField });
                        }, 500);
                    });
                }
            }
        });
        
        // Validación al enviar el formulario
        formulario.addEventListener('submit', (e) => {
            let formularioValido = true;
            
            Object.keys(configuracion).forEach(nombreCampo => {
                const campo = formulario.querySelector(`[name="${nombreCampo}"], #${nombreCampo}`);
                if (!campo) return;
                
                const config = configuracion[nombreCampo];
                const esValido = this.validarCampo(campo, config.tipo, config.opciones || {});
                
                if (!esValido) {
                    formularioValido = false;
                }
            });
            
            if (!formularioValido) {
                e.preventDefault();
                
                // Mostrar mensaje general de error
                this.mostrarMensajeFormulario(formulario, 'Por favor, corrige los errores antes de continuar.', 'error');
                
                // Hacer scroll al primer campo con error
                const primerError = formulario.querySelector('.campo-error');
                if (primerError) {
                    primerError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    primerError.focus();
                }
            }
        });
    }

    // Mostrar mensaje general del formulario
    mostrarMensajeFormulario(formulario, mensaje, tipo = 'error') {
        // Remover mensaje anterior
        const mensajeAnterior = formulario.querySelector('.mensaje-formulario');
        if (mensajeAnterior) {
            mensajeAnterior.remove();
        }
        
        const mensajeDiv = document.createElement('div');
        mensajeDiv.className = `mensaje-formulario alert alert-${tipo === 'error' ? 'danger' : 'success'}`;
        mensajeDiv.textContent = mensaje;
        
        // Insertar al inicio del formulario
        formulario.insertBefore(mensajeDiv, formulario.firstChild);
        
        // Remover automáticamente después de 5 segundos
        setTimeout(() => {
            if (mensajeDiv.parentNode) {
                mensajeDiv.remove();
            }
        }, 5000);
    }

    // Función para validar formulario completo manualmente
    validarFormularioCompleto(formulario, configuracion) {
        let formularioValido = true;
        
        Object.keys(configuracion).forEach(nombreCampo => {
            const campo = formulario.querySelector(`[name="${nombreCampo}"], #${nombreCampo}`);
            if (!campo) return;
            
            const config = configuracion[nombreCampo];
            const esValido = this.validarCampo(campo, config.tipo, config.opciones || {});
            
            if (!esValido) {
                formularioValido = false;
            }
        });
        
        return formularioValido;
    }
}

// Crear instancia global
const validacionesSway = new ValidacionesSway();

// Configuraciones predefinidas para diferentes formularios
const configFormularios = {
    eventos: {
        titulo: { tipo: 'soloTexto' },
        capacidad_maxima: { tipo: 'soloNumeros' },
        ubicacion: { tipo: 'urlFlexible' },
        fecha_evento: { tipo: 'fechaFutura' },
        costo: { tipo: 'numerosDecimales' },
        contacto: { tipo: 'email' }
    },
    
    contacto: {
        name: { tipo: 'soloTexto' },
        email: { tipo: 'email' },
        subject: { tipo: 'soloTexto' }
    },
    
    login: {
        email: { tipo: 'email' },
        password: { tipo: 'password' }
    },
    
    registro: {
        nombre: { tipo: 'soloTexto' },
        apellidoPaterno: { tipo: 'soloTexto' },
        apellidoMaterno: { tipo: 'soloTexto' },
        email: { tipo: 'email' },
        password: { tipo: 'password' },
        password_confirm: { tipo: 'password' }
    },
    
    checkout: {
        'shipping-name': { tipo: 'soloTexto' },
        'shipping-phone': { tipo: 'telefono' },
        'card-number': { tipo: 'tarjeta' },
        'card-name': { tipo: 'soloTexto' },
        'card-expiry': { tipo: 'fechaVencimiento' },
        'card-cvv': { tipo: 'cvv' }
    },

    payment: {
        'contact_nombre': { tipo: 'soloTexto' },
        'contact_apellido_paterno': { tipo: 'soloTexto' },
        'contact_apellido_materno': { tipo: 'soloTexto' },
        'contact_email': { tipo: 'email' }
    },

    tienda: {
        'registerNombre': { tipo: 'soloTexto' },
        'registerApellidoPaterno': { tipo: 'soloTexto' },
        'registerApellidoMaterno': { tipo: 'soloTexto' },
        'registerEmail': { tipo: 'email' },
        'registerPassword': { tipo: 'password' },
        'registerPasswordConfirm': { tipo: 'password' }
    },

    indexForm: {
        'nombre': { tipo: 'soloTexto' },
        'apellidoPaterno': { tipo: 'soloTexto' },
        'apellidoMaterno': { tipo: 'soloTexto' },
        'email': { tipo: 'email' }
    },
    
    newsletter: {
        email: { tipo: 'email' }
    },
    
    avistamientos: {
        'fecha-avistamiento': { tipo: 'fechaPasada' },
        latitud: { tipo: 'latitud' },
        longitud: { tipo: 'longitud' },
        'nombre-usuario': { tipo: 'soloTexto' },
        'email-usuario': { tipo: 'email' }
    },
    
    colaboradorLogin: {
        'login-email': { tipo: 'email' },
        'login-password': { tipo: 'password' }
    },
    
    colaboradorRegistro: {
        'reg-nombre': { tipo: 'soloTexto' },
        'reg-apellido-paterno': { tipo: 'soloTexto' },
        'reg-apellido-materno': { tipo: 'soloTexto' },
        'reg-email': { tipo: 'email' },
        'reg-password': { tipo: 'password' },
        'reg-confirm-password': { tipo: 'confirmPassword' },
        'reg-institucion': { tipo: 'soloTexto' }
    }
};

// Función de conveniencia para configurar rápidamente un formulario
function configurarValidaciones(nombreFormulario, selectorFormulario) {
    const formulario = document.querySelector(selectorFormulario);
    if (formulario && configFormularios[nombreFormulario]) {
        validacionesSway.configurarFormulario(formulario, configFormularios[nombreFormulario]);
        console.log(`Validaciones configuradas para: ${nombreFormulario}`);
    }
}

// Configurar automáticamente al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    // Eventos
    configurarValidaciones('eventos', '#form-crear-evento');
    
    // Contacto
    configurarValidaciones('contacto', '#contact-form');
    
    // Login
    configurarValidaciones('login', '#loginForm');
    
    // Registro con validación especial para confirmar contraseña
    const registerForm = document.querySelector('#registerForm');
    if (registerForm) {
        const passwordField = registerForm.querySelector('[name="password"]');
        const confirmPasswordField = registerForm.querySelector('[name="password_confirm"]');
        
        if (passwordField && confirmPasswordField) {
            const registroConfig = {
                nombre: { tipo: 'soloTexto' },
                apellidoPaterno: { tipo: 'soloTexto' },
                apellidoMaterno: { tipo: 'soloTexto' },
                email: { tipo: 'email' },
                password: { tipo: 'password' },
                password_confirm: { 
                    tipo: 'confirmPassword', 
                    opciones: { passwordField: passwordField } 
                }
            };
            
            validacionesSway.configurarFormulario(registerForm, registroConfig);
            console.log('Validaciones configuradas para: registro');
        }
    }
    
    // Checkout
    configurarValidaciones('checkout', '#checkout-form');
    
    // Avistamientos
    configurarValidaciones('avistamientos', '#sighting-form');
    
    // Colaboradores - Login
    const collaboratorLoginForm = document.querySelector('#collaborator-login-form');
    if (collaboratorLoginForm) {
        validacionesSway.configurarFormulario(collaboratorLoginForm, configFormularios.colaboradorLogin);
        console.log('Validaciones configuradas para: colaborador login');
    }
    
    // Colaboradores - Registro
    const collaboratorRegisterForm = document.querySelector('#collaborator-register-form');
    if (collaboratorRegisterForm) {
        const passwordField = collaboratorRegisterForm.querySelector('#reg-password');
        const confirmPasswordField = collaboratorRegisterForm.querySelector('#reg-confirm-password');
        
        if (passwordField && confirmPasswordField) {
            const colaboradorRegistroConfig = {
                'reg-nombre': { tipo: 'soloTexto' },
                'reg-apellido-paterno': { tipo: 'soloTexto' },
                'reg-apellido-materno': { tipo: 'soloTexto' },
                'reg-email': { tipo: 'email' },
                'reg-password': { tipo: 'password' },
                'reg-confirm-password': { 
                    tipo: 'confirmPassword', 
                    opciones: { passwordField: passwordField } 
                },
                'reg-institucion': { tipo: 'soloTexto' }
            };
            
            validacionesSway.configurarFormulario(collaboratorRegisterForm, colaboradorRegistroConfig);
            console.log('Validaciones configuradas para: colaborador registro');
        }
    }
    
    // Formulario de pago (payment.html)
    const paymentForm = document.querySelector('#payment-form');
    if (paymentForm) {
        validacionesSway.configurarFormulario(paymentForm, configFormularios.payment);
        console.log('Validaciones configuradas para: formulario de pago');
    }
    
    // Formulario de tienda (tienda.html)
    const tiendaRegisterForm = document.querySelector('#tienda-register-form, form[id*="register"]');
    if (tiendaRegisterForm) {
        validacionesSway.configurarFormulario(tiendaRegisterForm, configFormularios.tienda);
        console.log('Validaciones configuradas para: formulario de tienda');
    }
    
    // Formulario del index (index.html)
    const indexForm = document.querySelector('form[action="/subscribe"], #newsletter-form, form[id*="newsletter"]');
    if (indexForm) {
        validacionesSway.configurarFormulario(indexForm, configFormularios.indexForm);
        console.log('Validaciones configuradas para: formulario del index');
    }
    
    // Newsletter (buscar todos los campos de email del newsletter)
    document.querySelectorAll('input[name="email"]').forEach(campo => {
        if (campo.id === 'newsletter-email' || campo.closest('form') === null) {
            campo.addEventListener('blur', () => {
                validacionesSway.validarCampo(campo, 'email');
            });
        }
    });
    
    // Configurar validaciones automáticas para todos los campos con data-validation
    document.querySelectorAll('input[data-validation]').forEach(campo => {
        const tipoValidacion = campo.getAttribute('data-validation');
        
        // Solo configurar si no está ya configurado por otro sistema
        if (!campo.hasAttribute('data-validation-configured')) {
            campo.addEventListener('blur', () => {
                validacionesSway.validarCampo(campo, tipoValidacion);
            });
            
            // Para validación en tiempo real en campos de texto
            if (['soloTexto', 'soloNumeros', 'email'].includes(tipoValidacion)) {
                campo.addEventListener('input', () => {
                    clearTimeout(campo.validacionTimeout);
                    campo.validacionTimeout = setTimeout(() => {
                        validacionesSway.validarCampo(campo, tipoValidacion);
                    }, 500);
                });
            }
            
            campo.setAttribute('data-validation-configured', 'true');
        }
    });
    
    console.log('Sistema de validaciones SWAY inicializado completamente');
    
    // Función de verificación para debug (opcional)
    if (window.location.search.includes('debug=validaciones')) {
        verificarValidacionesApellidos();
    }
});

// Función de debug para verificar que todos los campos de apellidos tengan validaciones
function verificarValidacionesApellidos() {
    console.log('=== VERIFICACIÓN DE VALIDACIONES DE APELLIDOS ===');
    
    const camposApellidos = document.querySelectorAll('input[name*="apellido"], input[id*="apellido"]');
    let totalCampos = 0;
    let camposConValidacion = 0;
    let camposSinValidacion = [];
    
    camposApellidos.forEach(campo => {
        totalCampos++;
        const tieneValidacion = campo.hasAttribute('data-validation') || 
                               campo.hasAttribute('data-validation-configured');
        
        if (tieneValidacion) {
            camposConValidacion++;
            console.log(`✓ ${campo.name || campo.id}: ${campo.getAttribute('data-validation') || 'configurado'}`);
        } else {
            camposSinValidacion.push(campo.name || campo.id);
            console.log(`✗ ${campo.name || campo.id}: SIN VALIDACIÓN`);
        }
    });
    
    console.log(`\nResumen: ${camposConValidacion}/${totalCampos} campos con validación`);
    
    if (camposSinValidacion.length > 0) {
        console.warn('Campos sin validación:', camposSinValidacion);
    } else {
        console.log('🎉 ¡Todos los campos de apellidos tienen validación!');
    }
    
    console.log('=== FIN VERIFICACIÓN ===');
}
