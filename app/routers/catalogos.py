from fastapi import APIRouter, HTTPException
from app.data.database import get_db_connection
from app.models.catalogos import NewsletterSuscripcion, ContactoMensaje, DonacionCreate

router = APIRouter(tags=["catalogos"])


@router.get("/api/regiones")
def get_regiones():
    regiones = [
        {'id': 'pacifico', 'nombre': 'Océano Pacífico', 'descripcion': 'El mayor océano del planeta'},
        {'id': 'atlantico', 'nombre': 'Océano Atlántico', 'descripcion': 'Segundo océano más grande del mundo'},
        {'id': 'indico', 'nombre': 'Océano Índico', 'descripcion': 'Tercer océano más grande'},
        {'id': 'artico', 'nombre': 'Océano Ártico', 'descripcion': 'Océano polar del norte'},
        {'id': 'antartico', 'nombre': 'Océano Antártico', 'descripcion': 'Océano que rodea la Antártida'},
        {'id': 'mediterraneo', 'nombre': 'Mar Mediterráneo', 'descripcion': 'Mar semicerrado entre Europa, África y Asia'},
        {'id': 'caribe', 'nombre': 'Mar Caribe', 'descripcion': 'Mar tropical en América Central'}
    ]
    return {'success': True, 'regiones': regiones}


@router.post("/api/newsletter")
def suscribir_newsletter(data: NewsletterSuscripcion):
    try:
        email = data.email
        if not email or '@' not in email or '.' not in email:
            raise HTTPException(status_code=400, detail="Email inválido")

        conn = get_db_connection()
        if not conn:
            raise HTTPException(status_code=500, detail="Error de conexión")

        cursor = conn.cursor()
        cursor.execute("SELECT id, suscrito_newsletter FROM Usuarios WHERE email = ?", (email,))
        user_row = cursor.fetchone()

        if user_row:
            if user_row[1]:
                conn.close()
                return {'success': True, 'message': 'Este email ya está suscrito al newsletter', 'already_subscribed': True}
            else:
                cursor.execute("UPDATE Usuarios SET suscrito_newsletter = 1 WHERE email = ?", (email,))
                conn.commit()
                conn.close()
                return {'success': True, 'message': 'Suscripción reactivada exitosamente'}
        else:
            cursor.execute("""
                INSERT INTO Usuarios (nombre, apellido_paterno, apellido_materno, email, suscrito_newsletter, fecha_registro, activo)
                VALUES ('Usuario', 'Newsletter', NULL, ?, 1, GETDATE(), 1)
            """, (email,))
            conn.commit()
            conn.close()
            return {'success': True, 'message': 'Suscripción exitosa al newsletter'}

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error en suscribir_newsletter: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/api/contacto")
def enviar_contacto(data: ContactoMensaje):
    try:
        conn = get_db_connection()
        if not conn:
            raise HTTPException(status_code=500, detail="Error de conexión")

        cursor = conn.cursor()
        cursor.execute("SELECT id FROM Usuarios WHERE email = ?", (data.email,))
        user_row = cursor.fetchone()

        if user_row:
            user_id = user_row.id
        else:
            if data.nombre and data.apellidoPaterno:
                primer_nombre = data.nombre
                apellido_paterno = data.apellidoPaterno
                apellido_materno = data.apellidoMaterno
            else:
                nombre_partes = data.name.split()
                primer_nombre = nombre_partes[0] if nombre_partes else 'Usuario'
                apellido_paterno = nombre_partes[1] if len(nombre_partes) > 1 else 'Sin Apellido'
                apellido_materno = nombre_partes[2] if len(nombre_partes) > 2 else None

            cursor.execute("""
                INSERT INTO Usuarios (nombre, apellido_paterno, apellido_materno, email, suscrito_newsletter, activo)
                VALUES (?, ?, ?, ?, 0, 1)
            """, (primer_nombre, apellido_paterno, apellido_materno, data.email))
            cursor.execute("SELECT @@IDENTITY")
            user_id = cursor.fetchone()[0]

        cursor.execute("""
            INSERT INTO Contactos (id_usuario, asunto, mensaje, fecha_contacto, respondido)
            VALUES (?, ?, ?, GETDATE(), 0)
        """, (user_id, data.subject, data.message))

        conn.commit()
        conn.close()
        return {'success': True, 'message': 'Mensaje enviado exitosamente. Te contactaremos pronto.'}

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error en enviar_contacto: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")


