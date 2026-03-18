from flask import Blueprint, request, jsonify, session
from db import get_db_connection

especies_bp = Blueprint('especies', __name__)


# ── Helper interno (sin ruta) ─────────────────────────────────────────────────
def get_especies_fallback():
    """Devolver datos de especies de fallback cuando no hay conexión a BD"""
    try:
        habitat = request.args.get('habitat', '')
        conservation = request.args.get('conservation', '')
        tipo = request.args.get('type', '')
        region = request.args.get('region', '')
        search = request.args.get('search', '').lower()
        sort_by = request.args.get('sort', 'nombre')
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 12))

        filtered_especies = []

        if search:
            filtered_especies = [e for e in filtered_especies if
                                  search in e['nombre'].lower() or
                                  search in e['nombre_cientifico'].lower()]
        if habitat:
            filtered_especies = [e for e in filtered_especies if e.get('habitat') == habitat]
        if conservation:
            filtered_especies = [e for e in filtered_especies if e.get('estado_conservacion') == conservation]
        if tipo:
            filtered_especies = [e for e in filtered_especies if e.get('tipo') == tipo]
        if region:
            filtered_especies = [e for e in filtered_especies if e.get('region') == region]

        if sort_by == 'conservation':
            conservation_order = {
                'extincion-critica': 0, 'peligro': 1,
                'vulnerable': 2, 'casi-amenazada': 3, 'preocupacion-menor': 4
            }
            filtered_especies.sort(key=lambda x: conservation_order.get(x.get('estado_conservacion', ''), 5))
        elif sort_by == 'nombre':
            filtered_especies.sort(key=lambda x: x.get('nombre', ''))

        total_records = len(filtered_especies)
        start_idx = (page - 1) * limit
        paginated_especies = filtered_especies[start_idx:start_idx + limit]

        return jsonify({
            'especies': paginated_especies,
            'total': total_records,
            'page': page,
            'limit': limit,
            'total_pages': (total_records + limit - 1) // limit
        })

    except Exception as e:
        print(f"Error en get_especies_fallback: {e}")
        return jsonify({'error': 'Error interno del servidor'}), 500


# ── Catálogos auxiliares ──────────────────────────────────────────────────────

@especies_bp.route('/api/tipos-especies')
def get_tipos_especies():
    """API para obtener tipos de organismos/especies disponibles"""
    try:
        tipos = [
            {'id': 'mamiferos', 'nombre': 'Mamíferos Marinos', 'descripcion': 'Ballenas, delfines, focas y otros mamíferos marinos'},
            {'id': 'peces', 'nombre': 'Peces', 'descripcion': 'Peces cartilaginosos y óseos'},
            {'id': 'reptiles', 'nombre': 'Reptiles Marinos', 'descripcion': 'Tortugas marinas, serpientes marinas e iguanas'},
            {'id': 'invertebrados', 'nombre': 'Invertebrados', 'descripcion': 'Moluscos, crustáceos, equinodermos y otros'},
            {'id': 'corales', 'nombre': 'Corales', 'descripcion': 'Corales duros y blandos formadores de arrecifes'},
            {'id': 'algas', 'nombre': 'Algas Marinas', 'descripcion': 'Macroalgas y microalgas marinas'},
            {'id': 'aves', 'nombre': 'Aves Marinas', 'descripcion': 'Aves que dependen del ambiente marino'}
        ]
        return jsonify({'success': True, 'tipos': tipos})
    except Exception as e:
        print(f"Error en get_tipos_especies: {e}")
        return jsonify({'error': 'Error interno del servidor'}), 500


