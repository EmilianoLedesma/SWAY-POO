"""
SWAY - Rutas con SQLAlchemy ORM
Endpoints refactorizados con validación del servidor y ORM
"""

from flask import request, jsonify, session
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from datetime import datetime
from decimal import Decimal

from models import (
    get_session, Usuario, Colaborador, EspecieMarina, EstadoConservacion,
    Producto, CategoriaProducto, Pedido, DetallePedido, CarritoCompra
)
from validators import (
    validate_user_registration, validate_user_login, validate_colaborador_registration,
    validate_especie_marina, validate_producto, validate_pedido, ValidationError
)

def construir_nombre_completo(nombre, apellido_paterno, apellido_materno, prefijo=""):
    """Construye un nombre completo evitando duplicación de apellidos"""
    if not nombre:
        return "Usuario"
    
    if apellido_paterno and apellido_paterno in nombre:
        return f"{prefijo}{nombre}".strip()
    else:
        apellidos = []
        if apellido_paterno:
            apellidos.append(apellido_paterno)
        if apellido_materno:
            apellidos.append(apellido_materno)
        
        if apellidos:
            return f"{prefijo}{nombre} {' '.join(apellidos)}".strip()
        else:
            return f"{prefijo}{nombre}".strip()

# ========================================
# RUTAS DE AUTENTICACIÓN DE USUARIOS
# ========================================

def register_user_routes(app):
    """Registrar rutas de usuarios con ORM"""
    
    @app.route('/api/user/register', methods=['POST'])
    def user_register_orm():
        """Registrar nuevo usuario con validación del servidor y ORM"""
        db = get_session()
        try:
            data = request.get_json()
            
            # Validación del lado del servidor
            try:
                validated_data = validate_user_registration(data)
            except ValidationError as e:
                return jsonify({'success': False, 'error': str(e)}), 400
            
            # Verificar si el email ya existe
            existing_user = db.query(Usuario).filter_by(email=validated_data['email']).first()
            if existing_user:
                return jsonify({'success': False, 'error': 'El email ya está registrado'}), 400
            
            # Crear nuevo usuario
            nuevo_usuario = Usuario(
                nombre=validated_data['nombre'],
                apellido_paterno=validated_data['apellido_paterno'],
                apellido_materno=validated_data['apellido_materno'],
                email=validated_data['email'],
                password_hash=generate_password_hash(validated_data['password']),
                telefono=validated_data.get('telefono'),
                fecha_nacimiento=validated_data.get('fecha_nacimiento'),
                suscrito_newsletter=data.get('suscritoNewsletter', False),
                activo=True
            )
            
            db.add(nuevo_usuario)
            db.commit()
            
            return jsonify({
                'success': True,
                'message': 'Usuario registrado exitosamente',
                'user_id': nuevo_usuario.id
            }), 201
            
        except IntegrityError as e:
            db.rollback()
            return jsonify({'success': False, 'error': 'Error de integridad de datos'}), 400
        except SQLAlchemyError as e:
            db.rollback()
            print(f"Error de base de datos: {e}")
            return jsonify({'success': False, 'error': 'Error al registrar usuario'}), 500
        finally:
            db.close()
    
    @app.route('/api/user/login', methods=['POST'])
    def user_login_orm():
        """Iniciar sesión con validación del servidor y ORM"""
        db = get_session()
        try:
            data = request.get_json()
            
            # Validación del lado del servidor
            try:
                validated_data = validate_user_login(data)
            except ValidationError as e:
                return jsonify({'success': False, 'error': str(e)}), 400
            
            # Buscar usuario por email
            usuario = db.query(Usuario).filter_by(email=validated_data['email']).first()
            
            if not usuario:
                return jsonify({'success': False, 'error': 'Email o contraseña incorrectos'}), 401
            
            # Verificar que el usuario esté activo
            if not usuario.activo:
                return jsonify({'success': False, 'error': 'Cuenta inactiva'}), 401
            
            # Verificar contraseña
            if not check_password_hash(usuario.password_hash, validated_data['password']):
                return jsonify({'success': False, 'error': 'Email o contraseña incorrectos'}), 401
            
            # Crear sesión
            nombre_completo = construir_nombre_completo(
                usuario.nombre,
                usuario.apellido_paterno,
                usuario.apellido_materno
            )
            
            session['tienda_user_id'] = usuario.id
            session['tienda_user_name'] = nombre_completo
            session['tienda_user_email'] = usuario.email
            
            return jsonify({
                'success': True,
                'message': 'Sesión iniciada exitosamente',
                'user': {
                    'id': usuario.id,
                    'nombre': nombre_completo,
                    'email': usuario.email
                }
            })
            
        except SQLAlchemyError as e:
            print(f"Error de base de datos: {e}")
            return jsonify({'success': False, 'error': 'Error al iniciar sesión'}), 500
        finally:
            db.close()
    
    @app.route('/api/user/logout', methods=['POST'])
    def user_logout_orm():
        """Cerrar sesión de tienda"""
        session.pop('tienda_user_id', None)
        session.pop('tienda_user_name', None)
        session.pop('tienda_user_email', None)
        return jsonify({'success': True, 'message': 'Sesión cerrada exitosamente'})
    
    @app.route('/api/user/status', methods=['GET'])
    def user_status_orm():
        """Verificar estado de sesión de usuario"""
        if 'tienda_user_id' in session:
            return jsonify({
                'authenticated': True,
                'user': {
                    'id': session['tienda_user_id'],
                    'nombre': session['tienda_user_name'],
                    'email': session['tienda_user_email']
                }
            })
        else:
            return jsonify({'authenticated': False})

