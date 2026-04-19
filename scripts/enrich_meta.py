#!/usr/bin/env python3
from __future__ import annotations

import argparse
import copy
import difflib
import json
import math
from pathlib import Path
from typing import Any

import yaml

CATEGORY_TO_ROUTE_TYPES = {
    "food": ["foodie", "date-night"],
    "museums": ["culture", "rainy-day"],
    "museum": ["culture", "rainy-day"],
    "landmarks": ["culture", "architecture", "touristy"],
    "landmark": ["culture", "architecture", "touristy"],
    "parks": ["scenic", "outdoors", "relaxing"],
    "park": ["scenic", "outdoors", "relaxing"],
    "views": ["scenic", "photography", "date-night"],
    "viewpoints": ["scenic", "photography", "date-night"],
    "hidden-gems": ["hidden-gem", "photography"],
    "shopping": ["shopping", "indoor"],
    "nightlife": ["nightlife", "date-night"],
    "beaches": ["outdoors", "summer", "scenic"],
    "beach": ["outdoors", "summer", "scenic"],
    "family": ["family", "kids"],
    "zoos": ["family", "kids", "outdoors"],
    "zoo": ["family", "kids", "outdoors"],
}

TITLE_KEYWORDS = {
    "museum": ["culture", "rainy-day"],
    "gallery": ["culture"],
    "cathedral": ["culture", "architecture", "quiet"],
    "bridge": ["architecture", "scenic", "photography"],
    "park": ["outdoors", "relaxing", "scenic"],
    "market": ["foodie", "shopping"],
    "zoo": ["family", "kids", "outdoors"],
    "island": ["scenic", "outdoors", "day-trip"],
    "bagel": ["foodie", "quick-bite"],
    "bbq": ["foodie"],
    "coffee": ["coffee", "quick-bite"],
    "donut": ["dessert", "quick-bite"],
    "dumpling": ["foodie"],
    "library": ["culture", "rainy-day", "quiet"],
    "terminal": ["architecture", "photography"],
    "aquarium": ["family", "kids", "rainy-day"],
    "store": ["shopping"],
    "center": ["culture"],
}

SUMMARY_KEYWORDS = {
    "cocktail": ["nightlife", "date-night"],
    "bar": ["nightlife"],
    "restaurant": ["foodie"],
    "architecture": ["architecture"],
    "view": ["scenic", "photography"],
    "sunset": ["date-night", "scenic"],
    "family": ["family", "kids"],
    "historic": ["history", "culture"],
}

BEST_TIME_BY_ROUTE = {
    "nightlife": ["evening", "night"],
    "date-night": ["late-afternoon", "evening"],
    "photography": ["morning", "golden-hour"],
    "scenic": ["morning", "golden-hour"],
    "foodie": ["lunch", "dinner"],
    "coffee": ["morning"],
    "dessert": ["afternoon", "evening"],
    "rainy-day": ["midday"],
    "outdoors": ["morning", "afternoon"],
    "culture": ["midday", "afternoon"],
}

