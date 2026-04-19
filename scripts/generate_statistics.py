#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import yaml

PERSONAL_WANT = "want-to-go"
PERSONAL_VISITED = "visited"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate category/personal statistics for places.")
    parser.add_argument("repo_root", type=Path, help="Path to repository root")
    parser.add_argument("--output-json", type=Path, default=Path("build/statistics.json"), help="Output JSON path")
    parser.add_argument("--output-md", type=Path, default=Path("build/statistics.md"), help="Output Markdown path")
    return parser.parse_args()


def load_yaml(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as handle:
        data = yaml.safe_load(handle) or {}
    if not isinstance(data, dict):
        raise ValueError(f"Expected mapping in {path}")
    return data


def iter_meta_files(places_dir: Path) -> list[Path]:
    return sorted(places_dir.rglob("meta.yml"))


def main() -> int:
    args = parse_args()
    repo_root = args.repo_root
    category_counts: Counter[str] = Counter()
    personal_counts: Counter[str] = Counter()
    total_places = 0

    for meta_path in iter_meta_files(repo_root / "places"):
        total_places += 1
        meta = load_yaml(meta_path)

        categories = meta.get("category", [])
        if isinstance(categories, str):
            categories = [categories]
        for category in categories:
            normalized = str(category).strip().lower()
            if normalized:
                category_counts[normalized] += 1

        personal = str(meta.get("personal") or "").strip().lower()
        if personal:
            personal_counts[personal] += 1

    payload = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "total_places": total_places,
        "categories": dict(sorted(category_counts.items())),
        "personal": {
            "want_to_go": personal_counts.get(PERSONAL_WANT, 0),
            "visited": personal_counts.get(PERSONAL_VISITED, 0),
            "other": {
                key: value
                for key, value in sorted(personal_counts.items())
                if key not in {PERSONAL_WANT, PERSONAL_VISITED}
            },
        },
    }

    output_json = repo_root / args.output_json
    output_json.parent.mkdir(parents=True, exist_ok=True)
    output_json.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    output_md = repo_root / args.output_md
    lines = [
        "# Place Statistics",
        "",
        f"Generated at (UTC): `{payload['generated_at']}`",
        f"Total places: **{total_places}**",
        "",
        "## Places per category",
        "",
        "| Category | Count |",
        "|---|---:|",
    ]
    for category, count in sorted(category_counts.items()):
        lines.append(f"| {category} | {count} |")

    lines.extend(
        [
            "",
            "## Personal status",
            "",
            "| Status | Count |",
            "|---|---:|",
            f"| want-to-go | {payload['personal']['want_to_go']} |",
            f"| visited | {payload['personal']['visited']} |",
        ]
    )

    for key, value in payload["personal"]["other"].items():
        lines.append(f"| {key} | {value} |")

    output_md.write_text("\n".join(lines) + "\n", encoding="utf-8")

    print(json.dumps(payload, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
