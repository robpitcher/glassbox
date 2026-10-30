<script lang="ts">
  import { tick } from 'svelte';
  import InfoBar from '../ui/InfoBar.svelte';
  import SectionHead from '../ui/SectionHead.svelte';
  import SegmentedToggle from '../ui/SegmentedToggle.svelte';
  import {
    KIND_LABEL,
    LANE_LABELS,
    PATTERNS,
    PATTERN_IDS,
    SUB_LABELS,
    SUMMARY_KEYS,
    TENANT,
    VISUAL,
    type PatternId,
  } from './data';

  interface Props {
    initialPattern?: PatternId;
  }

  let { initialPattern = 'central' }: Props = $props();

  let patternId = $state<PatternId>(initialPattern);
  let selected = $state<string | null>(null);

  const pattern = $derived(PATTERNS[patternId]);
  const options = PATTERN_IDS.map((id) => ({ id, label: PATTERNS[id].label }));

  const lit = $derived(selected ? new Set([selected, ...(pattern.links[selected] ?? [])]) : null);
  const info = $derived(selected ? pattern.info[selected] : { lead: pattern.lead, text: pattern.text });

  const tone = (id: string) => (selected === id ? 'is-selected' : !lit ? '' : lit.has(id) ? 'is-lit' : 'is-dim');
  const pick = (id: string) => (selected = selected === id ? null : id);
  const clear = () => (selected = null);
  const setPattern = (next: PatternId) => {
    patternId = next;
    selected = null;
  };

  // Edge geometry is measured from the rendered boxes after layout.
  interface Geo {
    from: string;
    to: string;
    label?: string;
    d: string;
    lx: number;
    ly: number;
  }

  let lanes: HTMLDivElement | undefined = $state();
  let size = $state({ w: 0, h: 0 });
  let geo = $state<Geo[]>([]);

  function measure() {
    if (!lanes) return;
    const box = lanes.getBoundingClientRect();
    size = { w: box.width, h: box.height };
    const at = (id: string) => lanes!.querySelector(`[data-id="${id}"]`)?.getBoundingClientRect();
    geo = pattern.edges.flatMap(([from, to, label]) => {
      const a = at(from);
      const b = at(to);
      if (!a || !b) return [];
      const x1 = a.right - box.left;
      const y1 = a.top + a.height / 2 - box.top;
      const x2 = b.left - box.left;
      const y2 = b.top + b.height / 2 - box.top;
      const mx = (x1 + x2) / 2;
      return [{ from, to, label, d: `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`, lx: x2 - 42, ly: y2 }];
    });
  }

  $effect(() => {
    void patternId;
    tick().then(measure);
  });

  $effect(() => {
    if (!lanes) return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(lanes);
    return () => ro.disconnect();
  });

  const edgeTone = (from: string, to: string) => (!lit ? '' : lit.has(from) && lit.has(to) ? 'hot' : 'cold');
</script>

