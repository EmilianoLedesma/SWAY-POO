from flask import Blueprint, render_template, send_from_directory

web_bp = Blueprint('web', __name__)


@web_bp.route('/')
def index():
    """Página principal"""
    return render_template('index.html')


@web_bp.route('/especies')
def especies():
    """Página del catálogo de especies"""
    return render_template('especies.html')


@web_bp.route('/eventos')
def eventos():
    """Página de eventos"""
    return render_template('eventos.html')


@web_bp.route('/biblioteca')
def biblioteca():
    """Página de biblioteca"""
    return render_template('biblioteca.html')


@web_bp.route('/tienda')
def tienda():
    """Página de tienda"""
    return render_template('tienda.html')


@web_bp.route('/mis-pedidos')
def mis_pedidos():
    """Página de pedidos del usuario"""
    return render_template('mis-pedidos.html')


@web_bp.route('/payment')
def payment():
    """Página de pagos"""
    return render_template('payment.html')


@web_bp.route('/toma-accion')
def toma_accion():
    """Página de toma de acción"""
    return render_template('toma-accion.html')


@web_bp.route('/starter-page')
def starter_page():
    """Página de inicio básica"""
    return render_template('starter-page.html')


@web_bp.route('/login')
def login_page():
    """Página de login"""
    return render_template('login.html')


@web_bp.route('/register')
def register_page():
    """Página de registro"""
    return render_template('register.html')


@web_bp.route('/portal-colaboradores')
def portal_colaboradores():
    """Página del portal de colaboradores"""
    return render_template('portal-colaboradores.html')


@web_bp.route('/test_dropdown.html')
def test_dropdown():
    """Página de prueba del dropdown"""
    return send_from_directory('.', 'test_dropdown.html')
