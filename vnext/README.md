# LUMEN VNext · Shared learning workspace

A non-destructive preview at `/vnext/`. It is intentionally **not** a production replacement for `/`.

## Problem verified in source

The legacy workspace, atlas and image quiz render different document shells, nav bars and mobile tabs. Links in the image quiz include `target="_blank"`. CSS-only page transition effects cannot make separate documents behave as one continuous application.

## Architecture — compatibility stage A

- `vnext/index.html`: one persistent global rail, top bar, module tabs, mobile navigation and browser route.
- `vnext/workspace.js`: route registry, History API navigation, keyboard/touch scene interaction, persistent same-origin module adapters and theme synchronization.
- `vnext/workspace.css`: shared visual tokens, responsive chrome and 2.5D histology sculpture.
- Original engines are loaded unchanged inside same-origin embedded module adapters. Their duplicate top/global navigation is hidden and cross-module anchors are intercepted by the parent shell, so switching no longer opens a new window and previously loaded modules retain their in-memory state.
- The existing `localStorage` keys are unmodified. No data migrations, regrading, question exclusions or file moves occur.
- Legacy URLs remain available as compatibility fallbacks.

**Engineering honesty:** Stage A is a shared SPA shell with cached legacy islands, **not** the final single JavaScript runtime. An iframe still separates each engine internally. That buys a safer continuous UX and preserves every specialized module while the core is refactored; pretending this is already a full native merger would be misleading.

## Stage B — planned native migration

1. Extract the 1.4 MB glossary payload from `index.html` into versioned data files. Split the main application into route view, domain, storage and UI modules.
2. Convert Atlas and Quiz to `mount(container, context)` / `unmount()` ES modules under a shared DOM shell. Remove duplicate nav and iframe adapters only after feature equivalence tests pass.
3. Share a context contract for theme, route, focus, keyboard, academic source attribution and progress status. **Keep the grading and three storage domains separate unless a migration is explicitly approved.**
4. Preserve paths and deep links using redirect or History API routing, with a tested backup-and-rollback plan.

## 2.5D visual study — anatomy of recognition

Inspired by Linear's stable shell and Rive's state-driven movement: the microscopy "slice stack" uses perspective, distinct tissue planes, a nucleus and spring-smoothed pointer tilt. The interaction has a legible causal story: collapsed "specimen" → click → separate planes and inspect three labeled processes → click again to reassemble. It is a bespoke CSS/JS illustration, not another vendor's copied 3D asset.

- Main CTA leads to the image quiz, secondary CTA to the atlas.
- Click, touch, keyboard Enter/Space work; reduced-motion preference disables transitions.
- The scene is a progressive enhancement, not a dependency for studying.
- No new JavaScript packages or remote runtime are installed.

## Test acceptance

`node qa/browser-vnext.mjs` joins the existing Chromium workflow for 1440 / 768 / 390 / 320 px. It verifies route continuity, module data loading, browser history, theme sync, source image quiz count and interactive hero states. The original site's existing regressions still execute.

## Release gate

Do **not** replace the production homepage or redirect existing deep links yet. Study progress and images are educational assets: breaking a previously saved session or deep link would be unacceptable. Require user review of the preview, actual screenshots, all CI passes, and a staged native module migration before making this the default.
