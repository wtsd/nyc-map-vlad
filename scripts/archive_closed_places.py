#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import math
import re
import time
from pathlib import Path
from typing import Any
from urllib.error import URLError
from urllib.parse import quote_plus
from urllib.request import Request, urlopen

import yaml

OVERPASS_URL = "https://overpass-api.de/api/interpreter"
USER_AGENT = "nyc-map-vlad-maintenance/1.0"
ARCHIVE_CATEGORY = "archive"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Detect closed places from OSM tags and move them to archive category."
    )
    parser.add_argument("repo_root", type=Path, help="Path to repository root")
    parser.add_argument("--write", action="store_true", help="Persist changes")
    parser.add_argument("--radius", type=int, default=130, help="Search radius in meters")
    parser.add_argument("--sleep", type=float, default=1.0, help="Delay between Overpass requests")
    return parser.parse_args()


def load_yaml(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as handle:
        data = yaml.safe_load(handle) or {}
    if not isinstance(data, dict):
        raise ValueError(f"Expected mapping in {path}")
    return data


def dump_yaml(data: dict[str, Any]) -> str:
    return yaml.safe_dump(data, allow_unicode=True, sort_keys=False, width=100)


def request_json(url: str, body: str) -> Any | None:
    data = body.encode("utf-8")
    req = Request(url, data=data, headers={"User-Agent": USER_AGENT, "Content-Type": "application/x-www-form-urlencoded"})
    try:
        with urlopen(req, timeout=45) as response:
            return json.load(response)
    except URLError:
        return None


def get_title(meta: dict[str, Any], fallback: str) -> str:
    title = meta.get("title")
    if isinstance(title, dict):
        return str(title.get("en") or title.get("ru") or fallback)
    if isinstance(title, str) and title.strip():
        return title
    return fallback


def get_coords(meta: dict[str, Any]) -> tuple[float, float] | None:
    coords = meta.get("coords")
    if not isinstance(coords, dict):
        return None
    lat = coords.get("lat")
    lng = coords.get("lng")
    if isinstance(lat, (int, float)) and isinstance(lng, (int, float)):
        return float(lat), float(lng)
    return None


def normalized(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", text.lower())


def distance_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371000
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
    )
    return 2 * r * math.asin(math.sqrt(a))


def is_closed(tags: dict[str, str]) -> tuple[bool, str]:
    if tags.get("disused") == "yes" or tags.get("abandoned") == "yes":
        return True, "disused/abandoned tag"
    if tags.get("amenity") == "vacant":
        return True, "amenity=vacant"
    if tags.get("shop") == "vacant":
        return True, "shop=vacant"
    for key in tags:
        if key.startswith("disused:") or key.startswith("abandoned:"):
            return True, f"{key} present"
    if tags.get("opening_hours") == "closed":
        return True, "opening_hours=closed"
    return False, ""


def choose_candidate(elements: list[dict[str, Any]], title: str, lat: float, lng: float) -> dict[str, Any] | None:
    norm_title = normalized(title)
    scored: list[tuple[float, dict[str, Any]]] = []

    for elem in elements:
        tags = elem.get("tags") or {}
        name = str(tags.get("name") or "")
        e_lat = elem.get("lat")
        e_lon = elem.get("lon")
        if isinstance(e_lat, (int, float)) and isinstance(e_lon, (int, float)):
            dist = distance_m(lat, lng, float(e_lat), float(e_lon))
        else:
            dist = 9999.0

        similarity_bonus = 0.0
        norm_name = normalized(name)
        if norm_title and norm_name:
            if norm_title == norm_name:
                similarity_bonus = 300.0
            elif norm_title in norm_name or norm_name in norm_title:
                similarity_bonus = 180.0

        score = similarity_bonus - dist
        scored.append((score, elem))

    if not scored:
        return None
    scored.sort(key=lambda x: x[0], reverse=True)
    return scored[0][1]


def overpass_query(lat: float, lng: float, radius: int) -> str:
    return quote_plus(
        f"""
[out:json][timeout:25];
(
  nwr(around:{radius},{lat},{lng})[name];
);
out center tags;
""".strip()
    )


def get_element_lat_lng(elem: dict[str, Any]) -> tuple[float, float] | None:
    if isinstance(elem.get("lat"), (int, float)) and isinstance(elem.get("lon"), (int, float)):
        return float(elem["lat"]), float(elem["lon"])
    center = elem.get("center")
    if isinstance(center, dict) and isinstance(center.get("lat"), (int, float)) and isinstance(center.get("lon"), (int, float)):
        return float(center["lat"]), float(center["lon"])
    return None


def main() -> int:
    args = parse_args()
    places_dir = args.repo_root / "places"

    archived: list[dict[str, Any]] = []

    for meta_path in sorted(places_dir.rglob("meta.yml")):
        meta = load_yaml(meta_path)

        categories = meta.get("category")
        if isinstance(categories, str):
            categories = [categories]
        if isinstance(categories, list) and ARCHIVE_CATEGORY in [str(c).lower() for c in categories]:
            continue

        coords = get_coords(meta)
        if coords is None:
            continue

        lat, lng = coords
        title = get_title(meta, meta_path.parent.name)
        body = f"data={overpass_query(lat, lng, args.radius)}"
        result = request_json(OVERPASS_URL, body)
        if not isinstance(result, dict):
            time.sleep(args.sleep)
            continue
        elements = result.get("elements") or []
        candidate = choose_candidate(elements, title, lat, lng)

        if candidate is None:
            time.sleep(args.sleep)
            continue

        tags = candidate.get("tags") or {}
        closed, reason = is_closed(tags)

        if closed:
            old_category = meta.get("category", [])
            if isinstance(old_category, str):
                old_category = [old_category]
            meta["category"] = ["archive"]
            meta["archived_from"] = old_category
            meta["archive_reason"] = reason
            meta["archive_source"] = "openstreetmap"

            archived.append({
                "place": meta.get("id") or meta_path.parent.name,
                "reason": reason,
                "osm_name": tags.get("name", ""),
            })

            if args.write:
                meta_path.write_text(dump_yaml(meta), encoding="utf-8")

        time.sleep(args.sleep)

    print(json.dumps({"archived_count": len(archived), "archived": archived}, ensure_ascii=False, indent=2))
    if not args.write:
        print("Dry run complete. Re-run with --write to persist changes.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
