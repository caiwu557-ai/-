# Learning V7 adversarial audit

- Remove redundant learning subnavigation; two entry cards, three explicit modes before starting a new round.
- Fresh pool excludes history across modes and courses; 35 explicit synonym clusters share progress, with different concepts (arteriole/small artery, acidophil/oxyphil, etc.) kept separate. Source data and IDs unchanged.
- Review draws globally from actual historical concepts, only when due, oldest first, with per-card prior actual mode and scope; legacy events used when mode missing, recognition fallback when unavailable. Fixed card profile is persisted in round snapshot. No guarantee of human memory retention.
- Wrong: 5 min; hinted success: 10 min without streak growth; independent success: 10 min, 1 d, 3 d, adaptive 7–90 d. Review batches unique; skip is not learning and is deprioritized next batch. Snapshot records submission token to recover interrupted grading. Old backups keep schema 1.
- Distractors rank with stable computed scores and disallow synonymous or Chinese-equivalent options; expand pool if needed. Avoid held Enter auto-repeat.
- Limitations: legacy records whose mode aged out of the event log default to recognition; multi-tab simultaneous conflicting writes are not yet a transactional synchronization service. Word meaning/alias clusters are intentionally conservative, not full semantic deduplication. Real browser CI and screenshot inspection still required.

- Unique-concept statistics, original question-scope distractor ranking, and idle review/home due-queue refresh every 15 seconds; no active question rerender.
