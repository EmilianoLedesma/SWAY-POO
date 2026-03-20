from fastapi import APIRouter, HTTPException, Depends
from app.data.database import get_db_connection
from app.security.auth import get_current_tienda_user
from app.models.pedidos import PedidoCreate, CarritoAgregar

router = APIRouter(tags=["pedidos"])


@router.post("/api/pedidos/crear")
def crear_pedido(data: PedidoCreate):
    try:
        conn = get_db_connection()
        if not conn:
            raise HTTPException(status_code=500, detail="Error de conexión")

        cursor = conn.cursor()

        def buscar_o_crear_direccion(direccion_info):
            cursor.execute("SELECT id FROM Estados WHERE nombre = ?", (direccion_info.estado,))
            estado = cursor.fetchone()
            if not estado:
                cursor.execute("INSERT INTO Estados (nombre) VALUES (?)", (direccion_info.estado,))
                cursor.execute("SELECT @@IDENTITY")
                estado_id = cursor.fetchone()[0]
            else:
                estado_id = estado[0]

            cursor.execute("SELECT id FROM Municipios WHERE nombre = ? AND id_estado = ?", (direccion_info.municipio, estado_id))
            municipio = cursor.fetchone()
            if not municipio:
                cursor.execute("INSERT INTO Municipios (nombre, id_estado) VALUES (?, ?)", (direccion_info.municipio, estado_id))
                cursor.execute("SELECT @@IDENTITY")
                municipio_id = cursor.fetchone()[0]
            else:
                municipio_id = municipio[0]

            cursor.execute("SELECT id FROM Colonias WHERE nombre = ? AND id_municipio = ?", (direccion_info.colonia, municipio_id))
            colonia = cursor.fetchone()
            if not colonia:
                cp = direccion_info.codigo_postal
                cursor.execute("INSERT INTO Colonias (nombre, id_municipio, cp) VALUES (?, ?, ?)", (direccion_info.colonia, municipio_id, cp))
                cursor.execute("SELECT @@IDENTITY")
                colonia_id = cursor.fetchone()[0]
            else:
                colonia_id = colonia[0]

            cursor.execute("SELECT id FROM Calles WHERE nombre = ? AND id_colonia = ?", (direccion_info.calle, colonia_id))
            calle = cursor.fetchone()
            if not calle:
                cursor.execute("INSERT INTO Calles (nombre, id_colonia, n_exterior, n_interior) VALUES (?, ?, ?, ?)",
                             (direccion_info.calle, colonia_id, direccion_info.numero_exterior, direccion_info.numero_interior))
                cursor.execute("SELECT @@IDENTITY")
                calle_id = cursor.fetchone()[0]
            else:
                calle_id = calle[0]

            return calle_id

        id_calle = buscar_o_crear_direccion(data.direccion)

        cursor.execute("INSERT INTO Direcciones (id_calle) VALUES (?)", (id_calle,))
        cursor.execute("SELECT @@IDENTITY")
        direccion_id = cursor.fetchone()[0]

        total = 0
        for item in data.productos:
            item_id = item.get('id') if isinstance(item, dict) else getattr(item, 'id', None)
            item_qty = item.get('quantity', item.get('cantidad', 1)) if isinstance(item, dict) else getattr(item, 'quantity', 1)
            cursor.execute("SELECT precio FROM Productos WHERE id = ?", (item_id,))
            producto = cursor.fetchone()
            if producto:
                total += float(producto[0]) * int(item_qty)

        cursor.execute("""
            INSERT INTO Pedidos (id_usuario, total, id_estatus, id_direccion, telefono_contacto)
            VALUES (?, ?, ?, ?, ?)
        """, (data.user_id, total, 1, direccion_id, data.direccion.telefono_contacto or ''))

        cursor.execute("SELECT @@IDENTITY")
        pedido_id = cursor.fetchone()[0]

        for item in data.productos:
            item_id = item.get('id') if isinstance(item, dict) else getattr(item, 'id', None)
            item_qty = int(item.get('quantity', item.get('cantidad', 1)) if isinstance(item, dict) else getattr(item, 'quantity', 1))
            cursor.execute("SELECT precio FROM Productos WHERE id = ?", (item_id,))
            producto = cursor.fetchone()
            if producto:
                precio_unitario = float(producto[0])
                subtotal = precio_unitario * item_qty
                cursor.execute("""
                    INSERT INTO DetallesPedido (id_pedido, id_producto, cantidad, precio_unitario, subtotal)
                    VALUES (?, ?, ?, ?, ?)
                """, (pedido_id, item_id, item_qty, precio_unitario, subtotal))

        pago = data.pago
        if pago.tipo_pago == 'paypal':
            cursor.execute("""
                INSERT INTO PagosPedidos (id_pedido, numero_tarjeta, fecha_expiracion, cvv, nombre_tarjeta, id_tipoTarjeta, monto, id_estatus)
                VALUES (?, ?, ?, ?, ?, ?, ?, 3)
            """, (pedido_id, 'PAYPAL_TRANS', 'N/A', 'N/A', 'PayPal User', 5, total))
        else:
            numero_limpio = (pago.numero_tarjeta or '').replace(' ', '')
            tipo_tarjeta_id = 1
            if numero_limpio.startswith('5'):
                tipo_tarjeta_id = 2
            elif numero_limpio.startswith('3'):
                tipo_tarjeta_id = 3
            cursor.execute("""
                INSERT INTO PagosPedidos (id_pedido, numero_tarjeta, fecha_expiracion, cvv, nombre_tarjeta, id_tipoTarjeta, monto, id_estatus)
                VALUES (?, ?, ?, ?, ?, ?, ?, 3)
            """, (pedido_id, numero_limpio, pago.fecha_expiracion or '', pago.cvv or '', pago.nombre_tarjeta or '', tipo_tarjeta_id, total))

        for item in data.productos:
            item_id = item.get('id') if isinstance(item, dict) else getattr(item, 'id', None)
            item_qty = int(item.get('quantity', item.get('cantidad', 1)) if isinstance(item, dict) else getattr(item, 'quantity', 1))
            cursor.execute("UPDATE Productos SET stock = stock - ? WHERE id = ?", (item_qty, item_id))

        cursor.execute("UPDATE Pedidos SET id_estatus = 3 WHERE id = ?", (pedido_id,))

        conn.commit()
        conn.close()

        return {'success': True, 'pedido_id': pedido_id, 'total': total, 'message': 'Pedido creado exitosamente'}

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"Error en crear_pedido: {e}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/pedidos/mis-pedidos")
def get_mis_pedidos(current_user: dict = Depends(get_current_tienda_user)):
    try:
        user_id = int(current_user["sub"])
        conn = get_db_connection()
        if not conn:
            raise HTTPException(status_code=500, detail="Error de conexión")

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
        return {'pedidos': pedidos}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/pedidos/usuario/{user_id}")
