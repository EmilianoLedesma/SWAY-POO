"""
SWAY - Modelos SQLAlchemy
Definición de modelos ORM para la base de datos SQL Server
"""

from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, Boolean, ForeignKey, Date, Time, Numeric
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, sessionmaker
from datetime import datetime
import pyodbc

Base = declarative_base()

# ========================================
# MODELOS DE UBICACIÓN GEOGRÁFICA
# ========================================

class Estado(Base):
    __tablename__ = 'Estados'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(254), nullable=False)
    codigo_postal_base = Column(String(5))
    
    # Relaciones
    municipios = relationship('Municipio', back_populates='estado')

class Municipio(Base):
    __tablename__ = 'Municipios'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(254), nullable=False)
    id_estado = Column(Integer, ForeignKey('Estados.id'), nullable=False)
    
    # Relaciones
    estado = relationship('Estado', back_populates='municipios')
    colonias = relationship('Colonia', back_populates='municipio')

class Colonia(Base):
    __tablename__ = 'Colonias'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(254), nullable=False)
    codigo_postal = Column(String(5), nullable=False)
    id_municipio = Column(Integer, ForeignKey('Municipios.id'), nullable=False)
    
    # Relaciones
    municipio = relationship('Municipio', back_populates='colonias')
    calles = relationship('Calle', back_populates='colonia')

class Calle(Base):
    __tablename__ = 'Calles'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(254), nullable=False)
    id_colonia = Column(Integer, ForeignKey('Colonias.id'), nullable=False)
    
    # Relaciones
    colonia = relationship('Colonia', back_populates='calles')
    direcciones = relationship('Direccion', back_populates='calle')

class Direccion(Base):
    __tablename__ = 'Direcciones'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    id_calle = Column(Integer, ForeignKey('Calles.id'), nullable=False)
    numero_exterior = Column(String(10))
    numero_interior = Column(String(10))
    referencias = Column(String(500))
    
    # Relaciones
    calle = relationship('Calle', back_populates='direcciones')

# ========================================
# MODELOS DE USUARIOS Y ROLES
# ========================================

class Usuario(Base):
    __tablename__ = 'Usuarios'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(100), nullable=False)
    apellido_paterno = Column(String(100))
    apellido_materno = Column(String(100))
    email = Column(String(254), unique=True, nullable=False)
    password_hash = Column(String(254))
    telefono = Column(String(15))
    fecha_nacimiento = Column(Date)
    id_direccion = Column(Integer, ForeignKey('Direcciones.id'))
    suscrito_newsletter = Column(Boolean, default=False)
    activo = Column(Boolean, default=True)
    fecha_registro = Column(DateTime, default=datetime.utcnow)
    
    # Relaciones
    colaborador = relationship('Colaborador', back_populates='usuario', uselist=False)
    pedidos = relationship('Pedido', back_populates='usuario')
    carrito = relationship('CarritoCompra', back_populates='usuario')

class Colaborador(Base):
    __tablename__ = 'Colaboradores'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    id_usuario = Column(Integer, ForeignKey('Usuarios.id'), nullable=False, unique=True)
    especialidad = Column(String(100))
    grado_academico = Column(String(50))
    institucion = Column(String(200))
    años_experiencia = Column(Integer)
    numero_cedula = Column(String(20))
    orcid = Column(String(50))
    estado_solicitud = Column(String(20), default='pendiente')
    activo = Column(Boolean, default=True)
    fecha_solicitud = Column(DateTime, default=datetime.utcnow)
    
    # Relaciones
    usuario = relationship('Usuario', back_populates='colaborador')
    especies_registradas = relationship('EspecieMarina', back_populates='colaborador_registrante')
    avistamientos = relationship('AvistamientoEspecie', back_populates='colaborador')

# ========================================
# MODELOS DE ESPECIES MARINAS
# ========================================

class EstadoConservacion(Base):
    __tablename__ = 'EstadosConservacion'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    codigo = Column(String(5), unique=True, nullable=False)
    nombre = Column(String(50), nullable=False)
    descripcion = Column(Text)
    color_codigo = Column(String(7))
    nivel_prioridad = Column(Integer)
    
    # Relaciones
    especies = relationship('EspecieMarina', back_populates='estado_conservacion')

