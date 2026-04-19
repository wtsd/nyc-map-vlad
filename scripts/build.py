import json
import os
import sys
from pathlib import Path

import yaml

PLACES_DIR = "places"
OUTPUT_FILE = "build/places.json"

VALID_TIME = {"short", "medium", "full"}
VALID_COST = {"free", "paid"}
VALID_PERSONAL = {"", "want-to-go", "been-not-impressed", "highly-recommend"}

REQUIRED_META_FIELDS = [
    "id",
    "title",
    "coords",
    "category",
    "personal",
    "time",
    "cost",
    "address",
]


def read_file(path):
    if not os.path.exists(path):
        return ""
    with open(path, "r", encoding="utf-8") as f:
        return f.read().strip()


def load_yaml(path):
    with open(path, "r", encoding="utf-8") as f:
        data = yaml.safe_load(f)
    return data if data is not None else {}


def is_non_empty_string(value):
    return isinstance(value, str) and value.strip() != ""


def validate_coords(coords):
    if not isinstance(coords, dict):
        return "must be an object with numeric 'lat' and 'lng'"

    lat = coords.get("lat")
    lng = coords.get("lng")

    if not isinstance(lat, (int, float)) or not isinstance(lng, (int, float)):
        return "must include numeric 'lat' and 'lng'"

    if not (-90 <= lat <= 90):
        return f"lat {lat} is out of range [-90, 90]"
    if not (-180 <= lng <= 180):
        return f"lng {lng} is out of range [-180, 180]"

    return None


def validate_address(address):
    if isinstance(address, str):
        return None

    if isinstance(address, dict):
        for key, value in address.items():
            if not isinstance(value, str):
                return f"localized address field '{key}' must be a string"
        return None

    return "must be a string or localized object"


def validate_enum(field_name, value, valid_values):
    if value not in valid_values:
        allowed = ", ".join(sorted(repr(v) for v in valid_values))
        return f"{field_name}={value!r} is invalid; allowed values: {allowed}"
    return None


def build_place(meta, place_path):
    en_text = read_file(str(place_path / "en.md"))
    ru_text = read_file(str(place_path / "ru.md"))

    image_file = place_path / "cover.jpg"
    image_path = str(image_file).replace("\\", "/") if image_file.exists() else "assets/images/placeholders/cover.jpg"

    categories = meta.get("category", [])
    if isinstance(categories, str):
        categories = [categories]
    primary_category = categories[0] if categories else ""
    route = f"{primary_category}/{meta['id']}" if primary_category else meta["id"]

    return {
        "id": meta["id"],
        "route": route,
        "title": meta["title"],
        "coords": [meta["coords"]["lat"], meta["coords"]["lng"]],
        "category": categories,
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
            "ru": ru_text if ru_text else en_text,
        },
    }


def main():
    places = []
    errors = []
    seen_ids = {}
    validated_count = 0

    places_root = Path(PLACES_DIR)

    for meta_path in sorted(places_root.rglob("meta.yml")):
        validated_count += 1
        place_path = meta_path.parent
        folder_slug = place_path.name

        try:
            meta = load_yaml(str(meta_path))
        except Exception as exc:
            errors.append(f"{meta_path}: failed to parse YAML ({exc})")
            continue

        if not isinstance(meta, dict):
            errors.append(f"{meta_path}: top-level YAML must be an object")
            continue

        file_error_count_before = len(errors)

        for field in REQUIRED_META_FIELDS:
            if field not in meta:
                errors.append(f"{meta_path}: missing required field '{field}'")

        place_id = meta.get("id")
        if not is_non_empty_string(place_id):
            errors.append(f"{meta_path}: 'id' must be a non-empty string")
        else:
            if place_id != folder_slug:
                errors.append(
                    f"{meta_path}: folder slug '{folder_slug}' does not match id '{place_id}'"
                )

            first_path = seen_ids.get(place_id)
            if first_path:
                errors.append(
                    f"{meta_path}: duplicate id '{place_id}' (already used in {first_path})"
                )
            else:
                seen_ids[place_id] = meta_path

        coords_error = validate_coords(meta.get("coords"))
        if coords_error:
            errors.append(f"{meta_path}: coords {coords_error}")

        enum_error = validate_enum("time", meta.get("time"), VALID_TIME)
        if enum_error:
            errors.append(f"{meta_path}: {enum_error}")

        enum_error = validate_enum("cost", meta.get("cost"), VALID_COST)
        if enum_error:
            errors.append(f"{meta_path}: {enum_error}")

        enum_error = validate_enum("personal", meta.get("personal"), VALID_PERSONAL)
        if enum_error:
            errors.append(f"{meta_path}: {enum_error}")

        address_error = validate_address(meta.get("address"))
        if address_error:
            errors.append(f"{meta_path}: address {address_error}")

        if len(errors) == file_error_count_before:
            places.append(build_place(meta, place_path))

    print("Validation summary:")
    print(f"- Files checked: {validated_count}")
    print(f"- Unique ids: {len(seen_ids)}")
    print(f"- Errors: {len(errors)}")

    if errors:
        print("\nBuild failed due to metadata validation errors:\n", file=sys.stderr)
        for idx, err in enumerate(errors, start=1):
            print(f"{idx}. {err}", file=sys.stderr)
        raise SystemExit(1)

    os.makedirs("build", exist_ok=True)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(places, f, ensure_ascii=False, indent=2)

    print(f"\nBuilt {len(places)} places into {OUTPUT_FILE}.")


if __name__ == "__main__":
    main()
