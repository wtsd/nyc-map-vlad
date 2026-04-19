# Route enrichment scripts for nyc-map-vlad

These scripts add route-friendly metadata to `places/*/meta.yml` without changing your existing frontend contract.

## Included

- `scripts/enrich_meta.py`
  - infers `borough`
  - infers `neighborhood`
  - adds `route_types`
  - adds `best_time`
  - adds `vibes`
  - adds `best_for`
- `scripts/audit_places.py`
  - checks missing required fields
  - checks missing route fields
  - reports missing `ru.md` and `cover.jpg`
- `scripts/build_route_catalog.py`
  - builds one JSON file for route generation and filtering

## Suggested workflow

```bash
python scripts/audit_places.py /path/to/nyc-map-vlad
python scripts/enrich_meta.py /path/to/nyc-map-vlad --write --backup
python scripts/build_route_catalog.py /path/to/nyc-map-vlad --output /path/to/nyc-map-vlad/build/route_catalog.json
```

## Notes

- The neighborhood assignment uses curated NYC centers and radii. It is intentionally simple and easy to edit.
- The route classification uses existing `category`, title words, and summary text.
- Existing manual values are preserved and merged.