# ========================================
# RUTAS DE COLABORADORES
# ========================================

def register_colaborador_routes(app):
    """Registrar rutas de colaboradores con ORM"""
    
    @app.route('/api/colaboradores/register', methods=['POST'])
    def colaborador_register_orm():
        """Registrar nuevo colaborador con validación del servidor y ORM"""
        db = get_session()
        try:
            data = request.get_json()
            
            # Validación del lado del servidor
            try:
                validated_data = validate_colaborador_registration(data)
            except ValidationError as e:
                return jsonify({'success': False, 'error': str(e)}), 400
            
            # Verificar si el email ya existe
            existing_user = db.query(Usuario).filter_by(email=validated_data['email']).first()
            if existing_user:
                return jsonify({'success': False, 'error': 'El email ya está registrado'}), 400
            
            # Crear nuevo usuario
            nuevo_usuario = Usuario(
                nombre=validated_data['nombre'],
                apellido_paterno=validated_data['apellido_paterno'],
                apellido_materno=validated_data['apellido_materno'],
                email=validated_data['email'],
                password_hash=generate_password_hash(validated_data['password']),
                telefono=validated_data.get('telefono'),
                activo=True
            )
            
            db.add(nuevo_usuario)
            db.flush()  # Para obtener el ID sin hacer commit
            
            # Crear registro de colaborador
            nuevo_colaborador = Colaborador(
                id_usuario=nuevo_usuario.id,
                especialidad=validated_data['especialidad'],
                grado_academico=validated_data['grado_academico'],
                institucion=validated_data['institucion'],
                años_experiencia=validated_data['años_experiencia'],
                numero_cedula=validated_data.get('numero_cedula'),
                orcid=validated_data.get('orcid'),
                estado_solicitud='pendiente',
                activo=True
            )
            
            db.add(nuevo_colaborador)
            db.commit()
            
            return jsonify({
                'success': True,
                'message': 'Solicitud de colaborador enviada exitosamente',
                'colaborador_id': nuevo_colaborador.id
            }), 201
            
        except IntegrityError as e:
            db.rollback()
            return jsonify({'success': False, 'error': 'Error de integridad de datos'}), 400
        except SQLAlchemyError as e:
            db.rollback()
            print(f"Error de base de datos: {e}")
            return jsonify({'success': False, 'error': 'Error al registrar colaborador'}), 500
        finally:
            db.close()
    
    @app.route('/api/colaboradores/login', methods=['POST'])
    def colaborador_login_orm():
        """Iniciar sesión de colaborador con ORM"""
        db = get_session()
        try:
            data = request.get_json()
            
            # Validación del lado del servidor
            try:
                validated_data = validate_user_login(data)
            except ValidationError as e:
                return jsonify({'success': False, 'error': str(e)}), 400
            
            # Buscar usuario y colaborador
            usuario = db.query(Usuario).filter_by(email=validated_data['email']).first()
            
            if not usuario:
                return jsonify({'success': False, 'error': 'Email o contraseña incorrectos'}), 401
            
            # Verificar que sea colaborador
            colaborador = db.query(Colaborador).filter_by(id_usuario=usuario.id).first()
            if not colaborador:
                return jsonify({'success': False, 'error': 'Usuario no es colaborador'}), 403
            
            # Verificar estado de solicitud
            if colaborador.estado_solicitud != 'aprobada':
                return jsonify({
                    'success': False,
                    'error': f'Solicitud de colaborador {colaborador.estado_solicitud}'
                }), 403
            
            # Verificar contraseña
            if not check_password_hash(usuario.password_hash, validated_data['password']):
                return jsonify({'success': False, 'error': 'Email o contraseña incorrectos'}), 401
            
            # Crear sesión de colaborador
            nombre_completo = construir_nombre_completo(
                usuario.nombre,
                usuario.apellido_paterno,
                usuario.apellido_materno,
                "Dr. "
            )
            
            session['colab_user_id'] = usuario.id
            session['colab_user_name'] = nombre_completo
            session['colab_user_email'] = usuario.email
            session['colab_colaborador_id'] = colaborador.id
            session['colab_user_type'] = 'colaborador'
            
            return jsonify({
                'success': True,
                'message': 'Sesión iniciada exitosamente',
                'colaborador': {
                    'id': colaborador.id,
                    'nombre': nombre_completo,
                    'email': usuario.email,
                    'especialidad': colaborador.especialidad
                }
            })
            
        except SQLAlchemyError as e:
            print(f"Error de base de datos: {e}")
            return jsonify({'success': False, 'error': 'Error al iniciar sesión'}), 500
        finally:
            db.close()
    
    @app.route('/api/colaboradores/logout', methods=['POST'])
    def colaborador_logout_orm():
        """Cerrar sesión de colaborador"""
        session.pop('colab_user_id', None)
        session.pop('colab_user_name', None)
        session.pop('colab_user_email', None)
        session.pop('colab_colaborador_id', None)
        session.pop('colab_user_type', None)
        return jsonify({'success': True, 'message': 'Sesión cerrada exitosamente'})
    
    @app.route('/api/colaboradores/status', methods=['GET'])
    def colaborador_status_orm():
        """Verificar estado de sesión de colaborador"""
        if 'colab_user_email' in session:
            return jsonify({
                'authenticated': True,
                'colaborador': {
                    'id': session.get('colab_colaborador_id'),
                    'nombre': session.get('colab_user_name'),
                    'email': session.get('colab_user_email')
                }
            })
        else:
            return jsonify({'authenticated': False})

