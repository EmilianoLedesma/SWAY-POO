from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional
from app.data.database import get_db_connection
from app.security.auth import get_optional_tienda_user
from app.models.eventos import EventoCreate

router = APIRouter(tags=["eventos"])


@router.get("/api/eventos")
def get_eventos(
    tipo: str = Query(""),
    modalidad: str = Query(""),
    fecha_inicio: str = Query(""),
    fecha_fin: str = Query("")
):
    try:
        conn = get_db_connection()
        if not conn:
            raise HTTPException(status_code=500, detail="Error de conexión")

        cursor = conn.cursor()

        query = """
            SELECT
                e.id, e.titulo, e.descripcion, e.fecha_evento, e.hora_inicio, e.hora_fin,
                e.url_evento, e.capacidad_maxima, e.costo,
                te.nombre as tipo_evento, m.nombre as modalidad,
                CONCAT(u.nombre, ' ', u.apellido_paterno, ISNULL(' ' + u.apellido_materno, '')) as organizador,
                est.nombre as estatus,
                ca.nombre as direccion_calle, ca.n_exterior as numero_exterior,
                col.nombre as colonia, mun.nombre as municipio, edo.nombre as estado
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
        if tipo:
            query += " AND te.nombre = ?"
            params.append(tipo)
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
            direccion_completa = ""
            if row[13]:
                direccion_completa = f"{row[13]}"
                if row[14]:
                    direccion_completa += f" {row[14]}"
                if row[15]:
                    direccion_completa += f", {row[15]}"
                if row[16]:
                    direccion_completa += f", {row[16]}"
                if row[17]:
                    direccion_completa += f", {row[17]}"

            eventos.append({
                'id': row[0],
                'title': row[1],
                'titulo': row[1],
                'descripcion': row[2],
                'start': row[3].isoformat() if row[3] else None,
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
            })

        conn.close()
        return {'success': True, 'eventos': eventos}

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error en get_eventos: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/api/eventos/crear")
def crear_evento(data: EventoCreate, current_user: Optional[dict] = Depends(get_optional_tienda_user)):
    try:
        conn = get_db_connection()
        if not conn:
            raise HTTPException(status_code=500, detail="Error de conexión")

        cursor = conn.cursor()

        if current_user:
            user_id = int(current_user["sub"])
        else:
            nombre_completo = data.nombre_organizador or 'Organizador Sin Apellido'
            nombre_partes = nombre_completo.split()
            primer_nombre = nombre_partes[0] if nombre_partes else 'Organizador'
            apellido_paterno = nombre_partes[1] if len(nombre_partes) > 1 else 'Sin Apellido'
            apellido_materno = nombre_partes[2] if len(nombre_partes) > 2 else None

            cursor.execute("""
                INSERT INTO Usuarios (nombre, apellido_paterno, apellido_materno, email, suscrito_newsletter, activo)
                VALUES (?, ?, ?, ?, 0, 1)
            """, (primer_nombre, apellido_paterno, apellido_materno, data.contacto))

            cursor.execute("SELECT @@IDENTITY")
            user_id = cursor.fetchone()[0]

        cursor.execute("SELECT id FROM Organizadores WHERE id_usuario = ?", (user_id,))
        organizador_row = cursor.fetchone()

        if organizador_row:
            organizador_id = organizador_row.id
        else:
            cursor.execute("""
                INSERT INTO Organizadores (id_usuario, experiencia_eventos, certificado)
                VALUES (?, 0, 0)
            """, (user_id,))
            cursor.execute("SELECT @@IDENTITY")
            organizador_id = cursor.fetchone()[0]

        url_evento = data.url_evento if data.url_evento else None

        cursor.execute("""
            INSERT INTO Eventos (
                titulo, descripcion, fecha_evento, hora_inicio, hora_fin,
                id_tipo_evento, id_modalidad, url_evento, capacidad_maxima,
                costo, id_organizador, id_estatus
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
        """, (
            data.titulo, data.descripcion, data.fecha_evento, data.hora_inicio,
            data.hora_fin, data.id_tipo_evento, data.id_modalidad, url_evento,
            data.capacidad_maxima, data.costo, organizador_id
        ))

        cursor.execute("SELECT @@IDENTITY")
        evento_id = cursor.fetchone()[0]

        conn.commit()
        conn.close()

        return {'success': True, 'evento_id': evento_id, 'message': 'Evento creado exitosamente. Será revisado y publicado pronto.'}

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error en crear_evento: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")


@router.get("/api/tipos-evento")
def get_tipos_evento():
    try:
        conn = get_db_connection()
        if not conn:
            raise HTTPException(status_code=500, detail="Error de conexión")
        cursor = conn.cursor()
        cursor.execute("SELECT id, nombre, descripcion FROM TiposEvento ORDER BY nombre")
        tipos = [{'id': r[0], 'nombre': r[1], 'descripcion': r[2]} for r in cursor.fetchall()]
        conn.close()
        return {'success': True, 'tipos': tipos}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/modalidades")
def get_modalidades():
    try:
        conn = get_db_connection()
        if not conn:
            raise HTTPException(status_code=500, detail="Error de conexión")
        cursor = conn.cursor()
        cursor.execute("SELECT id, nombre FROM Modalidades ORDER BY nombre")
        modalidades = [{'id': r[0], 'nombre': r[1]} for r in cursor.fetchall()]
        conn.close()
        return {'success': True, 'modalidades': modalidades}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
