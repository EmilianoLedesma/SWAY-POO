# LEGACY_FLASK

Archivos Flask de la arquitectura anterior, conservados como referencia.
Las APIs han sido migradas a FastAPI en app/ (puerto 8000).

- blueprints/api/ → app/routers/
- validators.py → app/models/ (Pydantic)
- routes_orm.py → reemplazado por app/data/database.py