# ========================================
# RUTAS DE ESPECIES MARINAS (CRUD COMPLETO)
# ========================================

def register_especies_routes(app):
    """Registrar rutas de especies con ORM - CRUD COMPLETO"""
    
    @app.route('/api/especies', methods=['GET'])
    def get_especies_orm():
        """Obtener listado de especies con filtros y paginación"""
        db = get_session()
        try:
            # Parámetros de filtro
            habitat = request.args.get('habitat', '')
            conservacion = request.args.get('conservation', '')
            search = request.args.get('search', '').lower()
            page = int(request.args.get('page', 1))
            limit = int(request.args.get('limit', 12))
            
            query = db.query(EspecieMarina)
            
            # Aplicar filtros
            if search:
                query = query.filter(
                    (EspecieMarina.nombre_comun.ilike(f'%{search}%')) |
                    (EspecieMarina.nombre_cientifico.ilike(f'%{search}%'))
                )
            
            if conservacion:
                query = query.join(EstadoConservacion).filter(
                    EstadoConservacion.codigo == conservacion
                )
            
            # Paginación
            total = query.count()
            especies = query.offset((page - 1) * limit).limit(limit).all()
            
            especies_list = []
            for especie in especies:
                especies_list.append({
                    'id': especie.id,
                    'nombre_comun': especie.nombre_comun,
                    'nombre_cientifico': especie.nombre_cientifico,
                    'descripcion': especie.descripcion,
                    'esperanza_vida': especie.esperanza_vida,
                    'poblacion_estimada': especie.poblacion_estimada,
                    'estado_conservacion': especie.estado_conservacion.nombre if especie.estado_conservacion else 'Desconocido',
                    'imagen_url': especie.imagen_url
                })
            
            return jsonify({
                'success': True,
                'especies': especies_list,
                'total': total,
                'page': page,
                'limit': limit
            })
            
        except SQLAlchemyError as e:
            print(f"Error de base de datos: {e}")
            return jsonify({'success': False, 'error': 'Error al obtener especies'}), 500
        finally:
            db.close()
    
    @app.route('/api/especies/<int:id>', methods=['GET'])
    def get_especie_orm(id):
        """Obtener detalles de una especie específica"""
        db = get_session()
        try:
            especie = db.query(EspecieMarina).filter_by(id=id).first()
            
            if not especie:
                return jsonify({'success': False, 'error': 'Especie no encontrada'}), 404
            
            return jsonify({
                'success': True,
                'especie': {
                    'id': especie.id,
                    'nombre_comun': especie.nombre_comun,
                    'nombre_cientifico': especie.nombre_cientifico,
                    'descripcion': especie.descripcion,
                    'esperanza_vida': especie.esperanza_vida,
                    'poblacion_estimada': especie.poblacion_estimada,
                    'estado_conservacion': especie.estado_conservacion.nombre if especie.estado_conservacion else 'Desconocido',
                    'imagen_url': especie.imagen_url
                }
            })
            
        except SQLAlchemyError as e:
            print(f"Error de base de datos: {e}")
            return jsonify({'success': False, 'error': 'Error al obtener especie'}), 500
        finally:
            db.close()
    
    @app.route('/api/especies', methods=['POST'])
    def create_especie_orm():
        """Crear nueva especie (solo colaboradores autenticados)"""
        # Verificar autenticación de colaborador
        if 'colab_colaborador_id' not in session:
            return jsonify({'success': False, 'error': 'No autorizado'}), 401
        
        db = get_session()
        try:
            data = request.get_json()
            
            # Validación del lado del servidor
            try:
                validated_data = validate_especie_marina(data)
            except ValidationError as e:
                return jsonify({'success': False, 'error': str(e)}), 400
            
            # Verificar que no exista especie con mismo nombre científico
            existing = db.query(EspecieMarina).filter_by(
                nombre_cientifico=validated_data['nombre_cientifico']
            ).first()
            
            if existing:
                return jsonify({
                    'success': False,
                    'error': 'Ya existe una especie con ese nombre científico'
                }), 400
            
            # Crear nueva especie
            nueva_especie = EspecieMarina(
                nombre_comun=validated_data['nombre_comun'],
                nombre_cientifico=validated_data['nombre_cientifico'],
                descripcion=validated_data.get('descripcion'),
                esperanza_vida=validated_data.get('esperanza_vida'),
                poblacion_estimada=validated_data.get('poblacion_estimada'),
                id_estado_conservacion=validated_data['id_estado_conservacion'],
                imagen_url=validated_data.get('imagen_url')
            )
            
            db.add(nueva_especie)
            db.commit()
            
            return jsonify({
                'success': True,
                'message': 'Especie creada exitosamente',
                'especie_id': nueva_especie.id
            }), 201
            
        except IntegrityError as e:
            db.rollback()
            return jsonify({'success': False, 'error': 'Error de integridad de datos'}), 400
        except SQLAlchemyError as e:
            db.rollback()
            print(f"Error de base de datos: {e}")
            return jsonify({'success': False, 'error': 'Error al crear especie'}), 500
        finally:
            db.close()
    
    @app.route('/api/especies/<int:id>', methods=['PUT'])
    def update_especie_orm(id):
        """Actualizar especie existente"""
        # Verificar autenticación
        if 'colab_colaborador_id' not in session:
            return jsonify({'success': False, 'error': 'No autorizado'}), 401
        
        db = get_session()
        try:
            data = request.get_json()
            
            # Buscar especie
            especie = db.query(EspecieMarina).filter_by(id=id).first()
            if not especie:
                return jsonify({'success': False, 'error': 'Especie no encontrada'}), 404
            
            # Validación
            try:
                validated_data = validate_especie_marina(data)
            except ValidationError as e:
                return jsonify({'success': False, 'error': str(e)}), 400
            
            # Actualizar campos 
            especie.nombre_comun = validated_data['nombre_comun']
            especie.nombre_cientifico = validated_data['nombre_cientifico']
            especie.descripcion = validated_data.get('descripcion')
            especie.esperanza_vida = validated_data.get('esperanza_vida')
            especie.poblacion_estimada = validated_data.get('poblacion_estimada')
            especie.id_estado_conservacion = validated_data['id_estado_conservacion']
            especie.imagen_url = validated_data.get('imagen_url')
            
            db.commit()
            
            return jsonify({
                'success': True,
                'message': 'Especie actualizada exitosamente'
            })
            
        except IntegrityError as e:
            db.rollback()
            return jsonify({'success': False, 'error': 'Error de integridad de datos'}), 400
        except SQLAlchemyError as e:
            db.rollback()
            print(f"Error de base de datos: {e}")
            return jsonify({'success': False, 'error': 'Error al actualizar especie'}), 500
        finally:
            db.close()
    
    @app.route('/api/especies/<int:id>', methods=['DELETE'])
    def delete_especie_orm(id):
        """Eliminar especie (soft delete)"""
        # Verificar autenticación
        if 'colab_colaborador_id' not in session:
            return jsonify({'success': False, 'error': 'No autorizado'}), 401
        
        db = get_session()
        try:
            especie = db.query(EspecieMarina).filter_by(id=id).first()
            
            if not especie:
                return jsonify({'success': False, 'error': 'Especie no encontrada'}), 404

            # Hard delete (la tabla no tiene columna 'activo')
            db.delete(especie)
            db.commit()
            
            return jsonify({
                'success': True,
                'message': 'Especie eliminada exitosamente'
            })
            
        except SQLAlchemyError as e:
            db.rollback()
            print(f"Error de base de datos: {e}")
            return jsonify({'success': False, 'error': 'Error al eliminar especie'}), 500
        finally:
            db.close()

# ========================================
# FUNCIÓN PRINCIPAL PARA REGISTRAR TODAS LAS RUTAS
# ========================================

def register_all_orm_routes(app):
    """Registrar todas las rutas con ORM"""
    register_user_routes(app)
    register_colaborador_routes(app)
    register_especies_routes(app)
    print("✅ Rutas ORM registradas exitosamente")
