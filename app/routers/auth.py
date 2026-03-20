from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from app.data.database import get_db_connection, construir_nombre_completo
from app.security.auth import create_token, get_current_tienda_user

router = APIRouter(tags=["auth"])


class UserLogin(BaseModel):
    email: str
    password: str


class UserRegister(BaseModel):
    nombre: str
    apellidoPaterno: str
    apellidoMaterno: Optional[str] = None
    email: str
    password: str
    telefono: Optional[str] = None
    fecha_nacimiento: Optional[str] = None
    newsletter: Optional[bool] = False


class AuthLogin(BaseModel):
    email: str
    password: str


class AuthRegister(BaseModel):
    nombre: str
    email: str
    password: str
    telefono: str
    apellidoPaterno: Optional[str] = None
    apellidoMaterno: Optional[str] = None
    fecha_nacimiento: Optional[str] = None
    newsletter: Optional[bool] = False


@router.post("/api/user/login")
def user_login(data: UserLogin):
    try:
        email = data.email
        password = data.password

        if not email or not password:
            raise HTTPException(status_code=400, detail="Email y contraseña son requeridos")

        conn = get_db_connection()
        if not conn:
            raise HTTPException(status_code=500, detail="Error de conexión a la base de datos")

        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, nombre, apellido_paterno, apellido_materno,
                   email, password_hash, telefono, activo
            FROM Usuarios
            WHERE email = ? AND activo = 1
        """, (email,))

        user = cursor.fetchone()
        conn.close()

        if user and user.password_hash == password:
            nombre_completo = construir_nombre_completo(user.nombre, user.apellido_paterno, user.apellido_materno)

            token = create_token({
                "sub": str(user.id),
                "email": user.email,
                "name": nombre_completo,
                "token_type": "tienda"
            })

            return {
                "success": True,
                "message": "Login exitoso",
                "access_token": token,
                "token_type": "bearer",
                "user": {
                    "id": user.id,
                    "nombre": nombre_completo,
                    "email": user.email,
                    "telefono": user.telefono
                }
            }
        else:
            raise HTTPException(status_code=401, detail="Credenciales incorrectas")

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"Error en login: {e}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")


@router.post("/api/user/register")
def user_register(data: UserRegister):
    try:
        conn = get_db_connection()
        if not conn:
            raise HTTPException(status_code=500, detail="Error de conexión a la base de datos")

        cursor = conn.cursor()
        cursor.execute("SELECT id FROM Usuarios WHERE email = ?", (data.email,))
        if cursor.fetchone():
            conn.close()
            raise HTTPException(status_code=400, detail="El email ya está registrado")

        cursor.execute("""
            INSERT INTO Usuarios (nombre, apellido_paterno, apellido_materno, email, password_hash, telefono, fecha_nacimiento, suscrito_newsletter, activo, fecha_registro)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, GETDATE())
        """, (data.nombre, data.apellidoPaterno, data.apellidoMaterno, data.email, data.password, data.telefono, data.fecha_nacimiento, data.newsletter))

        conn.commit()
        cursor.execute("SELECT @@IDENTITY")
        user_id = cursor.fetchone()[0]
        conn.close()

        nombre_completo = data.nombre + ' ' + data.apellidoPaterno + (' ' + data.apellidoMaterno if data.apellidoMaterno else '')

        token = create_token({
            "sub": str(int(user_id)),
            "email": data.email,
            "name": nombre_completo,
            "token_type": "tienda"
        })

        return {
            "success": True,
            "message": "Registro exitoso",
            "access_token": token,
            "token_type": "bearer",
            "user": {
                "id": int(user_id),
                "nombre": nombre_completo,
                "email": data.email,
                "telefono": data.telefono
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"Error en registro: {e}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")


@router.post("/api/user/logout")
def logout():
    return {"success": True, "message": "Sesión cerrada exitosamente"}


@router.get("/api/user/status")
def user_status(current_user: dict = Depends(get_current_tienda_user)):
    try:
        user_id = int(current_user["sub"])
        conn = get_db_connection()
        if not conn:
            raise HTTPException(status_code=500, detail="Error de conexión")

        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, nombre, apellido_paterno, apellido_materno,
                   email, telefono, fecha_registro, fecha_nacimiento
            FROM Usuarios
            WHERE id = ?
        """, (user_id,))

        user = cursor.fetchone()
        conn.close()

        if not user:
            raise HTTPException(status_code=401, detail="Usuario no encontrado")

        nombre_completo = construir_nombre_completo(user[1], user[2], user[3])

        return {
            "success": True,
            "user": {
                "id": user[0],
                "nombre": nombre_completo,
                "email": user[4],
                "telefono": user[5],
                "fecha_registro": user[6].isoformat() if user[6] else None,
                "fecha_nacimiento": user[7].isoformat() if user[7] else None
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error en user_status: {e}")
        raise HTTPException(status_code=500, detail="Error al verificar sesión")


@router.post("/api/auth/register")
def auth_register(data: AuthRegister):
    try:
        conn = get_db_connection()
        if not conn:
            raise HTTPException(status_code=500, detail="Error de conexión a la base de datos")

        cursor = conn.cursor()
        cursor.execute("SELECT id FROM Usuarios WHERE email = ?", (data.email,))
        if cursor.fetchone():
            conn.close()
            raise HTTPException(status_code=400, detail="El email ya está registrado")

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
            INSERT INTO Usuarios (nombre, apellido_paterno, apellido_materno, email, password_hash, telefono, fecha_nacimiento, suscrito_newsletter)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (primer_nombre, apellido_paterno, apellido_materno, data.email, data.password, data.telefono, data.fecha_nacimiento, data.newsletter or False))

        conn.commit()
        cursor.execute("SELECT @@IDENTITY")
        user_id = cursor.fetchone()[0]
        conn.close()

        return {"success": True, "message": "Usuario registrado exitosamente", "user_id": int(user_id)}

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error en auth_register: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")


@router.post("/api/auth/login")
def auth_login(data: AuthLogin):
    try:
        conn = get_db_connection()
        if not conn:
            raise HTTPException(status_code=500, detail="Error de conexión a la base de datos")

        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, nombre, apellido_paterno, apellido_materno,
                   email, telefono, activo
            FROM Usuarios
            WHERE email = ? AND password_hash = ?
        """, (data.email, data.password))

        user = cursor.fetchone()
        conn.close()

        if not user or not user.activo:
            raise HTTPException(status_code=401, detail="Credenciales inválidas")

        nombre_completo = construir_nombre_completo(user.nombre, user.apellido_paterno, user.apellido_materno)

        return {
            "success": True,
            "user": {
                "id": user.id,
                "nombre": nombre_completo,
                "email": user.email,
                "telefono": user.telefono
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error en auth_login: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")
