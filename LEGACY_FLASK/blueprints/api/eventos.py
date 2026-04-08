from flask import Blueprint, request, jsonify, session
from db import get_db_connection, construir_nombre_completo

eventos_bp = Blueprint('eventos', __name__)


@eventos_bp.route('/api/eventos', methods=['GET'])
def get_eventos():
    """Obtener eventos para el calendario"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Error de conexión a la base de datos'}), 500

        cursor = conn.cursor()

        # Obtener parámetros de consulta
        tipo_evento = request.args.get('tipo', '')
        modalidad = request.args.get('modalidad', '')
        fecha_inicio = request.args.get('fecha_inicio', '')
        fecha_fin = request.args.get('fecha_fin', '')

        # Construir consulta SQL
        query = """
            SELECT
                e.id,
                e.titulo,
                e.descripcion,
                e.fecha_evento,
                e.hora_inicio,
                e.hora_fin,
                e.url_evento,
                e.capacidad_maxima,
                e.costo,
                te.nombre as tipo_evento,
                m.nombre as modalidad,
                CONCAT(u.nombre, ' ', u.apellido_paterno, ISNULL(' ' + u.apellido_materno, '')) as organizador,
                est.nombre as estatus,
                ca.nombre as direccion_calle,
                ca.n_exterior as numero_exterior,
                col.nombre as colonia,
                mun.nombre as municipio,
                edo.nombre as estado
            FROM Eventos e
            LEFT JOIN TiposEvento te ON e.id_tipo_evento = te.id
            LEFT JOIN Modalidades m ON e.id_modalidad = m.id
            LEFT JOIN Organizadores org ON e.id_organizador = org.id
            LEFT JOIN Usuarios u ON org.id_usuario = u.id
            LEFT JOIN Estatus est ON e.id_estatus = est.id
            LEFT JOIN Direcciones d ON e.id_direccion = d.id
            LEFT JOIN Calles ca ON d.id_calle = ca.id
            LEFT JOIN Colonias col ON ca.id_colonia = col.id
            LEFT JOIN Municipios mun ON col.id_municipio = mun.id
            LEFT JOIN Estados edo ON mun.id_estado = edo.id
            WHERE est.nombre = 'Activo'
        """

        params = []

        # Aplicar filtros
        if tipo_evento:
            query += " AND te.nombre = ?"
            params.append(tipo_evento)

        if modalidad:
            query += " AND m.nombre = ?"
            params.append(modalidad)

        if fecha_inicio:
            query += " AND e.fecha_evento >= ?"
            params.append(fecha_inicio)

        if fecha_fin:
            query += " AND e.fecha_evento <= ?"
            params.append(fecha_fin)

        query += " ORDER BY e.fecha_evento ASC, e.hora_inicio ASC"

        cursor.execute(query, params)
        rows = cursor.fetchall()

        eventos = []
        for row in rows:
            # Construir dirección completa
            direccion_completa = ""
            if row[13]:  # direccion_calle
                direccion_completa = f"{row[13]}"
                if row[14]:  # numero_exterior
                    direccion_completa += f" {row[14]}"
                if row[15]:  # colonia
                    direccion_completa += f", {row[15]}"
                if row[16]:  # municipio
                    direccion_completa += f", {row[16]}"
                if row[17]:  # estado
                    direccion_completa += f", {row[17]}"

            evento = {
                'id': row[0],
                'title': row[1],  # Para compatibilidad con FullCalendar
                'titulo': row[1],
                'descripcion': row[2],
                'start': row[3].isoformat() if row[3] else None,  # Para FullCalendar
                'fecha_evento': row[3].isoformat() if row[3] else None,
                'hora_inicio': str(row[4]) if row[4] else None,
                'hora_fin': str(row[5]) if row[5] else None,
                'url_evento': row[6],
                'capacidad_maxima': row[7],
                'costo': float(row[8]) if row[8] else 0.0,
                'tipo_evento': row[9],
                'modalidad': row[10],
                'organizador': row[11],
                'estatus': row[12],
                'direccion': direccion_completa,
                'es_gratuito': float(row[8]) == 0.0 if row[8] else True
            }
            eventos.append(evento)

        conn.close()
        return jsonify({'success': True, 'eventos': eventos})

    except Exception as e:
        print(f"Error en get_eventos: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@eventos_bp.route('/api/eventos/crear', methods=['POST'])
def crear_evento():
    """Crear nuevo evento"""
    try:
        data = request.get_json()

        # Validar datos requeridos
        required_fields = ['titulo', 'descripcion', 'fecha_evento', 'hora_inicio', 'id_tipo_evento', 'id_modalidad']
        for field in required_fields:
            if not data.get(field):
                return jsonify({
                    'success': False,
                    'message': f'El campo {field} es requerido'
                }), 400

        conn = get_db_connection()
        if not conn:
            return jsonify({
                'success': False,
                'message': 'Error de conexión a la base de datos'
            }), 500

        cursor = conn.cursor()

        # Verificar si el usuario está autenticado
        user_id = None
        if 'tienda_user_id' in session:
            user_id = session['tienda_user_id']
        else:
            # Crear usuario temporal con solo nombre y email de contacto
            # Dividir el nombre en partes
            nombre_completo = data.get('nombre_organizador', 'Organizador Sin Apellido')
            nombre_partes = nombre_completo.split()
            primer_nombre = nombre_partes[0] if nombre_partes else 'Organizador'
            apellido_paterno = nombre_partes[1] if len(nombre_partes) > 1 else 'Sin Apellido'
            apellido_materno = nombre_partes[2] if len(nombre_partes) > 2 else None

            cursor.execute("""
                INSERT INTO Usuarios (nombre, apellido_paterno, apellido_materno, email, suscrito_newsletter, activo)
                VALUES (?, ?, ?, ?, 0, 1)
            """, (primer_nombre, apellido_paterno, apellido_materno, data.get('contacto')))

            cursor.execute("SELECT @@IDENTITY")
            user_id = cursor.fetchone()[0]

        # Verificar si ya existe un organizador para este usuario
        cursor.execute("SELECT id FROM Organizadores WHERE id_usuario = ?", (user_id,))
        organizador_row = cursor.fetchone()

        if organizador_row:
            organizador_id = organizador_row.id
        else:
            # Crear nuevo organizador
            cursor.execute("""
                INSERT INTO Organizadores (id_usuario, experiencia_eventos, certificado)
                VALUES (?, 0, 0)
            """, (user_id,))

            cursor.execute("SELECT @@IDENTITY")
            organizador_id = cursor.fetchone()[0]

        # Manejar la dirección/ubicación
        direccion_id = None
        if data.get('url_evento'):
            # Para eventos virtuales, no necesitamos dirección física
            url_evento = data.get('url_evento')
        else:
            url_evento = None

        # Insertar el evento
        cursor.execute("""
            INSERT INTO Eventos (
                titulo, descripcion, fecha_evento, hora_inicio, hora_fin,
                id_tipo_evento, id_modalidad, url_evento, capacidad_maxima,
                costo, id_organizador, id_estatus
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
        """, (
            data['titulo'],
            data['descripcion'],
            data['fecha_evento'],
            data['hora_inicio'],
            data.get('hora_fin'),
            data['id_tipo_evento'],
            data['id_modalidad'],
            url_evento,
            data.get('capacidad_maxima', 50),
            data.get('costo', 0),
            organizador_id
        ))

        cursor.execute("SELECT @@IDENTITY")
        evento_id = cursor.fetchone()[0]

        conn.commit()
        conn.close()

        return jsonify({
            'success': True,
            'evento_id': evento_id,
            'message': 'Evento creado exitosamente. Será revisado y publicado pronto.'
        })

    except Exception as e:
        print(f"Error en crear_evento: {e}")
        return jsonify({
            'success': False,
            'message': 'Error interno del servidor'
        }), 500


@eventos_bp.route('/api/tipos-evento', methods=['GET'])
def get_tipos_evento():
    """Obtener tipos de evento para filtros"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Error de conexión a la base de datos'}), 500

        cursor = conn.cursor()
        cursor.execute("SELECT id, nombre, descripcion FROM TiposEvento ORDER BY nombre")
        rows = cursor.fetchall()

        tipos = []
        for row in rows:
            tipos.append({
                'id': row[0],
                'nombre': row[1],
                'descripcion': row[2]
            })

        conn.close()
        return jsonify({'success': True, 'tipos': tipos})

    except Exception as e:
        print(f"Error en get_tipos_evento: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@eventos_bp.route('/api/modalidades', methods=['GET'])
def get_modalidades():
    """Obtener modalidades de evento para filtros"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Error de conexión a la base de datos'}), 500

        cursor = conn.cursor()
        cursor.execute("SELECT id, nombre FROM Modalidades ORDER BY nombre")
        rows = cursor.fetchall()

        modalidades = []
        for row in rows:
            modalidades.append({
                'id': row[0],
                'nombre': row[1]
            })

        conn.close()
        return jsonify({'success': True, 'modalidades': modalidades})

    except Exception as e:
        print(f"Error en get_modalidades: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500
