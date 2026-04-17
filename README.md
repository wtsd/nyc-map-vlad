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

1. Create folder in `places/your-place-id/`
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

- `places/` → source content
- `scripts/build.py` → build script
- `build/places.json` → generated data
- `assets/` → frontend
