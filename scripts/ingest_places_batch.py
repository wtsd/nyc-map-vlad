#!/usr/bin/env python3
from __future__ import annotations

import argparse
import importlib.util
import re
import unicodedata
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import yaml

META_FILE = "meta.yml"
EN_FILE = "en.md"
RU_FILE = "ru.md"
DEFAULT_BATCH_VAR = "INCOMING_PLACES"


@dataclass
class IngestStats:
    created: list[str] = field(default_factory=list)
    updated: list[str] = field(default_factory=list)
    skipped: list[str] = field(default_factory=list)
    conflicts: list[str] = field(default_factory=list)


@dataclass
class ExistingIndexes:
    by_id: dict[str, Path]
    by_address: dict[str, Path]
    by_title_norm: dict[str, Path]


class IngestConflictError(Exception):
    pass


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Safely ingest a Python list of place records into places/<category>/<slug>/meta.yml. "
            "Only empty metadata fields are updated by default."
        )
    )
    parser.add_argument("repo_root", type=Path, nargs="?", default=Path("."))
    parser.add_argument(
        "--batch-file",
        type=Path,
        default=Path("scripts/katya_batch_template.py"),
        help="Python file that defines a list variable with incoming place records",
    )
    parser.add_argument(
        "--batch-var",
        default=DEFAULT_BATCH_VAR,
        help="Variable name in --batch-file that contains list[dict] records",
    )
    parser.add_argument(
        "--overwrite-descriptions",
        action="store_true",
        help="Allow overwriting existing en.md / ru.md content when description fields are present",
    )
    parser.add_argument(
        "--write",
        action="store_true",
        help="Persist changes. Dry run by default.",
    )
    return parser.parse_args()


def load_yaml(path: Path) -> dict[str, Any]:
    if not path.exists():
        return {}
    with path.open("r", encoding="utf-8") as handle:
        data = yaml.safe_load(handle) or {}
    if not isinstance(data, dict):
        raise ValueError(f"Expected mapping in {path}")
    return data


def dump_yaml(data: dict[str, Any]) -> str:
    return yaml.safe_dump(data, allow_unicode=True, sort_keys=False, width=100)


