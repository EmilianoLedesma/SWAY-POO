from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from app.data.database import get_db_connection, construir_nombre_completo
from app.security.auth import create_token, get_current_colaborador
from app.models.colaboradores import ColaboradorLogin, ColaboradorRegister, CheckEmail, CheckOrcid, CheckCedula, ColaboradorPerfilUpdate, ColaboradorPasswordChange
from app.services.email_service import send_welcome_email

router = APIRouter(tags=["colaboradores"])


@router.post("/api/colaboradores/login")
def colaborador_login(data: ColaboradorLogin):
    try:
        email = data.email.strip().lower()
        password = data.password

        conn = get_db_connection()
        if not conn:
            raise HTTPException(status_code=500, detail="Error de conexión a la base de datos")

        cursor = conn.cursor()
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
            raise HTTPException(status_code=401, detail="Usuario no encontrado o no es un colaborador activo")

        if user[5] != password:
            raise HTTPException(status_code=401, detail="Contraseña incorrecta")

        nombre_completo = construir_nombre_completo(user[1], user[2], user[3])

        token = create_token({
            "sub": str(user[0]),
            "colaborador_id": user[6],
            "email": user[4],
            "user_type": "colaborador",
            "token_type": "colaborador"
        })

        return {
            "success": True,
            "message": "Login exitoso",
            "access_token": token,
            "token_type": "bearer",
            "user": {
                "id": user[0],
                "nombre": user[1],
                "apellido_paterno": user[2],
                "apellido_materno": user[3],
                "nombre_completo": nombre_completo,
                "email": user[4],
                "colaborador_id": user[6],
                "especialidad": user[7],
                "institucion": user[9],
                "años_experiencia": user[10],
                "grado_academico": user[11]
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error en colaborador_login: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/api/colaboradores/register")
def colaborador_register(data: ColaboradorRegister, background_tasks: BackgroundTasks):
    try:
        conn = get_db_connection()
        if not conn:
            raise HTTPException(status_code=500, detail="Error de conexión a la base de datos")

        cursor = conn.cursor()
        cursor.execute("SELECT id FROM Usuarios WHERE LOWER(email) = ?", (data.email.lower(),))
        existing_user = cursor.fetchone()

        if existing_user:
            cursor.execute("""
                SELECT estado_solicitud FROM Colaboradores
                WHERE id_usuario = ? AND estado_solicitud IN ('pendiente', 'aprobada')
            """, (existing_user[0],))
            existing_collaborator = cursor.fetchone()
            if existing_collaborator:
                estado = existing_collaborator[0]
                conn.close()
                if estado == 'pendiente':
                    raise HTTPException(status_code=400, detail="Ya tienes una solicitud de colaboración pendiente")
                elif estado == 'aprobada':
                    raise HTTPException(status_code=400, detail="Ya eres un colaborador activo")
            user_id = existing_user[0]
        else:
            if data.apellidoPaterno:
                primer_nombre = data.nombre
                apellido_paterno = data.apellidoPaterno
                apellido_materno = data.apellidoMaterno
            else:
                nombre_partes = data.nombre.split()
                primer_nombre = nombre_partes[0] if nombre_partes else 'Usuario'
                apellido_paterno = nombre_partes[1] if len(nombre_partes) > 1 else 'Sin Apellido'
                apellido_materno = nombre_partes[2] if len(nombre_partes) > 2 else None

            cursor.execute("""
                INSERT INTO Usuarios (nombre, apellido_paterno, apellido_materno, email, password_hash, suscrito_newsletter, activo)
                OUTPUT INSERTED.id
                VALUES (?, ?, ?, ?, ?, 0, 1)
            """, (primer_nombre, apellido_paterno, apellido_materno, data.email.lower(), data.password))

            user_result = cursor.fetchone()
            if not user_result:
                conn.close()
                raise HTTPException(status_code=500, detail="No se pudo crear el usuario")
            user_id = user_result[0]

        cursor.execute("""
            INSERT INTO Colaboradores (
                id_usuario, especialidad, grado_academico, institucion,
                años_experiencia, numero_cedula, orcid, motivacion,
                estado_solicitud, fecha_aprobacion, aprobado_por
            ) OUTPUT INSERTED.id
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'aprobada', GETDATE(), NULL)
        """, (
            user_id, data.especialidad, data.grado_academico, data.institucion,
            data.años_experiencia, data.numero_cedula, data.orcid, data.motivacion
        ))

        colaborador_result = cursor.fetchone()
        if not colaborador_result:
            conn.close()
            raise HTTPException(status_code=500, detail="No se pudo crear el colaborador")
        colaborador_id = colaborador_result[0]

        conn.commit()
        conn.close()

        nombre_completo = construir_nombre_completo(
            data.nombre,
            data.apellidoPaterno or "",
            data.apellidoMaterno or ""
        )
        background_tasks.add_task(
            send_welcome_email,
            nombre=nombre_completo,
            email=data.email,
            institucion=data.institucion or "SWAY Conservación Marina"
        )

        return {
            "success": True,
            "message": "Registro exitoso. Has sido aprobado como colaborador científico.",
            "colaborador_id": colaborador_id,
            "user_id": user_id
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error en colaborador_register: {e}")
        if 'conn' in dir() and conn:
            try:
                conn.rollback()
                conn.close()
            except:
                pass
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/api/colaboradores/logout")
def logout_colaborador():
    return {"success": True, "message": "Sesión de colaborador cerrada exitosamente"}


@router.get("/api/colaboradores/profile")
def get_colaborador_profile(current_user: dict = Depends(get_current_colaborador)):
    try:
        colaborador_email = current_user.get("email")
        conn = get_db_connection()
        if not conn:
            raise HTTPException(status_code=500, detail="Error de conexión a la base de datos")

        cursor = conn.cursor()
        cursor.execute("""
            SELECT c.id, c.especialidad, c.grado_academico, c.institucion,
                   c.años_experiencia, c.numero_cedula, c.orcid, c.estado_solicitud,
                   u.nombre, u.apellido_paterno, u.apellido_materno, u.email,
                   u.telefono, u.fecha_nacimiento, c.motivacion, u.id as usuario_id
            FROM Colaboradores c
            JOIN Usuarios u ON c.id_usuario = u.id
            WHERE u.email = ?
        """, (colaborador_email,))

        row = cursor.fetchone()
        conn.close()

        if not row:
            raise HTTPException(status_code=404, detail="Colaborador no encontrado")

        nombre_completo = construir_nombre_completo(row[8], row[9], row[10], "Dr. ")

        experiencia_raw = row[4]
        if experiencia_raw is None:
            experiencia_procesada = '0'
        else:
            experiencia_procesada = str(experiencia_raw).replace(' años', '').replace(' año', '').strip()
            if not experiencia_procesada:
                experiencia_procesada = '0'

        return {
            "success": True,
            "colaborador": {
                "id": row[0],
                "usuario_id": row[15],
                "especialidad": row[1],
                "grado_academico": row[2],
                "institucion": row[3],
                "años_experiencia": experiencia_procesada,
                "numero_cedula": row[5],
                "orcid": row[6],
                "estado_solicitud": row[7],
                "nombre": row[8],
                "apellido_paterno": row[9],
                "apellido_materno": row[10] or "",
                "nombre_completo": nombre_completo,
                "email": row[11],
                "telefono": row[12] or "",
                "fecha_nacimiento": row[13].isoformat() if row[13] else "",
                "motivacion": row[14] or ""
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error en get_colaborador_profile: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/colaboradores/status")
def colaborador_status(current_user: dict = Depends(get_current_colaborador)):
    return {
        "success": True,
        "user": {
            "id": current_user.get("sub"),
            "name": current_user.get("name", "Usuario"),
            "email": current_user.get("email", ""),
            "colaborador_id": current_user.get("colaborador_id", ""),
            "user_type": "colaborador"
        }
    }


@router.post("/api/colaboradores/check-email")
def check_collaborator_email(data: CheckEmail):
    try:
        email = data.email.strip().lower()
        conn = get_db_connection()
        if not conn:
            raise HTTPException(status_code=500, detail="Error de conexión")

        cursor = conn.cursor()
        cursor.execute("""
            SELECT u.id, c.estado_solicitud, c.activo
            FROM Usuarios u
            LEFT JOIN Colaboradores c ON u.id = c.id_usuario
            WHERE LOWER(u.email) = ?
        """, (email,))

        result = cursor.fetchone()
        conn.close()

        if not result:
            return {"exists": False, "can_register": True}

        user_id, estado_solicitud, activo = result

        if estado_solicitud == 'pendiente':
            return {"exists": True, "can_register": False, "message": "Ya tienes una solicitud pendiente"}
        elif estado_solicitud == 'aprobada' and activo:
            return {"exists": True, "can_register": False, "message": "Ya eres un colaborador activo"}
        else:
            return {"exists": True, "can_register": True}

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error en check_collaborator_email: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/api/colaboradores/check-orcid")
def check_collaborator_orcid(data: CheckOrcid):
    try:
        orcid = data.orcid.strip()
        conn = get_db_connection()
        if not conn:
            raise HTTPException(status_code=500, detail="Error de conexión")

        cursor = conn.cursor()
        cursor.execute("""
            SELECT estado_solicitud, activo
            FROM Colaboradores
            WHERE orcid = ? AND orcid != ''
        """, (orcid,))

        result = cursor.fetchone()
        conn.close()

        if not result:
            return {"exists": False, "can_register": True}

        estado_solicitud, activo = result

        if estado_solicitud == 'pendiente':
            return {"exists": True, "can_register": False, "message": "Este ORCID ya tiene una solicitud pendiente"}
        elif estado_solicitud == 'aprobada' and activo:
            return {"exists": True, "can_register": False, "message": "Este ORCID ya pertenece a un colaborador activo"}
        else:
            return {"exists": True, "can_register": True}

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error en check_collaborator_orcid: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/api/colaboradores/check-cedula")
def check_collaborator_cedula(data: CheckCedula):
    try:
        cedula = data.cedula.strip()
        conn = get_db_connection()
        if not conn:
            raise HTTPException(status_code=500, detail="Error de conexión")

        cursor = conn.cursor()
        cursor.execute("""
            SELECT estado_solicitud, activo
            FROM Colaboradores
            WHERE numero_cedula = ? AND numero_cedula != ''
        """, (cedula,))

        result = cursor.fetchone()
        conn.close()

        if not result:
            return {"exists": False, "can_register": True}

        estado_solicitud, activo = result

        if estado_solicitud == 'pendiente':
            return {"exists": True, "can_register": False, "message": "Esta cédula ya tiene una solicitud pendiente"}
        elif estado_solicitud == 'aprobada' and activo:
            return {"exists": True, "can_register": False, "message": "Esta cédula ya pertenece a un colaborador activo"}
        else:
            return {"exists": True, "can_register": True}

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error en check_collaborator_cedula: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/api/colaboradores/perfil")
def update_colaborador_perfil(data: ColaboradorPerfilUpdate, current_user: dict = Depends(get_current_colaborador)):
    try:
        user_id = int(current_user.get("sub"))
        colaborador_id = current_user.get("colaborador_id")

        conn = get_db_connection()
        if not conn:
            raise HTTPException(status_code=500, detail="Error de conexión a la base de datos")

        cursor = conn.cursor()

        # Actualizar tabla Usuarios
        user_fields = []
        user_values = []
        if data.nombre:
            user_fields.append("nombre = ?"); user_values.append(data.nombre or None)
        if data.apellido_paterno:
            user_fields.append("apellido_paterno = ?"); user_values.append(data.apellido_paterno or None)
        if data.apellido_materno:
            user_fields.append("apellido_materno = ?"); user_values.append(data.apellido_materno or None)
        if data.telefono:
            user_fields.append("telefono = ?"); user_values.append(data.telefono or None)
        if data.fecha_nacimiento:
            user_fields.append("fecha_nacimiento = ?"); user_values.append(data.fecha_nacimiento or None)

        if user_fields:
            user_values.append(user_id)
            cursor.execute(f"UPDATE Usuarios SET {', '.join(user_fields)} WHERE id = ?", user_values)

        # Actualizar tabla Colaboradores
        colab_fields = []
        colab_values = []
        if data.especialidad:
            colab_fields.append("especialidad = ?"); colab_values.append(data.especialidad or None)
        if data.grado_academico:
            colab_fields.append("grado_academico = ?"); colab_values.append(data.grado_academico or None)
        if data.institucion:
            colab_fields.append("institucion = ?"); colab_values.append(data.institucion or None)
        if data.años_experiencia:
            colab_fields.append("años_experiencia = ?"); colab_values.append(data.años_experiencia or None)
        if data.numero_cedula:
            colab_fields.append("numero_cedula = ?"); colab_values.append(data.numero_cedula or None)
        if data.orcid:
            colab_fields.append("orcid = ?"); colab_values.append(data.orcid or None)
        if data.motivacion:
            colab_fields.append("motivacion = ?"); colab_values.append(data.motivacion or None)

        if colab_fields:
            colab_fields.append("fecha_modificacion = GETDATE()")
            colab_values.append(colaborador_id)
            cursor.execute(f"UPDATE Colaboradores SET {', '.join(colab_fields)} WHERE id = ?", colab_values)

        conn.commit()
        conn.close()
        return {"success": True, "message": "Perfil actualizado correctamente"}

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error en update_colaborador_perfil: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/api/colaboradores/perfil/password")
def change_colaborador_password(data: ColaboradorPasswordChange, current_user: dict = Depends(get_current_colaborador)):
    try:
        user_id = int(current_user.get("sub"))

        conn = get_db_connection()
        if not conn:
            raise HTTPException(status_code=500, detail="Error de conexión a la base de datos")

        cursor = conn.cursor()
        cursor.execute("SELECT password_hash FROM Usuarios WHERE id = ?", (user_id,))
        row = cursor.fetchone()

        if not row or row[0] != data.password_actual:
            conn.close()
            raise HTTPException(status_code=400, detail="La contraseña actual es incorrecta")

        cursor.execute("UPDATE Usuarios SET password_hash = ? WHERE id = ?", (data.password_nuevo, user_id))
        conn.commit()
        conn.close()
        return {"success": True, "message": "Contraseña actualizada correctamente"}

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error en change_colaborador_password: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/api/colaboradores/perfil")
def delete_colaborador_perfil(current_user: dict = Depends(get_current_colaborador)):
    try:
        colaborador_id = current_user.get("colaborador_id")
        user_id = int(current_user.get("sub"))

        conn = get_db_connection()
        if not conn:
            raise HTTPException(status_code=500, detail="Error de conexión a la base de datos")

        cursor = conn.cursor()
        # Soft delete: desactivar colaborador y usuario
        cursor.execute("UPDATE Colaboradores SET activo = 0, estado_solicitud = 'inactivo' WHERE id = ?", (colaborador_id,))
        cursor.execute("UPDATE Usuarios SET activo = 0 WHERE id = ?", (user_id,))
        conn.commit()
        conn.close()
        return {"success": True, "message": "Cuenta desactivada correctamente"}

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error en delete_colaborador_perfil: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/colaboradores/avistamientos")
def get_colaborador_avistamientos(current_user: dict = Depends(get_current_colaborador)):
    try:
        colaborador_email = current_user.get("email")
        conn = get_db_connection()
        if not conn:
            raise HTTPException(status_code=500, detail="Error de conexión")

        cursor = conn.cursor()
        cursor.execute("""
            SELECT a.id, a.fecha, a.latitud, a.longitud, a.notas,
                   e.nombre_comun, e.nombre_cientifico,
                   u.nombre, u.apellido_paterno, u.apellido_materno, u.email
            FROM Avistamientos a
            JOIN Especies e ON a.id_especie = e.id
            JOIN Usuarios u ON a.id_usuario = u.id
            WHERE u.email = ?
            ORDER BY a.fecha DESC
        """, (colaborador_email,))

        avistamientos = []
        for row in cursor.fetchall():
            nombre_partes = [row[7], row[8], row[9]]
            nombre_completo = ' '.join(p for p in nombre_partes if p)
            avistamientos.append({
                "id": row[0],
                "fecha": row[1].isoformat() if row[1] else None,
                "latitud": float(row[2]) if row[2] else None,
                "longitud": float(row[3]) if row[3] else None,
                "notas": row[4],
                "especie_nombre": row[5],
                "especie_cientifica": row[6],
                "reportado_por": nombre_completo or None,
                "email_usuario": row[10]
            })

        conn.close()
        return {"success": True, "avistamientos": avistamientos}

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error en get_colaborador_avistamientos: {e}")
        raise HTTPException(status_code=500, detail=str(e))
