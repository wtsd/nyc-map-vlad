# Architecture overview

## High-level

This project is a **static site**:
- content is stored as files under `places/`
- build scripts generate JSON artifacts under `build/`
- frontend JS renders list/map from generated JSON
- GitHub Pages serves the built static assets

There is no backend service.

---

## Source content layer

Source of truth is file-based:

```text
places/<category>/<slug>/
  meta.yml
  en.md
  ru.md
  cover.jpg (optional)
```

Build scripts read this structure directly.

---

## Build layer

Main entry point: `scripts/build.py`.

Responsibilities:
- validates metadata (`id`, `coords`, `category`, etc.)
- prevents duplicate IDs
- compiles place payloads from YAML + markdown
- generates search index
- optionally generates thumbnails (`build/thumbs/*.webp`)
- writes cache-oriented manifest and hashed JSON copies
- updates asset version query params in HTML

Main outputs:
- `build/places.json`
- `build/search-index.json`
- `build/manifest.json`
- hashed variants (`build/places.<hash>.json`, `build/search-index.<hash>.json`)

---

## Frontend layer

### Entry points
- `index.html` — list + filters + map UI
- `place.html` — place details view

### JS modules (main app page)
- `assets/js/state.js` — in-memory app state + localStorage-backed language/checklist
- `assets/js/filters.js` — category/search/status/personal filtering logic
- `assets/js/list-view.js` — cards rendering, stats, pagination, copy actions
- `assets/js/map.js` — Leaflet map, marker clustering, legend, viewport fitting
- `assets/js/ui-shell.js` — responsive shell, mobile filters panel, focus management
- `assets/js/url-state.js` — URL query sync for filters
- `assets/js/data-loader.js` / `data-bootstrap.js` — manifest-aware data loading + service worker registration
- `assets/js/common.js` / `ui-text.js` — shared helpers and UI dictionaries
- `assets/js/app.js` — app bootstrapping + global action wiring

### Mapping stack
- Leaflet base map
- `leaflet.markercluster` for clustered markers
- category-colored circle markers

---

## Deployment layer

GitHub Actions workflow `.github/workflows/build.yml`:
1. install Python deps
2. run `python scripts/build.py`
3. upload repository as Pages artifact
4. deploy to GitHub Pages

Because assets are static and build artifacts are committed/generated in-repo, GitHub Pages can serve the app directly.
