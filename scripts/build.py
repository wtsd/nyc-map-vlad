import os
import yaml
import json
from pathlib import Path

PLACES_DIR = "places"
OUTPUT_FILE = "build/places.json"

def read_file(path):
    if not os.path.exists(path):
        return ""
    with open(path, "r", encoding="utf-8") as f:
        return f.read().strip()

def load_yaml(path):
    with open(path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)

places = []
places_root = Path(PLACES_DIR)

for meta_path in sorted(places_root.rglob("meta.yml")):
    place_path = meta_path.parent
    place_id = place_path.name

    meta = load_yaml(str(meta_path))

    en_text = read_file(str(place_path / "en.md"))
    ru_text = read_file(str(place_path / "ru.md"))

    image_path = str(place_path / "cover.jpg").replace("\\", "/")
    if not (place_path / "cover.jpg").exists():
        image_path = "assets/images/placeholders/cover.jpg"

    place = {
        "id": meta["id"],
        "title": meta["title"],
        "coords": [meta["coords"]["lat"], meta["coords"]["lng"]],
        "category": meta.get("category", []),
        "personal": meta.get("personal", ""),
        "tags": meta.get("tags", []),
        "time": meta.get("time"),
        "cost": meta.get("cost"),
        "price": meta.get("price"),
        "transit": meta.get("transit"),
        "address": meta.get("address", ""),
        "external_link": meta.get("external_link", ""),
        "image": image_path,
        "summary": {
            "en": en_text,
            "ru": ru_text if ru_text else en_text
        }
    }

    places.append(place)

os.makedirs("build", exist_ok=True)

with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
    json.dump(places, f, ensure_ascii=False, indent=2)

print(f"Built {len(places)} places.")
