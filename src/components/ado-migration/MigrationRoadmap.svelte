<script lang="ts">
  import InfoBar from '../ui/InfoBar.svelte';
  import SectionHead from '../ui/SectionHead.svelte';
  import SegmentedToggle from '../ui/SegmentedToggle.svelte';
  import {
    LANES,
    SERVICES,
    SLOT_TEXT,
    STAGES,
    STAGE_IDS,
    SUMMARY_KEYS,
    TAGS,
    VISUAL,
    type Service,
    type ServiceId,
    type StageId,
  } from './data';

  interface Props {
    initialStage?: StageId;
  }

  let { initialStage = '1' }: Props = $props();

  let stageId = $state<StageId>(initialStage);
  let selected = $state<ServiceId | null>(null);

  const stage = $derived(STAGES[stageId]);
  const options = STAGE_IDS.map((id) => ({ id, label: STAGES[id].label }));

  const onGh = (s: Service) => Number(stageId) >= Number(s.moves);
  const bridged = (s: Service) => !onGh(s) && !!s.bridge;
  /** Connected to the GitHub repositories: moved, or bridged by an app. */
  const joined = (s: Service) => s.id !== 'repos' && (onGh(s) || bridged(s));

  const lit = $derived.by(() => {
    if (!selected) return null;
    const s = SERVICES.find((x) => x.id === selected)!;
    if (s.id === 'repos') return new Set<ServiceId>(['repos', ...SERVICES.filter(joined).map((x) => x.id)]);
    return new Set<ServiceId>(joined(s) ? [s.id, 'repos'] : [s.id]);
  });

  const info = $derived(selected ? stage.info[selected] : { lead: stage.lead, text: stage.text });

  const tone = (id: ServiceId) => (selected === id ? 'is-selected' : !lit ? '' : lit.has(id) ? 'is-lit' : 'is-dim');
  const linkTone = (id: ServiceId) => (!lit ? '' : lit.has(id) ? 'is-lit' : 'is-dim');
  const pick = (id: ServiceId) => (selected = selected === id ? null : id);
  const clear = () => (selected = null);
  const setStage = (next: StageId) => {
    stageId = next;
    selected = null;
  };

  const tag = (s: Service) => (s.moves !== stageId ? null : s.optional ? TAGS.optional : TAGS.now);
</script>

