#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import time
from pathlib import Path
from typing import Any
from urllib.parse import quote_plus
from urllib.request import Request, urlopen

import yaml

NOMINATIM_SEARCH = "https://nominatim.openstreetmap.org/search"
NOMINATIM_REVERSE = "https://nominatim.openstreetmap.org/reverse"
USER_AGENT = "nyc-map-vlad-maintenance/1.0"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Fill missing address and coords in places/<category>/<place-id>/meta.yml using Nominatim."
    )
    parser.add_argument("repo_root", type=Path, help="Path to repository root")
    parser.add_argument("--write", action="store_true", help="Persist changes")
    parser.add_argument("--sleep", type=float, default=1.1, help="Delay between API calls")
    return parser.parse_args()


def load_yaml(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as handle:
        data = yaml.safe_load(handle) or {}
    if not isinstance(data, dict):
        raise ValueError(f"Expected mapping in {path}")
    return data


def dump_yaml(data: dict[str, Any]) -> str:
    return yaml.safe_dump(data, allow_unicode=True, sort_keys=False, width=100)


def request_json(url: str) -> Any:
    req = Request(url, headers={"User-Agent": USER_AGENT})
    with urlopen(req, timeout=30) as response:
        return json.load(response)


def build_query(meta: dict[str, Any], folder_name: str) -> str:
    title = meta.get("title", {})
    if isinstance(title, dict):
        title_text = str(title.get("en") or title.get("ru") or folder_name)
    else:
        title_text = str(title or folder_name)
    return f"{title_text}, New York, NY"


def get_coords(meta: dict[str, Any]) -> tuple[float, float] | None:
    coords = meta.get("coords")
    if not isinstance(coords, dict):
        return None
    lat = coords.get("lat")
    lng = coords.get("lng")
    if isinstance(lat, (int, float)) and isinstance(lng, (int, float)):
        return float(lat), float(lng)
    return None


def main() -> int:
    args = parse_args()
    places_dir = args.repo_root / "places"

    reports: list[dict[str, Any]] = []

    for meta_path in sorted(places_dir.rglob("meta.yml")):
        meta = load_yaml(meta_path)
        changed = False
        place_id = meta.get("id") or meta_path.parent.name

        coords = get_coords(meta)
        address = str(meta.get("address") or "").strip()

        if coords is None:
            query = build_query(meta, meta_path.parent.name)
            search_url = (
                f"{NOMINATIM_SEARCH}?q={quote_plus(query)}&format=jsonv2&limit=1&countrycodes=us"
            )
            result = request_json(search_url)
            if result:
                item = result[0]
                meta["coords"] = {
                    "lat": float(item["lat"]),
                    "lng": float(item["lon"]),
                }
                coords = (meta["coords"]["lat"], meta["coords"]["lng"])
                changed = True
                reports.append({"place": place_id, "action": "filled_coords", "query": query})
            time.sleep(args.sleep)

        if not address and coords is not None:
            lat, lng = coords
            reverse_url = (
                f"{NOMINATIM_REVERSE}?lat={lat}&lon={lng}&format=jsonv2&addressdetails=1"
            )
            result = request_json(reverse_url)
            display_name = str(result.get("display_name") or "").strip()
            if display_name:
                meta["address"] = display_name
                changed = True
                reports.append({"place": place_id, "action": "filled_address", "from_coords": [lat, lng]})
            time.sleep(args.sleep)

        if changed and args.write:
            meta_path.write_text(dump_yaml(meta), encoding="utf-8")

    print(json.dumps({"updated": len(reports), "changes": reports}, ensure_ascii=False, indent=2))
    if not args.write:
        print("Dry run complete. Re-run with --write to persist changes.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