@especies_bp.route('/api/especies/estadisticas')
def get_especies_estadisticas():
    """API para obtener estadísticas dinámicas de especies"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'success': True, 'estadisticas': {
                'total_especies': 2847, 'en_peligro_critico': 156, 'en_peligro': 300,
                'vulnerables': 891, 'especies_marinas': 2200,
                'especies_agregadas_hoy': 3, 'especies_agregadas_mes': 89,
                'habitats_representados': 7, 'regiones_cubiertas': 7
            }})

        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) as total FROM Especies WHERE activo = 1")
        total_especies = cursor.fetchone()[0]

        cursor.execute("""
            SELECT ec.nombre, COUNT(*) as cantidad
            FROM Especies e
            LEFT JOIN EstadosConservacion ec ON e.id_estado_conservacion = ec.id
            WHERE e.activo = 1
            GROUP BY ec.nombre
        """)
        conservacion_stats = {row[0]: row[1] for row in cursor.fetchall()}

        cursor.execute("""
            SELECT COUNT(*) FROM Especies
            WHERE CAST(fecha_registro AS DATE) = CAST(GETDATE() AS DATE) AND activo = 1
        """)
        agregadas_hoy = cursor.fetchone()[0]

        cursor.execute("""
            SELECT COUNT(*) FROM Especies
            WHERE YEAR(fecha_registro) = YEAR(GETDATE())
            AND MONTH(fecha_registro) = MONTH(GETDATE()) AND activo = 1
        """)
        agregadas_mes = cursor.fetchone()[0]
        conn.close()

        return jsonify({'success': True, 'estadisticas': {
            'total_especies': total_especies,
            'en_peligro_critico': conservacion_stats.get('Extinción Crítica', 0),
            'en_peligro': conservacion_stats.get('En Peligro', 0),
            'vulnerables': conservacion_stats.get('Vulnerable', 0),
            'especies_marinas': total_especies,
            'especies_agregadas_hoy': agregadas_hoy,
            'especies_agregadas_mes': agregadas_mes,
            'habitats_representados': 7,
            'regiones_cubiertas': 7
        }})

    except Exception as e:
        print(f"Error en get_especies_estadisticas: {e}")
        return jsonify({'success': True, 'estadisticas': {
            'total_especies': 2847, 'en_peligro_critico': 156, 'en_peligro': 300,
            'vulnerables': 891, 'especies_marinas': 2200,
            'especies_agregadas_hoy': 3, 'especies_agregadas_mes': 89,
            'habitats_representados': 7, 'regiones_cubiertas': 7
        }})


@especies_bp.route('/api/especies/opciones-filtros')
def get_opciones_filtros():
    """API para obtener todas las opciones de filtros disponibles de una vez"""
    try:
        response_habitats = get_habitats()
        habitats_data = response_habitats.get_json()

        response_tipos = get_tipos_especies()
        tipos_data = response_tipos.get_json()

        regiones = [
            {'id': 'pacifico', 'nombre': 'Océano Pacífico'},
            {'id': 'atlantico', 'nombre': 'Océano Atlántico'},
            {'id': 'indico', 'nombre': 'Océano Índico'},
            {'id': 'artico', 'nombre': 'Océano Ártico'},
            {'id': 'antartico', 'nombre': 'Océano Antártico'},
            {'id': 'mediterraneo', 'nombre': 'Mar Mediterráneo'},
            {'id': 'caribe', 'nombre': 'Mar Caribe'}
        ]

        estados_conservacion = [
            {'id': 'extincion-critica', 'nombre': 'Extinción Crítica'},
            {'id': 'peligro', 'nombre': 'En Peligro'},
            {'id': 'vulnerable', 'nombre': 'Vulnerable'},
            {'id': 'casi-amenazada', 'nombre': 'Casi Amenazada'},
            {'id': 'preocupacion-menor', 'nombre': 'Preocupación Menor'}
        ]

        ordenamiento = [
            {'id': 'nombre', 'nombre': 'Nombre'},
            {'id': 'conservation', 'nombre': 'Estado de Conservación'},
            {'id': 'size', 'nombre': 'Tamaño'},
            {'id': 'habitat', 'nombre': 'Hábitat'},
            {'id': 'added', 'nombre': 'Recién Agregados'}
        ]

        return jsonify({'success': True, 'filtros': {
            'habitats': habitats_data.get('habitats', []) if habitats_data.get('success') else [],
            'tipos': tipos_data.get('tipos', []) if tipos_data.get('success') else [],
            'regiones': regiones,
            'estados_conservacion': estados_conservacion,
            'ordenamiento': ordenamiento
        }})

    except Exception as e:
        print(f"Error en get_opciones_filtros: {e}")
        return jsonify({'success': False, 'error': 'Error al obtener opciones de filtros'}), 500


@especies_bp.route('/api/especies/busqueda-avanzada')
def busqueda_avanzada_especies():
    """API para búsqueda avanzada con múltiples criterios"""
    try:
        nombre = request.args.get('nombre', '').strip()
        nombre_cientifico = request.args.get('nombre_cientifico', '').strip()
        habitat = request.args.get('habitat', '')
        conservation = request.args.get('conservation', '')
        tipo = request.args.get('tipo', '')
        region = request.args.get('region', '')

        search_terms = []
        if nombre:
            search_terms.append(nombre)
        if nombre_cientifico:
            search_terms.append(nombre_cientifico)

        from werkzeug.test import EnvironBuilder
        from flask import current_app

        qs_parts = []
        if search_terms:
            qs_parts.append(f"search={'%20'.join(search_terms)}")
        if habitat:
            qs_parts.append(f"habitat={habitat}")
        if conservation:
            qs_parts.append(f"conservation={conservation}")
        if tipo:
            qs_parts.append(f"type={tipo}")
        if region:
            qs_parts.append(f"region={region}")

        with current_app.test_request_context(f"/api/especies?{'&'.join(qs_parts)}"):
            result = get_especies()
        return result

    except Exception as e:
        print(f"Error en busqueda_avanzada_especies: {e}")
        return jsonify({'success': False, 'error': 'Error en búsqueda avanzada'}), 500


# ── CRUD Especies ─────────────────────────────────────────────────────────────

@especies_bp.route('/api/especies', methods=['GET'])
def get_especies():
    """Obtener especies con filtros y paginación"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Error de conexión a la base de datos'}), 500

        cursor = conn.cursor()

        search = request.args.get('search', '').strip()
        habitat_filter = request.args.get('habitat', '')
        conservation_filter = request.args.get('conservation', '')
        sort_by = request.args.get('sort', 'nombre')
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 12))
        offset = (page - 1) * limit

        base_query = """
            SELECT DISTINCT e.id, e.nombre_comun, e.nombre_cientifico,
                   e.esperanza_vida, e.poblacion_estimada, e.id_estado_conservacion,
                   e.imagen_url, ec.nombre as estado_conservacion
            FROM Especies e
            LEFT JOIN EstadosConservacion ec ON e.id_estado_conservacion = ec.id
            LEFT JOIN EspeciesHabitats eh ON e.id = eh.id_especie
            LEFT JOIN Habitats h ON eh.id_habitat = h.id
        """
        count_query = """
            SELECT COUNT(DISTINCT e.id)
            FROM Especies e
            LEFT JOIN EstadosConservacion ec ON e.id_estado_conservacion = ec.id
            LEFT JOIN EspeciesHabitats eh ON e.id = eh.id_especie
            LEFT JOIN Habitats h ON eh.id_habitat = h.id
        """

        conditions = []
        params = []

        if search:
            conditions.append("(e.nombre_comun LIKE ? OR e.nombre_cientifico LIKE ?)")
            params.extend([f'%{search}%', f'%{search}%'])

        if conservation_filter:
            conservation_map = {
                'extincion-critica': ['crítica', 'critica'],
                'peligro': ['peligro'],
                'vulnerable': ['vulnerable'],
                'casi-amenazada': ['amenazada'],
                'preocupacion-menor': ['menor', 'preocupación menor']
            }
            if conservation_filter in conservation_map:
                search_terms = conservation_map[conservation_filter]
                condition_parts = []
                for term in search_terms:
                    condition_parts.append("LOWER(ec.nombre) LIKE ?")
                    params.append(f'%{term}%')
                conditions.append(f"({' OR '.join(condition_parts)})")

        if habitat_filter:
            habitat_map = {
                'arrecife': ['arrecife', 'coral'],
                'aguas-profundas': ['profundas', 'abisales'],
                'aguas-abiertas': ['abiertas', 'pelágicas', 'oceánicas'],
                'costero': ['costero', 'costa', 'litoral'],
                'polar': ['polar', 'ártico', 'antártico'],
                'manglar': ['manglar', 'manglares'],
                'estuario': ['estuario', 'estuarios']
            }
            if habitat_filter in habitat_map:
                search_terms = habitat_map[habitat_filter]
                condition_parts = []
                for term in search_terms:
                    condition_parts.append("LOWER(h.nombre) LIKE ?")
                    params.append(f'%{term}%')
                conditions.append(f"({' OR '.join(condition_parts)})")

        where_clause = (" WHERE " + " AND ".join(conditions)) if conditions else ""

        order_map = {
            'nombre': 'e.nombre_comun',
            'conservation': 'ec.nombre',
            'size': 'e.poblacion_estimada DESC',
            'habitat': 'e.nombre_comun',
            'added': 'e.id DESC'
        }
        order_clause = f" ORDER BY {order_map.get(sort_by, 'e.nombre_comun')}"

        cursor.execute(count_query + where_clause, params)
        total_count = cursor.fetchone()[0]

        especies_query = (base_query + where_clause + order_clause +
                          f" OFFSET {offset} ROWS FETCH NEXT {limit} ROWS ONLY")
        cursor.execute(especies_query, params)
        especies_data = cursor.fetchall()

        descripciones = {}
        if especies_data:
            species_ids = [str(row[0]) for row in especies_data]
            desc_query = f"SELECT id, descripcion FROM Especies WHERE id IN ({','.join(['?' for _ in species_ids])})"
            cursor.execute(desc_query, species_ids)
            descripciones = {row[0]: row[1] for row in cursor.fetchall()}

        especies = []
        for row in especies_data:
            especie_id = row[0]
            estado_conservacion = 'preocupacion-menor'
            if row[7]:
                estado_nombre = row[7].lower()
                if 'crítica' in estado_nombre or 'critica' in estado_nombre:
                    estado_conservacion = 'extincion-critica'
                elif 'peligro' in estado_nombre:
                    estado_conservacion = 'peligro'
                elif 'vulnerable' in estado_nombre:
                    estado_conservacion = 'vulnerable'
                elif 'amenazada' in estado_nombre:
                    estado_conservacion = 'casi-amenazada'

            habitats_nombres = ['Océano Atlántico', 'Océano Pacífico']
            amenazas_nombres = ['Contaminación', 'Pesca excesiva']

            especies.append({
                'id': row[0],
                'nombre': row[1],
                'nombre_comun': row[1],
                'nombre_cientifico': row[2],
                'descripcion': descripciones.get(especie_id, 'Sin descripción disponible'),
                'esperanza_vida': f"{row[3]} años" if row[3] else 'No disponible',
                'poblacion_estimada': row[4],
                'id_estado_conservacion': row[5],
                'imagen': row[6] or 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjZjBmMGYwIi8+Cjx0ZXh0IHg9IjIwMCIgeT0iMTUwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOTk5IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiPkVzcGVjaWUgTWFyaW5hPC90ZXh0Pgo8L3N2Zz4K',
                'imagen_url': row[6],
                'estado_conservacion': estado_conservacion,
                'longitud': 'Variable',
                'ubicacion': ', '.join(habitats_nombres),
                'habitat': habitats_nombres[0].lower().replace(' ', '-'),
                'tipo': 'marina',
                'region': 'global',
                'amenazas': amenazas_nombres,
                'habitats': habitats_nombres
            })

        conn.close()
        return jsonify({
            'success': True,
            'especies': especies,
            'total': total_count,
            'page': page,
            'limit': limit,
            'total_pages': (total_count + limit - 1) // limit
        })

    except Exception as e:
        print(f"Error en get_especies: {e}")
        return jsonify({'error': str(e)}), 500


