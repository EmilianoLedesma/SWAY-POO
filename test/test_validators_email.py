# Prueba pytest para validate_email en validators.py
# Ejecutar: pip install -r requirements.txt && pytest -q

import pytest
from validators import validate_email, ValidationError

def test_validate_email_accepts_and_lowercases():
    """Emails válidos se normalizan (strip + lowercase) y se devuelven."""
    assert validate_email(" User@Example.COM ") == "user@example.com"

def test_validate_email_invalid_format_raises():
    """Formatos inválidos deben lanzar ValidationError."""
    with pytest.raises(ValidationError):
        validate_email("no-at-symbol")

def test_validate_email_empty_raises():
    """Email vacío o None debe lanzar ValidationError (campo requerido)."""
    with pytest.raises(ValidationError):
        validate_email("")

def test_validate_email_too_long_raises():
    """Emails mayores a 254 caracteres deben lanzar ValidationError."""
    local_part = "a" * 245
    email = f"{local_part}@example.com"  # longitud > 254
    assert len(email) > 254
    with pytest.raises(ValidationError):
        validate_email(email)
