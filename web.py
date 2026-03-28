from flask import Flask, render_template, send_from_directory, Response
from flask_cors import CORS
import os
from sqlalchemy.orm import scoped_session
from models import get_session

# ── Inicialización ────────────────────────────────────────────────
app = Flask(__name__, static_folder='assets', static_url_path='/static')
app.secret_key = os.environ.get('SECRET_KEY', 'sway_secret_key_ultra_secreta')

CORS(app, supports_credentials=True)

db_session = scoped_session(lambda: get_session())

# ── Headers sin caché (desarrollo) ───────────────────────────────
@app.after_request
def add_no_cache_headers(response):
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    return response

# ── Manejo de errores ─────────────────────────────────────────────
@app.errorhandler(404)
def not_found(error):
    return render_template('404.html'), 404

@app.errorhandler(500)
def internal_error(error):
    return render_template('500.html'), 500

# ── Web 1 — Rutas de páginas HTML ────────────────────────────────
# Se mantienen en app.py para que url_for() en templates funcione sin prefijo de blueprint

@app.route('/config.js')
def config_js():
    api_base = os.getenv('API_BASE_URL', 'http://localhost:8000/api')
    return Response(f'const API_BASE = "{api_base}";', mimetype='application/javascript')


@app.route('/')
def index():
    return render_template('index.html')

@app.route('/especies')
def especies():
    return render_template('especies.html')

@app.route('/eventos')
def eventos():
    return render_template('eventos.html')

@app.route('/biblioteca')
def biblioteca():
    return render_template('biblioteca.html')

@app.route('/tienda')
def tienda():
    return render_template('tienda.html')

@app.route('/mis-pedidos')
def mis_pedidos():
    return render_template('mis-pedidos.html')

@app.route('/payment')
def payment():
    return render_template('payment.html')

@app.route('/toma-accion')
def toma_accion():
    return render_template('toma-accion.html')

@app.route('/starter-page')
def starter_page():
    return render_template('starter-page.html')

@app.route('/login')
def login_page():
    return render_template('login.html')

@app.route('/register')
def register_page():
    return render_template('register.html')


@app.route('/test_dropdown.html')
def test_dropdown():
    return send_from_directory('.', 'test_dropdown.html')

# ── APIs migradas a FastAPI (puerto 8000) ─────────────────────────
# Los blueprints de API han sido migrados a app/main.py (FastAPI)
# Ejecutar: uvicorn app.main:app --port 8000 --reload

# ── Punto de entrada ──────────────────────────────────────────────
if __name__ == '__main__':
    print("Iniciando servidor SWAY...")
    print("Arquitectura: Flask Blueprints (desacoplado)")
    print("Servidor corriendo en http://localhost:5000")
    app.run(debug=True, host='0.0.0.0', port=5000)
