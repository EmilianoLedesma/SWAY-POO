from flask import Blueprint, request, jsonify, session
from db import get_db_connection, construir_nombre_completo
from validators import validate_direccion_envio, validate_metodo_pago, ValidationError

pedidos_bp = Blueprint('pedidos', __name__)


@pedidos_bp.route('/api/pedidos/crear', methods=['POST'])
def crear_pedido():
    """Crear nuevo pedido con validación del servidor"""
    try:
        data = request.get_json()

        # Validar datos requeridos
        required_fields = ['user_id', 'productos', 'direccion', 'pago']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'El campo {field} es requerido'}), 400

        # VALIDAR DIRECCIÓN DE ENVÍO usando validators.py
        try:
            direccion_data = data['direccion']
            validated_direccion = validate_direccion_envio(direccion_data)
        except ValidationError as ve:
            return jsonify({'error': str(ve)}), 400

        # VALIDAR MÉTODO DE PAGO usando validators.py
        pago_data = data['pago']
        metodo_pago = pago_data.get('tipo_pago', 'credit_card')
        try:
            validated_pago = validate_metodo_pago(pago_data, metodo_pago)
        except ValidationError as ve:
            return jsonify({'error': str(ve)}), 400

        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Error de conexión a la base de datos'}), 500

        cursor = conn.cursor()

        # 1. Procesar dirección: convertir nombres a IDs
        direccion_data = data['direccion']

        # Función auxiliar para buscar o crear direcciones
        def buscar_o_crear_direccion(direccion_info):
            # Buscar o crear estado
            cursor.execute("SELECT id FROM Estados WHERE nombre = ?", (direccion_info['estado'],))
            estado = cursor.fetchone()
            if not estado:
                cursor.execute("INSERT INTO Estados (nombre) VALUES (?)", (direccion_info['estado'],))
                cursor.execute("SELECT @@IDENTITY")
                estado_id = cursor.fetchone()[0]
            else:
                estado_id = estado[0]

            # Buscar o crear municipio
            cursor.execute("SELECT id FROM Municipios WHERE nombre = ? AND id_estado = ?", (direccion_info['municipio'], estado_id))
            municipio = cursor.fetchone()
            if not municipio:
                cursor.execute("INSERT INTO Municipios (nombre, id_estado) VALUES (?, ?)", (direccion_info['municipio'], estado_id))
                cursor.execute("SELECT @@IDENTITY")
                municipio_id = cursor.fetchone()[0]
            else:
                municipio_id = municipio[0]

            # Buscar o crear colonia
            cursor.execute("SELECT id FROM Colonias WHERE nombre = ? AND id_municipio = ?", (direccion_info['colonia'], municipio_id))
            colonia = cursor.fetchone()
            if not colonia:
                cp = direccion_info.get('codigo_postal')
                cursor.execute("INSERT INTO Colonias (nombre, id_municipio, cp) VALUES (?, ?, ?)", (direccion_info['colonia'], municipio_id, cp))
                cursor.execute("SELECT @@IDENTITY")
                colonia_id = cursor.fetchone()[0]
            else:
                colonia_id = colonia[0]

            # Buscar o crear calle
            cursor.execute("SELECT id FROM Calles WHERE nombre = ? AND id_colonia = ?", (direccion_info['calle'], colonia_id))
            calle = cursor.fetchone()
            if not calle:
                n_exterior = direccion_info.get('numero_exterior')
                n_interior = direccion_info.get('numero_interior')
                cursor.execute("INSERT INTO Calles (nombre, id_colonia, n_exterior, n_interior) VALUES (?, ?, ?, ?)",
                             (direccion_info['calle'], colonia_id, n_exterior, n_interior))
                cursor.execute("SELECT @@IDENTITY")
                calle_id = cursor.fetchone()[0]
            else:
                calle_id = calle[0]

            return calle_id

        # Obtener el id_calle
        id_calle = buscar_o_crear_direccion(direccion_data)

        # Crear dirección si no existe
        cursor.execute("""
            INSERT INTO Direcciones (id_calle)
            VALUES (?)
        """, (id_calle,))

        cursor.execute("SELECT @@IDENTITY")
        direccion_id = cursor.fetchone()[0]

        # 2. Calcular total del pedido
        total = 0
        productos = data['productos']

        for item in productos:
            cursor.execute("SELECT precio FROM Productos WHERE id = ?", (item['id'],))
            producto = cursor.fetchone()
            if producto:
                precio = float(producto[0])
                cantidad = int(item['quantity'])
                subtotal = precio * cantidad
                total += subtotal

        # 3. Crear pedido con estatus inicial (1 = Pendiente)
        cursor.execute("""
            INSERT INTO Pedidos (id_usuario, total, id_estatus, id_direccion, telefono_contacto)
            VALUES (?, ?, ?, ?, ?)
        """, (
            data['user_id'],
            total,
            1,  # Estatus pendiente
            direccion_id,
            direccion_data.get('telefono_contacto', '')
        ))

        cursor.execute("SELECT @@IDENTITY")
        pedido_id = cursor.fetchone()[0]

        # 4. Crear detalles del pedido
        for item in productos:
            cursor.execute("SELECT precio FROM Productos WHERE id = ?", (item['id'],))
            producto = cursor.fetchone()
            if producto:
                precio_unitario = float(producto[0])
                # El frontend envía 'quantity', no 'cantidad'
                cantidad = int(item.get('quantity', item.get('cantidad', 1)))
                subtotal = precio_unitario * cantidad

                cursor.execute("""
                    INSERT INTO DetallesPedido (id_pedido, id_producto, cantidad, precio_unitario, subtotal)
                    VALUES (?, ?, ?, ?, ?)
                """, (pedido_id, item['id'], cantidad, precio_unitario, subtotal))

        # 5. Procesar pago
        pago_data = data['pago']

        # Procesar el pago según el método seleccionado
        if pago_data.get('tipo_pago') == 'paypal':
            # Para PayPal, usar valores especiales como en donaciones
            cursor.execute("""
                INSERT INTO PagosPedidos (id_pedido, numero_tarjeta, fecha_expiracion, cvv, nombre_tarjeta, id_tipoTarjeta, monto, id_estatus)
                VALUES (?, ?, ?, ?, ?, ?, ?, 3)
            """, (
                pedido_id,
                'PAYPAL_TRANS',  # Identificador corto para PayPal (máx 16 chars)
                'N/A',           # No aplica fecha de expiración
                'N/A',           # No aplica CVV
                'PayPal User',   # Nombre genérico
                5,               # PayPal es ID 5 según los datos
                total
            ))
        else:
            # Para tarjetas de crédito/débito, limpiar el número (sin espacios)
            numero_limpio = pago_data.get('numero_tarjeta', '').replace(' ', '')

            # Determinar tipo de tarjeta basado en el primer dígito
            tipo_tarjeta_id = 1  # Default: Visa
            if numero_limpio.startswith('5'):
                tipo_tarjeta_id = 2  # Mastercard
            elif numero_limpio.startswith('3'):
                tipo_tarjeta_id = 3  # American Express
            # Otros casos podrían ser tarjeta de débito (ID 4)

            cursor.execute("""
                INSERT INTO PagosPedidos (id_pedido, numero_tarjeta, fecha_expiracion, cvv, nombre_tarjeta, id_tipoTarjeta, monto, id_estatus)
                VALUES (?, ?, ?, ?, ?, ?, ?, 3)
            """, (
                pedido_id,
                numero_limpio,  # Sin espacios para que quepa en varchar(16)
                pago_data.get('fecha_expiracion', ''),
                pago_data.get('cvv', ''),
                pago_data.get('nombre_tarjeta', ''),
                tipo_tarjeta_id,
                total
            ))

        # 6. Actualizar stock de productos
        for item in productos:
            # El frontend envía 'quantity', no 'cantidad'
            cantidad = int(item.get('quantity', item.get('cantidad', 1)))
            cursor.execute("""
                UPDATE Productos
                SET stock = stock - ?
                WHERE id = ?
            """, (cantidad, item['id']))

        # 7. Actualizar estatus del pedido a "Pagado"
        cursor.execute("UPDATE Pedidos SET id_estatus = 3 WHERE id = ?", (pedido_id,))

        conn.commit()
        conn.close()

        return jsonify({
            'success': True,
            'pedido_id': pedido_id,
            'total': total,
            'message': 'Pedido creado exitosamente'
        })

    except Exception as e:
        import traceback
        print(f"Error en crear_pedido: {e}")
        print(f"Traceback: {traceback.format_exc()}")
        return jsonify({'error': f'Error interno del servidor: {str(e)}'}), 500


