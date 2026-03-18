import json
import os
import uuid
from datetime import datetime

HISTORY_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
HISTORY_FILE = os.path.join(HISTORY_DIR, "history.json")


def _ensure_file():
    os.makedirs(HISTORY_DIR, exist_ok=True)
    if not os.path.exists(HISTORY_FILE):
        with open(HISTORY_FILE, "w") as f:
            json.dump([], f)


def get_all():
    _ensure_file()
    with open(HISTORY_FILE, "r") as f:
        items = json.load(f)
    return sorted(items, key=lambda x: x.get("created_at", ""), reverse=True)


def add(title, prompt_settings, image_b64, mime_type, model_used):
    _ensure_file()
    items = get_all()
    entry = {
        "id": str(uuid.uuid4()),
        "title": title,
        "prompt_settings": prompt_settings,
        "image": image_b64,
        "mime_type": mime_type,
        "model": model_used,
        "created_at": datetime.utcnow().isoformat() + "Z",
    }
    items.insert(0, entry)
    with open(HISTORY_FILE, "w") as f:
        json.dump(items, f)
    return entry


def delete(item_id):
    _ensure_file()
    items = get_all()
    items = [i for i in items if i["id"] != item_id]
    with open(HISTORY_FILE, "w") as f:
        json.dump(items, f)


def clear_all():
    _ensure_file()
    with open(HISTORY_FILE, "w") as f:
        json.dump([], f)
