---
name: new-topic
description: Build a new Visual Aids topic page (MDX plus a Svelte diagram island) from a GitHub issue so it matches the existing pages. Use when adding a topic, explainer, or visual to this site.
---

# New topic

`AGENTS.md` holds the rules. This skill is the order to apply them in. Don't skip the screenshot review in step 7, because that's where consistency problems show up.

## 1. Scope and facts

- Read the issue. Its "Page scope" is the boundary. Note adjacent topics to link to instead of explaining them.
- Verify every claim against docs.github.com or learn.microsoft.com, and keep the URLs for the PR body.

## 2. Pick one pattern

Choose one row from the pattern table in `AGENTS.md` and stick to it. If the topic seems to need two patterns, it's probably two pages: propose an issue for the second one.

## 3. Write `data.ts` first

In `src/components/<topic>/data.ts`, put every label, example, and explanation sentence. Use the shared cast (`Acme`, `acme-web`, `acme-data`, `mona`, `kai`, `ray`). Give each selectable item an info entry with a bold `lead` and a one-sentence `text`, plus the default info shown when nothing is selected.

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
- Make the default (unhydrated) state readable, and default any toggle to the richer variant.

## 5. Write the page

In `src/content/topics/<category>/<slug>.mdx`: frontmatter, then `FactCards` with 4 pairs, then the island, then short `##` sections with bullets that work without JavaScript. No intro paragraph and no Sources section. Copy the structure of `src/content/topics/github/account-enterprise-hierarchy.mdx`.

## 6. Add the card art

Create `src/components/art/<Name>Art.astro`, register its key in the `art` enum in `src/content.config.ts` and in `src/components/TopicCard.astro`, and match the style of the existing art.

## 7. Check it

1. Run `pnpm typecheck` and `pnpm build`.
2. Run `pnpm shots <category>/<slug> github/account-enterprise-hierarchy`. It must exit 0 (no sideways scroll).
3. View the new page's PNGs next to the hierarchy page's at each width and theme. Fix differences in spacing, type size, card style, and connector alignment before moving on.
4. In `pnpm preview` (or the Playwright MCP), check every toggle state, select one item of each kind by keyboard, confirm the highlights and info bar, and press Esc to clear.
5. Confirm the page shows on the home page and in the sidebar.

## 8. Open the PR

Branch `robpitcher-<topic>`. The PR body has `Closes #N` and the doc links from step 1. Open issues for any scope you cut.