@router.post("/api/procesar-donacion")
def procesar_donacion(data: DonacionCreate):
    try:
        conn = get_db_connection()
        if not conn:
            raise HTTPException(status_code=500, detail="Error de conexión")

        cursor = conn.cursor()
        cursor.execute("SELECT id FROM Usuarios WHERE email = ?", (data.contact_email,))
        user_row = cursor.fetchone()

        if user_row:
            user_id = user_row[0]
        else:
            if data.contact_nombre and data.contact_apellido_paterno:
                primer_nombre = data.contact_nombre
                apellido_paterno = data.contact_apellido_paterno
                apellido_materno = data.contact_apellido_materno
            else:
                nombre_partes = data.contact_name.split()
                primer_nombre = nombre_partes[0] if nombre_partes else 'Usuario'
                apellido_paterno = nombre_partes[1] if len(nombre_partes) > 1 else 'Sin Apellido'
                apellido_materno = nombre_partes[2] if len(nombre_partes) > 2 else None

            cursor.execute("""
                INSERT INTO Usuarios (nombre, apellido_paterno, apellido_materno, email, suscrito_newsletter, fecha_registro, activo)
                VALUES (?, ?, ?, ?, 0, GETDATE(), 1)
            """, (primer_nombre, apellido_paterno, apellido_materno, data.contact_email))
            cursor.execute("SELECT @@IDENTITY")
            user_id = cursor.fetchone()[0]

        cursor.execute("""
            INSERT INTO Donadores (id_usuario, monto, fecha_donacion, id_tipoDonacion)
            VALUES (?, ?, GETDATE(), 1)
        """, (user_id, float(data.amount)))
        cursor.execute("SELECT @@IDENTITY")
        donador_id = cursor.fetchone()[0]

        if data.payment_method == 'credit_card':
            primer_digito = (data.card_number or '').replace(' ', '')[:1]
            if primer_digito == '4':
                tipo_tarjeta_id = 1
            elif primer_digito in ['5', '2']:
                tipo_tarjeta_id = 2
            elif primer_digito == '3':
                tipo_tarjeta_id = 3
            else:
                tipo_tarjeta_id = 4

            cursor.execute("""
                INSERT INTO Donaciones (id_donador, numero_tarjeta_encriptado, fecha_expiracion_encriptada, cvv_encriptado, id_tipoTarjeta)
                VALUES (?, ?, ?, ?, ?)
            """, (donador_id, (data.card_number or '').replace(' ', ''), data.card_expiry, data.card_cvv, tipo_tarjeta_id))
        elif data.payment_method == 'paypal':
            cursor.execute("""
                INSERT INTO Donaciones (id_donador, numero_tarjeta_encriptado, fecha_expiracion_encriptada, cvv_encriptado, id_tipoTarjeta)
                VALUES (?, ?, ?, ?, ?)
            """, (donador_id, 'PAYPAL_TRANSACTION', 'N/A', 'N/A', 5))

        conn.commit()
        conn.close()
        return {'success': True, 'message': 'Donación procesada exitosamente', 'donador_id': donador_id}

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error en procesar_donacion: {e}")
        if 'conn' in dir() and conn:
            try:
                conn.rollback()
                conn.close()
            except:
                pass
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/api/setup-tienda")
def setup_tienda():
    try:
        conn = get_db_connection()
        if not conn:
            raise HTTPException(status_code=500, detail="Error de conexión")

        cursor = conn.cursor()

        categorias_ejemplo = [
            ('Ropa Sostenible', 'Prendas fabricadas con materiales ecológicos'),
            ('Accesorios Ecológicos', 'Productos útiles hechos con materiales reciclados'),
            ('Educativos', 'Materiales educativos sobre conservación marina'),
            ('Hogar Sustentable', 'Productos para el hogar que respetan el medio ambiente'),
            ('Juguetes Ecológicos', 'Juguetes fabricados con materiales naturales')
        ]
        for nombre, descripcion in categorias_ejemplo:
            cursor.execute("""
                IF NOT EXISTS (SELECT 1 FROM CategoriasProducto WHERE nombre = ?)
                INSERT INTO CategoriasProducto (nombre, descripcion) VALUES (?, ?)
            """, (nombre, nombre, descripcion))

        materiales_ejemplo = ['Algodón Orgánico', 'Plástico Reciclado', 'Bambú', 'Madera Certificada', 'Acero Inoxidable', 'Vidrio Reciclado', 'Materiales Naturales']
        for material in materiales_ejemplo:
            cursor.execute("""
                IF NOT EXISTS (SELECT 1 FROM Materiales WHERE nombre = ?)
                INSERT INTO Materiales (nombre) VALUES (?)
            """, (material, material))

        conn.commit()
        conn.close()
        return {'success': True, 'message': 'Tienda configurada con datos de ejemplo'}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
