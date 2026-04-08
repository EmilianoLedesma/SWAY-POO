from flask import Blueprint, request, jsonify, session
from db import get_db_connection, construir_nombre_completo
import pyodbc

colaboradores_bp = Blueprint('colaboradores', __name__)


@colaboradores_bp.route('/api/colaboradores/login', methods=['POST'])
def colaborador_login():
    """API para login de colaboradores"""
    try:
        data = request.get_json()

        if not data or not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Email y contraseña son requeridos'}), 400

        email = data['email'].strip().lower()
        password = data['password']

        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Error de conexión a la base de datos'}), 500

        cursor = conn.cursor()

        # Buscar usuario y verificar si es colaborador activo
        cursor.execute("""
            SELECT u.id, u.nombre, u.apellido_paterno, u.apellido_materno, u.email,
                   u.password_hash, c.id as colaborador_id, c.especialidad, c.estado_solicitud,
                   c.institucion, c.años_experiencia, c.grado_academico
            FROM Usuarios u
            INNER JOIN Colaboradores c ON u.id = c.id_usuario
            WHERE LOWER(u.email) = ? AND c.estado_solicitud = 'aprobada' AND c.activo = 1
        """, (email,))

        user = cursor.fetchone()
        conn.close()

        if not user:
            return jsonify({'error': 'Usuario no encontrado o no es un colaborador activo'}), 401

        # Validar contraseña
        if user[5] != password:  # password_hash está en índice 5 ahora
            return jsonify({'error': 'Contraseña incorrecta'}), 401

        # Construir nombre completo evitando duplicación
        nombre_completo = construir_nombre_completo(user[1], user[2], user[3])

        # Crear sesión para el colaborador
        session['colab_user_id'] = user[0]
        session['colab_user_email'] = user[4]
        session['colab_user_name'] = nombre_completo
        session['colab_colaborador_id'] = user[6]
        session['colab_user_type'] = 'colaborador'

        return jsonify({
            'success': True,
            'message': 'Login exitoso',
            'user': {
                'id': user[0],
                'nombre': user[1],
                'apellido_paterno': user[2],
                'apellido_materno': user[3],
                'nombre_completo': nombre_completo,
                'email': user[4],
                'colaborador_id': user[6],
                'especialidad': user[7],
                'institucion': user[9],
                'años_experiencia': user[10],
                'grado_academico': user[11]
            }
        })

    except Exception as e:
        print(f"Error en colaborador_login: {e}")
        return jsonify({'error': str(e)}), 500


