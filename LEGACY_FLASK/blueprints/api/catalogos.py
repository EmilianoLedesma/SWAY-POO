from flask import Blueprint, request, jsonify, session
from db import get_db_connection, construir_nombre_completo

catalogos_bp = Blueprint('catalogos', __name__)


@catalogos_bp.route('/api/regiones')
def get_regiones():
    """API para obtener regiones geográficas disponibles"""
    try:
        regiones = [
            {'id': 'pacifico', 'nombre': 'Océano Pacífico', 'descripcion': 'El mayor océano del planeta'},
            {'id': 'atlantico', 'nombre': 'Océano Atlántico', 'descripcion': 'Segundo océano más grande del mundo'},
            {'id': 'indico', 'nombre': 'Océano Índico', 'descripcion': 'Tercer océano más grande'},
            {'id': 'artico', 'nombre': 'Océano Ártico', 'descripcion': 'Océano polar del norte'},
            {'id': 'antartico', 'nombre': 'Océano Antártico', 'descripcion': 'Océano que rodea la Antártida'},
            {'id': 'mediterraneo', 'nombre': 'Mar Mediterráneo', 'descripcion': 'Mar semicerrado entre Europa, África y Asia'},
            {'id': 'caribe', 'nombre': 'Mar Caribe', 'descripcion': 'Mar tropical en América Central'}
        ]

        return jsonify({
            'success': True,
            'regiones': regiones
        })

    except Exception as e:
        print(f"Error en get_regiones: {e}")
        return jsonify({'error': 'Error interno del servidor'}), 500


@catalogos_bp.route('/api/newsletter', methods=['POST'])
def suscribir_newsletter():
    """API para suscribir al newsletter"""
    try:
        data = request.get_json()
        email = data.get('email')

        if not email:
            return jsonify({'error': 'Email requerido'}), 400

        # Validar formato de email básico
        if '@' not in email or '.' not in email:
            return jsonify({'error': 'Email inválido'}), 400

        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Error de conexión a la base de datos'}), 500

        cursor = conn.cursor()

        # Verificar si ya existe el usuario
        cursor.execute("SELECT id, suscrito_newsletter FROM Usuarios WHERE email = ?", (email,))
        user_row = cursor.fetchone()

        if user_row:
            if user_row[1]:  # Ya está suscrito
                conn.close()
                return jsonify({
                    'success': True,
                    'message': 'Este email ya está suscrito al newsletter',
                    'already_subscribed': True
                }), 200
            else:
                # Actualizar suscripción
                cursor.execute("UPDATE Usuarios SET suscrito_newsletter = 1 WHERE email = ?", (email,))
                conn.commit()
                conn.close()
                return jsonify({
                    'success': True,
                    'message': 'Suscripción reactivada exitosamente'
                }), 200
        else:
            # Crear nuevo usuario suscrito
            cursor.execute("""
                INSERT INTO Usuarios (nombre, apellido_paterno, apellido_materno, email, suscrito_newsletter, fecha_registro, activo)
                VALUES ('Usuario', 'Newsletter', NULL, ?, 1, GETDATE(), 1)
            """, (email,))
            conn.commit()
            conn.close()

            return jsonify({
                'success': True,
                'message': 'Suscripción exitosa al newsletter'
            }), 200

    except Exception as e:
        print(f"Error en suscribir_newsletter: {e}")
        return jsonify({'error': str(e)}), 500


@catalogos_bp.route('/api/contacto', methods=['POST'])
def enviar_contacto():
    """Enviar mensaje de contacto"""
    try:
        data = request.get_json()

        # Validar datos requeridos
        if not data.get('name') or not data.get('email') or not data.get('subject') or not data.get('message'):
            return jsonify({
                'success': False,
                'message': 'Todos los campos son requeridos'
            }), 400

        conn = get_db_connection()
        if not conn:
            return jsonify({
                'success': False,
                'message': 'Error de conexión a la base de datos'
            }), 500

        cursor = conn.cursor()

        # 1. Verificar si el usuario ya existe por email
        cursor.execute("SELECT id FROM Usuarios WHERE email = ?", (data['email'],))
        user_row = cursor.fetchone()

        if user_row:
            user_id = user_row.id
        else:
            # 2. Crear nuevo usuario con solo nombre y email
            # Usar campos separados si están disponibles, sino dividir el nombre completo
            if data.get('nombre') and data.get('apellidoPaterno'):
                primer_nombre = data['nombre']
                apellido_paterno = data['apellidoPaterno']
                apellido_materno = data.get('apellidoMaterno')
            else:
                # Dividir el nombre en partes como fallback
                nombre_partes = data['name'].split()
                primer_nombre = nombre_partes[0] if nombre_partes else 'Usuario'
                apellido_paterno = nombre_partes[1] if len(nombre_partes) > 1 else 'Sin Apellido'
                apellido_materno = nombre_partes[2] if len(nombre_partes) > 2 else None

            cursor.execute("""
                INSERT INTO Usuarios (nombre, apellido_paterno, apellido_materno, email, suscrito_newsletter, activo)
                VALUES (?, ?, ?, ?, 0, 1)
            """, (primer_nombre, apellido_paterno, apellido_materno, data['email']))

            # Obtener el ID del usuario creado
            cursor.execute("SELECT @@IDENTITY")
            user_id = cursor.fetchone()[0]

        # 3. Insertar mensaje de contacto
        cursor.execute("""
            INSERT INTO Contactos (id_usuario, asunto, mensaje, fecha_contacto, respondido)
            VALUES (?, ?, ?, GETDATE(), 0)
        """, (user_id, data['subject'], data['message']))

        conn.commit()
        conn.close()

        return jsonify({
            'success': True,
            'message': 'Mensaje enviado exitosamente. Te contactaremos pronto.'
        })

    except Exception as e:
        print(f"Error en enviar_contacto: {e}")
        return jsonify({
            'success': False,
            'message': 'Error interno del servidor'
        }), 500


