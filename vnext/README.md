# LUMEN VNext · Shared learning workspace

A non-destructive preview at `/vnext/`. It is intentionally **not** a production replacement for `/`.

## Problem verified in source

The legacy workspace, atlas and image quiz render different document shells, nav bars and mobile tabs. Links in the image quiz include `target="_blank"`. CSS-only page transition effects cannot make separate documents behave as one continuous application.

## Architecture — native modules with compatibility fallback

- `vnext/index.html`: one persistent global rail, top bar, module tabs, mobile navigation and browser route.
- `vnext/workspace.js`: route registry, History API navigation, keyboard/touch scene interaction, persistent same-origin module adapters and theme synchronization.
- `vnext/workspace.css`: shared visual tokens, responsive chrome and 2.5D histology sculpture.
- VNext now opens **Atlas** and **Image Quiz** as native Shadow DOM components by default, directly mounted into the persistent workspace without a separate document or duplicate global navigation. They retain their original content, domain logic and storage keys.
- The terminology engine is still cached inside a same-origin legacy iframe while its 1.4 MB bundle is decomposed. All modules share a single browser tab, URL/History API, app header and navigation.
- `?compat=1` enables the original iframe compatibility mode for all three modules; this remains tested and is an automatic fallback if native startup fails.
- The existing `localStorage` keys are unmodified. No data migrations, regrading, question exclusions or file moves occur.
- Legacy URLs remain available as compatibility fallbacks.

**Engineering honesty:** Atlas and Image Quiz are now native Shadow DOM modules in VNext; the glossary is not yet native. This is progressive integration with a single app shell, not yet a finished clean-domain ES-module architecture. No data migration or regrading is implied.

## Next migration — modular glossary and shared service contracts

1. Extract the 1.4 MB glossary payload from `index.html` into versioned data files. Split the main application into route view, domain, storage and UI modules.
2. Complete the native adapters' lifecycle and isolate their global listeners, then replace transitional wrappers with small importable controllers and scoped components.
3. Share a context contract for theme, route, focus, keyboard, academic source attribution and progress status. **Keep the grading and three storage domains separate unless a migration is explicitly approved.**
4. Preserve paths and deep links using redirect or History API routing, with a tested backup-and-rollback plan.

## 2.5D visual study — anatomy of recognition

Inspired by Linear's stable shell and Rive's state-driven movement: the microscopy "slice stack" uses perspective, distinct tissue planes, a nucleus and spring-smoothed pointer tilt. The interaction has a legible causal story: collapsed "specimen" → click → separate planes and inspect three labeled processes → click again to reassemble. It is a bespoke CSS/JS illustration, not another vendor's copied 3D asset.

- Main CTA leads to the image quiz, secondary CTA to the atlas.
- Click, touch, keyboard Enter/Space work; reduced-motion preference disables transitions.
- The scene is a progressive enhancement, not a dependency for studying.
- No new JavaScript packages or remote runtime are installed.

## Test acceptance

`node qa/browser-vnext.mjs` validates the `?compat=1` fallback on 1440 / 768 / 390 / 320 px. `node qa/browser-vnext-native.mjs` and `node qa/browser-vnext-atlas.mjs` validate native modules by default at 1440 / 390 px, including image decoding, section deep links, training continuity, theme and browser history. The original regressions still execute.

## Release gate

Do **not** replace the production homepage or redirect existing deep links yet. Study progress and images are educational assets: breaking a previously saved session or deep link would be unacceptable. Require user review of the preview, actual screenshots, all CI passes, and a staged native module migration before making this the default.
