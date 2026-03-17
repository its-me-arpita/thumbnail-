import os
import base64
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    print("ERROR: GEMINI_API_KEY not found in environment/.env")
    exit(1)

client = genai.Client(api_key=api_key)

IMAGE_MODELS = [
    "gemini-3.1-flash-image-preview",
    "gemini-2.5-flash-image",
    "gemini-3-pro-image-preview",
    "imagen-4.0-generate-001",
    "imagen-4.0-fast-generate-001",
    "imagen-4.0-ultra-generate-001",
]

PROMPT = "A simple red circle on a white background."

print("Testing image generation models...\n")
for model_name in IMAGE_MODELS:
    try:
        response = client.models.generate_content(
            model=model_name,
            contents=[PROMPT],
            config=types.GenerateContentConfig(
                response_modalities=["IMAGE"],
            ),
        )
        # Check if any image part is returned
        parts = []
        if getattr(response, "parts", None):
            parts = response.parts
        elif getattr(response, "candidates", None):
            content = getattr(response.candidates[0], "content", None)
            if content:
                parts = getattr(content, "parts", [])

        has_image = any(getattr(p, "inline_data", None) for p in parts)
        if has_image:
            print(f"  ✅ {model_name}  — WORKS")
        else:
            print(f"  ⚠️  {model_name}  — responded but no image returned")
    except Exception as e:
        short = str(e).splitlines()[0][:120]
        print(f"  ❌ {model_name}  — {short}")