def compact_spaces(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def slugify(text: str) -> str:
    normalized = unicodedata.normalize("NFKD", text)
    ascii_text = normalized.encode("ascii", "ignore").decode("ascii").lower()
    cleaned = re.sub(r"[^a-z0-9]+", "-", ascii_text)
    return cleaned.strip("-") or "place"


def normalize_category(value: Any) -> str:
    text = compact_spaces(str(value or "other")).lower()
    category = re.sub(r"[^a-z0-9]+", "-", text).strip("-")
    return category or "other"


def normalize_title(record: dict[str, Any]) -> dict[str, str]:
    title_obj = record.get("title")
    if isinstance(title_obj, dict):
        en = compact_spaces(str(title_obj.get("en") or ""))
        ru = compact_spaces(str(title_obj.get("ru") or ""))
    else:
        raw = compact_spaces(str(record.get("title") or record.get("name") or ""))
        en = raw
        ru = compact_spaces(str(record.get("title_ru") or ""))

    if not en and ru:
        en = ru
    if not en:
        raise IngestConflictError("Missing title/name")
    return {"en": en, "ru": ru or en}


def normalize_price(value: Any) -> str:
    text = compact_spaces(str(value or "")).lower()
    mapping = {
        "free": "free",
        "$": "paid",
        "$$": "paid",
        "$$$": "paid",
        "paid": "paid",
    }
    return mapping.get(text, text or "paid")


def normalize_record(record: dict[str, Any]) -> dict[str, Any]:
    title = normalize_title(record)
    base_slug = compact_spaces(str(record.get("slug") or record.get("id") or title["en"]))
    slug = slugify(base_slug)
    category = normalize_category(record.get("category"))
    address = compact_spaces(str(record.get("address") or ""))
    transit = compact_spaces(str(record.get("transit") or ""))

    normalized = {
        "id": slug,
        "slug": slug,
        "title": title,
        "category": [category],
        "address": address,
        "transit": {"en": transit, "ru": transit} if transit else {"en": "", "ru": ""},
        "cost": normalize_price(record.get("price") or record.get("cost")),
        "external_link": compact_spaces(str(record.get("external_link") or "")),
        "description_en": str(record.get("description_en") or "").strip(),
        "description_ru": str(record.get("description_ru") or "").strip(),
        "path": Path("places") / category / slug,
    }
    return normalized


def normalize_address_key(address: str) -> str:
    return compact_spaces(address).lower()


def normalize_title_key(title: str) -> str:
    return slugify(title)


def discover_existing_indexes(places_root: Path) -> ExistingIndexes:
    by_id: dict[str, Path] = {}
    by_address: dict[str, Path] = {}
    by_title_norm: dict[str, Path] = {}

    for meta_path in sorted(places_root.rglob(META_FILE)):
        meta = load_yaml(meta_path)
        place_id = slugify(str(meta.get("id") or meta_path.parent.name))
        by_id.setdefault(place_id, meta_path.parent)

        addr = normalize_address_key(str(meta.get("address") or ""))
        if addr:
            by_address.setdefault(addr, meta_path.parent)

        title = meta.get("title")
        if isinstance(title, dict):
            title_text = str(title.get("en") or title.get("ru") or "")
        else:
            title_text = str(title or "")
        key = normalize_title_key(title_text)
        if key:
            by_title_norm.setdefault(key, meta_path.parent)

    return ExistingIndexes(by_id=by_id, by_address=by_address, by_title_norm=by_title_norm)


def update_if_empty(target: dict[str, Any], key: str, incoming: Any) -> bool:
    current = target.get(key)
    if current in (None, "", [], {}):
        target[key] = incoming
        return True
    return False


def ingest_record(
    record: dict[str, Any],
    repo_root: Path,
    indexes: ExistingIndexes,
    stats: IngestStats,
    overwrite_descriptions: bool,
    write: bool,
) -> None:
    normalized = normalize_record(record)

    slug = normalized["slug"]
    category = normalized["category"][0]
    address_key = normalize_address_key(normalized["address"])
    title_key = normalize_title_key(normalized["title"]["en"])

    id_match = indexes.by_id.get(slug)
    address_match = indexes.by_address.get(address_key) if address_key else None
    title_match = indexes.by_title_norm.get(title_key)

    match_reasons = [
        reason
        for reason, match in [("id", id_match), ("address", address_match), ("title", title_match)]
        if match is not None
    ]
    matches = [m for m in [id_match, address_match, title_match] if m is not None]
    unique_matches = {m.resolve() for m in matches}

    if len(unique_matches) > 1:
        stats.conflicts.append(
            f"{slug}: duplicate signals point to different places (id={id_match}, address={address_match}, title={title_match})"
        )
        return

    if id_match is None and title_match is not None and address_key and address_match is None:
        stats.conflicts.append(
            f"{slug}: title matches existing place {title_match} but address '{normalized['address']}' does not"
        )
        return

    if id_match is None and address_match is not None and title_key and title_match is None:
        stats.conflicts.append(
            f"{slug}: address matches existing place {address_match} but title '{normalized['title']['en']}' does not"
        )
        return

    target_dir = (next(iter(unique_matches)) if unique_matches else (repo_root / normalized["path"]))
    meta_path = target_dir / META_FILE
    existed = meta_path.exists()

    meta = load_yaml(meta_path)
    changed = False

    if not existed:
        meta = {
            "id": slug,
            "title": normalized["title"],
            "category": normalized["category"],
            "address": normalized["address"],
            "transit": normalized["transit"],
            "cost": normalized["cost"],
            "external_link": normalized["external_link"],
        }
        changed = True
    else:
        changed |= update_if_empty(meta, "id", slug)
        changed |= update_if_empty(meta, "title", normalized["title"])
        changed |= update_if_empty(meta, "category", normalized["category"])
        changed |= update_if_empty(meta, "address", normalized["address"])
        changed |= update_if_empty(meta, "transit", normalized["transit"])
        changed |= update_if_empty(meta, "cost", normalized["cost"])
        changed |= update_if_empty(meta, "external_link", normalized["external_link"])

    en_path = target_dir / EN_FILE
    ru_path = target_dir / RU_FILE
    if not en_path.exists() and normalized["description_en"]:
        changed = True
    if not ru_path.exists() and normalized["description_ru"]:
        changed = True

    if write and changed:
        target_dir.mkdir(parents=True, exist_ok=True)
        meta_path.write_text(dump_yaml(meta), encoding="utf-8")

        incoming_en = normalized["description_en"]
        incoming_ru = normalized["description_ru"]

        if incoming_en and (overwrite_descriptions or not en_path.exists()):
            if overwrite_descriptions or not en_path.read_text(encoding="utf-8").strip() if en_path.exists() else True:
                en_path.write_text(incoming_en + "\n", encoding="utf-8")

        if incoming_ru and (overwrite_descriptions or not ru_path.exists()):
            if overwrite_descriptions or not ru_path.read_text(encoding="utf-8").strip() if ru_path.exists() else True:
                ru_path.write_text(incoming_ru + "\n", encoding="utf-8")

        if not en_path.exists():
            en_path.write_text("", encoding="utf-8")
        if not ru_path.exists():
            ru_path.write_text("", encoding="utf-8")

    reason_suffix = f" (matched by {', '.join(match_reasons)})" if match_reasons else ""
    descriptor = f"{target_dir.relative_to(repo_root)}{reason_suffix}"
    if changed and existed:
        stats.updated.append(descriptor)
    elif changed and not existed:
        stats.created.append(descriptor)
    else:
        stats.skipped.append(descriptor)

    indexes.by_id.setdefault(slug, target_dir)
    if address_key:
        indexes.by_address.setdefault(address_key, target_dir)
    indexes.by_title_norm.setdefault(title_key, target_dir)


def load_batch(batch_file: Path, variable_name: str) -> list[dict[str, Any]]:
    spec = importlib.util.spec_from_file_location("incoming_batch_module", batch_file)
    if spec is None or spec.loader is None:
        raise ValueError(f"Could not load {batch_file}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)

    batch = getattr(module, variable_name, None)
    if not isinstance(batch, list):
        raise ValueError(f"{variable_name} in {batch_file} must be a list")
    if not all(isinstance(item, dict) for item in batch):
        raise ValueError(f"{variable_name} must contain only dictionaries")
    return batch


def print_summary(stats: IngestStats, dry_run: bool) -> None:
    print("=== Ingestion summary ===")
    print(f"Created:  {len(stats.created)}")
    for item in stats.created:
        print(f"  + {item}")

    print(f"Updated:  {len(stats.updated)}")
    for item in stats.updated:
        print(f"  ~ {item}")

    print(f"Skipped:  {len(stats.skipped)}")
    for item in stats.skipped:
        print(f"  = {item}")

    print(f"Conflicts: {len(stats.conflicts)}")
    for item in stats.conflicts:
        print(f"  ! {item}")

    if dry_run:
        print("Dry run complete. Re-run with --write to persist changes.")


def main() -> int:
    args = parse_args()
    repo_root = args.repo_root.resolve()
    places_root = repo_root / "places"

    if not places_root.exists():
        raise SystemExit(f"Missing places directory: {places_root}")

    batch_file = args.batch_file
    if not batch_file.is_absolute():
        batch_file = (repo_root / batch_file).resolve()

    records = load_batch(batch_file, args.batch_var)
    indexes = discover_existing_indexes(places_root)
    stats = IngestStats()

    for record in records:
        try:
            ingest_record(
                record=record,
                repo_root=repo_root,
                indexes=indexes,
                stats=stats,
                overwrite_descriptions=args.overwrite_descriptions,
                write=args.write,
            )
        except IngestConflictError as exc:
            raw_id = record.get("id") or record.get("slug") or record.get("title") or "<unknown>"
            stats.conflicts.append(f"{raw_id}: {exc}")

    print_summary(stats, dry_run=not args.write)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
