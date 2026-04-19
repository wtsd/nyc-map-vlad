import hashlib
import json
import os
import re
import sys
from io import BytesIO
from pathlib import Path

import yaml

try:
    from PIL import Image, UnidentifiedImageError
except Exception:
    Image = None
    UnidentifiedImageError = OSError

PLACES_DIR = "places"
BUILD_DIR = Path("build")
OUTPUT_FILE = BUILD_DIR / "places.json"
SEARCH_INDEX_FILE = BUILD_DIR / "search-index.json"
MANIFEST_FILE = BUILD_DIR / "manifest.json"
THUMBS_DIR = BUILD_DIR / "thumbs"

VALID_PERSONAL = {"to-do", "visited", "want-to-go", "been-not-impressed", "highly-recommend", "highly-recommended", ""}

REQUIRED_META_FIELDS = [
    "id",
    "title",
    "coords",
    "category",
    "personal",
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


def file_hash(path: Path):
    h = hashlib.sha256()
    h.update(path.read_bytes())
    return h.hexdigest()


def build_search_text(meta, en_text, ru_text):
    title = meta.get("title", {})
    if isinstance(title, dict):
        title_text = " ".join(v for v in title.values() if isinstance(v, str))
    elif isinstance(title, str):
        title_text = title
    else:
        title_text = ""

    categories = meta.get("category", [])
    if isinstance(categories, str):
        categories = [categories]

    address = meta.get("address", "")
    if isinstance(address, dict):
        address_text = " ".join(v for v in address.values() if isinstance(v, str))
    elif isinstance(address, str):
        address_text = address
    else:
        address_text = ""

    all_text = "\n".join([title_text, en_text, ru_text, " ".join(categories), address_text])
    return all_text.strip().lower()


def generate_thumbnail(image_file: Path, place_id: str):
    if Image is None or not image_file.exists():
        return None

    THUMBS_DIR.mkdir(parents=True, exist_ok=True)
    output_rel = f"build/thumbs/{place_id}.webp"
    output_path = Path(output_rel)

    try:
        with Image.open(image_file) as im:
            rgb = im.convert("RGB")
            rgb.thumbnail((640, 360))
            rgb.save(output_path, format="WEBP", quality=72, method=6)
    except (UnidentifiedImageError, OSError) as exc:
        print(
            f"Warning: failed to generate thumbnail for {image_file} ({exc}); skipping.",
            file=sys.stderr,
        )
        return None

    return output_rel.replace("\\", "/")


def resolve_image_path(image_file: Path):
    if not image_file.exists():
        return ""

    if image_file.stat().st_size == 0:
        print(
            f"Warning: {image_file} is empty; omitting image.",
            file=sys.stderr,
        )
        return ""

    if Image is not None:
        try:
            with Image.open(image_file) as im:
                im.verify()
        except (UnidentifiedImageError, OSError) as exc:
            print(
                f"Warning: {image_file} is not a valid image ({exc}); omitting image.",
                file=sys.stderr,
            )
            return ""

    return str(image_file).replace("\\", "/")


def build_place(meta, place_path):
    en_text = read_file(str(place_path / "en.md"))
    ru_text = read_file(str(place_path / "ru.md"))

    image_file = place_path / "cover.jpg"
    image_path = resolve_image_path(image_file)
    thumb_path = generate_thumbnail(image_file, meta["id"]) if image_path else None

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
        "personal": meta.get("personal", "to-do") or "to-do",
        "price": meta.get("price", "$$") or "$$",
        "address": meta.get("address", ""),
        "external_link": meta.get("external_link", ""),
        "image": image_path,
        "thumbnail": thumb_path,
        "search_text": build_search_text(meta, en_text, ru_text if ru_text else en_text),
        "summary": {
            "en": en_text,
            "ru": ru_text if ru_text else en_text,
        },
    }


def write_hashed_copy(path: Path, stem: str):
    digest = file_hash(path)[:10]
    out = path.parent / f"{stem}.{digest}.json"
    out.write_bytes(path.read_bytes())
    return out.as_posix()


def compute_asset_version(paths):
    hasher = hashlib.sha256()
    for path in sorted(paths):
        p = Path(path)
        if p.exists():
            hasher.update(p.as_posix().encode("utf-8"))
            hasher.update(p.read_bytes())
    return hasher.hexdigest()[:10]


def stamp_html_version(asset_version: str):
    for html_path in [Path("index.html"), Path("place.html")]:
        text = html_path.read_text(encoding="utf-8")
        text = re.sub(r"([?&]v=)([A-Za-z0-9_-]+|__ASSET_VERSION__)", rf"\g<1>{asset_version}", text)
        html_path.write_text(text, encoding="utf-8")


def build_manifest(asset_version: str, places_hashed: str, search_hashed: str, places):
    key_images = [p.get("thumbnail") or p.get("image") for p in places[:24] if p.get("thumbnail") or p.get("image")]
    manifest = {
        "version": asset_version,
        "places": places_hashed,
        "searchIndex": search_hashed,
        "offline": {
            "core": [
                "index.html",
                "place.html",
                "assets/css/styles.css",
                "assets/js/common.js",
                "assets/js/state.js",
                "assets/js/ui-text.js",
                "assets/js/filters.js",
                "assets/js/url-state.js",
                "assets/js/list-view.js",
                "assets/js/data-loader.js",
                "assets/js/app.js",
                "assets/js/map.js",
                "assets/js/place.js",
                "build/places.json",
                "build/search-index.json",
                places_hashed,
                search_hashed,
            ],
            "images": key_images,
        },
    }
    MANIFEST_FILE.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")


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

    BUILD_DIR.mkdir(parents=True, exist_ok=True)
    places_payload = []
    search_rows = []
    for place in places:
      search_rows.append({"id": place["id"], "text": place.get("search_text", "")})
      place_copy = dict(place)
      place_copy.pop("search_text", None)
      places_payload.append(place_copy)

    OUTPUT_FILE.write_text(json.dumps(places_payload, ensure_ascii=False, indent=2), encoding="utf-8")

    SEARCH_INDEX_FILE.write_text(json.dumps(search_rows, ensure_ascii=False, indent=2), encoding="utf-8")

    places_hashed = write_hashed_copy(OUTPUT_FILE, "places")
    search_hashed = write_hashed_copy(SEARCH_INDEX_FILE, "search-index")

    asset_version = compute_asset_version([
        "assets/css/styles.css",
        "assets/js/app.js",
        "assets/js/common.js",
        "assets/js/data-loader.js",
        "assets/js/filters.js",
        "assets/js/list-view.js",
        "assets/js/map.js",
        "assets/js/place.js",
        "assets/js/state.js",
        "assets/js/ui-text.js",
        "assets/js/url-state.js",
        str(OUTPUT_FILE),
        str(SEARCH_INDEX_FILE),
    ])
    stamp_html_version(asset_version)
    build_manifest(asset_version, places_hashed, search_hashed, places_payload)

    print(f"\nBuilt {len(places)} places into {OUTPUT_FILE}.")
    print(f"Search index written to {SEARCH_INDEX_FILE}.")
    if Image is None:
        print("Thumbnails skipped: Pillow is not installed.")
    else:
        print(f"Thumbnails generated in {THUMBS_DIR}.")


if __name__ == "__main__":
    main()
