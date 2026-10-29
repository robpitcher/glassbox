---
name: new-topic
description: Build a new Visual Aids topic page (MDX plus a Svelte diagram island) from a GitHub issue or a request so it matches the existing pages. Use when adding a topic, explainer, or visual to this site.
---

# New topic

`AGENTS.md` holds the rules. This skill is the order to apply them in. Don't skip the design approval in step 2 or the screenshot review in step 8, because that's where direction and consistency problems show up.

## 1. Scope and facts

- If there's an issue, read it. Its "Page scope" is the boundary. If there isn't one, the user's request is the scope: don't create an issue for it. Note adjacent topics to link to instead of explaining them.
- Verify every claim against docs.github.com or learn.microsoft.com, and keep the URLs for the PR body.

## 2. Propose, mock up, and get approval

Don't write Svelte until the user has picked a direction.

1. Propose 3–5 visual ideas, each in one or two sentences, tied to rows of the pattern table in `AGENTS.md`. Favor ideas where the visual does the explaining, with little text on the page. Don't draw or code yet.
2. For the ideas the user picks, build HTML mockups: copy `scripts/mockup/template.html` to `mockups/<idea>.html` (gitignored), use the shared cast and real numbers, and drive states with query parameters.
3. Run `pnpm mockup-shots mockups/<idea>.html "mockups/<idea>.html?<state>"` and show the PNGs. Iterate on the user's feedback in the mockups, which is much faster than in Svelte.
4. Wait for the user to approve one design before step 3.

If the approved design seems to need two patterns, it's probably two pages: suggest splitting it.

## 3. Write `data.ts` first

In `src/components/<topic>/data.ts`, put every label, example, and explanation sentence. Use the shared cast (`Acme`, `acme-web`, `acme-data`, `mona`, `kai`, `ray`) and keep it consistent with licensing (see `AGENTS.md`). Give each selectable item an info entry with a bold `lead` and a one-sentence `text`, plus the default info shown when nothing is selected.

## 4. Build the island from the shared blocks

Start from this skeleton and compare with `src/components/hierarchy/HierarchyExplorer.svelte`:

```svelte
<script lang="ts">
  import InfoBar from '../ui/InfoBar.svelte';
  import SectionHead from '../ui/SectionHead.svelte';
  import SegmentedToggle from '../ui/SegmentedToggle.svelte';
  // import the example data from './data'
</script>

<section class="visual" aria-labelledby="x-title" onkeydown={(e) => e.key === 'Escape' && clear()}>
  <SectionHead n={1} id="x-title" title="Short heading">One line of explanation.</SectionHead>

  <div class="visual-controls">
    <span class="visual-label" id="x-mode-label">Show</span>
    <SegmentedToggle options={modeOptions} value={mode} onchange={setMode} labelledby="x-mode-label" />
    <span class="visual-hint">Select a …</span>
  </div>

  <!-- diagram: every selectable item is a <button aria-pressed={…}> -->

  <InfoBar lead={info.lead} text={info.text} />
</section>
```

- Local CSS styles only the diagram itself. Don't redefine the frame, heading, badge, toggle, label, or info bar.
- Use `@container` queries, not `@media`, because `.visual` is the container. Collapse to one column around 650px.
- Use tokens only: `--cc-*` for categories, and `--accent` only for selection. Fade unrelated items through border, fill, and `--muted` text, never `opacity`.
- Animate only `transform`, `clip-path`, or `opacity` on decorative layers, never `width`, `height`, `padding`, or `margin`.
- Make the default (unhydrated) state readable, and default any toggle to the richer variant.

## 5. Write the page

In `src/content/topics/<category>/<slug>.mdx`: frontmatter, then `FactCards` with 4 pairs, then the island, then short `##` sections with bullets that work without JavaScript. No intro paragraph and no Sources section. Copy the structure of `src/content/topics/github/account-enterprise-hierarchy.mdx`.

- Link to other topics with `withBase()`, as `AGENTS.md` describes.
- If you give the new page `badge: "New"`, check the other badged pages' first commit dates. Suggest removing any badge older than a month, but don't remove it without asking.

## 6. Add the card art

Create `src/components/art/<Name>Art.astro`, register its key in the `art` enum in `src/content.config.ts` and in `src/components/TopicCard.astro`, and match the style of the existing art.

## 7. Build

Run `pnpm typecheck` and `pnpm build`.

## 8. Check it

1. Run `pnpm shots <category>/<slug> github/account-enterprise-hierarchy`. It must exit 0 (no sideways scroll).
2. View the new page's PNGs next to the hierarchy page's at each width and theme. Fix differences in spacing, type size, card style, and connector alignment before moving on.
3. Run `pnpm interact <category>/<slug>`. It must exit 0. Open the `interact-*.png` shots to check every toggle state, and confirm the highlights connect the right items.
4. Confirm the page shows on the home page and in the sidebar.

## 9. Open the PR

Branch `robpitcher-<topic>`. The PR body lists the doc links from step 1, plus `Closes #N` if there's an issue. Open issues for any scope you cut.
