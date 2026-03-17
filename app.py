import os
import base64
from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()

app = Flask(__name__)

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

# Prefer current image-capable models, with automatic fallback.
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

    # Some SDK responses expose image parts under candidates[0].content.parts.
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
            # SDKs may return already-base64 data as a string.
            encoded = image_bytes
        else:
            return None, None

        return encoded, mime_type

    return None, None


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/generate", methods=["POST"])
def generate():
    data = request.get_json()
    title = data.get("title", "").strip()
    description = data.get("description", "").strip()
    style = data.get("style", "modern").strip()
    color_scheme = data.get("color_scheme", "vibrant").strip()
    brand_name = data.get("brand_name", "").strip()
    theme_colors = data.get("theme_colors", [])   # list of hex strings
    logo_b64 = data.get("logo", "")
    logo_mime = data.get("logo_mime", "image/png")
    ref_b64 = data.get("reference_image", "")
    ref_mime = data.get("reference_mime", "image/png")

    if not title:
        return jsonify({"error": "Title is required"}), 400

    brand_part = f" Brand name: '{brand_name}'." if brand_name else ""

    color_labels = ["primary", "secondary", "accent"]
    color_descs = [f"{color_labels[i]}: {c.strip()}" for i, c in enumerate(theme_colors[:3]) if c and c.strip()]
    color_part = f" Use these theme colors — {', '.join(color_descs)}." if color_descs else ""

    logo_part = " Incorporate the provided logo image naturally into the design (e.g. corner watermark or overlay)." if logo_b64 else ""
    ref_part = " Use the provided reference image as inspiration for layout, composition, and visual style." if ref_b64 else ""

    prompt = (
        f"Create a professional YouTube/social media thumbnail image. "
        f"Title: '{title}'. "
        f"Description: '{description}'. "
        f"Style: {style}. Color scheme: {color_scheme}."
        f"{color_part}{brand_part}{logo_part}{ref_part} "
        f"Make it eye-catching, bold text, high contrast, 16:9 aspect ratio. "
        f"No watermarks, clean design, suitable for a thumbnail."
    )

    content_parts = [prompt]
    if logo_b64:
        try:
            content_parts.append(types.Part.from_bytes(data=base64.b64decode(logo_b64), mime_type=logo_mime))
        except Exception:
            pass
    if ref_b64:
        try:
            content_parts.append(types.Part.from_bytes(data=base64.b64decode(ref_b64), mime_type=ref_mime))
        except Exception:
            pass

    return _run_image_generation(content_parts)


def _run_image_generation(content_parts):
    try:
        last_error = None
        for model_name in get_image_model_candidates():
            try:
                response = client.models.generate_content(
                    model=model_name,
                    contents=content_parts,
                    config=types.GenerateContentConfig(
                        response_modalities=["IMAGE"],
                        image_config=types.ImageConfig(aspect_ratio="16:9"),
                    ),
                )
                encoded, mime_type = extract_image_part(response)
                if encoded:
                    return jsonify({"image": encoded, "mime_type": mime_type, "model": model_name})
                last_error = RuntimeError(f"No image returned by model: {model_name}")
            except Exception as model_error:
                last_error = model_error
                continue

        if last_error is not None:
            return jsonify({"error": f"Image generation failed: {last_error}"}), 500
        return jsonify({"error": "No image was generated. Try a different prompt."}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/edit", methods=["POST"])
def edit_thumbnail():
    data = request.get_json()
    edit_instruction = data.get("edit_instruction", "").strip()
    base_image_b64 = data.get("base_image", "")
    base_mime = data.get("base_mime", "image/png")

    if not edit_instruction:
        return jsonify({"error": "Edit instruction is required"}), 400
    if not base_image_b64:
        return jsonify({"error": "No base image provided"}), 400

    try:
        image_bytes = base64.b64decode(base_image_b64)
    except Exception:
        return jsonify({"error": "Invalid base image data"}), 400

    prompt = (
        f"Edit this thumbnail image as follows: {edit_instruction}. "
        f"Keep the overall composition and style but apply the requested changes. "
        f"Maintain 16:9 aspect ratio. Output as a complete thumbnail image."
    )
    content_parts = [prompt, types.Part.from_bytes(data=image_bytes, mime_type=base_mime)]
    return _run_image_generation(content_parts)


if __name__ == "__main__":
    app.run(debug=True)

