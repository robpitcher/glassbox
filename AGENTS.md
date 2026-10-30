# Glassbox: agent instructions

A static Astro 7 + Svelte 5 wiki of interactive explainers for GitHub, Copilot, Azure, and developer-tooling concepts. Each topic is one MDX page with one or more Svelte diagram islands. Readers are developers and GitHub admins with some experience.

## Commands

Use pnpm (Node 24, pnpm 12). If `pnpm` isn't on PATH, run `corepack enable` once rather than `npx pnpm`.

- `pnpm typecheck`: Astro sync, then `tsc --noEmit`. `astro check` doesn't support TypeScript 7, so don't use it.
- `pnpm build`: production build plus the Pagefind search index.
- `pnpm preview`: serves the last build at `http://localhost:4321/glassbox/`. Rebuild after every change. Search only works here, not in `pnpm dev`.
- `pnpm shots [category/slug ...]`: after `pnpm build`, screenshots each page (or all pages) at 375, 650, and 1440px in dark and light into `shots/`, and fails if anything scrolls sideways.
- `pnpm interact [category/slug ...]`: after `pnpm build`, presses Enter on every selectable item in every `.visual` section and toggle state. It fails unless the item becomes `aria-pressed`, the info bar changes, and Esc resets both. It also saves one screenshot per section and state as `shots/<slug>/interact-*.png`.
- `pnpm mockup-shots mockups/<name>.html["?query"] ...`: screenshots throwaway HTML mockups in dark and light. Mockups live in the gitignored `mockups/` folder; start from `scripts/mockup/template.html`, which links `scripts/mockup/mockup.css` (the real tokens plus look-alike shared blocks).

To add a new topic, follow the `new-topic` skill in `.github/skills/new-topic/SKILL.md`.

## Scope

- One idea per page. Each issue's "Page scope" is the boundary. If the work comes from a request with no issue, the request is the scope; don't create an issue for it. If the work starts covering an adjacent concept, link to that topic's page or issue instead of explaining it. If no issue exists, propose one rather than expanding the page.
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
  - `badge: "New"` marks recent topics. When you touch the topics, check when each badged page was added (`git log --diff-filter=A --format=%ad -- <file>.mdx`). If it was more than a month ago, suggest removing the badge, but don't remove it without asking.
- **Links between topics** in MDX: `import { withBase } from '/src/lib/url';` and write `<a href={withBase('/github/<slug>/')}>`. Never hard-code `/glassbox/` or use a root-relative Markdown link.
- **No intro paragraph** under the title. Open with `FactCards` (4 short label/value pairs), then the visual.
- **Visual sections** are cards with a numbered badge, a short heading, and one line of explanation (see `HierarchyExplorer.svelte`).
- **After the visual**, add short `##` sections with bulleted explanations. These must make sense without JavaScript, because they are the noninteractive version of the visual.
- The layout puts the "Updated" date at the bottom, left-aligned. Don't move it.

## Visual design

Reference implementation: `src/components/hierarchy/HierarchyExplorer.svelte` and its `data.ts`.

**Shared building blocks.** Build every island from these so pages match. Don't restyle frames, headings, toggles, or info bars locally.

- `<section class="visual">`: the card frame. It's a container, so use `@container` queries inside it.
- `SectionHead` (`src/components/ui/`): the numbered badge, heading, and one-line description.
- `.visual-controls` holding `.visual-label`, a `SegmentedToggle`, and an optional `.visual-hint`.
- `.visual-label`: small uppercase captions, such as column or panel labels.
- `InfoBar`: the single `aria-live` explanation under the visual.

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
- Animate only `transform`, `opacity` (on decorative layers, never on buttons or text), and `clip-path`. Don't animate `width`, `height`, `padding`, or `margin`, because they cause layout thrash, and the impeccable design hook flags them. For example, reveal a bar with `clip-path: inset(0 X% 0 0)` rather than by growing its width. Respect `prefers-reduced-motion`.

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
- Keep the cast consistent with licensing. Every organization member holds a GitHub Enterprise license, so someone who must be unlicensed, such as `ray` on a Copilot-only seat, sits in an enterprise team, never inside an organization. Label organizations and enterprise teams so readers can tell them apart.

## Adding a topic: files to touch

1. `src/content/topics/<category>/<slug>.mdx`
2. `src/components/<topic>/` for the Svelte island(s) and `data.ts`.
3. `src/components/art/<Name>Art.astro` for the home page thumbnail. Register its key in the `art` enum in `src/content.config.ts` and in `src/components/TopicCard.astro`.

The home page and sidebar pick the page up automatically.

## Before showing work or opening a PR

1. `pnpm typecheck` and `pnpm build` pass.
2. `pnpm shots <category/slug>` passes. Open its screenshots at 375px, about 650px (where layouts switch to one column), and 1440px, in both themes, next to the hierarchy page's, and fix anything that looks different.
3. Check every toggle state.
4. At every width, nothing scrolls sideways and connectors line up with the boxes they join.
5. `pnpm interact <category/slug>` passes. Then open its `interact-*.png` screenshots and check that the highlights connect the right items.
6. Confirm the page appears on the home page and in the sidebar.

## Git

- Branch names: `robpitcher-<topic>`.
- List the sources in the PR body. If the work has an issue, add `Closes #N`; if it doesn't, skip it.
- Open new issues for scope you cut. Don't widen the current PR.
