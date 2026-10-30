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
