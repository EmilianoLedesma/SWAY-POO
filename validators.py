"""
SWAY - Validadores del Lado del Servidor
Funciones de validación para todos los formularios
"""

import re
from datetime import datetime

class ValidationError(Exception):
    """Excepción personalizada para errores de validación"""
    pass

def validate_required(value, field_name):
    """Validar campo requerido"""
    if value is None or (isinstance(value, str) and value.strip() == ''):
        raise ValidationError(f'El campo {field_name} es obligatorio')
    return value.strip() if isinstance(value, str) else value

def validate_email(email):
    """Validar formato de email"""
    email = validate_required(email, 'email')
    
    # Patrón de email básico
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(pattern, email):
        raise ValidationError('El formato del email no es válido')
    
    if len(email) > 254:
        raise ValidationError('El email es demasiado largo (máximo 254 caracteres)')
    
    return email.lower()

def validate_password(password):
    """Validar contraseña"""
    password = validate_required(password, 'contraseña')
    
    if len(password) < 6:
        raise ValidationError('La contraseña debe tener al menos 6 caracteres')
    
    if len(password) > 100:
        raise ValidationError('La contraseña es demasiado larga (máximo 100 caracteres)')
    
    return password

def validate_password_match(password, password_confirm):
    """Validar que las contraseñas coincidan"""
    if password != password_confirm:
        raise ValidationError('Las contraseñas no coinciden')
    return True

def validate_text(text, field_name, min_length=2, max_length=100, allow_empty=False):
    """Validar campo de texto"""
    if allow_empty and (text is None or text.strip() == ''):
        return None
    
    text = validate_required(text, field_name)
    
    if len(text) < min_length:
        raise ValidationError(f'{field_name} debe tener al menos {min_length} caracteres')
    
    if len(text) > max_length:
        raise ValidationError(f'{field_name} es demasiado largo (máximo {max_length} caracteres)')
    
    # Validar solo letras y espacios para nombres
    if field_name.lower() in ['nombre', 'apellido paterno', 'apellido materno']:
        if not re.match(r'^[a-záéíóúñA-ZÁÉÍÓÚÑ\s]+$', text):
            raise ValidationError(f'{field_name} solo puede contener letras')
    
    return text.strip()

def validate_phone(phone, allow_empty=True):
    """Validar número telefónico"""
    if allow_empty and (phone is None or phone.strip() == ''):
        return None
    
    phone = validate_required(phone, 'teléfono')
    
    # Eliminar espacios y guiones
    phone_clean = re.sub(r'[\s\-\(\)]', '', phone)
    
    if not phone_clean.isdigit():
        raise ValidationError('El teléfono solo puede contener números')
    
    if len(phone_clean) < 10:
        raise ValidationError('El teléfono debe tener al menos 10 dígitos')
    
    if len(phone_clean) > 15:
        raise ValidationError('El teléfono es demasiado largo (máximo 15 dígitos)')
    
    return phone_clean

def validate_date(date_str, field_name, allow_empty=True):
    """Validar fecha"""
    if allow_empty and (date_str is None or date_str == ''):
        return None
    
    date_str = validate_required(date_str, field_name)
    
    try:
        date_obj = datetime.strptime(date_str, '%Y-%m-%d').date()
        return date_obj
    except ValueError:
        raise ValidationError(f'{field_name} tiene un formato inválido (use YYYY-MM-DD)')

def validate_number(value, field_name, min_value=None, max_value=None, allow_empty=True):
    """Validar número"""
    if allow_empty and (value is None or value == ''):
        return None
    
    try:
        num = float(value)
    except (ValueError, TypeError):
        raise ValidationError(f'{field_name} debe ser un número válido')
    
    if min_value is not None and num < min_value:
        raise ValidationError(f'{field_name} debe ser al menos {min_value}')
    
    if max_value is not None and num > max_value:
        raise ValidationError(f'{field_name} no puede ser mayor a {max_value}')
    
    return num

def validate_integer(value, field_name, min_value=None, max_value=None, allow_empty=True):
    """Validar número entero"""
    num = validate_number(value, field_name, min_value, max_value, allow_empty)
    
    if num is None:
        return None
    
    if num != int(num):
        raise ValidationError(f'{field_name} debe ser un número entero')
    
    return int(num)

