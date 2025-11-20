/**
 * Sistema de validaciones centralizadas para todos los formularios del proyecto SWAY
 * Implementa validación de tarjetas de crédito, algoritmo de Luhn y validaciones avanzadas
 * Proporciona una solución robusta para validación de formularios complejos
 */

/**
 * Clase para manejar validaciones avanzadas de formularios
 * Incluye algoritmos de validación especializados y formateo automático
 */
class FormValidator {
    /**
     * Constructor de la clase FormValidator
     * Inicializa patrones, mensajes y configuraciones para validación
     */
    constructor() {
        // Almacena errores de validación por campo
        this.errors = {};
        // Patrones de expresiones regulares para diferentes tipos de datos
        this.patterns = {
            email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
            phone: /^[\d\s\-\(\)\+]{10,15}$/,
            text: /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/,
            alphanumeric: /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\s]+$/,
            numbers: /^\d+$/,
            decimal: /^\d+(\.\d{1,2})?$/,
            date: /^\d{4}-\d{2}-\d{2}$/,
            time: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
            creditCard: /^\d{13,19}$/,
            expirationDate: /^(0[1-9]|1[0-2])\/\d{2}$/,
            cvv: /^\d{3,4}$/,
            postalCode: /^\d{5}$/,
            url: /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/
        };
        
