---
applyTo: ".github/workflows/content-accuracy-audit.md,.github/workflows/content-accuracy-audit.lock.yml,.github/aw/actions-lock.json"
---

# Content accuracy workflow

- Edit `.github/workflows/content-accuracy-audit.md`, not its generated `.lock.yml`.
- After workflow changes, run `gh aw compile content-accuracy-audit`, then
  `gh aw compile content-accuracy-audit --no-emit --strict`. Commit both workflow
  files and any compiler changes to `.github/aw/actions-lock.json`.
- Preserve the workflow's deployed-content boundary, official GitHub documentation
  evidence, correction-only scope, and draft-PR safeguards. Keep detailed audit
  rules in the workflow rather than duplicating them here.
