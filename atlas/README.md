# LUMEN · 组织切片图谱 (Histology Atlas)

This is a proposed GitHub Pages module integrated with LUMEN's existing terminology training. It adds `/atlas/` without changing existing quiz, SRS, learner history or glossary IDs.

- `atlas/index.html`, `atlas/atlas.css`, `atlas/atlas.js`: atlas reader with the shared LUMEN navy/violet visual language
- `atlas/data/manual.json`: organ/system subsections, original instructional prose, 45 G01–G45 comparison groups and 118 conversation-image URLs
- `atlas/data/image-map.json`: scoped mapping from tissue/organ label to media and image provenance
- `atlas/data/term-image-links.json`: per-term section bindings
- `atlas/images/*.webp`: source image resources where locally available
- `qa/validate-atlas.mjs`: dataset and image-path validation

The root entry is an additive link in the desktop sidebar, topbar and home dashboard. Original `lumen_histology_recall_v1` browser study history is left untouched.

**Publication review:** Third-party teaching micrographs are stored in this public repository only under the user's explicit authorization and with provenance retained. This does not establish redistribution rights; audit licenses before merging. Linked external imagery may be unavailable at runtime. 27 placements are representative examples, not validated single-cell annotations.

**Deployment:** This branch is a proposal. No Pages deployment is intended until PR review and explicit merge approval.

Validation:
```bash
node qa/validate-atlas.mjs
node qa/validate-terminology.mjs
node qa/validate-learning-flow.mjs
node qa/validate-round-prompt.mjs
```
