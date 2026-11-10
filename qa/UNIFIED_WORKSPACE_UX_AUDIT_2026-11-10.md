# LUMEN Unified Workspace · UX / Visual Audit

Date: 2026-11-10
Branch: `feat/lumen-unified-workspace-ux`
Baseline: merged PR #2 (`f67534e5fcb49da34672538c9a2af85b9544ad88`)
Scope: LUMEN Recall and Histology Atlas. This document is **source-based audit + regression plan**, not a claim of screenshot testing or medical-image certification.

## Product mission and invariants

User: medical students doing rapid bilingual histology term recall and microscopic-structure recognition.
Primary paths: review due terms → answer → feedback → next card; new terms → continue a round; glossary → atlas image evidence → return to original context; atlas section → search → comparison → original image → return.
Guardrails: no loss of answer history, no forced log-in, no fabricated image sourcing, exam scope and existing SRS data unchanged, accessible keyboard navigation, optional motion and reliable offline-first vocabulary exercise. Atlas external images **do** require an internet connection.

## DBS Standard Answer applied

**Structure fingerprint:** one product, two separately implemented modules, shared learning intent, inconsistent interaction shells and navigation cost when crossing modules.

- NN/g: consistency within a product family reduces the need to relearn interface rules (Jakob Nielsen, *10 Usability Heuristics*, 1994/reviewed 2024).
- Material Motion and Apple HIG: animation communicates hierarchy, feedback and origin; frequent actions should avoid gratuitous motion.
- Atlassian Navigation 2024: consolidate global navigation; keep a product-specific tree beneath it. Their 2018 one-size-fits-all approach was an explicit failure boundary.
- NN/g's Windows 8 usability evaluation (2012): two interface paradigms in one environment imposed memory and switching overhead.
- MDN View Transitions: same-origin cross-document navigation can use `@view-transition{navigation:auto}`; not universal; honor reduced motion.

Sources:
- https://www.nngroup.com/articles/ten-usability-heuristics/
- https://www.nngroup.com/articles/windows-8-disappointing-usability/
- https://www.atlassian.com/blog/how-we-build/designing-atlassians-new-navigation
- https://developer.apple.com/design/human-interface-guidelines/motion
- https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API/Using

**Conditional answer:** unify global chrome, language, tokens and interaction grammar, preserve specialist reading and training layouts. This is an engineering and UX hypothesis pending actual usability testing; no claim of measured uplift.

## Six-dimensional audit

| Dimension | Confirmed source-level problem | Severity | Fix in this branch | Further validation |
| --- | --- | --- | --- | --- |
| Information architecture | Atlas had its own top-level sidebar and only a return link to Recall | P0 | Shared global destinations on desktop and mobile, atlas-local directory below | Observe first-use comprehension |
| User flow | Atlas → Recall did not preserve desired destination (review/library/stats/settings) | P0 | Root `?view=` whitelist deep-link and per-view history address | Back navigation and refresh |
| Interaction efficiency | Recall mobile bottom bar lacked Atlas entry | P1 | Six shared destinations across both modules | Small phone tap targets and horizontal overflow |
| Feedback | Switching modules had a hard page change | P1 | Opt-in cross-document transition, fast content fade and native fallback | Chrome/Safari/Firefox actual interaction |
| Visual hierarchy | Two palettes, side widths, headers, nav states and brand treatments | P0 | Shared palette, shell, motion, typography and state styling | 1440/768/390 visual screenshots |
| Component consistency | Excess decorative overlines, pill metrics and generic subtitles | P1 | Task-specific copy and Atlas editorial statistics | Check density vs legibility |

## Page-by-page / flow-by-flow source inspection