<section class="visual" aria-labelledby="adm-title" onkeydown={(e) => e.key === 'Escape' && clear()}>
  <SectionHead n={1} id="adm-title" title={VISUAL.title}>{VISUAL.description}</SectionHead>

  <div class="visual-controls">
    <span class="visual-label" id="adm-stage-label">{VISUAL.label}</span>
    <SegmentedToggle {options} value={stageId} onchange={setStage} labelledby="adm-stage-label" wrap />
    <span class="visual-hint">{VISUAL.hint}</span>
  </div>

  <div class="board">
    <span class="lane lane-ado" aria-hidden="true"></span>
    <span class="lane lane-gh" aria-hidden="true"></span>

    <div class="row heads">
      <span class="visual-label">{LANES.ado}</span>
      <span class="visual-label head-gh">{LANES.gh}</span>
    </div>

    {#each SERVICES as s (s.id)}
      {@const gh = onGh(s)}
      {@const side = gh ? s.gh : s.ado}
      {@const t = tag(s)}
      <div class="row">
        <button
          type="button"
          class="tile {tone(s.id)}"
          class:on-gh={gh}
          aria-pressed={selected === s.id}
          onclick={() => pick(s.id)}
        >
          <span class="kind">{s.kind}</span>
          {#if t}<span class="tag">{t}</span>{/if}
          <b>{side.name}</b>
          <small>{t ? s.handoff : side.sub}</small>
        </button>

        {#if bridged(s) && s.bridge}
          <span class="bridge {linkTone(s.id)}" aria-hidden="true"></span>
          <span class="slot stub right {linkTone(s.id)}">
            <small>{SLOT_TEXT.via} {s.bridge.app}</small>
            <b>{s.bridge.surface}</b>
          </span>
        {:else if gh}
          <span class="slot left {linkTone(s.id)}">
            {s.optional ? SLOT_TEXT.keep : SLOT_TEXT.moved(s.moves)}
          </span>
        {:else}
          <span class="slot right {linkTone(s.id)}">{SLOT_TEXT.pending(s.moves)}</span>
        {/if}
      </div>
    {/each}
  </div>

  <div class="summary">
    {#each SUMMARY_KEYS as k (k)}
      <div class="sum">
        <span class="visual-label">{k}</span>
        <p>{stage.summary[k]}</p>
      </div>
    {/each}
  </div>

  <InfoBar lead={info.lead} text={info.text} />
</section>

<style>
  /* Two lanes; each row's tile slides between them with a transform. */
  .board {
    --b: 56px;
    --p: 10px;
    --mid: calc(var(--b) + 2 * var(--p));
    --ado: var(--cc-1);
    --gh: var(--cc-3);
    position: relative;
    display: grid;
    gap: 10px;
    margin-top: 1.25rem;
    padding: 0 var(--p) var(--p);
  }

  .lane {
    position: absolute;
    top: 0;
    bottom: 0;
    width: calc((100% - var(--b)) / 2);
    border: 1px solid var(--border);
    border-radius: var(--radius);
  }

  .lane-ado {
    left: 0;
    border-color: color-mix(in srgb, var(--ado) 30%, var(--border));
    background: color-mix(in srgb, var(--ado) 5%, var(--surface));
  }

  .lane-gh {
    right: 0;
    border-color: color-mix(in srgb, var(--gh) 30%, var(--border));
    background: color-mix(in srgb, var(--gh) 5%, var(--surface));
  }

  .row {
    position: relative;
    display: grid;
    grid-template-columns: minmax(0, 1fr) var(--mid) minmax(0, 1fr);
    align-items: stretch;
  }

  .heads {
    padding-top: 12px;
  }

  .heads .visual-label {
    grid-row: 1;
    grid-column: 1;
  }

  .heads .head-gh {
    grid-column: 3;
  }

  .tile,
  .slot,
  .bridge {
    grid-row: 1;
  }

  .tile {
    --c: var(--ado);
    position: relative;
    z-index: 2;
    grid-column: 1;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-content: start;
    gap: 1px 8px;
    min-height: 78px;
    padding: 0.55rem 0.75rem;
    border: 1px solid color-mix(in srgb, var(--c) 55%, var(--border));
    border-radius: var(--radius-sm);
    background: color-mix(in srgb, var(--c) 9%, var(--surface-solid));
    color: var(--text);
    font: inherit;
    text-align: left;
    cursor: pointer;
    transition:
      transform var(--dur) var(--ease),
      border-color var(--dur) var(--ease),
      background-color var(--dur) var(--ease),
      box-shadow var(--dur) var(--ease);
  }

  .tile.on-gh {
    --c: var(--gh);
    transform: translateX(calc(100% + var(--mid)));
  }

  .tile:focus-visible {
    outline: 2px solid var(--accent-2);
    outline-offset: 2px;
  }

  .kind {
    color: var(--muted);
    font-size: 0.64rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .tag {
    grid-row: 1;
    grid-column: 2;
    align-self: center;
    padding: 0.05rem 0.45rem;
    border: 1px solid color-mix(in srgb, var(--c) 60%, var(--border));
    border-radius: var(--radius-pill);
    color: var(--text);
    font-size: 0.66rem;
    font-weight: 800;
    white-space: nowrap;
  }

  .tile b {
    grid-column: 1 / -1;
    font-size: 0.95rem;
    overflow-wrap: anywhere;
  }

  .tile small {
    grid-column: 1 / -1;
    color: var(--muted);
    font-size: 0.76rem;
    line-height: 1.35;
  }

  .tile.is-lit {
    border-color: color-mix(in srgb, var(--accent) 75%, var(--border));
  }

  .tile.is-selected {
    border-color: var(--accent);
    background: color-mix(in srgb, var(--accent) 14%, var(--surface-solid));
    box-shadow: 0 0 0 1px var(--accent);
  }

  .tile.is-dim {
    border-color: var(--border);
    background: var(--surface);
  }

  .tile.is-dim b,
  .tile.is-dim .tag {
    color: var(--muted);
  }

  .tile.is-dim .tag {
    border-color: var(--border);
  }

  /* Empty slots and the integration stub, behind the tile. */
  .slot {
    z-index: 1;
    display: grid;
    align-content: center;
    gap: 2px;
    padding: 0.5rem 0.75rem;
    border: 1px dashed var(--border-strong);
    border-radius: var(--radius-sm);
    color: var(--muted);
    font-size: 0.78rem;
    font-weight: 650;
    transition: border-color var(--dur) var(--ease);
  }

  .slot.left {
    grid-column: 1;
  }

  .slot.right {
    grid-column: 3;
  }

  .slot.is-dim {
    border-color: var(--border);
  }

  .stub {
    border-color: color-mix(in srgb, var(--ado) 60%, var(--border));
    background: color-mix(in srgb, var(--ado) 6%, var(--surface-solid));
  }

  .stub small {
    font-size: 0.7rem;
  }

  .stub b {
    color: var(--text);
    font-size: 0.85rem;
  }

  .stub.is-lit {
    border-color: var(--accent);
  }

  .stub.is-dim {
    background: var(--surface);
  }

  .stub.is-dim b {
    color: var(--muted);
  }

  /* The app that joins a service in Azure DevOps to the GitHub repositories. */
  .bridge {
    grid-column: 2;
    align-self: center;
    height: 0;
    margin-inline: -1px;
    border-top: 2px dashed color-mix(in srgb, var(--ado) 70%, var(--border));
    transition: border-color var(--dur) var(--ease);
  }

  .bridge.is-lit {
    border-top-color: var(--accent);
  }

  .bridge.is-dim {
    border-top-color: var(--border-strong);
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

  @container (max-width: 720px) {
    .board {
      --b: 28px;
    }

    .summary {
      grid-template-columns: minmax(0, 1fr);
    }
  }

  @container (max-width: 480px) {
    .board {
      --b: 14px;
      --p: 6px;
    }

    .tile,
    .slot {
      padding: 0.45rem 0.55rem;
    }

    .tile {
      grid-template-columns: minmax(0, 1fr);
    }

    .tag {
      grid-row: auto;
      grid-column: 1;
      justify-self: start;
      margin-block: 2px;
    }

    .tile b {
      font-size: 0.86rem;
    }

    .tile small,
    .slot {
      font-size: 0.72rem;
    }

    .stub b {
      font-size: 0.78rem;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .tile,
    .slot,
    .bridge {
      transition: none;
    }
  }
</style>
