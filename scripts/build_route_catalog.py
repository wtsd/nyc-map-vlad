#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

import yaml


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Build route helper catalog from place metadata.")
    parser.add_argument("repo_root", type=Path, help="Path to repo root")
    parser.add_argument("--output", type=Path, default=None, help="Output JSON file path")
    return parser.parse_args()


def load_yaml(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as handle:
        data = yaml.safe_load(handle) or {}
    if not isinstance(data, dict):
        raise ValueError(f"Expected mapping in {path}")
    return data


def title_en(meta: dict[str, Any]) -> str:
    title = meta.get("title", "")
    if isinstance(title, dict):
        return str(title.get("en") or next(iter(title.values()), ""))
    return str(title)


def route_record(place_id: str, meta: dict[str, Any]) -> dict[str, Any]:
    coords = meta.get("coords") or {}
    return {
        "id": meta.get("id", place_id),
        "title": title_en(meta),
        "borough": meta.get("borough"),
        "neighborhood": meta.get("neighborhood"),
        "category": meta.get("category", []),
        "route_types": meta.get("route_types", []),
        "best_time": meta.get("best_time", []),
        "vibes": meta.get("vibes", []),
        "best_for": meta.get("best_for", []),
        "time": meta.get("time"),
        "cost": meta.get("cost"),
        "address": meta.get("address"),
        "coords": [coords.get("lat"), coords.get("lng")],
    }


def main() -> int:
    args = parse_args()
    places_dir = args.repo_root / "places"
    records = []
    by_neighborhood: dict[str, list[str]] = {}
    by_route_type: dict[str, list[str]] = {}

    for place_dir in sorted(path for path in places_dir.iterdir() if path.is_dir()):
        meta_path = place_dir / "meta.yml"
        if not meta_path.exists():
            continue
        meta = load_yaml(meta_path)
        record = route_record(place_dir.name, meta)
        records.append(record)

        neighborhood = record.get("neighborhood")
        if neighborhood:
            by_neighborhood.setdefault(neighborhood, []).append(record["id"])

        for route_type in record.get("route_types", []) or []:
            by_route_type.setdefault(route_type, []).append(record["id"])

    output = {
        "places": records,
        "by_neighborhood": {k: sorted(v) for k, v in sorted(by_neighborhood.items())},
        "by_route_type": {k: sorted(v) for k, v in sorted(by_route_type.items())},
    }

    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(json.dumps(output, ensure_ascii=False, indent=2), encoding="utf-8")
    else:
        print(json.dumps(output, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