# ========================================
# VALIDADORES ESPECÍFICOS
# ========================================

def validate_user_registration(data):
    """Validar datos de registro de usuario"""
    validated = {}
    
    # Campos requeridos
    validated['nombre'] = validate_text(data.get('nombre'), 'Nombre', min_length=2, max_length=100)
    validated['apellido_paterno'] = validate_text(data.get('apellidoPaterno'), 'Apellido Paterno', min_length=2, max_length=100)
    validated['apellido_materno'] = validate_text(data.get('apellidoMaterno'), 'Apellido Materno', min_length=2, max_length=100, allow_empty=True)
    validated['email'] = validate_email(data.get('email'))
    
    # Validar contraseñas
    password = validate_password(data.get('password'))
    password_confirm = data.get('password_confirm', '')
    validate_password_match(password, password_confirm)
    validated['password'] = password
    
    # Campos opcionales
    validated['telefono'] = validate_phone(data.get('telefono'), allow_empty=True)
    validated['fecha_nacimiento'] = validate_date(data.get('fechaNacimiento'), 'Fecha de Nacimiento', allow_empty=True)
    
    return validated

def validate_user_login(data):
    """Validar datos de login"""
    validated = {}
    
    validated['email'] = validate_email(data.get('email'))
    validated['password'] = validate_required(data.get('password'), 'contraseña')
    
    return validated

def validate_colaborador_registration(data):
    """Validar datos de registro de colaborador"""
    # Primero validar datos de usuario
    validated = validate_user_registration(data)
    
    # Datos adicionales de colaborador
    validated['especialidad'] = validate_text(data.get('especialidad'), 'Especialidad', min_length=3, max_length=100)
    validated['grado_academico'] = validate_text(data.get('gradoAcademico'), 'Grado Académico', min_length=2, max_length=50)
    validated['institucion'] = validate_text(data.get('institucion'), 'Institución', min_length=3, max_length=200)
    validated['años_experiencia'] = validate_integer(data.get('anosExperiencia'), 'Años de Experiencia', min_value=0, max_value=100)
    
    # Campos opcionales
    validated['numero_cedula'] = validate_text(data.get('numeroCedula'), 'Número de Cédula', min_length=5, max_length=20, allow_empty=True)
    validated['orcid'] = validate_text(data.get('orcid'), 'ORCID', min_length=10, max_length=50, allow_empty=True)
    
    return validated

def validate_especie_marina(data):
    """Validar datos de especie marina"""
    validated = {}
    
    validated['nombre_comun'] = validate_text(data.get('nombreComun'), 'Nombre Común', min_length=2, max_length=100)
    validated['nombre_cientifico'] = validate_text(data.get('nombreCientifico'), 'Nombre Científico', min_length=3, max_length=100)
    validated['descripcion'] = validate_text(data.get('descripcion'), 'Descripción', min_length=10, max_length=5000)
    
    # Taxonomía
    validated['filo'] = validate_text(data.get('filo'), 'Filo', min_length=2, max_length=50, allow_empty=True)
    validated['clase'] = validate_text(data.get('clase'), 'Clase', min_length=2, max_length=50, allow_empty=True)
    validated['orden'] = validate_text(data.get('orden'), 'Orden', min_length=2, max_length=50, allow_empty=True)
    validated['familia'] = validate_text(data.get('familia'), 'Familia', min_length=2, max_length=50, allow_empty=True)
    
    # Datos numéricos
    validated['profundidad_min'] = validate_integer(data.get('profundidadMin'), 'Profundidad Mínima', min_value=0, allow_empty=True)
    validated['profundidad_max'] = validate_integer(data.get('profundidadMax'), 'Profundidad Máxima', min_value=0, allow_empty=True)
    validated['esperanza_vida'] = validate_integer(data.get('esperanzaVida'), 'Esperanza de Vida', min_value=0, allow_empty=True)
    
    # Estado de conservación (requerido)
    validated['id_estado_conservacion'] = validate_integer(data.get('idEstadoConservacion'), 'Estado de Conservación', min_value=1)
    
    return validated