NEIGHBORHOODS = [
    {
        "name": "Midtown West",
        "borough": "Manhattan",
        "center": [40.7610, -73.9855],
        "radius_km": 1.5,
    },
    {
        "name": "Midtown East",
        "borough": "Manhattan",
        "center": [40.7549, -73.9776],
        "radius_km": 1.2,
    },
    {
        "name": "Chelsea",
        "borough": "Manhattan",
        "center": [40.7465, -74.0014],
        "radius_km": 1.2,
    },
    {
        "name": "Flatiron / NoMad",
        "borough": "Manhattan",
        "center": [40.7411, -73.9897],
        "radius_km": 1.0,
    },
    {
        "name": "Upper West Side",
        "borough": "Manhattan",
        "center": [40.7812, -73.9740],
        "radius_km": 1.8,
    },
    {
        "name": "Upper East Side",
        "borough": "Manhattan",
        "center": [40.7794, -73.9632],
        "radius_km": 1.7,
    },
    {
        "name": "Morningside Heights",
        "borough": "Manhattan",
        "center": [40.8075, -73.9626],
        "radius_km": 1.2,
    },
    {
        "name": "Financial District",
        "borough": "Manhattan",
        "center": [40.7075, -74.0113],
        "radius_km": 1.2,
    },
    {
        "name": "Chinatown / Little Italy",
        "borough": "Manhattan",
        "center": [40.7180, -73.9970],
        "radius_km": 1.0,
    },
    {
        "name": "SoHo / Nolita",
        "borough": "Manhattan",
        "center": [40.7233, -74.0020],
        "radius_km": 1.0,
    },
    {
        "name": "Greenwich Village",
        "borough": "Manhattan",
        "center": [40.7336, -74.0027],
        "radius_km": 1.1,
    },
    {
        "name": "DUMBO",
        "borough": "Brooklyn",
        "center": [40.7033, -73.9881],
        "radius_km": 0.9,
    },
    {
        "name": "Prospect Heights",
        "borough": "Brooklyn",
        "center": [40.6763, -73.9686],
        "radius_km": 1.2,
    },
    {
        "name": "Brighton Beach",
        "borough": "Brooklyn",
        "center": [40.5773, -73.9615],
        "radius_km": 1.0,
    },
    {
        "name": "Coney Island",
        "borough": "Brooklyn",
        "center": [40.5749, -73.9850],
        "radius_km": 1.5,
    },
    {
        "name": "South Bronx",
        "borough": "Bronx",
        "center": [40.8313, -73.9180],
        "radius_km": 2.0,
    },
]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Enrich NYC map meta.yml files with route-friendly metadata.")
    parser.add_argument("repo_root", type=Path, help="Path to repo root")
    parser.add_argument("--write", action="store_true", help="Persist changes to meta.yml files")
    parser.add_argument("--backup", action="store_true", help="Create .bak backup files before writing")
    parser.add_argument("--stdout", action="store_true", help="Print JSON report to stdout")
    return parser.parse_args()


def load_yaml(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as handle:
        data = yaml.safe_load(handle) or {}
    if not isinstance(data, dict):
        raise ValueError(f"Expected mapping in {path}")
    return data


def iter_place_dirs(places_dir: Path) -> list[Path]:
    return sorted(meta_path.parent for meta_path in places_dir.rglob("meta.yml"))

def place_key(places_dir: Path, place_dir: Path) -> str:
    return place_dir.relative_to(places_dir).as_posix()


def dump_yaml(data: dict[str, Any]) -> str:
    return yaml.safe_dump(data, allow_unicode=True, sort_keys=False, width=100)


def normalize_title(title_value: Any) -> str:
    if isinstance(title_value, dict):
        return " ".join(str(v) for v in title_value.values() if v)
    if title_value is None:
        return ""
    return str(title_value)


def normalize_categories(meta: dict[str, Any]) -> list[str]:
    categories = meta.get("category", [])
    if isinstance(categories, str):
        categories = [categories]
    return [str(item).strip().lower() for item in categories if str(item).strip()]


def read_summary_text(place_dir: Path) -> str:
    parts = []
    for name in ("en.md", "ru.md"):
        path = place_dir / name
        if path.exists():
            parts.append(path.read_text(encoding="utf-8"))
    return "\n".join(parts).lower()


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlon / 2) ** 2
    )
    return 2 * r * math.asin(math.sqrt(a))


def infer_neighborhood(lat: float, lng: float) -> tuple[str, str, float] | None:
    best = None
    for item in NEIGHBORHOODS:
        distance = haversine_km(lat, lng, item["center"][0], item["center"][1])
        if distance <= item["radius_km"]:
            if best is None or distance < best[2]:
                best = (item["borough"], item["name"], distance)
    return best