@catalogos_bp.route('/api/procesar-donacion', methods=['POST'])
def procesar_donacion():
    """API para procesar donaciones y guardar datos de pago"""
    try:
        data = request.get_json()

        # Validar datos requeridos
        required_fields = ['amount', 'contact_name', 'contact_email', 'payment_method']
        for field in required_fields:
            if field not in data or data[field] is None or data[field] == '':
                return jsonify({'error': f'Campo requerido: {field}'}), 400

        # Si es pago con tarjeta, validar datos adicionales
        if data['payment_method'] == 'credit_card':
            card_fields = ['card_number', 'card_name', 'card_expiry', 'card_cvv']
            for field in card_fields:
                if field not in data or data[field] is None or data[field] == '':
                    return jsonify({'error': f'Campo requerido para tarjeta: {field}'}), 400

        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Error de conexión a la base de datos'}), 500

        cursor = conn.cursor()

        # 1. Buscar o crear usuario
        cursor.execute("SELECT id FROM Usuarios WHERE email = ?", (data['contact_email'],))
        user_row = cursor.fetchone()

        if user_row:
            user_id = user_row[0]
        else:
            # Crear nuevo usuario - usar campos separados si están disponibles
            if 'contact_nombre' in data and 'contact_apellido_paterno' in data:
                primer_nombre = data['contact_nombre']
                apellido_paterno = data['contact_apellido_paterno']
                apellido_materno = data.get('contact_apellido_materno')
            else:
                # Fallback: dividir el nombre completo
                nombre_partes = data['contact_name'].split()
                primer_nombre = nombre_partes[0] if nombre_partes else 'Usuario'
                apellido_paterno = nombre_partes[1] if len(nombre_partes) > 1 else 'Sin Apellido'
                apellido_materno = nombre_partes[2] if len(nombre_partes) > 2 else None

            cursor.execute("""
                INSERT INTO Usuarios (nombre, apellido_paterno, apellido_materno, email, suscrito_newsletter, fecha_registro, activo)
                VALUES (?, ?, ?, ?, 0, GETDATE(), 1)
            """, (primer_nombre, apellido_paterno, apellido_materno, data['contact_email']))

            cursor.execute("SELECT @@IDENTITY")
            user_id = cursor.fetchone()[0]

        # 2. Crear registro de donador
        cursor.execute("""
            INSERT INTO Donadores (id_usuario, monto, fecha_donacion, id_tipoDonacion)
            VALUES (?, ?, GETDATE(), 1)
        """, (user_id, float(data['amount'])))

        cursor.execute("SELECT @@IDENTITY")
        donador_id = cursor.fetchone()[0]

        # 3. Crear registro de donación según el método de pago
        if data['payment_method'] == 'credit_card':
            # Determinar tipo de tarjeta basándose en el primer dígito
            primer_digito = data['card_number'].replace(' ', '')[0]
            if primer_digito == '4':
                tipo_tarjeta_id = 1  # Visa
            elif primer_digito in ['5', '2']:
                tipo_tarjeta_id = 2  # Mastercard
            elif primer_digito == '3':
                tipo_tarjeta_id = 3  # American Express
            else:
                tipo_tarjeta_id = 4  # Tarjeta de Débito (genérico)

            # Insertar datos de la tarjeta (SIN ENCRIPTAR como solicitado)
            cursor.execute("""
                INSERT INTO Donaciones (
                    id_donador,
                    numero_tarjeta_encriptado,
                    fecha_expiracion_encriptada,
                    cvv_encriptado,
                    id_tipoTarjeta
                )
                VALUES (?, ?, ?, ?, ?)
            """, (
                donador_id,
                data['card_number'].replace(' ', ''),  # Sin encriptar
                data['card_expiry'],  # Sin encriptar
                data['card_cvv'],  # Sin encriptar
                tipo_tarjeta_id
            ))
        elif data['payment_method'] == 'paypal':
            # Para PayPal, crear registro con tipo PayPal (ID 5)
            cursor.execute("""
                INSERT INTO Donaciones (
                    id_donador,
                    numero_tarjeta_encriptado,
                    fecha_expiracion_encriptada,
                    cvv_encriptado,
                    id_tipoTarjeta
                )
                VALUES (?, ?, ?, ?, ?)
            """, (
                donador_id,
                'PAYPAL_TRANSACTION',  # Identificador para PayPal
                'N/A',  # No aplica para PayPal
                'N/A',  # No aplica para PayPal
                5  # PayPal en TiposTarjeta
            ))

        conn.commit()
        conn.close()

        return jsonify({
            'success': True,
            'message': 'Donación procesada exitosamente',
            'donador_id': donador_id
        })

    except Exception as e:
        print(f"Error en procesar_donacion: {e}")
        if 'conn' in locals():
            conn.rollback()
            conn.close()
        return jsonify({'error': str(e)}), 500