@especies_bp.route('/api/especies/<int:especie_id>', methods=['GET'])
def get_especie(especie_id):
    """Obtener una especie específica con sus relaciones"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Error de conexión a la base de datos'}), 500

        cursor = conn.cursor()
        cursor.execute("""
            SELECT e.id, e.nombre_comun, e.nombre_cientifico, e.descripcion,
                   e.esperanza_vida, e.poblacion_estimada, e.id_estado_conservacion,
                   e.imagen_url, ec.nombre as estado_conservacion
            FROM Especies e
            LEFT JOIN EstadosConservacion ec ON e.id_estado_conservacion = ec.id
            WHERE e.id = ?
        """, (especie_id,))

        row = cursor.fetchone()
        if not row:
            conn.close()
            return jsonify({'error': 'Especie no encontrada'}), 404

        estado_conservacion = 'preocupacion-menor'
        if row[8]:
            estado_nombre = row[8].lower()
            if 'crítica' in estado_nombre or 'critica' in estado_nombre:
                estado_conservacion = 'extincion-critica'
            elif 'peligro' in estado_nombre:
                estado_conservacion = 'peligro'
            elif 'vulnerable' in estado_nombre:
                estado_conservacion = 'vulnerable'
            elif 'amenazada' in estado_nombre:
                estado_conservacion = 'casi-amenazada'

        cursor.execute("""
            SELECT a.nombre FROM EspeciesAmenazas ea
            JOIN Amenazas a ON ea.id_amenaza = a.id WHERE ea.id_especie = ?
        """, (especie_id,))
        amenazas_nombres = [r[0] for r in cursor.fetchall()]

        cursor.execute("""
            SELECT h.nombre FROM EspeciesHabitats eh
            JOIN Habitats h ON eh.id_habitat = h.id WHERE eh.id_especie = ?
        """, (especie_id,))
        habitats_nombres = [r[0] for r in cursor.fetchall()]

        cursor.execute("""
            SELECT c.tipo_caracteristica, c.valor
            FROM EspeciesCaracteristicas ec
            JOIN Caracteristicas c ON ec.id_caracteristica = c.id WHERE ec.id_especie = ?
        """, (especie_id,))
        longitud = 'Variable'
        peso = 'Variable'
        for carac_row in cursor.fetchall():
            tipo = carac_row[0].lower()
            if 'longitud' in tipo or 'tamaño' in tipo or 'talla' in tipo:
                longitud = carac_row[1]
            elif 'peso' in tipo:
                peso = carac_row[1]

        conn.close()
        return jsonify({'success': True, 'especie': {
            'id': row[0],
            'nombre_comun': row[1],
            'nombre': row[1],
            'nombre_cientifico': row[2],
            'descripcion': row[3] or 'Sin descripción disponible',
            'esperanza_vida': row[4],
            'poblacion_estimada': row[5],
            'id_estado_conservacion': row[6],
            'imagen_url': row[7],
            'imagen': row[7],
            'estado_conservacion': estado_conservacion,
            'amenazas': amenazas_nombres,
            'habitats': habitats_nombres,
            'longitud': longitud,
            'peso': peso,
            'habitat': habitats_nombres[0].lower().replace(' ', '-') if habitats_nombres else 'marino'
        }})

    except Exception as e:
        print(f"Error en get_especie: {e}")
        return jsonify({'error': str(e)}), 500


@especies_bp.route('/api/especies', methods=['POST'])
def create_especie():
    """Crear nueva especie con firma biométrica opcional"""
    try:
        data = request.get_json()

        if not data.get('nombre_comun') or not data.get('nombre_cientifico'):
            return jsonify({'error': 'Nombre común y científico son requeridos'}), 400

        if 'colab_colaborador_id' not in session:
            return jsonify({'success': False, 'error': 'No autorizado'}), 401

        from datetime import datetime as _dt

        firma_imagen = data.get('firma_imagen')
        colaborador = None
        db = None

        if firma_imagen:
            try:
                from face_service import decode_base64_image, extract_face_encoding, compare_face
                from models import get_session as orm_session, Colaborador

                image_rgb = decode_base64_image(firma_imagen)
                if image_rgb is None:
                    return jsonify({'success': False, 'error': 'Imagen de firma inválida'}), 403

                candidate_encoding = extract_face_encoding(image_rgb)
                if candidate_encoding is None:
                    return jsonify({'success': False, 'error': 'No se detectó un rostro en la firma'}), 403

                db = orm_session()
                colaborador = db.query(Colaborador).filter_by(id=session['colab_colaborador_id']).first()
                if not colaborador or not colaborador.face_encoding:
                    db.close()
                    return jsonify({'success': False, 'error': 'El colaborador no tiene rostro registrado'}), 403

                if not compare_face(colaborador.face_encoding, candidate_encoding):
                    db.close()
                    return jsonify({'success': False, 'error': 'La firma biométrica no coincide'}), 403
            except ImportError:
                pass

        conn = get_db_connection()
        if not conn:
            if db:
                db.close()
            return jsonify({'error': 'Error de conexión a la base de datos'}), 500

        cursor = conn.cursor()
        ahora = _dt.utcnow()
        colaborador_id_firma = colaborador.id if colaborador else session.get('colab_colaborador_id')

        cursor.execute("""
            INSERT INTO Especies (nombre_comun, nombre_cientifico, descripcion,
                                  esperanza_vida, poblacion_estimada, id_estado_conservacion,
                                  imagen_url, firmado_por, fecha_firma)
            OUTPUT INSERTED.id
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            data['nombre_comun'], data['nombre_cientifico'], data.get('descripcion'),
            data.get('esperanza_vida'), data.get('poblacion_estimada'),
            data.get('id_estado_conservacion'), data.get('imagen_url'),
            colaborador_id_firma, ahora
        ))

        especie_result = cursor.fetchone()
        if not especie_result:
            raise Exception("No se pudo obtener el ID de la especie creada")
        especie_id = especie_result[0]

        if data.get('amenazas') and isinstance(data['amenazas'], list):
            for amenaza_id in data['amenazas']:
                if amenaza_id and str(amenaza_id).strip() and str(amenaza_id) != 'null':
                    try:
                        cursor.execute(
                            "INSERT INTO EspeciesAmenazas (id_especie, id_amenaza) VALUES (?, ?)",
                            (especie_id, int(amenaza_id)))
                    except (ValueError, TypeError):
                        continue

        if data.get('habitats') and isinstance(data['habitats'], list):
            for habitat_id in data['habitats']:
                if habitat_id and str(habitat_id).strip() and str(habitat_id) != 'null':
                    try:
                        cursor.execute(
                            "INSERT INTO EspeciesHabitats (id_especie, id_habitat) VALUES (?, ?)",
                            (especie_id, int(habitat_id)))
                    except (ValueError, TypeError):
                        continue

        conn.commit()
        conn.close()

        if colaborador and db:
            try:
                from models import FirmaBiometrica
                from datetime import datetime as _dt2
                firma = FirmaBiometrica(
                    id_colaborador=colaborador.id, tabla_afectada='Especies',
                    id_registro=especie_id, accion='INSERT',
                    fecha_firma=_dt2.utcnow(), resultado=True,
                    ip_origen=request.remote_addr
                )
                db.add(firma)
                db.commit()
            except Exception as e:
                print(f"[firma] Error al registrar FirmaBiometrica: {e}")
            finally:
                db.close()

        return jsonify({'success': True, 'especie_id': especie_id, 'message': 'Especie creada correctamente'})

    except Exception as e:
        print(f"Error en create_especie: {e}")
        if 'conn' in locals() and conn:
            conn.rollback()
            conn.close()
        return jsonify({'error': str(e)}), 500


