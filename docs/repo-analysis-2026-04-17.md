# NYC Map Repo Analysis (2026-04-17)

## High-priority improvements

1. **Fix unresolved merge conflict markers in `index.html`.**
   - The file currently includes `<<<<<<<`, `=======`, and `>>>>>>>` blocks in the topbar section, which can break rendering and script expectations.
   - Recommendation: resolve the conflict and keep one consistent header structure.

2. **Add CI validation for HTML conflict markers and build integrity.**
   - Right now, issues like conflict markers can be committed unnoticed.
   - Recommendation: in GitHub Actions, add checks that fail on conflict markers and run a build+smoke test (e.g., ensure `build/places.json` is generated and valid JSON).

3. **Harden client-side rendering against content injection.**
   - Place content is inserted via `innerHTML` in multiple templates.
   - Recommendation: render user/content fields with `textContent` where possible, or sanitize values before interpolation.

## Medium-priority improvements

4. **Consolidate duplicated i18n/status/category logic between `app.js` and `place.js`.**
   - There is duplicated label and status logic in both files.
   - Recommendation: move shared helpers into a single `assets/js/common.js` module to reduce drift.

5. **Add robust error handling for async/browser APIs.**
   - `fetch("build/places.json")` and `navigator.clipboard.writeText(...)` are called without fallback UX.
   - Recommendation: show a user-visible error/toast when data loading or copy operations fail.

6. **Normalize and validate source data in `scripts/build.py`.**
   - Build order depends on `os.listdir` (non-deterministic across environments), and metadata fields are not schema-validated.
   - Recommendation: sort place directories, validate required keys, and surface friendly build errors for malformed YAML.

7. **Remove duplicate CSS media-query blocks.**
   - `styles.css` repeats some breakpoints/rules, which increases maintenance cost.
   - Recommendation: deduplicate and keep one source for each breakpoint.

## Lower-priority / quality improvements

8. **Improve accessibility.**
   - Recommendation: include clearer focus styles, verify color contrast, and add ARIA labels to icon/action-only controls where needed.

9. **Document local development workflow.**
   - README describes content editing and deployment but not local preview/build checks.
   - Recommendation: add a “Run locally” section (build command + simple static serve command).

10. **Add automated tests/linting.**
   - Recommendation: add minimal tests for build script and JSON structure, plus linting for JS/CSS/HTML.

## Suggested execution order

1. Resolve merge conflict in `index.html`.
2. Add CI guardrails (conflict marker check + build validation).
3. Refactor shared frontend helpers.
4. Harden rendering + error handling.
5. Refine build script validation and deterministic output.
6. Clean CSS + add accessibility and docs improvements.
