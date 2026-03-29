"""
SWAY - Servicio de reconocimiento facial
Procesa imágenes base64 desde el navegador y gestiona encodings
"""

import cv2
import face_recognition
import numpy as np
import base64
import json


def decode_base64_image(base64_str: str):
    """Decodifica una imagen base64 (proveniente del navegador) a array numpy RGB."""
    if ',' in base64_str:
        base64_str = base64_str.split(',')[1]

    img_bytes = base64.b64decode(base64_str)
    img_array = np.frombuffer(img_bytes, dtype=np.uint8)
    img_bgr = cv2.imdecode(img_array, cv2.IMREAD_COLOR)

    if img_bgr is None:
        return None

    return cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)


def extract_face_encoding(image_rgb):
    """Extrae el encoding facial (128 floats) de la imagen. Retorna None si no detecta rostro."""
    locations = face_recognition.face_locations(image_rgb)
    if not locations:
        return None

    encodings = face_recognition.face_encodings(image_rgb, known_face_locations=[locations[0]])
    if not encodings:
        return None

    return encodings[0].tolist()


def compare_face(stored_encoding_json: str, candidate_encoding: list, tolerance: float = 0.5) -> bool:
    """Compara un encoding almacenado (JSON string) contra uno candidato."""
    known = np.array(json.loads(stored_encoding_json))
    candidate = np.array(candidate_encoding)
    results = face_recognition.compare_faces([known], candidate, tolerance=tolerance)
    return bool(results[0])
