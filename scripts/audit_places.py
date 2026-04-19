#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

import yaml

REQUIRED = ["id", "title", "coords", "category", "time", "cost", "address"]
OPTIONAL_ROUTE_FIELDS = ["borough", "neighborhood", "route_types", "best_time", "vibes", "best_for"]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Audit NYC map place metadata for missing fields and route readiness.")
    parser.add_argument("repo_root", type=Path, help="Path to repo root")
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


def main() -> int:
    args = parse_args()
    places_dir = args.repo_root / "places"
    report = {
        "total_places": 0,
        "missing_required": [],
        "missing_route_fields": [],
        "missing_translations": [],
        "missing_cover": [],
    }

    for place_dir in iter_place_dirs(places_dir):
        meta_path = place_dir / "meta.yml"
        place_id = place_key(places_dir, place_dir)
        report["total_places"] += 1
        meta = load_yaml(meta_path)

        missing_required = [field for field in REQUIRED if field not in meta or meta.get(field) in (None, "", [])]
        if missing_required:
            report["missing_required"].append({"place": place_id, "fields": missing_required})

        missing_route = [field for field in OPTIONAL_ROUTE_FIELDS if field not in meta or meta.get(field) in (None, "", [])]
        if missing_route:
            report["missing_route_fields"].append({"place": place_id, "fields": missing_route})

        if not (place_dir / "ru.md").exists():
            report["missing_translations"].append(place_id)
        if not (place_dir / "cover.jpg").exists():
            report["missing_cover"].append(place_id)

    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
