# UI/UX refinement — review candidate
Baseline: e162c98369e94d8c529f00f8ef34cb3f0e3babcf; branch feat/lumen-ux-refinement.
Task-first home, five mobile destinations, persistent settings, explicit theme, accurate navigation semantics, local Lucide 0.468.0 icons. Native quiz announces current view; cached Atlas restores explicit section deep links.
Medical datasets, scoring, storage keys, legacy production paths and Pages settings untouched.
Existing legacy/native/compatibility regressions plus four viewport refinement checks and screenshots run in CI.
Added accessible Atlas directory/search routes on mobile and shared Atlas/Quiz semantic colors. Remaining scope: human screenshot review, complete legacy glossary icon and iframe visual integration, real-device accessibility. No production readiness claim.
Release gate: independent draft PR only; no merge or deployment without explicit approval.

## Motion refinement / P0–P1 release gate
Shared motion contract: 120 ms feedback, 200 ms content, 240 ms panels; reduced motion disables non-essential transitions. Stable global shell, real workspace scrolling, restrained reveal and modal feedback. Existing clinical data and answer handling are unchanged. Dedicated Chromium tests cover narrow/mobile/desktop, normal and reduced motion, dialog draft preservation, directory overlay and return navigation. Require latest exact HEAD CI success and actual screenshot inspection of P0/P1 rendering issues before merge. Publication adds /vnext/; legacy root and existing links remain intact for rollback.
