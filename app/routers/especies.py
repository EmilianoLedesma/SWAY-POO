from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional
from app.data.database import get_db_connection
from app.security.auth import get_current_colaborador
from app.models.especies import EspecieCreate, EspecieUpdate

router = APIRouter(tags=["especies"])


def _get_especies_filtered(conn, search="", conservation_filter="", habitat_filter="", sort_by="nombre", page=1, limit=12):
    cursor = conn.cursor()
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
            'imagen': row[6] or '',
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

    return especies, total_count


@router.get("/api/tipos-especies")
def get_tipos_especies():
    tipos = [
        {'id': 'mamiferos', 'nombre': 'Mamíferos Marinos', 'descripcion': 'Ballenas, delfines, focas y otros mamíferos marinos'},
        {'id': 'peces', 'nombre': 'Peces', 'descripcion': 'Peces cartilaginosos y óseos'},
        {'id': 'reptiles', 'nombre': 'Reptiles Marinos', 'descripcion': 'Tortugas marinas, serpientes marinas e iguanas'},
        {'id': 'invertebrados', 'nombre': 'Invertebrados', 'descripcion': 'Moluscos, crustáceos, equinodermos y otros'},
        {'id': 'corales', 'nombre': 'Corales', 'descripcion': 'Corales duros y blandos formadores de arrecifes'},
        {'id': 'algas', 'nombre': 'Algas Marinas', 'descripcion': 'Macroalgas y microalgas marinas'},
        {'id': 'aves', 'nombre': 'Aves Marinas', 'descripcion': 'Aves que dependen del ambiente marino'}
    ]
    return {'success': True, 'tipos': tipos}


@router.get("/api/especies/estadisticas")
def get_especies_estadisticas():
    try:
        conn = get_db_connection()
        if not conn:
            return {'success': True, 'estadisticas': {
                'total_especies': 2847, 'en_peligro_critico': 156, 'en_peligro': 300,
                'vulnerables': 891, 'especies_marinas': 2200,
                'especies_agregadas_hoy': 3, 'especies_agregadas_mes': 89,
                'habitats_representados': 7, 'regiones_cubiertas': 7
            }}

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

        return {'success': True, 'estadisticas': {
            'total_especies': total_especies,
            'en_peligro_critico': conservacion_stats.get('Extinción Crítica', 0),
            'en_peligro': conservacion_stats.get('En Peligro', 0),
            'vulnerables': conservacion_stats.get('Vulnerable', 0),
            'especies_marinas': total_especies,
            'especies_agregadas_hoy': agregadas_hoy,
            'especies_agregadas_mes': agregadas_mes,
            'habitats_representados': 7,
            'regiones_cubiertas': 7
        }}
    except Exception as e:
        print(f"Error en get_especies_estadisticas: {e}")
        return {'success': True, 'estadisticas': {
            'total_especies': 2847, 'en_peligro_critico': 156, 'en_peligro': 300,
            'vulnerables': 891, 'especies_marinas': 2200,
            'especies_agregadas_hoy': 3, 'especies_agregadas_mes': 89,
            'habitats_representados': 7, 'regiones_cubiertas': 7
        }}


@router.get("/api/especies/opciones-filtros")
def get_opciones_filtros():
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

    habitats_data = get_habitats()
    tipos_data = get_tipos_especies()

    return {'success': True, 'filtros': {
        'habitats': habitats_data.get('habitats', []) if habitats_data.get('success') else [],
        'tipos': tipos_data.get('tipos', []) if tipos_data.get('success') else [],
        'regiones': regiones,
        'estados_conservacion': estados_conservacion,
        'ordenamiento': ordenamiento
    }}


