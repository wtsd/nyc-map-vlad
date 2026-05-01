# Workflows

## Local development loop

```bash
python -m pip install pyyaml pillow
python scripts/build.py
python -m http.server 8000
```

Open `http://localhost:8000/`.

When content changes, re-run `python scripts/build.py`.

---

## Adding a new place

### Manual path (most explicit)

1. Pick category + slug.
2. Create folder:
   `places/<category>/<slug>/`
3. Add `meta.yml` with required fields.
4. Add `en.md` and `ru.md`.
5. Optionally add `cover.jpg`.
6. Run build and verify card + map pin.

### Checklist before commit

- slug equals `meta.yml:id`
- coords are valid NYC coords
- category is correct
- address is filled
- build passes with no validation errors

---

## Ingestion workflow (Katya batches)

Batch ingestion is handled by:
- `scripts/ingest_places_batch.py`
- template: `scripts/katya_batch_template.py`

### Typical flow

1. Copy template to dated file:
   `scripts/katya_batch_YYYY_MM_DD.py`
2. Fill `INCOMING_PLACES = [...]`
3. Dry run:
   ```bash
   python scripts/ingest_places_batch.py . --batch-file scripts/katya_batch_YYYY_MM_DD.py
   ```
4. Review created/updated/skipped/conflicts summary.
5. Persist changes:
   ```bash
   python scripts/ingest_places_batch.py . --batch-file scripts/katya_batch_YYYY_MM_DD.py --write
   ```
6. Rebuild:
   ```bash
   python scripts/build.py
   ```

Notes:
- ingestion updates only empty metadata fields by default
- descriptions are not overwritten unless `--overwrite-descriptions` is provided
- duplicate detection uses ID + address + normalized title

---

## Fixing coordinates

Primary helper:

```bash
python scripts/update_missing_location_data.py .
```

This is dry-run mode by default. To write changes:

```bash
python scripts/update_missing_location_data.py . --write
```

How it works:
- fills missing coords via Nominatim search
- fills missing address via reverse geocoding when coords exist
- sleeps between requests to be API-friendly

After updates:

```bash
python scripts/build.py
```

---

## Map behavior and filtering logic

### Filtering pipeline

Filters are combined in `assets/js/filters.js`:
- category filter (checkboxes)
- text search (uses prebuilt search index)
- personal filter (`to-do` / `visited`)
- status filter from local checklist (`want` / `skip` / `visited`)

Visible cards and map markers are both driven by this filtered dataset.

### Map rendering behavior

Implemented in `assets/js/map.js`:
- only places with valid coords are rendered on the map
- invalid/zero coords are excluded and surfaced via legend note
- markers are clustered
- map auto-fits bounds on first render and when map tab becomes visible on mobile
- legend can toggle category filters directly

---

## Common pitfalls

- **Flat folder structure:** use `places/<category>/<slug>/`, not `places/<slug>/`.
- **Wrong ID:** `meta.yml:id` must match folder slug exactly.
- **Bad coords type:** lat/lng must be numeric.
- **Forgot to rebuild:** frontend reads generated JSON, not raw markdown/YAML.
- **Unexpected ingestion overwrite behavior:** descriptions are protected unless `--overwrite-descriptions` is used.
- **Category mismatch:** category chip labels in UI are hardcoded in HTML; new categories require UI updates in `index.html` and labels in `common.js`/`ui-text.js`.

### GitHub manual Add Place workflow

Run the **Add Place** workflow from GitHub Actions using **Run workflow** (workflow_dispatch). It collects inputs and opens a PR with new place files after build validation.

If your repo has **Settings → Actions → General → Workflow permissions → Allow GitHub Actions to create and approve pull requests** disabled, set a `PR_CREATOR_TOKEN` secret (PAT with repo access). The workflow will use that token to create the PR without requiring approval automation.
