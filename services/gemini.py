import os
import base64
from google import genai
from dotenv import load_dotenv

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

DEFAULT_IMAGE_MODEL_CANDIDATES = [
    "gemini-3.1-flash-image-preview",
    "gemini-2.5-flash-image",
    "gemini-3-pro-image-preview",
]


def get_image_model_candidates():
    configured = os.getenv("GEMINI_IMAGE_MODEL", "").strip()
    if configured:
        return [configured] + [m for m in DEFAULT_IMAGE_MODEL_CANDIDATES if m != configured]
    return DEFAULT_IMAGE_MODEL_CANDIDATES


def extract_image_part(response):
    parts = getattr(response, "parts", None)

    if not parts and getattr(response, "candidates", None):
        first_candidate = response.candidates[0]
        content = getattr(first_candidate, "content", None)
        if content is not None:
            parts = getattr(content, "parts", None)

    if not parts:
        return None, None

    for part in parts:
        inline_data = getattr(part, "inline_data", None)
        if inline_data is None:
            continue

        image_bytes = getattr(inline_data, "data", None)
        if not image_bytes:
            continue

        mime_type = getattr(inline_data, "mime_type", None) or "image/png"

        if isinstance(image_bytes, bytes):
            encoded = base64.b64encode(image_bytes).decode("utf-8")
        elif isinstance(image_bytes, str):
            encoded = image_bytes
        else:
            return None, None

        return encoded, mime_type

    return None, None