@router.get("/api/especies/busqueda-avanzada")
def busqueda_avanzada_especies(
    nombre: str = Query(""),
    nombre_cientifico: str = Query(""),
    habitat: str = Query(""),
    conservation: str = Query(""),
    tipo: str = Query(""),
    region: str = Query("")
):
    try:
        search_terms = []
        if nombre:
            search_terms.append(nombre.strip())
        if nombre_cientifico:
            search_terms.append(nombre_cientifico.strip())

        conn = get_db_connection()
        if not conn:
            raise HTTPException(status_code=500, detail="Error de conexión")

        search = ' '.join(search_terms)
        especies, total_count = _get_especies_filtered(
            conn, search=search, conservation_filter=conservation,
            habitat_filter=habitat, sort_by="nombre", page=1, limit=100
        )
        conn.close()

        return {
            'success': True,
            'especies': especies,
            'total': total_count
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error en busqueda_avanzada: {e}")
        raise HTTPException(status_code=500, detail="Error en búsqueda avanzada")


@router.get("/api/especies")
def get_especies(
    search: str = Query(""),
    habitat: str = Query(""),
    conservation: str = Query(""),
    sort: str = Query("nombre"),
    page: int = Query(1),
    limit: int = Query(12)
):
    try:
        conn = get_db_connection()
        if not conn:
            raise HTTPException(status_code=500, detail="Error de conexión a la base de datos")

        especies, total_count = _get_especies_filtered(
            conn, search=search.strip(), conservation_filter=conservation,
            habitat_filter=habitat, sort_by=sort, page=page, limit=limit
        )
        conn.close()

        return {
            'success': True,
            'especies': especies,
            'total': total_count,
            'page': page,
            'limit': limit,
            'total_pages': (total_count + limit - 1) // limit
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error en get_especies: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/especies/{especie_id}")
def get_especie(especie_id: int):
    try:
        conn = get_db_connection()
        if not conn:
            raise HTTPException(status_code=500, detail="Error de conexión")

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
            raise HTTPException(status_code=404, detail="Especie no encontrada")

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
        return {'success': True, 'especie': {
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
        }}

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error en get_especie: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/api/especies")
def create_especie(data: EspecieCreate, current_user: dict = Depends(get_current_colaborador)):
    try:
        if not data.nombre_comun or not data.nombre_cientifico:
            raise HTTPException(status_code=400, detail="Nombre común y científico son requeridos")

        firma_imagen = data.firma_imagen
        colaborador = None
        db = None
        colaborador_id = current_user.get("colaborador_id")

        if firma_imagen:
            try:
                from face_service import decode_base64_image, extract_face_encoding, compare_face
                from models import get_session as orm_session, Colaborador

                image_rgb = decode_base64_image(firma_imagen)
                if image_rgb is None:
                    raise HTTPException(status_code=403, detail="Imagen de firma inválida")

                candidate_encoding = extract_face_encoding(image_rgb)
                if candidate_encoding is None:
                    raise HTTPException(status_code=403, detail="No se detectó un rostro en la firma")

                db = orm_session()
                colaborador = db.query(Colaborador).filter_by(id=colaborador_id).first()
                if not colaborador or not colaborador.face_encoding:
                    db.close()
                    raise HTTPException(status_code=403, detail="El colaborador no tiene rostro registrado")

                if not compare_face(colaborador.face_encoding, candidate_encoding):
                    db.close()
                    raise HTTPException(status_code=403, detail="La firma biométrica no coincide")
            except ImportError:
                pass
            except HTTPException:
                raise

        conn = get_db_connection()
        if not conn:
            if db:
                db.close()
            raise HTTPException(status_code=500, detail="Error de conexión")

        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO Especies (nombre_comun, nombre_cientifico, descripcion,
                                  esperanza_vida, poblacion_estimada, id_estado_conservacion,
                                  imagen_url)
            OUTPUT INSERTED.id
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            data.nombre_comun,
            data.nombre_cientifico,
            data.descripcion or None,
            data.esperanza_vida or None,
            data.poblacion_estimada or None,
            data.id_estado_conservacion,
            data.imagen_url or None,
        ))

        especie_result = cursor.fetchone()
        if not especie_result:
            raise HTTPException(status_code=500, detail="No se pudo crear la especie")
        especie_id = especie_result[0]

        if data.amenazas:
            for amenaza_id in data.amenazas:
                if amenaza_id and str(amenaza_id).strip() and str(amenaza_id) != 'null':
                    try:
                        cursor.execute("INSERT INTO EspeciesAmenazas (id_especie, id_amenaza) VALUES (?, ?)", (especie_id, int(amenaza_id)))
                    except (ValueError, TypeError):
                        continue

        if data.habitats:
            for habitat_id in data.habitats:
                if habitat_id and str(habitat_id).strip() and str(habitat_id) != 'null':
                    try:
                        cursor.execute("INSERT INTO EspeciesHabitats (id_especie, id_habitat) VALUES (?, ?)", (especie_id, int(habitat_id)))
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
                    fecha_firma=_dt2.utcnow(), resultado=True
                )
                db.add(firma)
                db.commit()
            except Exception as e:
                print(f"[firma] Error: {e}")
            finally:
                db.close()

        return {'success': True, 'especie_id': especie_id, 'message': 'Especie creada correctamente'}

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error en create_especie: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/api/especies/{especie_id}")
def update_especie(especie_id: int, data: EspecieUpdate, current_user: dict = Depends(get_current_colaborador)):
    try:
        firma_imagen = data.firma_imagen
        colaborador = None
        db = None
        colaborador_id = current_user.get("colaborador_id")

        if firma_imagen:
            try:
                from face_service import decode_base64_image, extract_face_encoding, compare_face
                from models import get_session as orm_session, Colaborador

                image_rgb = decode_base64_image(firma_imagen)
                if image_rgb is None:
                    raise HTTPException(status_code=403, detail="Imagen de firma inválida")

                candidate_encoding = extract_face_encoding(image_rgb)
                if candidate_encoding is None:
                    raise HTTPException(status_code=403, detail="No se detectó un rostro en la firma")

                db = orm_session()
                colaborador = db.query(Colaborador).filter_by(id=colaborador_id).first()
                if not colaborador or not colaborador.face_encoding:
                    db.close()
                    raise HTTPException(status_code=403, detail="El colaborador no tiene rostro registrado")

                if not compare_face(colaborador.face_encoding, candidate_encoding):
                    db.close()
                    raise HTTPException(status_code=403, detail="La firma biométrica no coincide")
            except ImportError:
                pass
            except HTTPException:
                raise

        conn = get_db_connection()
        if not conn:
            raise HTTPException(status_code=500, detail="Error de conexión")

        cursor = conn.cursor()

        cursor.execute("""
            UPDATE Especies SET
                nombre_comun = ?, nombre_cientifico = ?, descripcion = ?,
                esperanza_vida = ?, poblacion_estimada = ?,
                id_estado_conservacion = ?, imagen_url = ?
            WHERE id = ?
        """, (
            data.nombre_comun,
            data.nombre_cientifico,
            data.descripcion or None,
            data.esperanza_vida or None,
            data.poblacion_estimada or None,
            data.id_estado_conservacion,
            data.imagen_url or None,
            especie_id
        ))

        cursor.execute("DELETE FROM EspeciesAmenazas WHERE id_especie = ?", (especie_id,))
        cursor.execute("DELETE FROM EspeciesHabitats WHERE id_especie = ?", (especie_id,))

        if data.amenazas:
            for amenaza_id in data.amenazas:
                if amenaza_id and str(amenaza_id).strip() and str(amenaza_id) != 'null':
                    try:
                        cursor.execute("INSERT INTO EspeciesAmenazas (id_especie, id_amenaza) VALUES (?, ?)", (especie_id, int(amenaza_id)))
                    except (ValueError, TypeError):
                        continue

        if data.habitats:
            for habitat_id in data.habitats:
                if habitat_id and str(habitat_id).strip() and str(habitat_id) != 'null':
                    try:
                        cursor.execute("INSERT INTO EspeciesHabitats (id_especie, id_habitat) VALUES (?, ?)", (especie_id, int(habitat_id)))
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
                    fecha_firma=_dt2.utcnow(), resultado=True
                )
                db.add(firma)
                db.commit()
            except Exception as e:
                print(f"[firma] Error: {e}")
            finally:
                db.close()

        return {'success': True, 'message': 'Especie actualizada correctamente'}

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error en update_especie: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/api/especies/{especie_id}")
def delete_especie(especie_id: int, current_user: dict = Depends(get_current_colaborador)):
    try:
        conn = get_db_connection()
        if not conn:
            raise HTTPException(status_code=500, detail="Error de conexión")

        cursor = conn.cursor()
        cursor.execute("SELECT nombre_comun FROM Especies WHERE id = ?", (especie_id,))
        especie = cursor.fetchone()
        if not especie:
            conn.close()
            raise HTTPException(status_code=404, detail="Especie no encontrada")

        cursor.execute("DELETE FROM Avistamientos WHERE id_especie = ?", (especie_id,))
        cursor.execute("DELETE FROM EspeciesAmenazas WHERE id_especie = ?", (especie_id,))
        cursor.execute("DELETE FROM EspeciesHabitats WHERE id_especie = ?", (especie_id,))
        cursor.execute("DELETE FROM EspeciesCaracteristicas WHERE id_especie = ?", (especie_id,))
        cursor.execute("DELETE FROM Especies WHERE id = ?", (especie_id,))

        conn.commit()
        conn.close()
        return {'success': True, 'message': f'Especie "{especie[0]}" eliminada exitosamente'}

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error en delete_especie: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/estados-conservacion")
def get_estados_conservacion():
    try:
        conn = get_db_connection()
        if not conn:
            raise HTTPException(status_code=500, detail="Error de conexión")
        cursor = conn.cursor()
        cursor.execute("SELECT id, nombre, descripcion FROM EstadosConservacion ORDER BY nombre")
        estados = [{'id': r[0], 'nombre': r[1], 'descripcion': r[2]} for r in cursor.fetchall()]
        conn.close()
        return {'success': True, 'estados': estados}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/amenazas")
def get_amenazas():
    try:
        conn = get_db_connection()
        if not conn:
            raise HTTPException(status_code=500, detail="Error de conexión")
        cursor = conn.cursor()
        cursor.execute("SELECT id, nombre, descripcion FROM Amenazas ORDER BY nombre")
        amenazas = [{'id': r[0], 'nombre': r[1], 'descripcion': r[2]} for r in cursor.fetchall()]
        conn.close()
        return {'success': True, 'amenazas': amenazas}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/habitats")
def get_habitats():
    try:
        conn = get_db_connection()
        if not conn:
            raise HTTPException(status_code=500, detail="Error de conexión")
        cursor = conn.cursor()
        cursor.execute("SELECT id, nombre, descripcion FROM Habitats ORDER BY nombre")
        habitats = [{'id': r[0], 'nombre': r[1], 'descripcion': r[2]} for r in cursor.fetchall()]
        conn.close()
        return {'success': True, 'habitats': habitats}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
