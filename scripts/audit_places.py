#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

import yaml

REQUIRED = ["id", "title", "coords", "category", "time", "cost", "address"]
OPTIONAL_ROUTE_FIELDS = ["borough", "neighborhood", "route_types", "best_time", "vibes", "best_for"]
ALLOWED_CATEGORY_FILE_EXTENSIONS = {".md", ".yml", ".jpg", ".jpeg", ".png", ".webp", ".bak"}


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


def validate_place_structure(place_dir: Path) -> list[str]:
    issues: list[str] = []
    required_files = ["meta.yml", "en.md", "ru.md", "cover.jpg"]
    for file_name in required_files:
        if not (place_dir / file_name).exists():
            issues.append(f"missing file: {file_name}")

    for child in place_dir.iterdir():
        if child.is_dir():
            issues.append(f"unexpected nested directory: {child.name}")
            continue
        if child.suffix.lower() not in ALLOWED_CATEGORY_FILE_EXTENSIONS:
            issues.append(f"unexpected file extension: {child.name}")

    return issues


def main() -> int:
    args = parse_args()
    places_dir = args.repo_root / "places"
    category_dirs = sorted(path.name for path in places_dir.iterdir() if path.is_dir())
    report = {
        "total_places": 0,
        "categories": category_dirs,
        "missing_required": [],
        "missing_route_fields": [],
        "missing_translations": [],
        "missing_cover": [],
        "id_mismatches": [],
        "missing_category": [],
        "invalid_category": [],
        "structure_issues": [],
    }

    for place_dir in iter_place_dirs(places_dir):
        meta_path = place_dir / "meta.yml"
        place_id = place_key(places_dir, place_dir)
        expected_id = place_dir.name
        expected_category = place_dir.parent.name
        report["total_places"] += 1
        meta = load_yaml(meta_path)

        missing_required = [field for field in REQUIRED if field not in meta or meta.get(field) in (None, "", [])]
        if missing_required:
            report["missing_required"].append({"place": place_id, "fields": missing_required})

        missing_route = [field for field in OPTIONAL_ROUTE_FIELDS if field not in meta or meta.get(field) in (None, "", [])]
        if missing_route:
            report["missing_route_fields"].append({"place": place_id, "fields": missing_route})

        category = meta.get("category")
        normalized_category: list[str] = []
        if category in (None, "", []):
            report["missing_category"].append(place_id)
        elif isinstance(category, str):
            normalized_category = [category]
        elif isinstance(category, list):
            normalized_category = [item for item in category if isinstance(item, str) and item.strip()]
        else:
            report["invalid_category"].append({"place": place_id, "category": category})

        if normalized_category:
            if expected_category not in normalized_category:
                report["invalid_category"].append(
                    {
                        "place": place_id,
                        "expected": expected_category,
                        "actual": normalized_category,
                        "reason": "directory category missing from meta.category",
                    }
                )
            unknown_categories = [item for item in normalized_category if item not in category_dirs]
            if unknown_categories:
                report["invalid_category"].append(
                    {
                        "place": place_id,
                        "expected_known_categories": category_dirs,
                        "actual": normalized_category,
                        "unknown": unknown_categories,
                        "reason": "meta.category contains category not present in /places",
                    }
                )

        meta_id = meta.get("id")
        if isinstance(meta_id, str):
            if meta_id != expected_id:
                report["id_mismatches"].append({"place": place_id, "expected": expected_id, "actual": meta_id})
        elif meta_id not in (None, ""):
            report["id_mismatches"].append({"place": place_id, "expected": expected_id, "actual": meta_id})

        issues = validate_place_structure(place_dir)
        if issues:
            report["structure_issues"].append({"place": place_id, "issues": issues})

        if not (place_dir / "ru.md").exists():
            report["missing_translations"].append(place_id)
        if not (place_dir / "cover.jpg").exists():
            report["missing_cover"].append(place_id)

    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