<section class="visual" aria-labelledby="ep-title" onkeydown={(e) => e.key === 'Escape' && clear()}>
  <SectionHead n={1} id="ep-title" title={VISUAL.title}>{VISUAL.description}</SectionHead>

  <div class="visual-controls">
    <span class="visual-label" id="ep-pattern-label">{VISUAL.label}</span>
    <SegmentedToggle {options} value={patternId} onchange={setPattern} labelledby="ep-pattern-label" wrap />
    <span class="visual-hint">{VISUAL.hint}</span>
  </div>

  {#snippet node(id: string, kind: keyof typeof KIND_LABEL, name: string, sub: string, cc?: number, tag?: string)}
    <button
      type="button"
      class="node k-{kind} {tone(id)}"
      data-id={id}
      style={cc !== undefined ? `--c: var(--cc-${cc})` : undefined}
      aria-pressed={selected === id}
      onclick={() => pick(id)}
    >
      <span class="kind">{KIND_LABEL[kind]}</span>
      {#if tag}<span class="ntag">{tag}</span>{/if}
      <b>{name}</b>
      <small>{sub}</small>
    </button>
  {/snippet}

  <div class="lanes" bind:this={lanes}>
    <svg class="edges" viewBox="0 0 {size.w} {size.h}" aria-hidden="true">
      {#each geo as e (`${e.from}-${e.to}`)}
        <path class="{edgeTone(e.from, e.to)}" class:ctl={e.label !== undefined} d={e.d} />
      {/each}
      {#each geo as e (`${e.from}-${e.to}-label`)}
        {#if e.label && (!lit || edgeTone(e.from, e.to) === 'hot')}
          <g class="elabel {edgeTone(e.from, e.to)}" transform="translate({e.lx},{e.ly})">
            <rect x="-24" y="-9" width="48" height="18" rx="9" />
            <text text-anchor="middle" dy="3.5">{e.label}</text>
          </g>
        {/if}
      {/each}
    </svg>

    <div class="col">
      <span class="visual-label">{LANE_LABELS.tenant}</span>
      <div class="tenant">
        <span class="tenant-name">{TENANT}</span>
        {#each pattern.groups as g (g.id)}
          {@render node(g.id, 'group', g.name, g.sub, g.tone)}
        {/each}
      </div>
    </div>

    <div class="col">
      <span class="visual-label">{LANE_LABELS.apps}</span>
      <div class="apps">
        {#each pattern.apps as a (a.id)}
          {@render node(a.id, 'app', a.name, a.sub, undefined, a.tag)}
        {/each}
      </div>
    </div>

    <div class="col">
      <span class="visual-label">{LANE_LABELS.github}</span>
      {#each pattern.enterprises as ent (ent.id)}
        <div class="ent" style="--c: var(--cc-{ent.tone})">
          <div class="ent-head">
            <b>Enterprise {ent.name}</b>
            <span class="mono">{ent.shortcode}</span>
            <span class="chip">{ent.billing}</span>
          </div>
          <div class="ent-body">
            <div class="stack">
              <span class="sub-label">{SUB_LABELS.who}</span>
              {#each ent.actors as a (a.id)}
                {@render node(a.id, a.kind, a.name, a.sub, a.tone)}
              {/each}
            </div>
            <div class="stack">
              <span class="sub-label">{SUB_LABELS.what}</span>
              <div class="pframe {tone(ent.policy.id)}">
                {@render node(ent.policy.id, 'policy', ent.policy.name, ent.policy.sub)}
                <div class="porgs">
                  {#each ent.orgs as o (o.id)}
                    <div class="slot" class:open={selected === o.id}>
                      {@render node(o.id, 'org', o.name, o.sub)}
                      {#if o.team}
                        <div class="pop" style="--c: var(--cc-{o.team.tone})">
                          <span class="kind">{KIND_LABEL.team}</span>
                          <b>{o.team.name}</b>
                          <small>{o.team.sub}</small>
                          <small>{o.team.note}</small>
                        </div>
                      {/if}
                    </div>
                  {/each}
                </div>
              </div>
            </div>
          </div>
        </div>
      {/each}
    </div>
  </div>

  <div class="summary">
    {#each SUMMARY_KEYS as k (k)}
      <div class="sum">
        <span class="visual-label">{k}</span>
        <p>{pattern.summary[k]}</p>
      </div>
    {/each}
  </div>

  <InfoBar lead={info.lead} text={info.text} />
</section>

<style>
  .lanes {
    position: relative;
    display: grid;
    grid-template-columns: 0.95fr 0.8fr 2.6fr;
    gap: 56px;
    align-items: start;
    margin-top: 1.25rem;
  }

  .edges {
    position: absolute;
    inset: 0;
    z-index: 2;
    width: 100%;
    height: 100%;
    overflow: visible;
    pointer-events: none;
  }

  .edges path {
    fill: none;
    stroke: var(--border-strong);
    stroke-width: 1.25;
    stroke-dasharray: 4 4;
    transition: stroke var(--dur) var(--ease);
  }

  .edges path.ctl {
    stroke: var(--muted);
    stroke-width: 1.75;
    stroke-dasharray: none;
  }

  .edges path.hot {
    stroke: var(--accent);
    stroke-width: 2;
  }

  .edges path.cold {
    stroke: var(--border);
  }

  .elabel rect {
    fill: var(--surface-solid);
    stroke: var(--border-strong);
  }

  .elabel text {
    fill: var(--muted);
    font-family: var(--font-sans);
    font-size: 10.5px;
    font-weight: 750;
  }

  .elabel.hot rect {
    stroke: var(--accent);
  }

  .elabel.hot text {
    fill: var(--accent);
  }

  .col {
    position: relative;
    z-index: 1;
    display: grid;
    gap: 10px;
    align-content: start;
    min-width: 0;
  }

  .tenant {
    display: grid;
    gap: 8px;
    padding: 12px;
    border: 1px dashed var(--border-strong);
    border-radius: var(--radius);
    background: var(--surface);
  }

  .tenant-name,
  .mono {
    color: var(--muted);
    font-family: var(--font-mono);
    font-size: 0.8rem;
  }

  .apps {
    display: grid;
    gap: 12px;
    padding-top: 30px;
  }

  /* Nodes: entity kind shows in the caption and the border style. */
  .node {
    --c: var(--border-strong);
    position: relative;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 1px 8px;
    width: 100%;
    padding: 0.5rem 0.75rem;
    border: 1px solid color-mix(in srgb, var(--c) 55%, var(--border));
    border-radius: var(--radius-sm);
    background: color-mix(in srgb, var(--c) 8%, var(--surface-solid));
    color: var(--text);
    font: inherit;
    text-align: left;
    cursor: pointer;
    transition:
      border-color var(--dur) var(--ease),
      background-color var(--dur) var(--ease),
      box-shadow var(--dur) var(--ease);
  }

  .node:focus-visible {
    outline: 2px solid var(--accent-2);
    outline-offset: 2px;
  }

  .kind,
  .sub-label {
    color: var(--muted);
    font-size: 0.64rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .sub-label {
    font-size: 0.7rem;
  }

  .ntag {
    grid-row: 1 / 3;
    grid-column: 2;
    align-self: center;
    padding: 0.05rem 0.45rem;
    border: 1px solid var(--border-strong);
    border-radius: var(--radius-pill);
    color: var(--muted);
    font-size: 0.68rem;
    font-weight: 800;
  }

  .node b {
    grid-column: 1;
    font-size: 0.92rem;
    overflow-wrap: anywhere;
  }

  .node small {
    grid-column: 1 / -1;
    color: var(--muted);
    font-size: 0.75rem;
  }

  .k-role {
    border-width: 1.5px;
  }

  .k-org-owners {
    border-style: dashed;
    border-width: 1.5px;
  }

  .k-app {
    border-style: dashed;
  }

  .k-org b {
    font-family: var(--font-mono);
    font-size: 0.88rem;
  }

  .k-policy {
    border-color: var(--border-strong);
    background:
      repeating-linear-gradient(135deg, var(--surface) 0 6px, transparent 6px 12px),
      var(--surface-solid);
  }

  .node.is-selected {
    border-color: var(--accent);
    background: color-mix(in srgb, var(--accent) 14%, var(--surface-solid));
    box-shadow: 0 0 0 1px var(--accent);
  }

  .node.is-dim {
    border-color: var(--border);
    background: var(--surface);
  }

  .node.is-dim b {
    color: var(--muted);
  }

  /* Enterprise */
  .ent {
    --c: var(--cc-0);
    display: grid;
    gap: 10px;
    padding: 12px;
    border: 1px solid color-mix(in srgb, var(--c) 45%, var(--border));
    border-radius: var(--radius);
    background: color-mix(in srgb, var(--c) 5%, var(--surface));
  }

  .ent + .ent {
    margin-top: 4px;
  }

  .ent-head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }

  .chip {
    margin-left: auto;
    padding: 0.15rem 0.6rem;
    border: 1px solid var(--border-strong);
    border-radius: var(--radius-pill);
    color: var(--muted);
    font-size: 0.75rem;
    font-weight: 700;
  }

  .ent-body {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 96px;
  }

  .stack {
    display: grid;
    gap: 8px;
    align-content: start;
    min-width: 0;
  }

  /* Policy frame: enterprise policies wrap the orgs they flow down to. */
  .pframe {
    display: grid;
    gap: 8px;
    padding: 0 8px 8px;
    border: 1.5px solid var(--border-strong);
    border-radius: var(--radius);
    background: var(--surface);
    transition: border-color var(--dur) var(--ease);
  }

  .pframe.is-dim {
    border-color: var(--border);
  }

  .pframe > :global(.node.k-policy) {
    width: calc(100% + 16px);
    margin-inline: -8px;
    border-width: 0 0 1px;
    border-radius: var(--radius) var(--radius) 0 0;
  }

  .pframe > :global(.node.k-policy.is-selected) {
    border-width: 0 0 1px;
  }

  .porgs {
    display: grid;
    gap: 8px;
  }

  .porgs .node,
  .porgs .node.is-dim {
    background: var(--surface-solid);
  }

  .porgs .node.is-selected {
    background: color-mix(in srgb, var(--accent) 14%, var(--surface-solid));
  }

  /* Enterprise-team pop-out beside an org, on selection or hover. */
  .slot {
    position: relative;
  }

  .pop {
    --c: var(--cc-0);
    --reach: 105px;
    position: absolute;
    top: 0;
    right: calc(100% + var(--reach));
    z-index: 3;
    display: none;
    gap: 1px;
    width: calc(100% + 17px);
    padding: 0.5rem 0.75rem;
    border: 1.5px dashed color-mix(in srgb, var(--c) 70%, var(--border));
    border-radius: var(--radius-sm);
    background: color-mix(in srgb, var(--c) 12%, var(--surface-solid));
    box-shadow: var(--shadow);
  }

  .pop::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 100%;
    width: var(--reach);
    border-top: 1.5px dashed color-mix(in srgb, var(--c) 70%, var(--border));
  }

  .slot.open .pop,
  .slot:hover .pop,
  .slot:focus-within .pop {
    display: grid;
  }

  .pop b {
    font-size: 0.92rem;
  }

  .pop small {
    color: var(--muted);
    font-size: 0.75rem;
  }

  /* Summary */
  .summary {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
    margin-top: 1.25rem;
  }

  .sum {
    padding: 12px 14px;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: var(--surface);
  }

  .sum p {
    margin: 6px 0 0;
    font-size: 0.88rem;
    line-height: 1.5;
  }

  @container (max-width: 960px) {
    .lanes {
      gap: 40px;
    }

    .ent-body {
      gap: 64px;
    }

    .pop {
      --reach: 73px;
    }
  }

  @container (max-width: 720px) {
    .lanes,
    .ent-body,
    .summary {
      grid-template-columns: minmax(0, 1fr);
      gap: 16px;
    }

    .edges {
      display: none;
    }

    .apps {
      padding-top: 0;
    }

    .pop {
      position: static;
      width: auto;
      margin-top: 6px;
    }

    .pop::after {
      display: none;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .node,
    .pframe,
    .edges path {
      transition: none;
    }
  }
</style>