@pedidos_bp.route('/api/pedidos/usuario/<int:user_id>')
def get_pedidos_usuario(user_id):
    """Obtener pedidos de un usuario"""
    try:
        # Verificar que el usuario esté autenticado y sea el mismo que solicita los pedidos
        if 'tienda_user_id' not in session:
            return jsonify({'error': 'Usuario no autenticado'}), 401

        if session['tienda_user_id'] != user_id:
            return jsonify({'error': 'No autorizado para ver estos pedidos'}), 403

        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Error de conexión a la base de datos'}), 500

        cursor = conn.cursor()
        cursor.execute("""
            SELECT p.id, p.fecha_pedido, p.total, e.nombre as estatus
            FROM Pedidos p
            JOIN Estatus e ON p.id_estatus = e.id
            WHERE p.id_usuario = ?
            ORDER BY p.fecha_pedido DESC
        """, (user_id,))

        pedidos = []
        for row in cursor.fetchall():
            pedidos.append({
                'id': row.id,
                'fecha_pedido': row.fecha_pedido.isoformat() if row.fecha_pedido else None,
                'total': float(row.total),
                'estatus': row.estatus
            })

        conn.close()
        return jsonify({'pedidos': pedidos})

    except Exception as e:
        print(f"Error en get_pedidos_usuario: {e}")
        return jsonify({'error': 'Error interno del servidor'}), 500


