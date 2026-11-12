# Copilot instructions

- When changing an agentic workflow source in `.github/workflows/*.md`, run
  `gh aw compile <workflow>` and `gh aw compile <workflow> --no-emit --strict`.
  Commit the source, generated `.lock.yml`, and any resulting
  `.github/aw/actions-lock.json` changes.