def infer_route_types(meta: dict[str, Any], place_dir: Path) -> list[str]:
    title = normalize_title(meta.get("title")).lower()
    summary = read_summary_text(place_dir)
    collected: list[str] = []

    for category in normalize_categories(meta):
        collected.extend(CATEGORY_TO_ROUTE_TYPES.get(category, []))
        close_matches = difflib.get_close_matches(category, list(CATEGORY_TO_ROUTE_TYPES), n=1, cutoff=0.88)
        if close_matches:
            collected.extend(CATEGORY_TO_ROUTE_TYPES[close_matches[0]])

    for keyword, tags in TITLE_KEYWORDS.items():
        if keyword in title:
            collected.extend(tags)

    for keyword, tags in SUMMARY_KEYWORDS.items():
        if keyword in summary:
            collected.extend(tags)

    cost = str(meta.get("cost", "")).lower()
    if cost == "free":
        collected.append("budget-friendly")

    visit_time = str(meta.get("time", "")).lower()
    if visit_time in {"short", "medium"}:
        collected.append("easy-stop")
    if visit_time == "full":
        collected.append("anchor-stop")

    unique = sorted({item for item in collected if item})
    return unique


def infer_best_time(route_types: list[str]) -> list[str]:
    out: list[str] = []
    for route_type in route_types:
        out.extend(BEST_TIME_BY_ROUTE.get(route_type, []))
    return sorted(set(out))


def merge_list(existing: Any, new_items: list[str]) -> list[str]:
    items: list[str] = []
    if isinstance(existing, list):
        items.extend(str(x) for x in existing if str(x).strip())
    elif isinstance(existing, str) and existing.strip():
        items.append(existing.strip())
    items.extend(new_items)
    return sorted({item for item in items if item})


def enrich_meta(meta: dict[str, Any], place_dir: Path) -> dict[str, Any]:
    enriched = copy.deepcopy(meta)

    coords = meta.get("coords") or {}
    lat = float(coords.get("lat"))
    lng = float(coords.get("lng"))
    geo = infer_neighborhood(lat, lng)
    if geo:
        borough, neighborhood, _distance = geo
        enriched["borough"] = borough
        enriched["neighborhood"] = neighborhood

    route_types = infer_route_types(meta, place_dir)
    enriched["route_types"] = merge_list(meta.get("route_types"), route_types)
    enriched["best_time"] = merge_list(meta.get("best_time"), infer_best_time(enriched["route_types"]))

    vibes = []
    if "nightlife" in enriched["route_types"]:
        vibes.append("lively")
    if "culture" in enriched["route_types"]:
        vibes.append("curious")
    if "scenic" in enriched["route_types"]:
        vibes.append("photogenic")
    if "relaxing" in enriched["route_types"]:
        vibes.append("slow")
    if "foodie" in enriched["route_types"]:
        vibes.append("tasty")
    enriched["vibes"] = merge_list(meta.get("vibes"), vibes)

    best_for = []
    if "date-night" in enriched["route_types"]:
        best_for.append("couples")
    if "family" in enriched["route_types"] or "kids" in enriched["route_types"]:
        best_for.append("families")
    if "budget-friendly" in enriched["route_types"]:
        best_for.append("budget")
    if "photography" in enriched["route_types"]:
        best_for.append("photos")
    enriched["best_for"] = merge_list(meta.get("best_for"), best_for)

    return enriched


def process_repo(repo_root: Path, write: bool, backup: bool) -> dict[str, Any]:
    places_dir = repo_root / "places"
    if not places_dir.exists():
        raise FileNotFoundError(f"places directory not found under {repo_root}")

    report: dict[str, Any] = {"changed": [], "unchanged": [], "errors": []}
    for place_dir in iter_place_dirs(places_dir):
        meta_path = place_dir / "meta.yml"
        place_id = place_key(places_dir, place_dir)
        try:
            original = load_yaml(meta_path)
            enriched = enrich_meta(original, place_dir)
            if enriched != original:
                report["changed"].append(place_id)
                if write:
                    if backup:
                        meta_path.with_suffix(".yml.bak").write_text(meta_path.read_text(encoding="utf-8"), encoding="utf-8")
                    meta_path.write_text(dump_yaml(enriched), encoding="utf-8")
            else:
                report["unchanged"].append(place_id)
        except Exception as exc:
            report["errors"].append({"place": place_id, "error": str(exc)})
    return report


def main() -> int:
    args = parse_args()
    report = process_repo(args.repo_root, write=args.write, backup=args.backup)
    if args.stdout or True:
        print(json.dumps(report, ensure_ascii=False, indent=2))
    return 1 if report["errors"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