@pedidos_bp.route('/api/pedidos/mis-pedidos')
def get_mis_pedidos():
    """Obtener pedidos del usuario autenticado"""
    try:
        # Verificar que el usuario esté autenticado
        if 'tienda_user_id' not in session:
            return jsonify({'error': 'Usuario no autenticado'}), 401

        user_id = session['tienda_user_id']

        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Error de conexión a la base de datos'}), 500

        cursor = conn.cursor()
        cursor.execute("""
            SELECT p.id, p.fecha_pedido, p.total, e.nombre as estatus
            FROM Pedidos p
            JOIN Estatus e ON p.id_estatus = e.id
            WHERE p.id_usuario = ?
            ORDER BY p.fecha_pedido DESC
        """, (user_id,))

        pedidos = []
        for row in cursor.fetchall():
            pedidos.append({
                'id': row.id,
                'fecha_pedido': row.fecha_pedido.isoformat() if row.fecha_pedido else None,
                'total': float(row.total),
                'estatus': row.estatus
            })

        conn.close()
        return jsonify({'pedidos': pedidos})

    except Exception as e:
        print(f"Error en get_mis_pedidos: {e}")
        return jsonify({'error': 'Error interno del servidor'}), 500


@pedidos_bp.route('/api/tipos-tarjeta')
def get_tipos_tarjeta():
    """Obtener tipos de tarjeta disponibles"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Error de conexión a la base de datos'}), 500

        cursor = conn.cursor()
        cursor.execute("SELECT id, nombre FROM TiposTarjeta ORDER BY nombre")

        tipos = []
        for row in cursor.fetchall():
            tipos.append({
                'id': row.id,
                'nombre': row.nombre
            })

        conn.close()
        return jsonify({'tipos_tarjeta': tipos})

    except Exception as e:
        print(f"Error en get_tipos_tarjeta: {e}")
        return jsonify({'error': 'Error interno del servidor'}), 500


@pedidos_bp.route('/api/pedidos/detalle/<int:pedido_id>')
def get_pedido_detalle(pedido_id):
    """Obtener detalles completos de un pedido"""
    try:
        # Verificar que el usuario esté autenticado
        if 'tienda_user_id' not in session:
            return jsonify({'error': 'Usuario no autenticado'}), 401

        user_id = session['tienda_user_id']

        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Error de conexión a la base de datos'}), 500

        cursor = conn.cursor()

        # Verificar que el pedido pertenece al usuario autenticado
        cursor.execute("SELECT id_usuario FROM Pedidos WHERE id = ?", (pedido_id,))
        pedido_owner = cursor.fetchone()

        if not pedido_owner or pedido_owner.id_usuario != user_id:
            return jsonify({'error': 'No autorizado para ver este pedido'}), 403

        # Obtener información del pedido
        cursor.execute("""
            SELECT p.id, p.fecha_pedido, p.total, e.nombre as estatus, p.telefono_contacto,
                   CONCAT(ca.nombre, ', ', co.nombre, ', ', m.nombre, ', ', es.nombre) as direccion_completa
            FROM Pedidos p
            JOIN Estatus e ON p.id_estatus = e.id
            LEFT JOIN Direcciones d ON p.id_direccion = d.id
            LEFT JOIN Calles ca ON d.id_calle = ca.id
            LEFT JOIN Colonias co ON ca.id_colonia = co.id
            LEFT JOIN Municipios m ON co.id_municipio = m.id
            LEFT JOIN Estados es ON m.id_estado = es.id
            WHERE p.id = ?
        """, (pedido_id,))

        pedido_row = cursor.fetchone()
        if not pedido_row:
            return jsonify({'error': 'Pedido no encontrado'}), 404

        # Obtener detalles del pedido
        cursor.execute("""
            SELECT dp.cantidad, dp.precio_unitario, dp.subtotal, pr.nombre as producto_nombre
            FROM DetallesPedido dp
            JOIN Productos pr ON dp.id_producto = pr.id
            WHERE dp.id_pedido = ?
        """, (pedido_id,))

        detalles = []
        for row in cursor.fetchall():
            detalles.append({
                'cantidad': row.cantidad,
                'precio_unitario': float(row.precio_unitario),
                'subtotal': float(row.subtotal),
                'producto_nombre': row.producto_nombre
            })

        pedido = {
            'id': pedido_row.id,
            'fecha_pedido': pedido_row.fecha_pedido.isoformat() if pedido_row.fecha_pedido else None,
            'total': float(pedido_row.total),
            'estatus': pedido_row.estatus,
            'telefono_contacto': pedido_row.telefono_contacto,
            'direccion': pedido_row.direccion_completa,
            'detalles': detalles
        }

        conn.close()
        return jsonify({'pedido': pedido})

    except Exception as e:
        print(f"Error en get_pedido_detalle: {e}")
        return jsonify({'error': 'Error interno del servidor'}), 500


@pedidos_bp.route('/api/pedidos/reordenar/<int:pedido_id>', methods=['POST'])
def reordenar_pedido(pedido_id):
    """Reordenar un pedido (agregar productos al carrito)"""
    try:
        # Verificar que el usuario esté autenticado
        if 'tienda_user_id' not in session:
            return jsonify({'error': 'Usuario no autenticado'}), 401

        user_id = session['tienda_user_id']

        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Error de conexión a la base de datos'}), 500

        cursor = conn.cursor()

        # Verificar que el pedido pertenece al usuario autenticado
        cursor.execute("SELECT id_usuario FROM Pedidos WHERE id = ?", (pedido_id,))
        pedido_owner = cursor.fetchone()

        if not pedido_owner or pedido_owner.id_usuario != user_id:
            return jsonify({'error': 'No autorizado para reordenar este pedido'}), 403

        # Obtener productos del pedido original
        cursor.execute("""
            SELECT dp.id_producto, dp.cantidad, pr.nombre, pr.precio, pr.stock, pr.imagen_url
            FROM DetallesPedido dp
            JOIN Productos pr ON dp.id_producto = pr.id
            WHERE dp.id_pedido = ? AND pr.activo = 1
        """, (pedido_id,))

        productos = []
        for row in cursor.fetchall():
            if row.stock >= row.cantidad:  # Solo agregar si hay stock suficiente
                productos.append({
                    'id': row.id_producto,
                    'nombre': row.nombre,
                    'precio': float(row.precio),
                    'cantidad': row.cantidad,
                    'imagen_url': row.imagen_url,
                    'stock': row.stock
                })

        conn.close()

        if not productos:
            return jsonify({'error': 'No hay productos disponibles para reordenar'}), 400

        return jsonify({
            'success': True,
            'productos': productos,
            'message': f'Se agregaron {len(productos)} productos al carrito'
        })

    except Exception as e:
        print(f"Error en reordenar_pedido: {e}")
        return jsonify({'error': 'Error interno del servidor'}), 500


@pedidos_bp.route('/api/carrito/agregar', methods=['POST'])
def agregar_al_carrito():
    """Agregar producto al carrito (usando localStorage del frontend)"""
    try:
        data = request.get_json()

        if not data.get('producto_id') or not data.get('cantidad'):
            return jsonify({'error': 'ID de producto y cantidad son requeridos'}), 400

        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Error de conexión a la base de datos'}), 500

        cursor = conn.cursor()

        # Verificar que el producto existe y hay stock suficiente
        cursor.execute("""
            SELECT id, nombre, precio, stock, activo
            FROM Productos
            WHERE id = ?
        """, (data['producto_id'],))

        producto = cursor.fetchone()

        if not producto or not producto.activo:
            return jsonify({'error': 'Producto no encontrado'}), 404

        if producto.stock < int(data['cantidad']):
            return jsonify({'error': 'Stock insuficiente'}), 400

        conn.close()

        return jsonify({
            'success': True,
            'producto': {
                'id': producto.id,
                'nombre': producto.nombre,
                'precio': float(producto.precio),
                'stock': producto.stock
            }
        })

    except Exception as e:
        print(f"Error en agregar_al_carrito: {e}")
        return jsonify({'error': 'Error interno del servidor'}), 500