class TipoHabitat(Base):
    __tablename__ = 'TiposHabitat'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(100), nullable=False)
    descripcion = Column(Text)
    
    # Relaciones
    especies = relationship('EspecieHabitat', back_populates='habitat')

class TipoAmenaza(Base):
    __tablename__ = 'TiposAmenaza'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(100), nullable=False)
    descripcion = Column(Text)
    
    # Relaciones
    especies = relationship('EspecieAmenaza', back_populates='amenaza')

class EspecieMarina(Base):
    __tablename__ = 'EspeciesMarinas'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre_comun = Column(String(100), nullable=False)
    nombre_cientifico = Column(String(100), unique=True, nullable=False)
    reino = Column(String(50), default='Animalia')
    filo = Column(String(50))
    clase = Column(String(50))
    orden = Column(String(50))
    familia = Column(String(50))
    genero = Column(String(50))
    especie = Column(String(50))
    descripcion = Column(Text)
    habitat_principal = Column(String(200))
    profundidad_min = Column(Integer)
    profundidad_max = Column(Integer)
    temperatura_min = Column(Numeric(4, 1))
    temperatura_max = Column(Numeric(4, 1))
    distribucion_geografica = Column(Text)
    esperanza_vida = Column(Integer)
    longitud_max = Column(Numeric(6, 2))
    peso_max = Column(Numeric(8, 2))
    id_estado_conservacion = Column(Integer, ForeignKey('EstadosConservacion.id'), nullable=False)
    id_colaborador_registrante = Column(Integer, ForeignKey('Colaboradores.id'), nullable=False)
    imagen_url = Column(String(500))
    fecha_registro = Column(DateTime, default=datetime.utcnow)
    activo = Column(Boolean, default=True)
    
    # Relaciones
    estado_conservacion = relationship('EstadoConservacion', back_populates='especies')
    colaborador_registrante = relationship('Colaborador', back_populates='especies_registradas')
    habitats = relationship('EspecieHabitat', back_populates='especie')
    amenazas = relationship('EspecieAmenaza', back_populates='especie')
    avistamientos = relationship('AvistamientoEspecie', back_populates='especie')

class EspecieHabitat(Base):
    __tablename__ = 'EspeciesHabitats'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    id_especie = Column(Integer, ForeignKey('EspeciesMarinas.id'), nullable=False)
    id_habitat = Column(Integer, ForeignKey('TiposHabitat.id'), nullable=False)
    preferencia = Column(String(20))
    
    # Relaciones
    especie = relationship('EspecieMarina', back_populates='habitats')
    habitat = relationship('TipoHabitat', back_populates='especies')

class EspecieAmenaza(Base):
    __tablename__ = 'EspeciesAmenazas'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    id_especie = Column(Integer, ForeignKey('EspeciesMarinas.id'), nullable=False)
    id_amenaza = Column(Integer, ForeignKey('TiposAmenaza.id'), nullable=False)
    nivel_impacto = Column(String(20))
    notas = Column(Text)
    
    # Relaciones
    especie = relationship('EspecieMarina', back_populates='amenazas')
    amenaza = relationship('TipoAmenaza', back_populates='especies')

class AvistamientoEspecie(Base):
    __tablename__ = 'AvistamientosEspecies'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    id_especie = Column(Integer, ForeignKey('EspeciesMarinas.id'), nullable=False)
    id_colaborador = Column(Integer, ForeignKey('Colaboradores.id'), nullable=False)
    latitud = Column(Numeric(10, 8))
    longitud = Column(Numeric(11, 8))
    profundidad = Column(Numeric(6, 2))
    temperatura_agua = Column(Numeric(4, 1))
    cantidad_observada = Column(Integer)
    comportamiento_observado = Column(Text)
    calidad_avistamiento = Column(String(20))
    equipo_utilizado = Column(String(200))
    condiciones_climaticas = Column(String(100))
    visibilidad_agua = Column(String(20))
    fotos_evidencia = Column(Text)
    notas_adicionales = Column(Text)
    fecha_avistamiento = Column(DateTime, nullable=False)
    fecha_registro = Column(DateTime, default=datetime.utcnow)
    validado = Column(Boolean, default=False)
    id_validador = Column(Integer, ForeignKey('Colaboradores.id'))
    
    # Relaciones
    especie = relationship('EspecieMarina', back_populates='avistamientos')
    colaborador = relationship('Colaborador', foreign_keys=[id_colaborador], back_populates='avistamientos')