def validate_producto(data):
    """Validar datos de producto"""
    validated = {}
    
    validated['nombre'] = validate_text(data.get('nombre'), 'Nombre', min_length=3, max_length=200)
    validated['descripcion'] = validate_text(data.get('descripcion'), 'Descripción', min_length=10, max_length=5000)
    validated['precio'] = validate_number(data.get('precio'), 'Precio', min_value=0.01)
    validated['stock_disponible'] = validate_integer(data.get('stockDisponible'), 'Stock Disponible', min_value=0)
    validated['id_categoria'] = validate_integer(data.get('idCategoria'), 'Categoría', min_value=1)
    
    return validated

def validate_pedido(data):
    """Validar datos de pedido"""
    validated = {}
    
    validated['id_direccion_envio'] = validate_integer(data.get('idDireccionEnvio'), 'Dirección de Envío', min_value=1)
    validated['metodo_pago'] = validate_text(data.get('metodoPago'), 'Método de Pago', min_length=3, max_length=50)
    
    # Validar items del pedido
    items = data.get('items', [])
    if not items or len(items) == 0:
        raise ValidationError('El pedido debe contener al menos un producto')
    
    validated_items = []
    for item in items:
        validated_item = {
            'id_producto': validate_integer(item.get('idProducto'), 'ID de Producto', min_value=1),
            'cantidad': validate_integer(item.get('cantidad'), 'Cantidad', min_value=1)
        }
        validated_items.append(validated_item)
    
    validated['items'] = validated_items
    
    return validated

def validate_direccion_envio(data):
    """Validar datos de dirección de envío"""
    validated = {}
    
    validated['estado'] = validate_text(data.get('estado'), 'Estado', min_length=2, max_length=100)
    validated['municipio'] = validate_text(data.get('municipio'), 'Municipio', min_length=2, max_length=100)
    validated['colonia'] = validate_text(data.get('colonia'), 'Colonia', min_length=2, max_length=100)
    validated['calle'] = validate_text(data.get('calle'), 'Calle', min_length=2, max_length=100)
    validated['numero_exterior'] = validate_text(data.get('numero_exterior'), 'Número Exterior', min_length=1, max_length=10)
    validated['numero_interior'] = validate_text(data.get('numero_interior'), 'Número Interior', min_length=1, max_length=10, allow_empty=True)
    
    # Validar código postal (5 dígitos)
    codigo_postal = validate_required(data.get('codigo_postal'), 'Código Postal')
    if not re.match(r'^\d{5}$', codigo_postal):
        raise ValidationError('El código postal debe ser de 5 dígitos')
    validated['codigo_postal'] = codigo_postal
    
    validated['notas'] = validate_text(data.get('notas'), 'Notas', min_length=0, max_length=500, allow_empty=True)
    
    return validated

def validate_metodo_pago(data, metodo):
    """Validar datos del método de pago"""
    validated = {}
    
    if metodo == 'credit_card':
        # Validar número de tarjeta (16 dígitos sin espacios)
        card_number = validate_required(data.get('card_number'), 'Número de Tarjeta')
        card_number_clean = re.sub(r'\s', '', card_number)
        if not re.match(r'^\d{16}$', card_number_clean):
            raise ValidationError('El número de tarjeta debe tener 16 dígitos')
        validated['card_number'] = card_number_clean
        
        # Validar nombre en tarjeta
        validated['card_name'] = validate_text(data.get('card_name'), 'Nombre en Tarjeta', min_length=3, max_length=100)
        
        # Validar fecha de vencimiento (MM/YY)
        card_expiry = validate_required(data.get('card_expiry'), 'Fecha de Vencimiento')
        if not re.match(r'^(0[1-9]|1[0-2])\/\d{2}$', card_expiry):
            raise ValidationError('La fecha de vencimiento debe tener formato MM/YY')
        validated['card_expiry'] = card_expiry
        
        # Validar CVV (3 o 4 dígitos)
        cvv = validate_required(data.get('card_cvv'), 'CVV')
        if not re.match(r'^\d{3,4}$', cvv):
            raise ValidationError('El CVV debe tener 3 o 4 dígitos')
        validated['card_cvv'] = cvv
    
    return validated