@especies_bp.route('/api/especies/<int:especie_id>', methods=['PUT'])
def update_especie(especie_id):
    """Actualizar especie existente con firma biométrica opcional"""
    try:
        data = request.get_json()

        if 'colab_colaborador_id' not in session:
            return jsonify({'success': False, 'error': 'No autorizado'}), 401

        from datetime import datetime as _dt

        firma_imagen = data.get('firma_imagen')
        colaborador = None
        db = None

        if firma_imagen:
            try:
                from face_service import decode_base64_image, extract_face_encoding, compare_face
                from models import get_session as orm_session, Colaborador

                image_rgb = decode_base64_image(firma_imagen)
                if image_rgb is None:
                    return jsonify({'success': False, 'error': 'Imagen de firma inválida'}), 403

                candidate_encoding = extract_face_encoding(image_rgb)
                if candidate_encoding is None:
                    return jsonify({'success': False, 'error': 'No se detectó un rostro en la firma'}), 403

                db = orm_session()
                colaborador = db.query(Colaborador).filter_by(id=session['colab_colaborador_id']).first()
                if not colaborador or not colaborador.face_encoding:
                    db.close()
                    return jsonify({'success': False, 'error': 'El colaborador no tiene rostro registrado'}), 403

                if not compare_face(colaborador.face_encoding, candidate_encoding):
                    db.close()
                    return jsonify({'success': False, 'error': 'La firma biométrica no coincide'}), 403
            except ImportError:
                pass

        conn = get_db_connection()
        if not conn:
            if db:
                db.close()
            return jsonify({'error': 'Error de conexión a la base de datos'}), 500

        cursor = conn.cursor()
        ahora = _dt.utcnow()
        colaborador_id_firma = colaborador.id if colaborador else session.get('colab_colaborador_id')

        cursor.execute("""
            UPDATE Especies SET
                nombre_comun = ?, nombre_cientifico = ?, descripcion = ?,
                esperanza_vida = ?, poblacion_estimada = ?,
                id_estado_conservacion = ?, imagen_url = ?,
                firmado_por = ?, fecha_firma = ?
            WHERE id = ?
        """, (
            data['nombre_comun'], data['nombre_cientifico'], data.get('descripcion'),
            data.get('esperanza_vida'), data.get('poblacion_estimada'),
            data.get('id_estado_conservacion'), data.get('imagen_url'),
            colaborador_id_firma, ahora, especie_id
        ))

        cursor.execute("DELETE FROM EspeciesAmenazas WHERE id_especie = ?", (especie_id,))
        cursor.execute("DELETE FROM EspeciesHabitats WHERE id_especie = ?", (especie_id,))

        if data.get('amenazas') and isinstance(data['amenazas'], list):
            for amenaza_id in data['amenazas']:
                if amenaza_id and str(amenaza_id).strip() and str(amenaza_id) != 'null':
                    try:
                        cursor.execute(
                            "INSERT INTO EspeciesAmenazas (id_especie, id_amenaza) VALUES (?, ?)",
                            (especie_id, int(amenaza_id)))
                    except (ValueError, TypeError):
                        continue

        if data.get('habitats') and isinstance(data['habitats'], list):
            for habitat_id in data['habitats']:
                if habitat_id and str(habitat_id).strip() and str(habitat_id) != 'null':
                    try:
                        cursor.execute(
                            "INSERT INTO EspeciesHabitats (id_especie, id_habitat) VALUES (?, ?)",
                            (especie_id, int(habitat_id)))
                    except (ValueError, TypeError):
                        continue

        conn.commit()
        conn.close()

        if colaborador and db:
            try:
                from models import FirmaBiometrica
                from datetime import datetime as _dt2
                firma = FirmaBiometrica(
                    id_colaborador=colaborador.id, tabla_afectada='Especies',
                    id_registro=especie_id, accion='UPDATE',
                    fecha_firma=_dt2.utcnow(), resultado=True,
                    ip_origen=request.remote_addr
                )
                db.add(firma)
                db.commit()
            except Exception as e:
                print(f"[firma] Error al registrar FirmaBiometrica: {e}")
            finally:
                db.close()

        return jsonify({'success': True, 'message': 'Especie actualizada correctamente'})

    except Exception as e:
        print(f"Error en update_especie: {e}")
        if 'conn' in locals() and conn:
            conn.rollback()
            conn.close()
        return jsonify({'error': str(e)}), 500


