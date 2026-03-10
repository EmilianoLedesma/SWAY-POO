# Test de integración (caja gris) para /api/especies (routes_orm.create_especie_orm)
# Ejecutar: pip install -r requirements.txt && pytest -q
from flask import session
from sqlalchemy import create_engine
import json

from app import app
import models
import routes_orm
from models import EstadoConservacion, EspecieMarina

def test_create_especie_integration(monkeypatch):
    """
    Usamos sqlite:///:memory: como DB de pruebas reemplazando models.get_engine.
    Creamos esquema, insertamos estado de conservación y llamamos POST /api/especies
    simulando una sesión de colaborador.
    """
    # 1) Engine in-memory y crear tablas
    engine = create_engine('sqlite:///:memory:')
    monkeypatch.setattr(models, 'get_engine', lambda: engine)
    models.Base.metadata.create_all(engine)

    # 2) Registrar rutas (asegurar que las rutas ORM estén cargadas en la app)
    routes_orm.register_all_orm_routes(app)

    # 3) Insertar estado de conservación necesario para la FK
    db = models.get_session()
    estado = EstadoConservacion(nombre='En Peligro')
    db.add(estado)
    db.commit()
    db.close()

    # 4) Preparar cliente y simular sesión de colaborador autenticado
    client = app.test_client()
    with client.session_transaction() as sess:
        sess['colab_colaborador_id'] = 1

    # 5) Payload mínimo válido para crear especie
    payload = {
        "nombreComun": "Pejerrey",
        "nombreCientifico": "Odontesthes bonariensis",
        "descripcion": "Pez de agua dulce",
        "idEstadoConservacion": estado.id
    }

    # 6) Ejecutar petición
    resp = client.post('/api/especies', data=json.dumps(payload), content_type='application/json')

    # 7) Comprobaciones
    assert resp.status_code == 201
    body = resp.get_json()
    assert body.get('success') is True

    # 8) Verificar en BD que la especie fue creada
    db2 = models.get_session()
    created = db2.query(EspecieMarina).filter_by(nombre_cientifico=payload['nombreCientifico']).first()
    assert created is not None
    db2.close()
