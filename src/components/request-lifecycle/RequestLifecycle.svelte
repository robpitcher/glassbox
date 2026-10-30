<script lang="ts">
  import InfoBar from '../ui/InfoBar.svelte';
  import SectionHead from '../ui/SectionHead.svelte';
  import SegmentedToggle from '../ui/SegmentedToggle.svelte';
  import { GATES, LABELS, LEGEND, SCENARIOS, stopIndex, type GateId, type ScenarioId } from './data';

  interface Props {
    initialScenario?: ScenarioId;
  }

  let { initialScenario = 'served' }: Props = $props();

  let scenarioId = $state<ScenarioId>(initialScenario);
  let selected = $state<GateId | null>(null);

  const scenario = $derived(SCENARIOS.find((s) => s.id === scenarioId)!);
  const stopAt = $derived(stopIndex(scenario));
  const info = $derived.by(() => {
    const g = selected && GATES.find((x) => x.id === selected);
    return g ? { lead: g.lead, text: g.text } : { lead: scenario.lead, text: scenario.text };
  });

  const gateState = (i: number) => (i < stopAt ? 'pass' : i === stopAt ? 'stop' : 'skip');
  const statusText = (i: number) =>
    gateState(i) === 'pass' ? LABELS.passed : gateState(i) === 'stop' ? LABELS.stopped : LABELS.notReached;
  const tone = (id: GateId) => (!selected ? '' : id === selected ? 'is-selected' : 'is-dim');

  function select(id: GateId) {
    selected = selected === id ? null : id;
  }

  function pick(id: ScenarioId) {
    scenarioId = id;
    selected = null;
  }

  function onkeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') selected = null;
  }

  const options = SCENARIOS.map((s) => ({ id: s.id, label: s.label }));
</script>

<!--
  THESIS: A Copilot request passes a fixed set of admin controls, and the first one that says no decides the outcome.
  STORY: Pick a request to see which gates it clears and where it stops; select a gate to see what it checks and who sets it.
  FORM: One ordered stage track of keyboard-focusable gates, an outcome pill at the end, and a live one-line explanation.