| Surface | Issue or risk | Severity | Status / next check |
| --- | --- | --- | --- |
| Recall overview | Multiple header ribbons and stylized motivational phrases obscured actions | P1 | Replaced decorative ribbons with functional labels; screenshot review pending |
| Recall new terms | Mode 01 must not count skipped items as learned | P0 | Existing business logic intentionally unchanged; run existing study tests |
| Recall choice/spelling | Per-item feedback and progress must survive module switch | P0 | During an active session, Atlas opens in a new tab; verify persistence manually |
| Recall due review | Due-only filtering and exemption from completion dialog | P0 | Existing business logic intentionally unchanged; regression needed |
| Recall glossary | Term → atlas query should remain navigable by keyword | P1 | Deep-link existing; manual term-matching audit pending |
| Recall stats | Repeated slogans / ambiguous data labels | P2 | Task-specific `作答统计 / 学习记录`; verify accuracy from real progress state |
| Recall settings | Theme/backup controls had cross-module state expectations | P1 | Shared theme key; local data text clarified; import/export regression needed |
| Atlas overview | Two separate visual shells created immediate brand context loss | P0 | Shared global nav, logo, tokens and mobile tabs |
| Atlas group/section | Specialist directory still needs hierarchical depth | P1 | Preserved local directory with global nav above; no bulk flattening |
| Atlas search | Search state and focus need an exit / stable context | P1 | Existing search state logic retained; live keyboard test pending |
| Atlas compare | Native details disclosure must remain keyboard operable | P1 | Existing native disclosure retained; contrast/focus rules updated |
| Atlas image view | External image can fail; source link must remain available | P1 | Existing fallback/source link retained; external URL audit pending |
| Global light/dark | Theme could flash between separate documents | P1 | Early Atlas theme application and shared semantic palette |
| Desktop/tablet/mobile | Mobile 6-item navigation and atlas drawer can interfere with touch | P1 | Responsive shared tabs; physical viewport and keyboard testing pending |
| Reduced motion | Cross-page and in-page effects could violate preferences | P1 | Disabled motion under `prefers-reduced-motion`; manual emulation pending |

## Implemented changes

- `assets/lumen-unified.css` — shared global interface and motion system, no external font/CDN dependency.
- `index.html` — shared stylesheet, URL-based root workspace deep links, six-item mobile nav including Atlas, copy cleanup.
- `atlas/index.html` — shared brand, desktop/mobile global navigation, contextual breadcrumbs, early theme.
- `atlas/atlas.js` — reader-level transitions with fallback, true-to-task copy; original JSON/image library untouched.

## Acceptance gates

1. Node parse succeeds on both Recall inline script and Atlas script.
2. Shared CSS is linked by both documents; 6 global destinations are accessible.
3. Browse Recall → Atlas → Review → Atlas → Glossary → Overview, using Back and refresh.
4. Both light and dark themes match across each journey and a second tab.
5. Keyboard: Tab focus, Enter for nav, Escape for image modal/drawer, logical heading focus after navigation.
6. `prefers-reduced-motion:reduce` turns off animations, still communicates state.
7. Viewports: 1440×900, 768×1024, 390×844 and narrow 320px; no clipping, no text collision.
8. Retest SRS/new/due/skip/finish, backups, term filters, Atlas 182 sections and 45 comparisons, image credits and all original links.
9. Actual screenshot comparison and usability walkthrough required before readiness for merge.

## Remaining work — do not mislabel as verified

- **P1:** Validate 73 external image URLs and original conversation image links against real browsers and link expiration.
- **P1:** Medical expert review of images, labelled structures, source attribution and diagnostic distinctions; audit records do not certify scientific correctness.
- **P1:** Browser QA, keyboard and focus tests, screen-reader inspection, low-end motion performance.
- **P2:** Observe a first-time learner find a gland slice and complete an 8-question training round without coaching. Note hesitations, wrong routes, time and errors.
- **P2:** Clean up local Atlas CSS overrides when a larger refactor is separately authorized. Avoid a risky full rewrite in this patch.

## Release policy

No automatic merge or GitHub Pages deployment. Review branch changes, run the acceptance gates, confirm risk of public release, then merge and monitor deployment. Rollback by reverting the PR merge on main; local user data is not migrated or deleted by this patch.
