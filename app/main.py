import os
from dotenv import load_dotenv
load_dotenv()
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import auth, colaboradores, especies, productos, pedidos, eventos, estadisticas, direcciones, catalogos

app = FastAPI(title="SWAY API", description="API de conservación marina SWAY", version="2.0.0")

_raw_origins = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5000,http://localhost:5173,http://127.0.0.1:5000,http://127.0.0.1:5173"
)
_origins = [o.strip() for o in _raw_origins.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(colaboradores.router)
app.include_router(especies.router)
app.include_router(productos.router)
app.include_router(pedidos.router)
app.include_router(eventos.router)
app.include_router(estadisticas.router)
app.include_router(direcciones.router)
app.include_router(catalogos.router)


@app.get("/")
def root():
    return {"message": "SWAY FastAPI v2.0", "docs": "/docs"}
