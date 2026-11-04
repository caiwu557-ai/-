# LUMEN · Histology Recall Lab (v2.0)

An offline-first Chinese/English histology terminology study web app. 1,269 deduplicated base entries plus 14 classroom-photo entries at runtime (1,283 cards total). Multiple-choice exercises, letter-by-letter English spelling, chapter filtering, local SRS practice and exportable progress.

## Open
- Open `index.html` directly in Chrome/Edge/Safari. The entire app and word data are embedded in this file.
- When GitHub Pages is explicitly enabled for this repository, `index.html` is the static site entrypoint.
- No API keys, analytics, external fonts, external images or CDN requests are required for the app.
- Progress is saved to the browser's **localStorage**; it is not synced across devices.

## Editable source and QA
The current repository contains a single-file app (`index.html`) and this README; the standalone source-project folder referenced in earlier drafts is not present here. The embedded `window.LUMEN_DATA` glossary is the vocabulary source in this published bundle.

Terminology audit: `qa/TERMINOLOGY_AUDIT_2026-11-04.md` (verified fixes, source references, and unresolved ambiguities). Run `node qa/validate-terminology.mjs` after vocabulary edits to check vocabulary integrity and targeted regressions. The checker does not constitute independent academic validation of all entries.

## Study progression and term eligibility
- **01 · 新词学习** takes only never-answered terms from the current scope, so overdue items cannot block moving forward. Completing a round offers **继续学新词** (another unseen batch) and **巩固已学** (previously attempted cards) separately.
- **04 · 到期复习** remains an SRS due-only path. Each round has 8–30 items, but daily learning has no hard cap.
- A curated set of **48 generic/foundational terms** and **6 context-dependent isolated words** is omitted from automatic independent drills by default. The complete glossary remains searchable and individual cards remain manually practiceable. Favorites and the **基础词独立训练** preference can include these in automatic sessions; 172 exam-focus entries are protected from automatic omission.
- Terms are not deleted or declared academically invalid. See `qa/TERMINOLOGY_CLASSIFICATION_2026-11-04.md` for all 54 entries, rationale, exceptions and reversibility.

### Quality checks
Run both checks (Node.js ≥18, no extra packages):
```bash
node qa/validate-terminology.mjs
node qa/validate-learning-flow.mjs
```
These checks protect card identity, spelling corrections, exam coverage, fresh-word progression and safe overrides; they do **not** certify the scientific validity of every glossary entry.

## Source traceability
This study app includes terminology derived from the user's R10 histology source material and 14 chapter glossary files. Its study scope is not teacher-certified.

## Public-repository warning
This repository was **public** when audited on 2026-11-04, and its GitHub Pages site was accessible. Assume that all bundled terminology and application code can be viewed by anyone. Do not add nonpublic course documents, personal data, API keys or private annotations to the published bundle.

## Deploy via GitHub Pages
The site is currently published from this repository. Merge tested changes to the Pages source branch after review, then confirm the live site reflects the new commit. An audit branch alone does **not** update the live site.

The terminology audit makes no changes to repository visibility, access controls, or deployment settings.
