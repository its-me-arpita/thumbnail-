import base64
from flask import Blueprint, request, jsonify
from google.genai import types
from services.gemini import client, get_image_model_candidates, extract_image_part

generate_bp = Blueprint("generate", __name__)


def _run_image_generation(content_parts, aspect_ratio="16:9"):
    try:
        last_error = None
        for model_name in get_image_model_candidates():
            try:
                response = client.models.generate_content(
                    model=model_name,
                    contents=content_parts,
                    config=types.GenerateContentConfig(
                        response_modalities=["IMAGE"],
                        image_config=types.ImageConfig(aspect_ratio=aspect_ratio),
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


@generate_bp.route("/generate", methods=["POST"])
def generate():
    data = request.get_json()
    title = data.get("title", "").strip()
    description = data.get("description", "").strip()
    style = data.get("style", "modern").strip()
    color_scheme = data.get("color_scheme", "vibrant").strip()
    aspect_ratio = data.get("aspect_ratio", "16:9").strip()
    brand_name = data.get("brand_name", "").strip()
    theme_colors = data.get("theme_colors", [])
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
        f"Make it eye-catching, bold text, high contrast, {aspect_ratio} aspect ratio. "
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

    return _run_image_generation(content_parts, aspect_ratio=aspect_ratio)


@generate_bp.route("/generate-element", methods=["POST"])
def generate_element():
    data = request.get_json()
    prompt_text = data.get("prompt", "").strip()
    style = data.get("style", "3d render").strip()

    if not prompt_text:
        return jsonify({"error": "Prompt is required"}), 400

    prompt = (
        f"Generate a single isolated {style} of: {prompt_text}. "
        f"The subject must be on a completely transparent or solid white background. "
        f"No background scenery, no shadows on the ground, no extra objects. "
        f"Just the single element/object/icon centered in the image, "
        f"suitable for use as a sticker or overlay on a thumbnail. "
        f"Clean edges, high quality, PNG style with clear boundaries."
    )

    return _run_image_generation([prompt], aspect_ratio="1:1")


@generate_bp.route("/edit", methods=["POST"])
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
