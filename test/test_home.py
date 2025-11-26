# Prueba pytest simple para el proyecto SWAY-POO
# Supone que app.py expone el objeto Flask llamado `app` (from app import app)
# Ejecutar: pip install -r requirements.txt && pytest -q

from app import app

def test_home_status_code():
    """GET / debe responder 200 (página principal accesible)."""
    client = app.test_client()
    resp = client.get('/')
    assert resp.status_code == 200

def test_home_content_is_html():
    """La ruta principal debe devolver HTML (content-type contiene 'text/html')."""
    client = app.test_client()
    resp = client.get('/')
    assert 'text/html' in resp.content_type