def get_pedidos_usuario(user_id: int, current_user: dict = Depends(get_current_tienda_user)):
    try:
        if int(current_user["sub"]) != user_id:
            raise HTTPException(status_code=403, detail="No autorizado para ver estos pedidos")

        conn = get_db_connection()
        if not conn:
            raise HTTPException(status_code=500, detail="Error de conexión")

        cursor = conn.cursor()
        cursor.execute("""
            SELECT p.id, p.fecha_pedido, p.total, e.nombre as estatus
            FROM Pedidos p
            JOIN Estatus e ON p.id_estatus = e.id
            WHERE p.id_usuario = ?
            ORDER BY p.fecha_pedido DESC
        """, (user_id,))

        pedidos = [{'id': r.id, 'fecha_pedido': r.fecha_pedido.isoformat() if r.fecha_pedido else None, 'total': float(r.total), 'estatus': r.estatus} for r in cursor.fetchall()]
        conn.close()
        return {'pedidos': pedidos}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/pedidos/detalle/{pedido_id}")
def get_pedido_detalle(pedido_id: int, current_user: dict = Depends(get_current_tienda_user)):
    try:
        user_id = int(current_user["sub"])
        conn = get_db_connection()
        if not conn:
            raise HTTPException(status_code=500, detail="Error de conexión")

        cursor = conn.cursor()
        cursor.execute("SELECT id_usuario FROM Pedidos WHERE id = ?", (pedido_id,))
        pedido_owner = cursor.fetchone()

        if not pedido_owner or pedido_owner.id_usuario != user_id:
            conn.close()
            raise HTTPException(status_code=403, detail="No autorizado para ver este pedido")

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
            conn.close()
            raise HTTPException(status_code=404, detail="Pedido no encontrado")

        cursor.execute("""
            SELECT dp.cantidad, dp.precio_unitario, dp.subtotal, pr.nombre as producto_nombre
            FROM DetallesPedido dp
            JOIN Productos pr ON dp.id_producto = pr.id
            WHERE dp.id_pedido = ?
        """, (pedido_id,))

        detalles = [{'cantidad': r.cantidad, 'precio_unitario': float(r.precio_unitario), 'subtotal': float(r.subtotal), 'producto_nombre': r.producto_nombre} for r in cursor.fetchall()]
        conn.close()

        return {'pedido': {
            'id': pedido_row.id,
            'fecha_pedido': pedido_row.fecha_pedido.isoformat() if pedido_row.fecha_pedido else None,
            'total': float(pedido_row.total),
            'estatus': pedido_row.estatus,
            'telefono_contacto': pedido_row.telefono_contacto,
            'direccion': pedido_row.direccion_completa,
            'detalles': detalles
        }}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/api/pedidos/reordenar/{pedido_id}")
