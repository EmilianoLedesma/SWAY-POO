from pydantic import BaseModel, Field
from typing import Optional


class EventoCreate(BaseModel):
    titulo: str = Field(
        ..., min_length=3, max_length=200,
        description="Título del evento",
        example="Simposio de Conservación Marina 2026"
    )
    descripcion: str = Field(
        ..., min_length=10, max_length=2000,
        description="Descripción detallada del evento"
    )
    fecha_evento: str = Field(
        ..., min_length=10, max_length=10,
        description="Fecha del evento en formato YYYY-MM-DD",
        example="2026-06-15"
    )
    hora_inicio: str = Field(
        ..., min_length=5, max_length=5,
        description="Hora de inicio en formato HH:MM",
        example="09:00"
    )
    id_tipo_evento: int = Field(
        ..., gt=0,
        description="ID del tipo de evento según catálogo"
    )
    id_modalidad: int = Field(
        ..., gt=0,
        description="ID de la modalidad (presencial, virtual, híbrido)"
    )
    hora_fin: Optional[str] = Field(
        None, min_length=5, max_length=5,
        description="Hora de finalización en formato HH:MM",
        example="17:00"
    )
    url_evento: Optional[str] = Field(
        None, max_length=500,
        description="URL de acceso para eventos virtuales o sitio web"
    )
    capacidad_maxima: Optional[int] = Field(
        50, ge=1, le=10000,
        description="Número máximo de participantes"
    )
    costo: Optional[float] = Field(
        0, ge=0,
        description="Costo de inscripción en MXN (0 = gratuito)"
    )
    nombre_organizador: Optional[str] = Field(
        None, max_length=150,
        description="Nombre del organizador o institución responsable"
    )
    contacto: Optional[str] = Field(
        None, max_length=150,
        description="Correo o teléfono de contacto del organizador"
    )
