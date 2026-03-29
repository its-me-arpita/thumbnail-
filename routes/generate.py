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


@generate_bp.route("/generate-carousel-prompt", methods=["POST"])
def generate_carousel_prompt():
    data = request.get_json()
    user_prompt = data.get("prompt", "").strip()
    if not user_prompt:
        return jsonify({"error": "Prompt is required"}), 400

    slide_count = int(data.get("slide_count", 5))
    slide_count = max(2, min(slide_count, 10))
    aspect_ratio = data.get("aspect_ratio", "1:1").strip()

    slides = []
    errors = []

    for i in range(slide_count):
        if i == 0:
            slide_role = "This is the COVER/TITLE slide (slide 1)."
        elif i == slide_count - 1:
            slide_role = f"This is the FINAL slide ({i + 1}/{slide_count}) with a call-to-action."
        else:
            slide_role = f"This is content slide {i + 1}/{slide_count}."

        prompt = (
            f"{user_prompt}\n\n"
            f"Generate slide {i + 1} of {slide_count} for this carousel. "
            f"{slide_role} "
            f"Include slide number {i + 1}/{slide_count} subtly. "
            f"{aspect_ratio} aspect ratio. "
            f"Keep a consistent visual theme across all slides. "
            f"Clean design, readable text, no watermarks."
        )

        generated = False
        for model_name in get_image_model_candidates():
            try:
                response = client.models.generate_content(
                    model=model_name,
                    contents=[prompt],
                    config=types.GenerateContentConfig(
                        response_modalities=["IMAGE"],
                        image_config=types.ImageConfig(aspect_ratio=aspect_ratio),
                    ),
                )
                encoded, mime_type = extract_image_part(response)
                if encoded:
                    slides.append({
                        "image": encoded,
                        "mime_type": mime_type,
                        "slide_number": i + 1,
                        "model": model_name,
                    })
                    generated = True
                    break
            except Exception:
                continue

        if not generated:
            errors.append(f"Slide {i + 1} failed to generate")

    if not slides:
        return jsonify({"error": "Failed to generate any slides. Try again."}), 500

    return jsonify({"slides": slides, "total": len(slides), "errors": errors})


@generate_bp.route("/generate-carousel", methods=["POST"])
def generate_carousel():
    data = request.get_json()
    topic = data.get("topic", "").strip()
    description = data.get("description", "").strip()
    slide_count = int(data.get("slide_count", 5))
    platform = data.get("platform", "instagram").strip()
    style = data.get("style", "modern").strip()
    color_scheme = data.get("color_scheme", "vibrant").strip()
    brand_name = data.get("brand_name", "").strip()

    if not topic:
        return jsonify({"error": "Topic is required"}), 400

    slide_count = max(2, min(slide_count, 10))

    platform_ratios = {
        "instagram": "1:1",
        "linkedin": "4:5",
        "twitter": "16:9",
    }
    aspect_ratio = platform_ratios.get(platform, "1:1")

    brand_part = f" Brand name: '{brand_name}'." if brand_name else ""

    slides = []
    errors = []

    for i in range(slide_count):
        if i == 0:
            slide_desc = f"Title/cover slide introducing the topic: '{topic}'."
        elif i == slide_count - 1:
            slide_desc = (
                f"Final/closing slide with a call-to-action (e.g. follow, like, share). "
                f"Topic: '{topic}'."
            )
        else:
            slide_desc = (
                f"Content slide {i} of {slide_count - 2} (middle slides). "
                f"Topic: '{topic}'. "
                f"Show point/tip number {i} with a key insight or visual."
            )

        prompt = (
            f"Create a single carousel slide image for {platform}. "
            f"{slide_desc} "
            f"Description: '{description}'. "
            f"Style: {style}. Color scheme: {color_scheme}.{brand_part} "
            f"Keep a consistent visual theme across all slides. "
            f"Include slide number {i + 1}/{slide_count} subtly. "
            f"{aspect_ratio} aspect ratio. "
            f"Clean design, readable text, no watermarks."
        )

        generated = False
        for model_name in get_image_model_candidates():
            try:
                response = client.models.generate_content(
                    model=model_name,
                    contents=[prompt],
                    config=types.GenerateContentConfig(
                        response_modalities=["IMAGE"],
                        image_config=types.ImageConfig(aspect_ratio=aspect_ratio),
                    ),
                )
                encoded, mime_type = extract_image_part(response)
                if encoded:
                    slides.append({
                        "image": encoded,
                        "mime_type": mime_type,
                        "slide_number": i + 1,
                        "model": model_name,
                    })
                    generated = True
                    break
            except Exception:
                continue

        if not generated:
            errors.append(f"Slide {i + 1} failed to generate")

    if not slides:
        return jsonify({"error": "Failed to generate any slides. Try again."}), 500

    return jsonify({
        "slides": slides,
        "total": len(slides),
        "errors": errors,
    })


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