        // Mensajes de error personalizados para cada tipo de validación
        this.messages = {
            required: 'Este campo es obligatorio',
            email: 'Ingrese un correo electrónico válido (ejemplo@dominio.com)',
            phone: 'Ingrese un número de teléfono válido',
            text: 'Solo se permiten letras y espacios',
            alphanumeric: 'Solo se permiten letras, números y espacios',
            numbers: 'Solo se permiten números',
            decimal: 'Ingrese un número válido (ej: 12.50)',
            date: 'Ingrese una fecha válida (YYYY-MM-DD)',
            time: 'Ingrese una hora válida (HH:MM)',
            creditCard: 'Número de tarjeta inválido (13-19 dígitos)',
            expirationDate: 'Fecha de vencimiento inválida (MM/YY)',
            cvv: 'CVV inválido (3-4 dígitos)',
            postalCode: 'Código postal inválido (5 dígitos)',
            url: 'Ingrese una URL válida',
            minLength: 'Debe tener al menos {min} caracteres',
            maxLength: 'No puede tener más de {max} caracteres',
            dateRange: 'La fecha debe ser posterior a hoy',
            passwordStrength: 'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número',
            anosExperiencia: 'Los años de experiencia deben ser un número entre 0 y 100'
        };
    }

    /**
     * Valida un campo individual aplicando las reglas especificadas
     * @param {string} field - Nombre del campo
     * @param {string} value - Valor del campo a validar
     * @param {Object} rules - Reglas de validación a aplicar
     * @returns {Array} Array de errores encontrados
     */
    validateField(field, value, rules = {}) {
        const errors = [];
        
        // Verificar si el campo es obligatorio y está vacío
        if (rules.required && (!value || value.trim() === '')) {
            errors.push(this.messages.required);
            return errors;
        }
        
        // Campos opcionales vacíos no requieren validación adicional
        if (!value || value.trim() === '') {
            return errors;
        }
        
        // Aplicar validaciones específicas según el tipo de dato
        if (rules.type) {
            switch (rules.type) {
                case 'email':
                    if (!this.patterns.email.test(value)) {
                        errors.push(this.messages.email);
                    }
                    break;
                case 'phone':
                    if (!this.patterns.phone.test(value)) {
                        errors.push(this.messages.phone);
                    }
                    break;
                case 'text':
                    if (!this.patterns.text.test(value)) {
                        errors.push(this.messages.text);
                    }
                    break;
                case 'alphanumeric':
                    if (!this.patterns.alphanumeric.test(value)) {
                        errors.push(this.messages.alphanumeric);
                    }
                    break;
                case 'numbers':
                    if (!this.patterns.numbers.test(value)) {
                        errors.push(this.messages.numbers);
                    }
                    break;
                case 'decimal':
                    if (!this.patterns.decimal.test(value)) {
                        errors.push(this.messages.decimal);
                    }
                    break;
                case 'date':
                    if (!this.patterns.date.test(value)) {
                        errors.push(this.messages.date);
                    } else if (rules.futureDate && new Date(value) <= new Date()) {
                        errors.push(this.messages.dateRange);
                    }
                    break;
                case 'time':
                    if (!this.patterns.time.test(value)) {
                        errors.push(this.messages.time);
                    }
                    break;
                case 'creditCard':
                    if (!this.validateCreditCard(value)) {
                        errors.push(this.messages.creditCard);
                    }
                    break;
                case 'expirationDate':
                    if (!this.validateExpirationDate(value)) {
                        errors.push(this.messages.expirationDate);
                    }
                    break;
                case 'cvv':
                    if (!this.patterns.cvv.test(value)) {
                        errors.push(this.messages.cvv);
                    }
                    break;
                case 'postalCode':
                    if (!this.patterns.postalCode.test(value)) {
                        errors.push(this.messages.postalCode);
                    }
                    break;
                case 'url':
                    if (!this.patterns.url.test(value)) {
                        errors.push(this.messages.url);
                    }
                    break;
                case 'password':
                    if (!this.validatePassword(value)) {
                        errors.push(this.messages.passwordStrength);
                    }
                    break;
                case 'anosExperiencia':
                    const numValue = parseInt(value);
                    if (isNaN(numValue) || numValue < 0 || numValue > 100) {
                        errors.push(this.messages.anosExperiencia);
                    }
                    break;
            }
        }
        
        // Verificar longitud mínima del valor
        if (rules.minLength && value.length < rules.minLength) {
            errors.push(this.messages.minLength.replace('{min}', rules.minLength));
        }
        
        // Verificar longitud máxima del valor
        if (rules.maxLength && value.length > rules.maxLength) {
            errors.push(this.messages.maxLength.replace('{max}', rules.maxLength));
        }
        
        return errors;
    }

    /**
     * Valida número de tarjeta de crédito usando algoritmo de Luhn
     * Implementa el estándar de validación para tarjetas de crédito
     * @param {string} number - Número de tarjeta a validar
     * @returns {boolean} true si la tarjeta es válida
     */
    validateCreditCard(number) {
        // Normalizar número removiendo espacios y guiones
        const cleanNumber = number.replace(/[\s-]/g, '');
        
        // Verificar formato numérico y longitud válida
        if (!this.patterns.creditCard.test(cleanNumber)) {
            return false;
        }
        
        // Aplicar algoritmo de Luhn para validación de tarjeta
        let sum = 0;
        let alternate = false;
        
        for (let i = cleanNumber.length - 1; i >= 0; i--) {
            let digit = parseInt(cleanNumber.charAt(i));
            
            if (alternate) {
                digit *= 2;
                if (digit > 9) {
                    digit = (digit % 10) + 1;
                }
            }
            
            sum += digit;
            alternate = !alternate;
        }
        
        return (sum % 10) === 0;
    }

    // Validar fecha de vencimiento de tarjeta
    validateExpirationDate(value) {
        if (!this.patterns.expirationDate.test(value)) {
            return false;
        }
        
        const [month, year] = value.split('/');
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear() % 100; // Últimos 2 dígitos
        const currentMonth = currentDate.getMonth() + 1;
        
        const expYear = parseInt(year);
        const expMonth = parseInt(month);
        
        // Verificar que el año no esté en el pasado
        if (expYear < currentYear) {
            return false;
        }
        
        // Si es el año actual, verificar que el mes no esté en el pasado
        if (expYear === currentYear && expMonth < currentMonth) {
            return false;
        }
        
        return true;
    }

    // Validar contraseña fuerte
    validatePassword(password) {
        const minLength = 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        
        return password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers;
    }

    // Validar formulario completo
    validateForm(formId, validationRules) {
        const form = document.getElementById(formId);
        if (!form) {
            console.error(`Formulario ${formId} no encontrado`);
            return false;
        }
        
        this.errors = {};
        let isValid = true;
        
        // Limpiar errores previos
        this.clearErrors(form);
        
        // Validar cada campo
        for (const fieldName in validationRules) {
            const field = form.querySelector(`[name="${fieldName}"]`);
            if (!field) continue;
            
            const value = field.value;
            const rules = validationRules[fieldName];
            const fieldErrors = this.validateField(fieldName, value, rules);
            
            if (fieldErrors.length > 0) {
                this.errors[fieldName] = fieldErrors;
                this.showFieldError(field, fieldErrors[0]);
                isValid = false;
            }
        }
        
        return isValid;
    }

    // Mostrar error en un campo específico
    showFieldError(field, message) {
        field.classList.add('error');
        
        // Buscar o crear elemento de error
        let errorElement = field.parentNode.querySelector('.error-message');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'error-message';
            field.parentNode.appendChild(errorElement);
        }
        
        errorElement.textContent = message;
        errorElement.style.color = '#dc3545';
        errorElement.style.fontSize = '0.875rem';
        errorElement.style.marginTop = '0.25rem';
    }

    // Limpiar errores del formulario
    clearErrors(form) {
        // Remover clases de error
        const errorFields = form.querySelectorAll('.error');
        errorFields.forEach(field => field.classList.remove('error'));
        
        // Remover mensajes de error
        const errorMessages = form.querySelectorAll('.error-message');
        errorMessages.forEach(message => message.remove());
    }

    // Limpiar error de un campo específico
    clearFieldError(field) {
        field.classList.remove('error');
        const errorElement = field.parentNode.querySelector('.error-message');
        if (errorElement) {
            errorElement.remove();
        }
    }

    // Configurar validación en tiempo real
    setupRealTimeValidation(formId, validationRules) {
        const form = document.getElementById(formId);
        if (!form) return;
        
        for (const fieldName in validationRules) {
            const field = form.querySelector(`[name="${fieldName}"]`);
            if (!field) continue;
            
            // Validar al perder el foco
            field.addEventListener('blur', () => {
                const value = field.value;
                const rules = validationRules[fieldName];
                const fieldErrors = this.validateField(fieldName, value, rules);
                
                this.clearFieldError(field);
                if (fieldErrors.length > 0) {
                    this.showFieldError(field, fieldErrors[0]);
                }
            });
            
            // Limpiar error al escribir
            field.addEventListener('input', () => {
                if (field.classList.contains('error')) {
                    this.clearFieldError(field);
                }
            });
        }
    }

    // Formatear número de tarjeta de crédito
    formatCreditCard(input) {
        let value = input.value.replace(/\s/g, '').replace(/[^0-9]/gi, '');
        let matches = value.match(/\d{4,16}/g);
        let match = matches && matches[0] || '';
        let parts = [];
        
        for (let i = 0, len = match.length; i < len; i += 4) {
            parts.push(match.substring(i, i + 4));
        }
        
        if (parts.length) {
            input.value = parts.join(' ');
        } else {
            input.value = value;
        }
    }

    // Formatear fecha de vencimiento
    formatExpirationDate(input) {
        let value = input.value.replace(/\D/g, '');
        if (value.length >= 2) {
            value = value.substring(0, 2) + '/' + value.substring(2, 4);
        }
        input.value = value;
    }

    // Detectar tipo de tarjeta de crédito
    detectCardType(number) {
        const cleanNumber = number.replace(/\s/g, '');
        
        if (/^4/.test(cleanNumber)) {
            return 'visa';
        } else if (/^5[1-5]/.test(cleanNumber)) {
            return 'mastercard';
        } else if (/^3[47]/.test(cleanNumber)) {
            return 'amex';
        } else if (/^6/.test(cleanNumber)) {
            return 'discover';
        }
        
        return 'unknown';
    }
}

// Instancia global del validador
const formValidator = new FormValidator();

// Estilos CSS para los errores (se agregará dinámicamente)
const errorStyles = `
<style>
.error {
    border-color: #dc3545 !important;
    box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25) !important;
}

.error-message {
    color: #dc3545;
    font-size: 0.875rem;
    margin-top: 0.25rem;
    display: block;
}

.form-group {
    margin-bottom: 1rem;
}

.form-control.success {
    border-color: #28a745;
    box-shadow: 0 0 0 0.2rem rgba(40, 167, 69, 0.25);
}

.card-type-indicator {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 1.2rem;
    color: #6c757d;
}
</style>
`;

// Agregar estilos al documento
if (!document.querySelector('#validation-styles')) {
    const styleElement = document.createElement('style');
    styleElement.id = 'validation-styles';
    styleElement.innerHTML = errorStyles.replace('<style>', '').replace('</style>', '');
    document.head.appendChild(styleElement);
}

// Exportar para uso global
window.FormValidator = FormValidator;
window.formValidator = formValidator;
