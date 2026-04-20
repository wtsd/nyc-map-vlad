# Data model

## Place directory contract

Each place must live under:

```text
places/<category>/<slug>/
```

Expected files:
- `meta.yml` (required)
- `en.md` (recommended)
- `ru.md` (recommended, fallback logic exists)
- `cover.jpg` (optional)

`<slug>` should match `meta.yml:id`.

---

## `meta.yml` fields

## Required by build validation

- `id`: string
- `title`: string or localized object (`{ en, ru }`)
- `coords`: object with numeric `lat`, `lng`
- `category`: string or list of strings
- `personal`: enum (`to-do`, `visited`, `want-to-go`, `been-not-impressed`, `highly-recommend`, `highly-recommended`, or empty)
- `address`: string or localized object

If required fields are missing/invalid, `scripts/build.py` fails.

## Common optional fields

- `price` (typically `$$` style in current content)
- `external_link`
- any extra custom fields used by maintenance/experiments

---

## Minimal example

```yaml
id: rockefeller-center
title:
  en: Rockefeller Center
  ru: Рокфеллер-центр
coords:
  lat: 40.7587
  lng: -73.9787
category:
  - landmarks
address: 45 Rockefeller Plaza, New York, NY 10111
personal: to-do
price: $$
external_link: ""
```

---

## Markdown content

- `en.md` and `ru.md` are short summaries displayed in cards/details.
- If `ru.md` is empty/missing, build falls back to EN summary for RU display.

---

## Image handling

- `cover.jpg` is optional.
- If valid image exists and Pillow is installed, build creates thumbnail webp in `build/thumbs/`.
- Invalid/empty images are skipped with warnings.

---

## Route key in build output

Build derives a route-like key from category + id:
- `<primary-category>/<id>`

This is emitted in `build/places.json` as `route`.
