# NYC Map by Vlad

A personal interactive map and checklist of NYC places for friends and family.

## Features

- Interactive map (Leaflet)
- Sidebar-first design
- Personal notes per place
- English / Russian
- Checklist (localStorage)
- Copy/export for Messenger
- GitHub Pages hosting

## Editing content

Add a new place:

1. Create folder in `places/<category>/your-place-id/`
2. Add:
   - `meta.yml`
   - `en.md`
   - `ru.md` (optional)
   - `cover.jpg` (optional)

3. Commit → GitHub Actions builds automatically

## Deployment

Deployed automatically via GitHub Actions to:

https://wtsd.github.io/nyc-map-vlad/

## Structure

- `places/<category>/<place-id>/` → source content
- `scripts/build.py` → build script
- `build/places.json` → generated data
- `assets/` → frontend


## Maintenance scripts

Run from repository root.

- Fill missing `coords` and `address` (Nominatim, dry-run by default):
  - `python scripts/update_missing_location_data.py .`
  - `python scripts/update_missing_location_data.py . --write`
- Detect potentially closed places and move them to `archive` category (OpenStreetMap tags, dry-run by default):
  - `python scripts/archive_closed_places.py .`
  - `python scripts/archive_closed_places.py . --write`
- Generate category + personal statistics:
  - `python scripts/generate_statistics.py .`

A scheduled GitHub Actions workflow is available at `.github/workflows/maintenance.yml`.