@colaboradores_bp.route('/api/colaboradores/register', methods=['POST'])
def colaborador_register():
    """API para registro de nuevos colaboradores"""
    try:
        data = request.get_json()

        # Validar datos obligatorios
        required_fields = ['nombre', 'email', 'password', 'especialidad', 'grado_academico',
                          'institucion', 'años_experiencia', 'motivacion']

        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'El campo {field} es obligatorio'}), 400

        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Error de conexión a la base de datos'}), 500

        cursor = conn.cursor()

        # Verificar si el usuario ya existe
        cursor.execute("SELECT id FROM Usuarios WHERE LOWER(email) = ?", (data['email'].lower(),))
        existing_user = cursor.fetchone()

        if existing_user:
            # Usuario existe, verificar si ya es colaborador
            cursor.execute("""
                SELECT estado_solicitud FROM Colaboradores
                WHERE id_usuario = ? AND estado_solicitud IN ('pendiente', 'aprobada')
            """, (existing_user[0],))

            existing_collaborator = cursor.fetchone()
            if existing_collaborator:
                estado = existing_collaborator[0]
                if estado == 'pendiente':
                    return jsonify({'error': 'Ya tienes una solicitud de colaboración pendiente'}), 400
                elif estado == 'aprobada':
                    return jsonify({'error': 'Ya eres un colaborador activo'}), 400

            # Usuario existe pero no es colaborador, usar su ID
            user_id = existing_user[0]
        else:
            # Crear nuevo usuario - usar campos separados si están disponibles
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
                INSERT INTO Usuarios (nombre, apellido_paterno, apellido_materno, email, password_hash, suscrito_newsletter, activo)
                OUTPUT INSERTED.id
                VALUES (?, ?, ?, ?, ?, 0, 1)
            """, (primer_nombre, apellido_paterno, apellido_materno, data['email'].lower(), data['password']))

            # Obtener el ID del usuario recién insertado
            user_result = cursor.fetchone()
            if not user_result:
                raise Exception("No se pudo obtener el ID del usuario creado")
            user_id = user_result[0]
            print(f"Usuario creado con ID: {user_id}")  # Debug

        # Crear solicitud de colaboración (por defecto se aprueba automáticamente)
        cursor.execute("""
            INSERT INTO Colaboradores (
                id_usuario, especialidad, grado_academico, institucion,
                años_experiencia, numero_cedula, orcid, motivacion,
                estado_solicitud, fecha_aprobacion, aprobado_por
            ) OUTPUT INSERTED.id
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'aprobada', GETDATE(), NULL)
        """, (
            user_id,
            data['especialidad'],
            data['grado_academico'],
            data['institucion'],
            data['años_experiencia'],
            data.get('numero_cedula', None),
            data.get('orcid', None),
            data['motivacion']
        ))

        # Obtener el ID del colaborador recién insertado
        colaborador_result = cursor.fetchone()
        if not colaborador_result:
            raise Exception("No se pudo obtener el ID del colaborador creado")
        colaborador_id = colaborador_result[0]

        conn.commit()
        conn.close()

        return jsonify({
            'success': True,
            'message': 'Registro exitoso. Has sido aprobado como colaborador científico.',
            'colaborador_id': colaborador_id,
            'user_id': user_id
        })

    except pyodbc.IntegrityError as e:
        print(f"Error de integridad en colaborador_register: {e}")
        if 'conn' in locals():
            conn.rollback()
            conn.close()

        # Proporcionar más detalles del error para debugging
        error_message = str(e)
        if 'UNIQUE constraint failed' in error_message or 'duplicate' in error_message.lower():
            return jsonify({'error': 'Este email ya está registrado como colaborador'}), 400
        elif 'FOREIGN KEY constraint failed' in error_message or 'foreign key' in error_message.lower():
            return jsonify({'error': 'Error de referencia en los datos'}), 400
        else:
            return jsonify({'error': f'Error de integridad: {error_message}'}), 400

    except Exception as e:
        print(f"Error en colaborador_register: {e}")
        if 'conn' in locals():
            conn.rollback()
            conn.close()
        return jsonify({'error': str(e)}), 500


@colaboradores_bp.route('/api/colaboradores/logout', methods=['POST'])
def logout_colaborador():
    """Cerrar sesión del colaborador"""
    try:
        # Limpiar solo las claves de sesión de colaborador
        keys_to_remove = ['colab_user_id', 'colab_user_name', 'colab_user_email', 'colab_colaborador_id', 'colab_user_type']
        for key in keys_to_remove:
            session.pop(key, None)
        return jsonify({'success': True, 'message': 'Sesión de colaborador cerrada exitosamente'})
    except Exception as e:
        print(f"Error en logout colaborador: {e}")
        return jsonify({'success': False, 'error': 'Error al cerrar sesión'}), 500


@colaboradores_bp.route('/api/colaboradores/profile', methods=['GET'])
def get_colaborador_profile():
    """Obtener perfil del colaborador desde session"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'success': False, 'error': 'Error de conexión a la base de datos'}), 500

        cursor = conn.cursor()

        # Obtener email del colaborador desde la sesión
        colaborador_email = session.get('colab_user_email')
        if not colaborador_email:
            conn.close()
            return jsonify({'success': False, 'error': 'No hay sesión activa de colaborador'}), 401

        cursor.execute("""
            SELECT c.id, c.especialidad, c.grado_academico, c.institucion,
                   c.años_experiencia, c.numero_cedula, c.orcid, c.estado_solicitud,
                   u.nombre, u.apellido_paterno, u.apellido_materno, u.email
            FROM Colaboradores c
            JOIN Usuarios u ON c.id_usuario = u.id
            WHERE u.email = ?
        """, (colaborador_email,))

        row = cursor.fetchone()

        if row:
            # Debug: imprimir el valor raw de años_experiencia
            print(f"Valor raw años_experiencia desde BD: '{row[4]}'")

            # Construir nombre completo evitando duplicación
            nombre_completo = construir_nombre_completo(row[8], row[9], row[10], "Dr. ")

            # Procesar años de experiencia
            experiencia_raw = row[4]
            if experiencia_raw is None:
                experiencia_procesada = '0'
            else:
                # Limpiar el valor si viene con texto
                experiencia_procesada = str(experiencia_raw).replace(' años', '').replace(' año', '').strip()
                # Si después de limpiar queda vacío, usar 0
                if not experiencia_procesada:
                    experiencia_procesada = '0'

            print(f"Valor procesado años_experiencia: '{experiencia_procesada}'")

            colaborador = {
                'id': row[0],
                'especialidad': row[1],
                'grado_academico': row[2],
                'institucion': row[3],
                'años_experiencia': experiencia_procesada,
                'numero_cedula': row[5],
                'orcid': row[6],
                'estado_solicitud': row[7],
                'nombre': row[8],
                'apellido_paterno': row[9],
                'apellido_materno': row[10],
                'nombre_completo': nombre_completo,
                'email': row[11]
            }

            conn.close()
            return jsonify({
                'success': True,
                'colaborador': colaborador
            })
        else:
            conn.close()
            return jsonify({'success': False, 'error': 'Colaborador no encontrado o no autenticado'}), 404

    except Exception as e:
        print(f"Error en get_colaborador_profile: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@colaboradores_bp.route('/api/colaboradores/status')
def colaborador_status():
    """Verificar estado de sesión de colaborador"""
    try:
        if 'colab_user_id' in session:
            return jsonify({
                'success': True,
                'user': {
                    'id': session['colab_user_id'],
                    'name': session.get('colab_user_name', 'Usuario'),
                    'email': session.get('colab_user_email', ''),
                    'colaborador_id': session.get('colab_colaborador_id', ''),
                    'user_type': 'colaborador'
                }
            })
        else:
            return jsonify({
                'success': False,
                'message': 'No hay sesión activa de colaborador'
            }), 401
    except Exception as e:
        print(f"Error en colaborador_status: {e}")
        return jsonify({
            'success': False,
            'message': 'Error al verificar sesión'
        }), 500


@colaboradores_bp.route('/api/colaboradores/check-email', methods=['POST'])
def check_collaborator_email():
    """API para verificar si un email ya está registrado como colaborador"""
    try:
        data = request.get_json()

        if not data or not data.get('email'):
            return jsonify({'error': 'Email es requerido'}), 400

        email = data['email'].strip().lower()

        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Error de conexión a la base de datos'}), 500

        cursor = conn.cursor()

        # Verificar si existe usuario con este email y su estado como colaborador
        cursor.execute("""
            SELECT u.id, c.estado_solicitud, c.activo
            FROM Usuarios u
            LEFT JOIN Colaboradores c ON u.id = c.id_usuario
            WHERE LOWER(u.email) = ?
        """, (email,))

        result = cursor.fetchone()
        conn.close()

        if not result:
            return jsonify({'exists': False, 'can_register': True})

        user_id, estado_solicitud, activo = result

        if estado_solicitud == 'pendiente':
            return jsonify({
                'exists': True,
                'can_register': False,
                'message': 'Ya tienes una solicitud pendiente'
            })
        elif estado_solicitud == 'aprobada' and activo:
            return jsonify({
                'exists': True,
                'can_register': False,
                'message': 'Ya eres un colaborador activo'
            })
        else:
            return jsonify({'exists': True, 'can_register': True})

    except Exception as e:
        print(f"Error en check_collaborator_email: {e}")
        return jsonify({'error': str(e)}), 500


@colaboradores_bp.route('/api/colaboradores/avistamientos', methods=['GET'])
def get_colaborador_avistamientos():
    """Obtener avistamientos del colaborador actual"""
    try:
        # En una implementación real, obtendrías el email del colaborador de la sesión
        # Por ahora, usamos un email de ejemplo
        colaborador_email = "maria.gonzalez@universidad.edu"

        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Error de conexión a la base de datos'}), 500

        cursor = conn.cursor()
        cursor.execute("""
            SELECT a.id, a.fecha, a.latitud, a.longitud, a.notas,
                   e.nombre_comun as especie_nombre, e.nombre_cientifico
            FROM Avistamientos a
            JOIN Especies e ON a.id_especie = e.id
            JOIN Usuarios u ON a.id_usuario = u.id
            WHERE u.email = ?
            ORDER BY a.fecha DESC
        """, (colaborador_email,))

        avistamientos = []
        for row in cursor.fetchall():
            avistamientos.append({
                'id': row[0],
                'fecha': row[1].isoformat() if row[1] else None,
                'latitud': float(row[2]) if row[2] else None,
                'longitud': float(row[3]) if row[3] else None,
                'notas': row[4],
                'especie_nombre': row[5],
                'especie_cientifica': row[6]
            })

        conn.close()
        return jsonify({'success': True, 'avistamientos': avistamientos})

    except Exception as e:
        print(f"Error en get_colaborador_avistamientos: {e}")
        return jsonify({'error': str(e)}), 500
