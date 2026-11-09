# Glassbox

Glassbox is a static Astro wiki of interactive diagrams that open up cloud, AI, and developer tooling to show how the parts fit together. Each topic is a short MDX page paired with focused diagram islands.

## Stack

- Astro 7
- Svelte 5 islands via `@astrojs/svelte`
- MDX content collections
- Pagefind search
- `@fontsource-variable/inter`
- TypeScript 7
- pnpm

## Commands

```sh
pnpm install
pnpm dev
pnpm build
pnpm preview
pnpm typecheck
```

Search is indexed by Pagefind during `pnpm build`, so search results only work after building and serving with `pnpm preview`.

`astro check` currently requires TypeScript ≤6, while this project uses TypeScript 7, so it is not part of the build validation. Use `pnpm typecheck` for TypeScript-only checks.

## Local testing in the GitHub Copilot app

Install Node.js 24 and pnpm 12 on Windows or macOS, matching the deployment workflow. Review and accept `.github/github-app.yml` in the app when prompted.

The configuration runs **Setup** (`pnpm install --frozen-lockfile`) when a session is created. It also provides these manual commands:

- **Develop** starts the live-reloading development server.
- **Typecheck** generates Astro's types, then checks TypeScript without emitting compiled files.
- **Build** builds the production site and Pagefind search index.
- **Preview build** serves the most recent production build. Run **Build** first and rerun it after changes to refresh the preview.

For local validation, run **Typecheck**, then **Build**, then **Preview build**. The app opens the detected server URL, including the `/glassbox` base path, in its browser. Use the production preview to verify navigation, interactive diagrams, and search; the development server does not build the search index.

All configured commands use pnpm directly without platform-specific shell syntax and work on both Windows and macOS. Dependency installation respects your configured registry.

## Add a topic

1. Create an MDX file under `src/content/topics/<category>/`, for example `src/content/topics/github/example-topic.mdx`.
2. Add frontmatter:

   ```yaml
   ---
   title: "Long page title"
   shortTitle: "Short card title"
   category: "GitHub"
   summary: "One-line summary for cards."
   order: 100
   updated: 2026-09-22
   badge: "New"
   art: "billing"
   breadcrumb:
     - "GitHub"
     - "Example"
   ---
   ```

3. Write the explanation in MDX. Reusable visual components can live in `src/components/<topic>/` and be mounted as Svelte islands.
4. Add or reuse a thumbnail art component in `src/components/art/`, then allow its key in `src/content.config.ts`.

## Deployment

The site is deployed to GitHub Pages with `.github/workflows/deploy.yml`. In repository settings, enable Pages and set the source to **GitHub Actions**. Private repositories require a paid GitHub plan for Pages.

## Daily content accuracy audit

`.github/workflows/content-accuracy-audit.md` defines a daily
[GitHub Agentic Workflow](https://github.github.com/gh-aw/introduction/overview/)
using GitHub Copilot. Its generated `content-accuracy-audit.lock.yml` is the Actions
workflow; commit both files. The daily schedule starts after merge to `main`, and
the workflow also supports manual runs on `main`.

The audit identifies the active successful `github-pages` deployment and checks
its published GitHub pages, including interactive diagram states, against current
public `docs.github.com` documentation. It compares findings with current source
and open PRs to avoid obsolete or duplicate corrections. It proposes at most one
draft PR per run, with direct documentation citations and minimal factual fixes.
It does not add topics or expand explanations, except for a short qualification
whose absence materially changes an existing message. No PR is needed when
nothing verifiably requires correction; incomplete coverage is reported separately.

### Enable and operate

1. Enable GitHub Actions and **Allow GitHub Actions to create and approve pull
   requests** under **Settings > Actions > General > Workflow permissions**.
   The workflow only creates draft PRs; it cannot approve or merge them.
2. Add the repository Actions secret `COPILOT_GITHUB_TOKEN` with a fine-grained
   personal access token granting the account permission **Copilot Requests: Read**.
   See the official [Copilot authentication setup](https://github.github.com/gh-aw/reference/auth/#copilot_github_token).
   Usage is charged to the configured Copilot account; review its policies and
   budget before enabling daily runs. Do not commit the token.
3. Ensure the site has a successful deployment in the `github-pages` environment.
   The audit fails rather than treating an undeployed checkout as published.
4. After merge, run **Content accuracy audit** from the Actions tab, or use
   `gh workflow run content-accuracy-audit.lock.yml --ref main`. Review its run
   summary and any draft correction PR. Human review and merge are required;
   the existing deploy workflow publishes merged source changes.

The agent has read-only GitHub permissions. A separate
[safe-output job](https://github.github.com/gh-aw/reference/safe-outputs-pull-requests/)
can create the PR, with an enforced source-file allowlist and protected-file block.
PRs created using the default Actions token do not automatically trigger other
workflows; the agent runs the site's checks before proposing them. Treat its
evidence as a review aid, not a guarantee of factual completeness.

To change the automation, edit the Markdown source and regenerate the lock file
with the [gh-aw CLI](https://github.github.com/gh-aw/setup/quick-start/) (currently
compiled with `v1.0.1`):

```sh
gh aw compile content-accuracy-audit
gh aw compile content-accuracy-audit --no-emit --strict
```

Do not hand-edit the generated lock file. The
[daily schedule](https://github.github.com/gh-aw/reference/triggers/#scheduled-triggers-schedule)
is scattered to a stable compiler-selected time; Actions scheduling may be delayed,
and GitHub can disable scheduled workflows in inactive public repositories.