-->
<section class="visual" aria-labelledby="request-lifecycle-title" {onkeydown}>
  <SectionHead n={1} id="request-lifecycle-title" title="Where a request stops">
    Pick a request to see which gates let it through and which one stops it.
  </SectionHead>

  <div class="visual-controls">
    <span class="visual-label" id="request-lifecycle-label">{LABELS.request}</span>
    <SegmentedToggle {options} value={scenarioId} onchange={pick} wrap labelledby="request-lifecycle-label" />
    <span class="visual-hint">{LABELS.hint}</span>
  </div>

  <div class="stage">
    <div class="request">
      <span class="avatar" aria-hidden="true">
        <svg viewBox="0 0 20 20"><circle cx="10" cy="7" r="3.6" /><path d="M3.4 17.4c.6-3.7 3.2-6 6.6-6s6 2.3 6.6 6Z" /></svg>
      </span>
      <span><b>{scenario.who}</b><small>{scenario.ask}</small></span>
    </div>

    <ol class="track">
      {#each GATES as g, i (g.id)}
        <li class="step {gateState(i)}">
          <button
            type="button"
            class="gate {g.enforcer} {tone(g.id)}"
            aria-pressed={selected === g.id}
            aria-label={`${LABELS.gate} ${i + 1}, ${g.name}: ${statusText(i)}. ${g.owner}.`}
            onclick={() => select(g.id)}
          >
            <span class="top">
              <span class="num">{LABELS.gate} {i + 1}</span>
              <span class="mark" aria-hidden="true">
                {#if gateState(i) === 'pass'}
                  <svg viewBox="0 0 16 16"><path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z" /></svg>
                {:else if gateState(i) === 'stop'}
                  <svg viewBox="0 0 16 16"><path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.75.75 0 1 1 1.06 1.06L9.06 8l3.22 3.22a.75.75 0 1 1-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 0 1-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z" /></svg>
                {/if}
              </span>
            </span>
            <span class="name">{g.name}</span>
            <span class="sub">{g.sub}</span>
            <span class="owner">{g.owner}</span>
          </button>
        </li>
      {/each}
      <li class="end">
        <span class="outcome" class:ok={!scenario.stop}>{scenario.outcome}</span>
      </li>
    </ol>

    <div class="legend">
      <span class="key github">{LEGEND.github}</span>
      <span class="key client">{LEGEND.client}</span>
    </div>
  </div>

  <InfoBar lead={info.lead} text={info.text} />
</section>

<style>
  button {
    font: inherit;
    color: inherit;
    cursor: pointer;
  }

  button:focus-visible {
    outline: 2px solid var(--accent-2);
    outline-offset: 2px;
  }

  .stage {
    display: grid;
    gap: 1rem;
    margin-top: 1.25rem;
  }

  .request {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    width: fit-content;
    max-width: 100%;
    padding: 0.65rem 1rem 0.65rem 0.7rem;
    border: 1px solid var(--border-strong);
    border-radius: var(--radius);
    background: var(--surface);
  }

  .request b {
    display: block;
    font-family: var(--font-mono);
  }

  .request small {
    color: var(--muted);
    font-size: 0.82rem;
  }

  .avatar {
    display: grid;
    flex: none;
    place-items: center;
    width: 2.2rem;
    height: 2.2rem;
    border: 2px solid color-mix(in srgb, var(--accent) 50%, transparent);
    border-radius: var(--radius-pill);
    background: color-mix(in srgb, var(--accent) 22%, var(--surface-solid));
  }

  .avatar svg {
    width: 70%;
    fill: var(--accent);
  }

  /* Track */
  .track {
    --gap: 0.85rem;
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr)) minmax(0, 8.5rem);
    gap: var(--gap);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .step,
  .end {
    position: relative;
    display: grid;
    min-width: 0;
  }

  /* Connector to the next stage: a faint base line, with a green line revealed once the gate is passed. */
  .step::before,
  .step::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 100%;
    width: var(--gap);
    height: 2px;
    background: var(--border-strong);
  }

  .step::after {
    background: var(--ok);
    clip-path: inset(0 100% 0 0);
    transition: clip-path var(--dur) var(--ease);
  }

  .step.pass::after {
    clip-path: inset(0);
  }

  .gate {
    position: relative;
    display: grid;
    align-content: start;
    gap: 0.3rem;
    min-width: 0;
    padding: 0.75rem 0.8rem 0.8rem;
    border: 1px solid var(--border-strong);
    border-radius: var(--radius-sm);
    background: var(--surface-solid);
    text-align: left;
    transition:
      border-color var(--dur) var(--ease),
      background-color var(--dur) var(--ease),
      box-shadow var(--dur) var(--ease);
  }

  .gate:hover {
    border-color: var(--accent);
  }

  .top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }

  .num {
    color: var(--muted);
    font-size: 0.68rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .mark {
    display: grid;
    width: 1.25rem;
    height: 1.25rem;
    place-items: center;
    border-radius: var(--radius-pill);
  }

  .mark svg {
    width: 0.8rem;
    fill: currentColor;
  }

  .name {
    font-weight: 800;
    line-height: 1.2;
  }

  .sub {
    color: var(--muted);
    font-size: 0.78rem;
    line-height: 1.3;
    overflow-wrap: anywhere;
  }

  .owner {
    justify-self: start;
    margin-top: 0.35rem;
    padding: 0.15rem 0.5rem;
    border: 1px solid color-mix(in srgb, var(--c) 50%, transparent);
    border-radius: var(--radius-pill);
    background: color-mix(in srgb, var(--c) 10%, transparent);
    color: var(--c);
    font-size: 0.7rem;
    font-weight: 750;
    line-height: 1.3;
  }

  .gate.github {
    --c: var(--cc-0);
  }

  .gate.client {
    --c: var(--cc-3);
  }

  .pass .gate {
    border-color: color-mix(in srgb, var(--ok) 55%, var(--border));
  }

  .pass .mark {
    background: color-mix(in srgb, var(--ok) 16%, transparent);
    color: var(--ok);
  }

  .stop .gate {
    border-color: var(--bad);
    background: color-mix(in srgb, var(--bad) 9%, var(--surface-solid));
  }

  .stop .mark {
    background: color-mix(in srgb, var(--bad) 18%, transparent);
    color: var(--bad);
  }

  .skip .gate {
    border-style: dashed;
    border-color: var(--border);
  }

  .skip .name {
    color: var(--muted);
  }

  /* Selection */
  .step .gate.is-selected,
  .step .gate.is-selected:hover {
    border-color: var(--accent-2);
    box-shadow: 0 0 0 1px var(--accent-2);
  }

  .step .gate.is-dim,
  .step .gate.is-dim:hover {
    border-color: var(--border);
    background: var(--surface-solid);
  }

  .gate.is-dim .name {
    color: var(--muted);
  }

  .step .gate.is-dim .mark {
    background: transparent;
    color: var(--muted);
  }

  .gate.is-dim .owner {
    border-color: var(--border);
    background: transparent;
    color: var(--muted);
  }

  /* Outcome */
  .end {
    align-items: center;
  }

  .outcome {
    padding: 0.55rem 0.85rem;
    border: 1px solid var(--bad);
    border-radius: var(--radius-pill);
    background: color-mix(in srgb, var(--bad) 10%, var(--surface-solid));
    color: var(--text);
    font-size: 0.82rem;
    font-weight: 800;
    line-height: 1.25;
    text-align: center;
  }

  .outcome.ok {
    border-color: var(--ok);
    background: color-mix(in srgb, var(--ok) 10%, var(--surface-solid));
  }

  /* Legend */
  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem 1rem;
    color: var(--muted);
    font-size: 0.78rem;
  }

  .key {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
  }

  .key::before {
    content: '';
    width: 0.7rem;
    height: 0.7rem;
    border: 1.5px solid var(--c);
    border-radius: var(--radius-pill);
    background: color-mix(in srgb, var(--c) 20%, transparent);
  }

  .key.github {
    --c: var(--cc-0);
  }

  .key.client {
    --c: var(--cc-3);
  }

  /* Wide layout: share row tracks across gates so titles, subtitles, and owner pills line up. */
  @container (min-width: 721px) {
    .track {
      row-gap: 0;
    }

    .step,
    .end {
      grid-row: span 4;
    }

    .step,
    .gate {
      grid-template-rows: subgrid;
    }

    .gate {
      grid-row: 1 / -1;
      row-gap: 0.3rem;
    }

    .owner {
      align-self: start;
    }
  }

  @container (max-width: 720px) {
    .track {
      --gap: 0.7rem;
      grid-template-columns: minmax(0, 1fr);
    }

    .step::before,
    .step::after {
      top: 100%;
      left: 1.6rem;
      width: 2px;
      height: var(--gap);
    }

    .step::after {
      clip-path: inset(0 0 100% 0);
    }

    .step.pass::after {
      clip-path: inset(0);
    }

    .gate {
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 0.2rem 0.75rem;
    }

    .top {
      grid-column: 1 / -1;
    }

    .name,
    .sub {
      grid-column: 1;
    }

    .owner {
      grid-column: 2;
      grid-row: 2 / span 2;
      align-self: center;
      justify-self: end;
      margin-top: 0;
      text-align: right;
    }

    .end {
      justify-items: start;
    }
  }

  @container (max-width: 460px) {
    .gate {
      grid-template-columns: minmax(0, 1fr);
    }

    .owner {
      grid-column: 1;
      grid-row: auto;
      justify-self: start;
      margin-top: 0.3rem;
      text-align: left;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .step::after,
    .gate {
      transition: none;
    }
  }
</style>