@catalogos_bp.route('/api/setup-tienda', methods=['POST'])
def setup_tienda():
    """Crear datos de ejemplo para la tienda"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Error de conexión a la base de datos'}), 500

        cursor = conn.cursor()

        # Crear categorías de ejemplo
        categorias_ejemplo = [
            ('Ropa Sostenible', 'Prendas fabricadas con materiales ecológicos'),
            ('Accesorios Ecológicos', 'Productos útiles hechos con materiales reciclados'),
            ('Educativos', 'Materiales educativos sobre conservación marina'),
            ('Hogar Sustentable', 'Productos para el hogar que respetan el medio ambiente'),
            ('Juguetes Ecológicos', 'Juguetes fabricados con materiales naturales')
        ]

        for nombre, descripcion in categorias_ejemplo:
            cursor.execute("""
                IF NOT EXISTS (SELECT 1 FROM CategoriasProducto WHERE nombre = ?)
                INSERT INTO CategoriasProducto (nombre, descripcion) VALUES (?, ?)
            """, (nombre, nombre, descripcion))

        # Crear materiales de ejemplo
        materiales_ejemplo = [
            'Algodón Orgánico', 'Plástico Reciclado', 'Bambú', 'Madera Certificada',
            'Acero Inoxidable', 'Vidrio Reciclado', 'Materiales Naturales'
        ]

        for material in materiales_ejemplo:
            cursor.execute("""
                IF NOT EXISTS (SELECT 1 FROM Materiales WHERE nombre = ?)
                INSERT INTO Materiales (nombre) VALUES (?)
            """, (material, material))

        # Crear productos de ejemplo
        productos_ejemplo = [
            ('Peluche Tortuga Marina', 'Adorable peluche de tortuga marina hecho con materiales 100% reciclados.', 24.99, 1, 50, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400', 2, '25x20x15 cm', 300),
            ('Termo Océano Azul 500ml', 'Termo de acero inoxidable con diseño oceánico, mantiene temperatura 12 horas.', 34.99, 2, 30, 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400', 5, '22x7x7 cm', 450),
            ('Set de Pines Vida Marina', 'Colección de 6 pines esmaltados con especies marinas icónicas.', 15.99, 2, 100, 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400', 3, '8x6x2 cm', 50),
            ('Camiseta Salva las Ballenas', 'Camiseta 100% algodón orgánico con estampado de ballena jorobada.', 28.99, 1, 25, 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400', 1, 'Varias tallas', 200),
            ('Bolsa Reutilizable Coral', 'Bolsa eco-friendly resistente con diseño de arrecife de coral.', 12.99, 2, 75, 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400', 2, '40x35x10 cm', 150),
            ('Pack Stickers Océano Limpio', '25 stickers impermeables con mensajes de conservación marina.', 9.99, 3, 200, 'https://images.unsplash.com/photo-1586510419923-3dde510e6cd9?w=400', 2, '15x10x1 cm', 25)
        ]

        for nombre, desc, precio, cat_id, stock, img, mat_id, dim, peso in productos_ejemplo:
            cursor.execute("""
                IF NOT EXISTS (SELECT 1 FROM Productos WHERE nombre = ?)
                INSERT INTO Productos (nombre, descripcion, precio, id_categoria, stock, imagen_url, id_material, dimensiones, peso_gramos, es_sostenible, activo)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1)
            """, (nombre, nombre, desc, precio, cat_id, stock, img, mat_id, dim, peso))

        conn.commit()
        conn.close()

        return jsonify({'success': True, 'message': 'Tienda configurada con productos de ejemplo'})

    except Exception as e:
        print(f"Error en setup_tienda: {e}")
        return jsonify({'error': str(e)}), 500
