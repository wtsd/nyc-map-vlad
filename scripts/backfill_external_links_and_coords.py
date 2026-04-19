from __future__ import annotations

from pathlib import Path
import time
import json
import urllib.parse
import urllib.request
import yaml

ROOT = Path(__file__).resolve().parent.parent
PLACES_DIR = ROOT / "places"

USER_AGENT = "nyc-map-vlad/1.0 (contact: local-script)"
NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"

# Optional manual overrides for tricky places
OVERRIDES: dict[str, tuple[float, float]] = {
    # "food/mei-lai-wah": (40.7151859, -73.9990557),
    # "landmarks/brooklyn-bridge": (40.7061, -73.9969),
}

def load_yaml(path: Path) -> dict:
    with path.open("r", encoding="utf-8") as f:
        data = yaml.safe_load(f) or {}
    if not isinstance(data, dict):
        raise ValueError(f"{path} did not parse into a mapping")
    return data

def save_yaml(path: Path, data: dict) -> None:
    with path.open("w", encoding="utf-8") as f:
        yaml.safe_dump(
            data,
            f,
            allow_unicode=True,
            sort_keys=False,
            default_flow_style=False,
        )

def has_missing_external_link(data: dict) -> bool:
    return "external_link" not in data

def coords_missing_or_zero(data: dict) -> bool:
    coords = data.get("coords")
    if not isinstance(coords, dict):
        return True

    lat = coords.get("lat")
    lng = coords.get("lng")

    if lat is None or lng is None:
        return True

    try:
        lat_f = float(lat)
        lng_f = float(lng)
    except (TypeError, ValueError):
        return True

    return lat_f == 0.0 and lng_f == 0.0

def build_query(place_key: str, data: dict) -> str:
    address = str(data.get("address") or "").strip()
    title = data.get("title") or {}
    title_en = ""

    if isinstance(title, dict):
        title_en = str(title.get("en") or "").strip()

    if address:
        return address

    if title_en:
        return f"{title_en}, New York City"

    return place_key.split("/", 1)[-1].replace("-", " ")

def geocode(query: str) -> tuple[float, float] | None:
    params = {
        "q": query,
        "format": "jsonv2",
        "limit": 1,
    }
    url = f"{NOMINATIM_URL}?{urllib.parse.urlencode(params)}"
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})

    with urllib.request.urlopen(req, timeout=20) as resp:
        payload = json.loads(resp.read().decode("utf-8"))

    if not payload:
        return None

    hit = payload[0]
    return float(hit["lat"]), float(hit["lon"])

def get_place_key(meta_path: Path) -> str:
    # places/food/mei-lai-wah/meta.yml -> food/mei-lai-wah
    return str(meta_path.parent.relative_to(PLACES_DIR)).replace("\\", "/")

def main() -> None:
    updated_external = []
    updated_coords = []
    geocode_failures = []

    meta_files = sorted(PLACES_DIR.rglob("meta.yml"))

    if not meta_files:
        print("No meta.yml files found under places/")
        return

    for meta_path in meta_files:
        place_key = get_place_key(meta_path)
        data = load_yaml(meta_path)
        changed = False

        if has_missing_external_link(data):
            data["external_link"] = ""
            updated_external.append(place_key)
            changed = True

        if coords_missing_or_zero(data):
            if place_key in OVERRIDES:
                lat, lng = OVERRIDES[place_key]
                data["coords"] = {"lat": float(lat), "lng": float(lng)}
                updated_coords.append((place_key, "override"))
                changed = True
            else:
                query = build_query(place_key, data)
                try:
                    result = geocode(query)
                    time.sleep(1.1)
                except Exception as exc:
                    geocode_failures.append((place_key, query, f"error: {exc}"))
                    result = None

                if result is None:
                    geocode_failures.append((place_key, query, "no result"))
                else:
                    lat, lng = result
                    data["coords"] = {"lat": lat, "lng": lng}
                    updated_coords.append((place_key, query))
                    changed = True

        if changed:
            save_yaml(meta_path, data)

    print()
    print("Done.")
    print(f"Scanned {len(meta_files)} meta.yml files.")
    print(f"Added empty external_link to {len(updated_external)} places.")
    print(f"Updated coordinates for {len(updated_coords)} places.")
    print()

    if updated_external:
        print("external_link added:")
        for place_key in updated_external:
            print(f"  - {place_key}")
        print()

    if updated_coords:
        print("coordinates updated:")
        for place_key, source in updated_coords:
            print(f"  - {place_key}  <-  {source}")
        print()

    if geocode_failures:
        print("geocode failures:")
        for place_key, query, reason in geocode_failures:
            print(f"  - {place_key}: {reason} | query={query}")
        print()

    print("Closed / out-of-business check:")
    print("  This script does not verify business status.")
    print("  For that, use manual review or a live places/business-status API.")

if __name__ == "__main__":
    main()
