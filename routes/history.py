from flask import Blueprint, request, jsonify
from services.history import get_all, add, delete, clear_all

history_bp = Blueprint("history", __name__)


@history_bp.route("/api/history", methods=["GET"])
def list_history():
    items = get_all()
    # Return items without the full base64 image for the list view (send thumbnail-sized preview)
    summary = []
    for item in items:
        summary.append({
            "id": item["id"],
            "title": item["title"],
            "prompt_settings": item.get("prompt_settings", {}),
            "mime_type": item.get("mime_type", "image/png"),
            "model": item.get("model", ""),
            "created_at": item.get("created_at", ""),
            "has_image": bool(item.get("image")),
        })
    return jsonify(summary)


@history_bp.route("/api/history/<item_id>/image", methods=["GET"])
def get_history_image(item_id):
    items = get_all()
    for item in items:
        if item["id"] == item_id:
            return jsonify({
                "image": item.get("image", ""),
                "mime_type": item.get("mime_type", "image/png"),
            })
    return jsonify({"error": "Not found"}), 404


@history_bp.route("/api/history", methods=["POST"])
def save_history():
    data = request.get_json()
    title = data.get("title", "Untitled")
    prompt_settings = data.get("prompt_settings", {})
    image_b64 = data.get("image", "")
    mime_type = data.get("mime_type", "image/png")
    model_used = data.get("model", "")

    if not image_b64:
        return jsonify({"error": "No image data"}), 400

    entry = add(title, prompt_settings, image_b64, mime_type, model_used)
    return jsonify({"id": entry["id"], "created_at": entry["created_at"]})


@history_bp.route("/api/history/<item_id>", methods=["DELETE"])
def delete_history(item_id):
    delete(item_id)
    return jsonify({"ok": True})


@history_bp.route("/api/history/clear", methods=["DELETE"])
def clear_history():
    clear_all()
    return jsonify({"ok": True})
