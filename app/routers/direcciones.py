from fastapi import APIRouter, HTTPException
from app.data.database import get_db_connection

router = APIRouter(tags=["direcciones"])


@router.get("/api/direcciones/estados")
def get_estados():
    try:
        conn = get_db_connection()
        if not conn:
            raise HTTPException(status_code=500, detail="Error de conexión")
        cursor = conn.cursor()
        cursor.execute("SELECT DISTINCT id, nombre FROM Estados ORDER BY nombre")
        estados = [{'id': row.id, 'nombre': row.nombre} for row in cursor.fetchall()]
        conn.close()
        return {'estados': estados}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/direcciones/municipios/{estado_id}")
def get_municipios(estado_id: int):
    try:
        conn = get_db_connection()
        if not conn:
            raise HTTPException(status_code=500, detail="Error de conexión")
        cursor = conn.cursor()
        cursor.execute("SELECT id, nombre FROM Municipios WHERE id_estado = ? ORDER BY nombre", (estado_id,))
        municipios = [{'id': row.id, 'nombre': row.nombre} for row in cursor.fetchall()]
        conn.close()
        return {'municipios': municipios}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/direcciones/colonias/{municipio_id}")
def get_colonias(municipio_id: int):
    try:
        conn = get_db_connection()
        if not conn:
            raise HTTPException(status_code=500, detail="Error de conexión")
        cursor = conn.cursor()
        cursor.execute("SELECT id, nombre, cp FROM Colonias WHERE id_municipio = ? ORDER BY nombre", (municipio_id,))
        colonias = [{'id': row.id, 'nombre': row.nombre, 'cp': row.cp} for row in cursor.fetchall()]
        conn.close()
        return {'colonias': colonias}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/direcciones/calles/{colonia_id}")
def get_calles(colonia_id: int):
    try:
        conn = get_db_connection()
        if not conn:
            raise HTTPException(status_code=500, detail="Error de conexión")
        cursor = conn.cursor()
        cursor.execute("SELECT id, nombre FROM Calles WHERE id_colonia = ? ORDER BY nombre", (colonia_id,))
        calles = [{'id': row.id, 'nombre': row.nombre} for row in cursor.fetchall()]
        conn.close()
        return {'calles': calles}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