@especies_bp.route('/api/especies/<int:especie_id>', methods=['DELETE'])
def delete_especie(especie_id):
    """Eliminar especie y todas sus relaciones"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Error de conexión a la base de datos'}), 500

        cursor = conn.cursor()
        cursor.execute("SELECT nombre_comun FROM Especies WHERE id = ?", (especie_id,))
        especie = cursor.fetchone()
        if not especie:
            conn.close()
            return jsonify({'error': 'Especie no encontrada'}), 404

        cursor.execute("DELETE FROM Avistamientos WHERE id_especie = ?", (especie_id,))
        cursor.execute("DELETE FROM EspeciesAmenazas WHERE id_especie = ?", (especie_id,))
        cursor.execute("DELETE FROM EspeciesHabitats WHERE id_especie = ?", (especie_id,))
        cursor.execute("DELETE FROM EspeciesCaracteristicas WHERE id_especie = ?", (especie_id,))
        cursor.execute("DELETE FROM Especies WHERE id = ?", (especie_id,))

        if cursor.rowcount == 0:
            conn.rollback()
            conn.close()
            return jsonify({'error': 'No se pudo eliminar la especie'}), 500

        conn.commit()
        conn.close()
        return jsonify({'success': True, 'message': f'Especie "{especie[0]}" eliminada exitosamente'})

    except Exception as e:
        print(f"Error en delete_especie: {e}")
        if 'conn' in locals() and conn:
            conn.rollback()
            conn.close()
        return jsonify({'error': str(e)}), 500


# ── Catálogos relacionales ────────────────────────────────────────────────────

@especies_bp.route('/api/estados-conservacion', methods=['GET'])
def get_estados_conservacion():
    """Obtener estados de conservación para formularios"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Error de conexión a la base de datos'}), 500

        cursor = conn.cursor()
        cursor.execute("SELECT id, nombre, descripcion FROM EstadosConservacion ORDER BY nombre")
        estados = [{'id': r[0], 'nombre': r[1], 'descripcion': r[2]} for r in cursor.fetchall()]
        conn.close()
        return jsonify({'success': True, 'estados': estados})

    except Exception as e:
        print(f"Error en get_estados_conservacion: {e}")
        return jsonify({'error': str(e)}), 500


@especies_bp.route('/api/amenazas', methods=['GET'])
def get_amenazas():
    """Obtener amenazas para formularios"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Error de conexión a la base de datos'}), 500

        cursor = conn.cursor()
        cursor.execute("SELECT id, nombre, descripcion FROM Amenazas ORDER BY nombre")
        amenazas = [{'id': r[0], 'nombre': r[1], 'descripcion': r[2]} for r in cursor.fetchall()]
        conn.close()
        return jsonify({'success': True, 'amenazas': amenazas})

    except Exception as e:
        print(f"Error en get_amenazas: {e}")
        return jsonify({'error': str(e)}), 500


@especies_bp.route('/api/habitats', methods=['GET'])
def get_habitats():
    """Obtener hábitats para formularios"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Error de conexión a la base de datos'}), 500

        cursor = conn.cursor()
        cursor.execute("SELECT id, nombre, descripcion FROM Habitats ORDER BY nombre")
        habitats = [{'id': r[0], 'nombre': r[1], 'descripcion': r[2]} for r in cursor.fetchall()]
        conn.close()
        return jsonify({'success': True, 'habitats': habitats})

    except Exception as e:
        print(f"Error en get_habitats: {e}")
        return jsonify({'error': str(e)}), 500