# ========================================
# MODELOS DE E-COMMERCE
# ========================================

class CategoriaProducto(Base):
    __tablename__ = 'CategoriasProducto'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(100), nullable=False)
    descripcion = Column(Text)
    
    # Relaciones
    productos = relationship('Producto', back_populates='categoria')

class Producto(Base):
    __tablename__ = 'Productos'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(200), nullable=False)
    descripcion = Column(Text)
    precio = Column(Numeric(10, 2), nullable=False)
    id_categoria = Column(Integer, ForeignKey('CategoriasProducto.id'), nullable=False)
    stock_disponible = Column(Integer, default=0)
    stock_minimo = Column(Integer, default=5)
    sku = Column(String(50), unique=True)
    peso = Column(Numeric(8, 2))
    dimensiones = Column(String(50))
    imagen_url = Column(String(500))
    activo = Column(Boolean, default=True)
    fecha_creacion = Column(DateTime, default=datetime.utcnow)
    
    # Relaciones
    categoria = relationship('CategoriaProducto', back_populates='productos')
    detalles_pedido = relationship('DetallePedido', back_populates='producto')

class CarritoCompra(Base):
    __tablename__ = 'CarritoCompras'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    id_usuario = Column(Integer, ForeignKey('Usuarios.id'), nullable=False)
    id_producto = Column(Integer, ForeignKey('Productos.id'), nullable=False)
    cantidad = Column(Integer, nullable=False)
    precio_unitario = Column(Numeric(10, 2))
    fecha_agregado = Column(DateTime, default=datetime.utcnow)
    
    # Relaciones
    usuario = relationship('Usuario', back_populates='carrito')

class Pedido(Base):
    __tablename__ = 'Pedidos'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    id_usuario = Column(Integer, ForeignKey('Usuarios.id'), nullable=False)
    numero_pedido = Column(String(20), unique=True)
    subtotal = Column(Numeric(10, 2), nullable=False)
    impuestos = Column(Numeric(10, 2), default=0)
    costo_envio = Column(Numeric(10, 2), default=0)
    total = Column(Numeric(10, 2), nullable=False)
    id_direccion_envio = Column(Integer, ForeignKey('Direcciones.id'), nullable=False)
    estado = Column(String(20), default='pendiente')
    metodo_pago = Column(String(50))
    fecha_pedido = Column(DateTime, default=datetime.utcnow)
    fecha_estimada_entrega = Column(Date)
    notas_especiales = Column(Text)
    
    # Relaciones
    usuario = relationship('Usuario', back_populates='pedidos')
    detalles = relationship('DetallePedido', back_populates='pedido')

class DetallePedido(Base):
    __tablename__ = 'DetallesPedido'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    id_pedido = Column(Integer, ForeignKey('Pedidos.id'), nullable=False)
    id_producto = Column(Integer, ForeignKey('Productos.id'), nullable=False)
    cantidad = Column(Integer, nullable=False)
    precio_unitario = Column(Numeric(10, 2), nullable=False)
    subtotal = Column(Numeric(10, 2), nullable=False)
    
    # Relaciones
    pedido = relationship('Pedido', back_populates='detalles')
    producto = relationship('Producto', back_populates='detalles_pedido')

# ========================================
# CONFIGURACIÓN DE BASE DE DATOS
# ========================================

def get_engine():
    """Crear engine de SQLAlchemy para SQL Server"""
    server = 'DESKTOP-VAT773J'
    database = 'sway'
    username = 'EmilianoLedesma'
    password = 'Emiliano1'
    
    # Usar pyodbc para SQL Server
    connection_string = f'mssql+pyodbc://{username}:{password}@{server}/{database}?driver=ODBC+Driver+17+for+SQL+Server'
    
    engine = create_engine(connection_string, echo=False)
    return engine

def get_session():
    """Obtener sesión de SQLAlchemy"""
    engine = get_engine()
    Session = sessionmaker(bind=engine)
    return Session()

def init_db():
    """Inicializar base de datos (crear tablas si no existen)"""
    engine = get_engine()
    Base.metadata.create_all(engine)