def reordenar_pedido(pedido_id: int, current_user: dict = Depends(get_current_tienda_user)):
    try:
        user_id = int(current_user["sub"])
        conn = get_db_connection()
        if not conn:
            raise HTTPException(status_code=500, detail="Error de conexión")

        cursor = conn.cursor()
        cursor.execute("SELECT id_usuario FROM Pedidos WHERE id = ?", (pedido_id,))
        pedido_owner = cursor.fetchone()

        if not pedido_owner or pedido_owner.id_usuario != user_id:
            conn.close()
            raise HTTPException(status_code=403, detail="No autorizado")

        cursor.execute("""
            SELECT dp.id_producto, dp.cantidad, pr.nombre, pr.precio, pr.stock, pr.imagen_url
            FROM DetallesPedido dp
            JOIN Productos pr ON dp.id_producto = pr.id
            WHERE dp.id_pedido = ? AND pr.activo = 1
        """, (pedido_id,))

        productos = []
        for row in cursor.fetchall():
            if row.stock >= row.cantidad:
                productos.append({'id': row.id_producto, 'nombre': row.nombre, 'precio': float(row.precio), 'cantidad': row.cantidad, 'imagen_url': row.imagen_url, 'stock': row.stock})

        conn.close()

        if not productos:
            raise HTTPException(status_code=400, detail="No hay productos disponibles para reordenar")

        return {'success': True, 'productos': productos, 'message': f'Se agregaron {len(productos)} productos al carrito'}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/api/carrito/agregar")
def agregar_al_carrito(data: CarritoAgregar):
    try:
        conn = get_db_connection()
        if not conn:
            raise HTTPException(status_code=500, detail="Error de conexión")

        cursor = conn.cursor()
        cursor.execute("SELECT id, nombre, precio, stock, activo FROM Productos WHERE id = ?", (data.producto_id,))
        producto = cursor.fetchone()
        conn.close()

        if not producto or not producto.activo:
            raise HTTPException(status_code=404, detail="Producto no encontrado")

        if producto.stock < data.cantidad:
            raise HTTPException(status_code=400, detail="Stock insuficiente")

        return {'success': True, 'producto': {'id': producto.id, 'nombre': producto.nombre, 'precio': float(producto.precio), 'stock': producto.stock}}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/tipos-tarjeta")
def get_tipos_tarjeta():
    try:
        conn = get_db_connection()
        if not conn:
            raise HTTPException(status_code=500, detail="Error de conexión")
        cursor = conn.cursor()
        cursor.execute("SELECT id, nombre FROM TiposTarjeta ORDER BY nombre")
        tipos = [{'id': row.id, 'nombre': row.nombre} for row in cursor.fetchall()]
        conn.close()
        return {'tipos_tarjeta': tipos}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
