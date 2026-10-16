# Visual Aids: agent instructions

A static Astro 7 + Svelte 5 wiki of interactive explainers for GitHub, Copilot, Azure, and developer-tooling concepts. Each topic is one MDX page with one or more Svelte diagram islands. Readers are developers and GitHub admins with some experience.

## Commands

Use pnpm (Node 24, pnpm 12). If `pnpm` isn't on PATH, run `corepack enable` once rather than `npx pnpm`.

- `pnpm typecheck`: Astro sync, then `tsc --noEmit`. `astro check` doesn't support TypeScript 7, so don't use it.
- `pnpm build`: production build plus the Pagefind search index.
- `pnpm preview`: serves the last build at `http://localhost:4321/visual/`. Rebuild after every change. Search only works here, not in `pnpm dev`.

## Scope

- One idea per page. Each issue's "Page scope" is the boundary. If the work starts covering an adjacent concept, link to that topic's page or issue instead of explaining it. If no issue exists, propose one rather than expanding the page.
- Many topics are adjacent, for example Actions execution (#9) and Actions security (#6), or the security overview (#14) and its detail pages (#4, #7, #11). Cross-link them, and keep the overlap to a sentence.
- Use one concrete example and note important variations. Never build an exhaustive settings or permissions matrix.
- Cover GitHub.com / Enterprise Cloud. Mention GitHub Enterprise Server only when the difference is essential.

## Accuracy

- Verify every product claim against official docs (docs.github.com, learn.microsoft.com) before writing it. Don't rely on memory, because features and names change often.
- Don't present optional or configurable steps as universal, such as agent approvals, policies, or budgets. Don't present illustrative prices or allowances as guaranteed.
- Put the doc links you used in the PR description. Don't render a Sources section on the page.

## Page anatomy

- **Frontmatter** (schema in `src/content.config.ts`):
  - `title`: 2–4 words, like "GitHub enterprise hierarchy". Not a sentence or a question.
  - `shortTitle`: the home page card title.
  - `navTitle`: the sidebar label.
  - `summary`: one line for the card.
  - `updated`: today's date.
  - `breadcrumb`, `order`, `badge`, and `art` as needed.
- **No intro paragraph** under the title. Open with `FactCards` (4 short label/value pairs), then the visual.
- **Visual sections** are cards with a numbered badge, a short heading, and one line of explanation (see `HierarchyExplorer.svelte`).
- **After the visual**, add short `##` sections with bulleted explanations. These must make sense without JavaScript, because they are the noninteractive version of the visual.
- The layout puts the "Updated" date at the bottom, left-aligned. Don't move it.

## Visual design

Reference implementation: `src/components/hierarchy/HierarchyExplorer.svelte` and its `data.ts`.

**Pick the pattern that matches the issue:**

| Issue shape | Examples | Pattern |
| --- | --- | --- |
| Ownership or structure | #8, #19 | Nested containers. Actors sit beside the tree, connected by labeled arrows. |
| One item moving through stages | #3, #4, #5, #10, #11 | An ordered stage track. Branch the outcomes, such as fixed vs dismissed or pass vs blocked, and mark who acts at each step, such as human vs agent. |
| Execution over time | #9 | A step-through animation with play, pause, and step controls. Respect `prefers-reduced-motion`. |
| Two contrasting paths | #6, and EMU vs personal in #8 | A segmented toggle that rebuilds the same diagram for each case. |
| Graph or path tracing | #7 | Nodes and edges. Selecting a node highlights its path. |
| Side-by-side comparison | #12, #13, #14 | Parallel lanes or columns with the same example and the same axis in each. |
| Staged roadmap | #15 | A stage selector over one fixed layout, so readers see what moves. |

**Interaction rules:**

- Every interactive item is a real `<button>` with `aria-pressed`, so it works by keyboard. Esc clears a selection.
- Selecting an item lights up everything connected to it. Unrelated items fade only their borders, fills, and accent colors.
- Never fade a whole button with `opacity`, because that drops text below 4.5:1 contrast and fades focus outlines. Unrelated text uses `--muted`.
- One `aria-live` info bar under the visual explains the current selection in one sentence: bold lead, plain rest.
- When there's a toggle, default to the richer or more common variant. For example, the hierarchy page opens on EMU.
- The server-rendered default state must make sense before hydration.

**Content and color:**

- Keep all example data and explanation text in a `data.ts` next to the component, never hard-coded in markup.
- Use only tokens from `src/styles/tokens.css`, and define any new token in both the dark and light theme blocks.
- For categories such as teams, lanes, or actors, use the `--cc-*` tokens. Don't use `--accent` or `--accent-2` for categories, because those mark selection.
- Mark actors consistently across pages: one style for humans, one for automation or agents, one for external systems such as an IdP.

**Shared example cast:** reuse these on adjacent GitHub pages so the pages read as one world.

- Enterprise `Acme` (shortcode `acme`).
- Organizations `acme-web` and `acme-data`.
- People `mona`, `kai`, and `ray`.
- Repositories `checkout`, `app`, `docs`, `lake`, `models`, and `etl`.

## Adding a topic: files to touch

1. `src/content/topics/<category>/<slug>.mdx`
2. `src/components/<topic>/` for the Svelte island(s) and `data.ts`.
3. `src/components/art/<Name>Art.astro` for the home page thumbnail. Register its key in the `art` enum in `src/content.config.ts` and in `src/components/TopicCard.astro`.

The home page and sidebar pick the page up automatically.

## Before showing work or opening a PR

1. `pnpm typecheck` and `pnpm build` pass.
2. In `pnpm preview`, check the page at 375px, about 650px (where layouts switch to one column), and 1440px wide.
3. Check every toggle state, and both the light and dark themes.
4. At every width, nothing scrolls sideways and connectors line up with the boxes they join.
5. Select at least one item of each kind by keyboard and confirm the highlights and info bar.
6. Confirm the page appears on the home page and in the sidebar.

## Git

- Branch names: `robpitcher-<topic>`.
- Put `Closes #N` in the PR body, and list the sources there.
- Open new issues for scope you cut. Don't widen the current PR.
