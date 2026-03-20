from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from app.data.database import get_db_connection, construir_nombre_completo

router = APIRouter(tags=["productos"])


@router.get("/api/productos")
def get_productos(
    categoria_id: Optional[int] = Query(None),
    busqueda: str = Query(""),
    pagina: int = Query(1),
    limite: int = Query(6),
    ordenar: str = Query("fecha_agregado")
):
    try:
        conn = get_db_connection()
        if not conn:
            raise HTTPException(status_code=500, detail="Error de conexión")

        base_query = """
            SELECT
                p.id, p.nombre, p.descripcion, p.precio, p.stock,
                p.imagen_url, p.dimensiones, p.peso_gramos, p.es_sostenible,
                p.fecha_agregado, cp.nombre as categoria_nombre,
                m.nombre as material_nombre,
                COALESCE(r.calificacion_promedio, 0) as calificacion_promedio,
                COALESCE(r.total_reseñas, 0) as total_reseñas
            FROM Productos p
            LEFT JOIN CategoriasProducto cp ON p.id_categoria = cp.id
            LEFT JOIN Materiales m ON p.id_material = m.id
            LEFT JOIN (
                SELECT id_producto,
                       AVG(CAST(calificacion AS FLOAT)) as calificacion_promedio,
                       COUNT(id) as total_reseñas
                FROM ReseñasProducto
                GROUP BY id_producto
            ) r ON p.id = r.id_producto
            WHERE p.activo = 1
        """

        params = []

        if categoria_id:
            base_query += " AND p.id_categoria = ?"
            params.append(categoria_id)

        if busqueda:
            base_query += " AND (p.nombre LIKE ? OR p.descripcion LIKE ?)"
            params.extend([f'%{busqueda}%', f'%{busqueda}%'])

        if ordenar == 'precio_asc':
            base_query += " ORDER BY p.precio ASC"
        elif ordenar == 'precio_desc':
            base_query += " ORDER BY p.precio DESC"
        elif ordenar == 'nombre':
            base_query += " ORDER BY p.nombre ASC"
        elif ordenar == 'popularidad':
            base_query += " ORDER BY total_reseñas DESC"
        else:
            base_query += " ORDER BY p.fecha_agregado DESC"

        offset = (pagina - 1) * limite
        base_query += f" OFFSET {offset} ROWS FETCH NEXT {limite} ROWS ONLY"

        cursor = conn.cursor()
        cursor.execute(base_query, params)

        productos = []
        for row in cursor.fetchall():
            productos.append({
                'id': row.id,
                'name': row.nombre,
                'description': row.descripcion,
                'price': float(row.precio),
                'stock': row.stock,
                'image_url': row.imagen_url,
                'dimensions': row.dimensiones,
                'weight_grams': row.peso_gramos,
                'is_sustainable': bool(row.es_sostenible),
                'date_added': row.fecha_agregado.isoformat() if row.fecha_agregado else None,
                'category': row.categoria_nombre,
                'material': row.material_nombre,
                'average_rating': round(row.calificacion_promedio, 1) if row.calificacion_promedio else 0,
                'total_reviews': row.total_reseñas or 0
            })

        count_query = "SELECT COUNT(*) as total FROM Productos p WHERE p.activo = 1"
        count_params = []
        if categoria_id:
            count_query += " AND p.id_categoria = ?"
            count_params.append(categoria_id)
        if busqueda:
            count_query += " AND (p.nombre LIKE ? OR p.descripcion LIKE ?)"
            count_params.extend([f'%{busqueda}%', f'%{busqueda}%'])

        cursor.execute(count_query, count_params)
        total_productos = cursor.fetchone().total

        conn.close()

        return {
            'success': True,
            'products': productos,
            'total': total_productos,
            'pagina': pagina,
            'limite': limite,
            'total_paginas': (total_productos + limite - 1) // limite
        }

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"Error en get_productos: {e}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/producto/{producto_id}")
def get_producto_detalle(producto_id: int):
    try:
        conn = get_db_connection()
        if not conn:
            raise HTTPException(status_code=500, detail="Error de conexión")

        cursor = conn.cursor()
        cursor.execute("""
            SELECT p.id, p.nombre, p.descripcion, p.precio, p.stock,
                   p.imagen_url, p.dimensiones, p.peso_gramos, p.es_sostenible,
                   p.fecha_agregado, cp.nombre as categoria_nombre, m.nombre as material_nombre
            FROM Productos p
            LEFT JOIN CategoriasProducto cp ON p.id_categoria = cp.id
            LEFT JOIN Materiales m ON p.id_material = m.id
            WHERE p.id = ? AND p.activo = 1
        """, (producto_id,))

        row = cursor.fetchone()
        if not row:
            conn.close()
            raise HTTPException(status_code=404, detail="Producto no encontrado")

        cursor.execute("""
            SELECT COALESCE(AVG(CAST(calificacion AS FLOAT)), 0) as calificacion_promedio,
                   COUNT(id) as total_reseñas
            FROM ReseñasProducto WHERE id_producto = ?
        """, (producto_id,))

        reseñas_row = cursor.fetchone()
        conn.close()

        return {
            'success': True,
            'producto': {
                'id': row.id,
                'nombre': row.nombre,
                'descripcion': row.descripcion,
                'precio': float(row.precio),
                'stock': row.stock,
                'imagen_url': row.imagen_url,
                'dimensiones': row.dimensiones,
                'peso_gramos': row.peso_gramos,
                'es_sostenible': bool(row.es_sostenible),
                'fecha_agregado': row.fecha_agregado.isoformat() if row.fecha_agregado else None,
                'categoria_nombre': row.categoria_nombre,
                'material_nombre': row.material_nombre,
                'calificacion_promedio': round(reseñas_row.calificacion_promedio, 1) if reseñas_row else 0,
                'total_reseñas': reseñas_row.total_reseñas if reseñas_row else 0
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/reseñas/{producto_id}")
def get_reseñas_producto(producto_id: int):
    try:
        conn = get_db_connection()
        if not conn:
            raise HTTPException(status_code=500, detail="Error de conexión")

        cursor = conn.cursor()
        cursor.execute("""
            SELECT r.id, r.calificacion, r.comentario, r.fecha_reseña,
                   u.nombre, u.apellido_paterno, u.apellido_materno
            FROM ReseñasProducto r
            JOIN Usuarios u ON r.id_usuario = u.id
            WHERE r.id_producto = ?
            ORDER BY r.fecha_reseña DESC
        """, (producto_id,))

        reseñas = []
        for row in cursor.fetchall():
            usuario_nombre = construir_nombre_completo(row.nombre, row.apellido_paterno, row.apellido_materno)
            reseñas.append({
                'id': row.id,
                'calificacion': row.calificacion,
                'comentario': row.comentario,
                'fecha_reseña': row.fecha_reseña.isoformat() if row.fecha_reseña else None,
                'usuario_nombre': usuario_nombre
            })

        conn.close()
        return {'reseñas': reseñas}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/materiales")
def get_materiales():
    try:
        conn = get_db_connection()
        if not conn:
            raise HTTPException(status_code=500, detail="Error de conexión")
        cursor = conn.cursor()
        cursor.execute("SELECT id, nombre FROM Materiales ORDER BY nombre")
        materiales = [{'id': row.id, 'nombre': row.nombre} for row in cursor.fetchall()]
        conn.close()
        return {'materiales': materiales}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/categorias")
def get_categories():
    try:
        conn = get_db_connection()
        if not conn:
            raise HTTPException(status_code=500, detail="Error de conexión")
        cursor = conn.cursor()
        cursor.execute('SELECT id, nombre, descripcion FROM CategoriasProducto ORDER BY nombre')
        categories_list = [{'id': r[0], 'name': r[1], 'description': r[2] or ''} for r in cursor.fetchall()]
        conn.close()
        return {'success': True, 'categories': categories_list}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
