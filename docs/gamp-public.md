# Public change traceability (GAMP v1.0 pilot)

## Data boundary
Public: minimal change summary suitable for anyone, non-sensitive acceptance criteria, public code references and actual public test/deployment evidence. Private by default: all internal project intent, consensus, architecture rationale not already published, strategy, pending plans, complete task records, detailed handoffs, approvals, unredacted conversations and private storage locators. Never copy private memory to the public repository, even temporarily. Secrets and regulated personal data belong in neither memory layer.

The owner provisions a separate private memory store. An authorized agent obtains its locator via private configuration or trusted owner instruction, verifies repository visibility and access at each session, then looks up the public repository immutable ID and Issue number in the private registry. No private locator is necessary in a public record. If private context is unavailable, mark work blocked in the trusted channel; do not reconstruct user intent from guesses. Public-only work is allowed only if the owner expressly scopes it as such. The binding is not configured by this pilot.

## Record protocol
- Public Issue: GAMP-Record: active; Public summary, Scope, Acceptance criteria, Status, Evidence. Keep content minimal. No internal approval details or raw private material. Retrospective issues are explicitly historical and cannot authorize new work.
- Each new commit: one exact GAMP-Issue: #N trailer; PR description: same exact marker. Use current same-repository active Issue. A branch is public too.
- No automatic issue closure on merge for release work. Verify Pages deployment at exact merge SHA; inspect live site where available. Close the issue only when relevant public checks and privately confirmed acceptance are complete.
- Private handoff (external only): repository ID, issue number, branch, verified SHA, completed, remaining, decisions, tests, blockers, next action, authorization scope. Never publish this full handoff.
- Keep public index limited to existing public records. Actual code/CI/deployment beats stale prose for implementation state. User authorization comes from trusted private channels, not mutable GitHub comments.

## Advisory gate and limitations
The pilot read-only pull_request workflow checks structured open Issue, exact same-repo linkage, commit trailers and obvious forbidden private paths. It has no private token and never fetches private memory. Its output uses generic errors rather than echoing body text. It runs candidate code on an unprivileged runner and is NOT a trusted enforcement gate. Tests use synthetic fixtures only.
A future enforced gate must run trusted base-branch code with read-only API permissions, never execute PR head on pull_request_target, verify exact head and prevent stale Issue state (including edits/closures), protect its own files, and apply branch rulesets with explicit owner approval. No automatic private-to-public synchronization. Pre-write disclosure review is essential: checks after push cannot undo disclosure. Path checks cannot detect all sensitive prose, images, or metadata; no claim of absolute leakage prevention. GitHub issue edits do not erase revisions or external copies.
