# NYC Map (Katya & Vlad)

Interactive static NYC map + place shortlist, published on GitHub Pages.

This repo is intentionally simple:
- **File-based content** in `places/<category>/<slug>/`
- **Python build scripts** that compile content into static JSON
- **Vanilla JS + Leaflet frontend** served as static files

If you are new, start with:
1. `docs/workflows.md` (how to add/edit data)
2. `docs/data.md` (what goes into `meta.yml`)
3. `docs/architecture.md` (how frontend and build fit together)

---

## What this project is

The app helps track and share NYC places:
- Map view with marker clustering
- Filterable list view
- EN/RU content support
- Local checklist state (want / skip / visited)
- Static hosting on GitHub Pages (no backend)

---

## Repository layout

```text
assets/
  css/styles.css
  js/
    app.js
    state.js
    filters.js
    list-view.js
    map.js
    ui-shell.js
    data-loader.js
    data-bootstrap.js
    common.js
    ui-text.js
    url-state.js

places/
  <category>/
    <slug>/
      meta.yml
      en.md
      ru.md
      cover.jpg   # optional

scripts/
  build.py
  ingest_places_batch.py
  update_missing_location_data.py
  generate_statistics.py
  archive_closed_places.py
  ...

build/              # generated artifacts
index.html
place.html
sw.js
```

---

## Run locally

From repo root:

```bash
python -m pip install pyyaml pillow
python scripts/build.py
python -m http.server 8000
```

Then open:
- `http://localhost:8000/` (main list/map)
- `http://localhost:8000/place.html?id=<slug>` (single place page)

Why run `build.py` first: frontend reads `build/places.json` and `build/search-index.json`.

---

## Data model (source of truth)

Each place lives in:

```text
places/<category>/<slug>/
  meta.yml
  en.md
  ru.md
  cover.jpg (optional)
```

`meta.yml` commonly includes:
- `id` (must match folder slug)
- `title` (`en`, `ru`)
- `coords.lat`, `coords.lng`
- `category` (list, usually one value)
- `address`
- `personal` (e.g. `to-do`, `visited`, `want-to-go`)
- `price`
- `external_link`

See `docs/data.md` for exact field guidance.

---

## Adding a new place

Quick path:

1. Create `places/<category>/<slug>/`
2. Add `meta.yml`, `en.md`, `ru.md` (optional), `cover.jpg` (optional)
3. Run:
   ```bash
   python scripts/build.py
   ```
4. Start local server and verify map/list rendering
5. Commit

Detailed steps + ingestion flow are in `docs/workflows.md`.

---

## Build pipeline

### Primary build

`python scripts/build.py`:
- scans all `places/**/meta.yml`
- validates required metadata
- reads markdown summaries (`en.md`, `ru.md`)
- generates:
  - `build/places.json`
  - `build/search-index.json`
  - hashed JSON copies for cache busting
  - `build/manifest.json`
  - thumbnails in `build/thumbs/` (if Pillow is available)
- stamps version query params in `index.html` and `place.html`

### Ingestion and maintenance scripts

- `scripts/ingest_places_batch.py` — batch ingest/update from Katya files
- `scripts/update_missing_location_data.py` — fill missing coords/address via Nominatim
- `scripts/generate_statistics.py` — category/personal stats
- `scripts/archive_closed_places.py` — detect/archive closed places

---

## Deployment

GitHub Pages deployment is handled by **GitHub Actions** (`.github/workflows/build.yml`):
1. Checkout repo
2. Install Python deps
3. Run `python scripts/build.py`
4. Upload static artifact
5. Deploy to Pages

App URL:
- https://wtsd.github.io/nyc-map-vlad/

No runtime server is required; everything is static.

---

## Common pitfalls

- **ID mismatch:** `meta.yml:id` must equal folder slug.
- **Wrong structure:** place path must be `places/<category>/<slug>/...` (not flat `places/<slug>`).
- **Invalid coords:** map silently excludes invalid or zero coordinates.
- **Forgot build:** content changes won’t appear in UI until `scripts/build.py` regenerates JSON.
- **Category confusion:** category should be a list in YAML (e.g. `category: [food]`).

For troubleshooting workflows, see `docs/workflows.md`.
