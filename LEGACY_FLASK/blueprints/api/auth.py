from flask import Blueprint, request, jsonify, session
from db import get_db_connection, construir_nombre_completo

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/api/user/login', methods=['POST'])
def user_login():
    """Iniciar sesión"""
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')

        if not email or not password:
            return jsonify({
                'success': False,
                'message': 'Email y contraseña son requeridos'
            }), 400

        conn = get_db_connection()
        if not conn:
            return jsonify({
                'success': False,
                'message': 'Error de conexión a la base de datos'
            }), 500

        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, nombre, apellido_paterno, apellido_materno,
                   email, password_hash, telefono, activo
            FROM Usuarios
            WHERE email = ? AND activo = 1
        """, (email,))

        user = cursor.fetchone()
        conn.close()

        if user and user.password_hash == password:
            # Construir nombre completo evitando duplicación
            nombre_completo = construir_nombre_completo(user.nombre, user.apellido_paterno, user.apellido_materno)

            # Crear sesión para tienda
            session['tienda_user_id'] = user.id
            session['tienda_user_name'] = nombre_completo
            session['tienda_user_email'] = user.email

            return jsonify({
                'success': True,
                'message': 'Login exitoso',
                'user': {
                    'id': user.id,
                    'nombre': nombre_completo,
                    'email': user.email,
                    'telefono': user.telefono
                }
            })
        else:
            return jsonify({
                'success': False,
                'message': 'Credenciales incorrectas'
            }), 401

    except Exception as e:
        import traceback
        print(f"Error en login: {e}")
        print(f"Traceback: {traceback.format_exc()}")
        return jsonify({
            'success': False,
            'message': 'Error interno del servidor'
        }), 500


@auth_bp.route('/api/user/register', methods=['POST'])
def user_register():
    """Registrar nuevo usuario"""
    try:
        data = request.get_json()
        nombre = data.get('nombre')
        apellidoPaterno = data.get('apellidoPaterno')
        apellidoMaterno = data.get('apellidoMaterno')
        email = data.get('email')
        password = data.get('password')
        telefono = data.get('telefono')
        fecha_nacimiento = data.get('fecha_nacimiento')
        newsletter = data.get('newsletter', False)

        print(f"Datos de registro recibidos: {data}")

        if not all([nombre, apellidoPaterno, email, password]):
            return jsonify({
                'success': False,
                'message': 'Nombre, apellido paterno, email y contraseña son requeridos'
            }), 400

        conn = get_db_connection()
        if not conn:
            return jsonify({
                'success': False,
                'message': 'Error de conexión a la base de datos'
            }), 500

        cursor = conn.cursor()

        # Verificar si el email ya existe
        cursor.execute("SELECT id FROM Usuarios WHERE email = ?", (email,))
        if cursor.fetchone():
            conn.close()
            return jsonify({
                'success': False,
                'message': 'El email ya está registrado'
            }), 400

        # Crear el usuario con los campos separados ya recibidos
        cursor.execute("""
            INSERT INTO Usuarios (nombre, apellido_paterno, apellido_materno, email, password_hash, telefono, fecha_nacimiento, suscrito_newsletter, activo, fecha_registro)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, GETDATE())
        """, (nombre, apellidoPaterno, apellidoMaterno, email, password, telefono, fecha_nacimiento, newsletter))

        conn.commit()

        # Obtener el ID del usuario creado
        cursor.execute("SELECT @@IDENTITY")
        user_id = cursor.fetchone()[0]

        conn.close()

        # Crear sesión automáticamente para tienda
        nombre_completo = nombre + ' ' + apellidoPaterno + (' ' + apellidoMaterno if apellidoMaterno else '')
        session['tienda_user_id'] = user_id
        session['tienda_user_name'] = nombre_completo
        session['tienda_user_email'] = email

        return jsonify({
            'success': True,
            'message': 'Registro exitoso',
            'user': {
                'id': user_id,
                'nombre': nombre_completo,
                'email': email,
                'telefono': telefono
            }
        })

    except Exception as e:
        import traceback
        print(f"Error en registro: {e}")
        print(f"Traceback: {traceback.format_exc()}")
        return jsonify({
            'success': False,
            'message': 'Error interno del servidor'
        }), 500


@auth_bp.route('/api/user/logout', methods=['POST'])
def logout():
    """Cerrar sesión del usuario de tienda"""
    try:
        # Limpiar solo las claves de sesión de tienda
        keys_to_remove = ['tienda_user_id', 'tienda_user_name', 'tienda_user_email']
        for key in keys_to_remove:
            session.pop(key, None)
        return jsonify({'success': True, 'message': 'Sesión de tienda cerrada exitosamente'})
    except Exception as e:
        print(f"Error en logout tienda: {e}")
        return jsonify({'success': False, 'error': 'Error al cerrar sesión'}), 500


@auth_bp.route('/api/user/status')
def user_status():
    """Verificar estado de sesión"""
    try:
        if 'tienda_user_id' in session:
            # Obtener información completa del usuario desde la base de datos
            conn = get_db_connection()
            cursor = conn.cursor()

            cursor.execute("""
                SELECT id, nombre, apellido_paterno, apellido_materno,
                       email, telefono, fecha_registro, fecha_nacimiento
                FROM Usuarios
                WHERE id = ?
            """, (session['tienda_user_id'],))

            user = cursor.fetchone()
            conn.close()

            if user:
                # Construir nombre completo evitando duplicación
                nombre_completo = construir_nombre_completo(user[1], user[2], user[3])

                return jsonify({
                    'success': True,
                    'user': {
                        'id': user[0],
                        'nombre': nombre_completo,
                        'email': user[4],
                        'telefono': user[5],
                        'fecha_registro': user[6].isoformat() if user[6] else None,
                        'fecha_nacimiento': user[7].isoformat() if user[7] else None
                    }
                })
            else:
                # Usuario no encontrado en la base de datos, limpiar sesión de tienda
                keys_to_remove = ['tienda_user_id', 'tienda_user_name', 'tienda_user_email']
                for key in keys_to_remove:
                    session.pop(key, None)
                return jsonify({
                    'success': False,
                    'message': 'Usuario no encontrado'
                }), 401
        else:
            return jsonify({
                'success': False,
                'message': 'No hay sesión activa'
            }), 401
    except Exception as e:
        print(f"Error en user_status: {e}")
        return jsonify({
            'success': False,
            'message': 'Error al verificar sesión'
        }), 500


@auth_bp.route('/api/auth/register', methods=['POST'])
def auth_register():
    """Registrar nuevo usuario"""
    try:
        data = request.get_json()

        # Validar datos requeridos
        required_fields = ['nombre', 'email', 'password', 'telefono']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'El campo {field} es requerido'}), 400

        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Error de conexión a la base de datos'}), 500

        cursor = conn.cursor()

        # Verificar si el email ya existe
        cursor.execute("SELECT id FROM Usuarios WHERE email = ?", (data['email'],))
        if cursor.fetchone():
            return jsonify({'error': 'El email ya está registrado'}), 400

        # Insertar nuevo usuario - usar campos separados si están disponibles
        if 'apellidoPaterno' in data and data['apellidoPaterno']:
            primer_nombre = data['nombre']
            apellido_paterno = data['apellidoPaterno']
            apellido_materno = data.get('apellidoMaterno')
        else:
            # Fallback: dividir el nombre completo
            nombre_partes = data['nombre'].split()
            primer_nombre = nombre_partes[0] if nombre_partes else 'Usuario'
            apellido_paterno = nombre_partes[1] if len(nombre_partes) > 1 else 'Sin Apellido'
            apellido_materno = nombre_partes[2] if len(nombre_partes) > 2 else None

        cursor.execute("""
            INSERT INTO Usuarios (nombre, apellido_paterno, apellido_materno, email, password_hash, telefono, fecha_nacimiento, suscrito_newsletter)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            primer_nombre,
            apellido_paterno,
            apellido_materno,
            data['email'],
            data['password'],  # En proyecto real se haría hash
            data['telefono'],
            data.get('fecha_nacimiento'),
            data.get('newsletter', False)
        ))

        conn.commit()

        # Obtener el ID del usuario creado
        cursor.execute("SELECT @@IDENTITY")
        user_id = cursor.fetchone()[0]

        conn.close()

        return jsonify({
            'success': True,
            'message': 'Usuario registrado exitosamente',
            'user_id': user_id
        })

    except Exception as e:
        print(f"Error en register: {e}")
        return jsonify({'error': 'Error interno del servidor'}), 500


@auth_bp.route('/api/auth/login', methods=['POST'])
def auth_login():
    """Iniciar sesión"""
    try:
        data = request.get_json()

        if not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Email y contraseña son requeridos'}), 400

        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Error de conexión a la base de datos'}), 500

        cursor = conn.cursor()

        # Buscar usuario
        cursor.execute("""
            SELECT id, nombre, apellido_paterno, apellido_materno,
                   email, telefono, activo
            FROM Usuarios
            WHERE email = ? AND password_hash = ?
        """, (data['email'], data['password']))

        user = cursor.fetchone()

        if not user or not user.activo:
            return jsonify({'error': 'Credenciales inválidas'}), 401

        conn.close()

        # Construir nombre completo evitando duplicación
        nombre_completo = construir_nombre_completo(user.nombre, user.apellido_paterno, user.apellido_materno)

        return jsonify({
            'success': True,
            'user': {
                'id': user.id,
                'nombre': nombre_completo,
                'email': user.email,
                'telefono': user.telefono
            }
        })

    except Exception as e:
        print(f"Error en login: {e}")
        return jsonify({'error': 'Error interno del servidor'}), 500
