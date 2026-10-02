<script lang="ts">
  import { GATES, SCENARIOS, type GateId, type ScenarioId } from './data';

  let scenarioId = $state<ScenarioId>('clear');
  let activeGateId = $state<GateId>('ruleset');
  let scenarioButtons: HTMLButtonElement[] = [];

  const scenario = $derived(SCENARIOS.find((item) => item.id === scenarioId) ?? SCENARIOS[0]);
  const activeGate = $derived(GATES.find((gate) => gate.id === activeGateId) ?? GATES[0]);
  const blockingIndex = $derived(scenario.blockedBy ? GATES.findIndex((gate) => gate.id === scenario.blockedBy) : -1);

  function setScenario(id: ScenarioId) {
    scenarioId = id;
    const next = SCENARIOS.find((item) => item.id === id);
    if (next?.blockedBy) activeGateId = next.blockedBy;
  }

  function stateFor(id: GateId) {
    const index = GATES.findIndex((gate) => gate.id === id);
    if (!scenario.blockedBy) return 'ok';
    if (id === scenario.blockedBy) return 'bad';
    return index < blockingIndex ? 'ok' : 'waiting';
  }

  function handleScenarioKeydown(event: KeyboardEvent, index: number) {
    const last = SCENARIOS.length - 1;
    let nextIndex = index;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') nextIndex = index === last ? 0 : index + 1;
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') nextIndex = index === 0 ? last : index - 1;
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = last;
    else return;
    event.preventDefault();
    setScenario(SCENARIOS[nextIndex].id);
    scenarioButtons[nextIndex]?.focus();
  }

  function stateLabel(id: GateId) {
    const state = stateFor(id);
    if (state === 'bad') return 'blocking';
    if (state === 'ok') return 'satisfied';
    return 'waiting';
  }
</script>

<section class="merge-gates" aria-labelledby="merge-gates-title" style={`--dot-wide: ${scenario.wideDot}; --dot-narrow: ${scenario.narrowDot}`}>
  <div class="heading-row">
    <span class="badge" aria-hidden="true">1</span>
    <div>
      <h2 id="merge-gates-title">One PR, many gates</h2>
      <p>Pick a scenario and watch where the merge decision stops.</p>
    </div>
  </div>

  <div class="controls">
    <span class="control-label">Scenario</span>
    <div class="segments" role="group" aria-label="Merge gate scenario">
      {#each SCENARIOS as item, index (item.id)}
        <button
          bind:this={scenarioButtons[index]}
          type="button"
          class:active={scenarioId === item.id}
          aria-pressed={scenarioId === item.id}
          onclick={() => setScenario(item.id)}
          onkeydown={(event) => handleScenarioKeydown(event, index)}
        >{item.label}</button>
      {/each}
    </div>
  </div>

  <div class="stage" aria-label="Abstract merge gate route">
    <svg class="map map-wide" viewBox="0 0 1000 240" aria-hidden="true">
      <defs><linearGradient id="gate-flow" x1="80" x2="920" y1="0" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="var(--accent)" /><stop offset="1" stop-color="var(--accent-2)" /></linearGradient></defs>
      <rect class="band band-org" x="212" y="28" width="308" height="18" rx="9" /><text x="232" y="42">Org rule</text>
      <rect class="band band-repo" x="520" y="56" width="308" height="18" rx="9" /><text x="540" y="70">Repo rule</text>
      <path class="tick tick-org" d="M250 46 V92M410 46 V92" />
      <path class="tick tick-repo" d="M590 74 V92M750 74 V92" />
      <path class="rail" d="M70 106 H930" /><path class="rail-lit" d="M70 106 H930" />
    </svg>
    <svg class="map map-narrow" viewBox="0 0 320 660" preserveAspectRatio="none" aria-hidden="true">
      <defs><linearGradient id="gate-flow-narrow" x1="0" x2="0" y1="48" y2="612" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="var(--accent)" /><stop offset="1" stop-color="var(--accent-2)" /></linearGradient></defs>
      <path class="rail" d="M30 48 V612" /><path class="rail-lit rail-lit-narrow" d="M30 48 V612" />
    </svg>
    <div class="track-dot" aria-hidden="true"></div>
    <div class="gate-layer">
      <span class="start-node" aria-hidden="true"><span class="node-mark"></span><span class="node-label">PR</span></span>
      {#each GATES as gate (gate.id)}
        <button
          type="button"
          class={`gate-node is-${stateFor(gate.id)}`}
          class:active={activeGateId === gate.id}
          aria-pressed={activeGateId === gate.id}
          aria-label={`${gate.label}: ${stateLabel(gate.id)}. ${gate.configured}`}
          onclick={() => (activeGateId = gate.id)}
          onfocus={() => (activeGateId = gate.id)}
        >
          <span class="node-mark" aria-hidden="true"></span>
          <span class="node-label">{gate.shortLabel}</span>
          <span class="policy-tags" aria-hidden="true">
            {#if gate.id === 'ruleset'}
              <span>Org</span><span>Repo</span>
            {:else if gate.id === 'checks'}
              <span>Org</span>
            {:else}
              <span>Repo</span>
            {/if}
          </span>
        </button>
      {/each}
      <span class={`merge-node ${scenario.blockedBy ? 'is-bad' : 'is-ok'}`} aria-label={scenario.blockedBy ? 'Merge blocked' : 'Merge allowed'}><span class="node-mark" aria-hidden="true"></span><span class="node-label">Merge</span></span>
    </div>
  </div>

  <p class="caption" aria-live="polite">{scenario.caption}</p>
  <div class="detail-panel" aria-live="polite">
    <strong>{activeGate.label}</strong>
    <span>{activeGate.detail}</span>
    <em><span>Configured in:</span> {activeGate.configured}</em>
  </div>
</section>

<style>
  .merge-gates {
    box-sizing: border-box;
    container-type: inline-size;
    width: 100%;
    padding: clamp(1.5rem, 3vw, 2rem);
    overflow: hidden;
    color: var(--text);
    background: var(--card-grad);
    border: 1px solid var(--border);
    border-radius: calc(var(--radius) + 2px);
    box-shadow: var(--shadow);
  }

  .merge-gates * { box-sizing: border-box; }
  h2, p { margin: 0; }

  .heading-row {
    display: flex;
    gap: 1rem;
    align-items: flex-start;
  }

  .badge {
    display: inline-grid;
    flex: 0 0 auto;
    width: 2.25rem;
    height: 2.25rem;
    place-items: center;
    color: var(--on-accent);
    font-weight: 800;
    background: var(--accent-grad);
    border-radius: var(--radius-pill);
    box-shadow: 0 0.75rem 1.8rem color-mix(in srgb, var(--accent) 28%, transparent);
  }

  h2 {
    font-size: clamp(1.55rem, 3.4vw, 2rem);
    line-height: 1.05;
    letter-spacing: -0.035em;
  }

  .heading-row p {
    max-width: 58ch;
    margin-top: 0.75rem;
    color: var(--muted);
    line-height: 1.55;
  }

  .controls {
    display: flex;
    flex-wrap: wrap;
    gap: 0.8rem 1rem;
    align-items: center;
    margin-top: 1.35rem;
  }

  .control-label {
    color: var(--muted);
    font-size: 0.78rem;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .segments {
    display: inline-flex;
    gap: 0.25rem;
    padding: 0.25rem;
    background: color-mix(in srgb, var(--surface-2) 76%, transparent);
    border: 1px solid var(--border);
    border-radius: var(--radius-pill);
  }

  .segments button,
  .gate-node {
    font: inherit;
    color: inherit;
  }

  .segments button {
    min-height: 2.15rem;
    padding: 0 0.78rem;
    color: var(--muted);
    cursor: pointer;
    background: transparent;
    border: 0;
    border-radius: var(--radius-pill);
    transition: color var(--dur) var(--ease), background var(--dur) var(--ease), box-shadow var(--dur) var(--ease);
  }

  .segments button.active {
    color: var(--text);
    background: color-mix(in srgb, var(--accent) 18%, transparent);
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--accent) 42%, transparent);
  }

  .segments button:hover {
    color: var(--text);
  }

  .segments button:focus-visible,
  .gate-node:focus-visible {
    outline: 2px solid var(--accent-2);
    outline-offset: 3px;
  }

  .stage {
    position: relative;
    min-height: 18.2rem;
    margin-top: 1.15rem;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background:
      radial-gradient(circle at 18% 26%, color-mix(in srgb, var(--accent) 14%, transparent), transparent 30%),
      radial-gradient(circle at 78% 20%, color-mix(in srgb, var(--accent-2) 12%, transparent), transparent 28%),
      color-mix(in srgb, var(--surface) 44%, transparent);
  }

  .map {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }

  .map-narrow { display: none; }

  .band {
    fill: color-mix(in srgb, var(--accent) 13%, transparent);
    stroke: color-mix(in srgb, var(--accent) 36%, transparent);
  }

  .band-repo {
    fill: color-mix(in srgb, var(--accent-2) 12%, transparent);
    stroke: color-mix(in srgb, var(--accent-2) 34%, transparent);
  }

  .map text {
    fill: var(--muted);
    font-size: 13px;
    font-weight: 750;
  }

  .tick {
    fill: none;
    stroke: color-mix(in srgb, var(--accent) 42%, transparent);
    stroke-linecap: round;
    stroke-width: 1.5;
  }

  .tick-repo {
    stroke: color-mix(in srgb, var(--accent-2) 42%, transparent);
  }

  .rail,
  .rail-lit {
    fill: none;
    stroke-linecap: round;
  }

  .rail {
    stroke: var(--border-strong);
    stroke-width: 10;
  }

  .rail-lit {
    stroke: url('#gate-flow');
    stroke-width: 4;
  }

  .gate-layer {
    position: absolute;
    inset: 0;
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 0.35rem;
    align-items: start;
    padding: 6.8rem clamp(1.15rem, 4vw, 3.25rem) 2.1rem;
  }

  .start-node,
  .merge-node,
  .gate-node {
    position: relative;
    z-index: 2;
    display: inline-flex;
    flex-direction: column;
    min-width: 0;
    min-height: 5rem;
    align-items: center;
    justify-content: flex-start;
    gap: 0.48rem;
    padding: 0;
    text-align: center;
    border: 0;
    border-radius: var(--radius-sm);
  }

  .start-node {
    color: var(--muted);
  }

  .gate-node {
    cursor: pointer;
    background: transparent;
    transition: transform var(--dur) var(--ease), opacity var(--dur) var(--ease);
  }

  .gate-node:disabled {
    cursor: not-allowed;
  }

  .gate-node:hover,
  .gate-node.active {
    transform: translateY(-0.15rem);
  }

  .gate-node.is-ok { --node-color: var(--ok); }
  .gate-node.is-bad { --node-color: var(--bad); }
  .gate-node.is-waiting {
    --node-color: var(--border-strong);
    color: var(--muted);
    opacity: 0.72;
  }

  .merge-node {
    color: var(--text);
  }

  .merge-node.is-ok { --merge-color: var(--ok); }
  .merge-node.is-bad {
    --merge-color: var(--bad);
    color: var(--muted);
  }

  .node-mark {
    flex: 0 0 auto;
    width: 2.55rem;
    height: 2.55rem;
    background:
      radial-gradient(circle at 50% 50%, var(--node-color, var(--merge-color, var(--border-strong))) 0 0.36rem, transparent 0.38rem),
      color-mix(in srgb, var(--surface-solid, var(--bg)) 88%, var(--surface));
    border: 2px solid var(--node-color, var(--merge-color, var(--border-strong)));
    border-radius: var(--radius-pill);
    box-shadow:
      0 0 0 0.42rem color-mix(in srgb, var(--node-color, var(--merge-color, var(--accent))) 12%, transparent),
      0 0.85rem 1.7rem color-mix(in srgb, var(--node-color, var(--merge-color, var(--accent))) 16%, transparent);
  }

  .start-node .node-mark {
    --node-color: var(--border-strong);
    background:
      radial-gradient(circle at 50% 50%, var(--muted) 0 0.28rem, transparent 0.3rem),
      color-mix(in srgb, var(--surface-solid, var(--bg)) 92%, var(--surface));
    border-style: dashed;
  }

  .gate-node.is-waiting .node-mark {
    background:
      radial-gradient(circle at 50% 50%, var(--muted) 0 0.28rem, transparent 0.3rem),
      color-mix(in srgb, var(--surface-solid, var(--bg)) 90%, var(--surface));
  }

  .gate-node.active .node-mark,
  .gate-node:hover .node-mark {
    box-shadow:
      0 0 0 0.5rem color-mix(in srgb, var(--node-color, var(--accent)) 16%, transparent),
      0 1rem 2.1rem color-mix(in srgb, var(--node-color, var(--accent)) 24%, transparent);
  }

  .node-label {
    display: inline-flex;
    min-height: 1.3rem;
    align-items: center;
    justify-content: center;
    padding: 0.08rem 0.5rem;
    color: var(--text);
    font-weight: 750;
    line-height: 1.15;
    background: color-mix(in srgb, var(--surface-solid, var(--bg)) 72%, transparent);
    border: 1px solid color-mix(in srgb, var(--border) 78%, transparent);
    border-radius: var(--radius-pill);
  }

  .start-node .node-label,
  .gate-node.is-waiting .node-label {
    color: var(--muted);
  }

  .policy-tags {
    display: none;
  }

  .track-dot {
    position: absolute;
    z-index: 3;
    top: 8.08rem;
    left: var(--dot-wide);
    width: 1.08rem;
    height: 1.08rem;
    background: var(--text);
    border: 0.25rem solid var(--accent-2);
    border-radius: var(--radius-pill);
    box-shadow: 0 0 0 0.42rem color-mix(in srgb, var(--accent-2) 20%, transparent), 0 0.75rem 1.8rem color-mix(in srgb, var(--accent-2) 26%, transparent);
    transform: translate(-50%, -50%);
    transition: left var(--dur) var(--ease), top var(--dur) var(--ease);
  }

  .caption {
    min-height: 1.6rem;
    margin-top: 1rem;
    color: var(--text);
    font-weight: 650;
    line-height: 1.5;
  }

  .detail-panel {
    display: grid;
    grid-template-columns: minmax(6.5rem, auto) minmax(0, 1fr) auto;
    gap: 0.55rem 0.8rem;
    align-items: baseline;
    margin-top: 0.9rem;
    padding: 0.88rem 1rem;
    color: var(--muted);
    background: color-mix(in srgb, var(--surface-2) 58%, transparent);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
  }

  .detail-panel strong { color: var(--text); }
  .detail-panel em {
    color: var(--accent-2);
    font-style: normal;
    font-weight: 700;
  }

  .detail-panel em span {
    color: var(--muted);
    font-weight: 650;
  }

  @container (max-width: 820px) {
    .gate-layer {
      padding-inline: 1.1rem;
    }

    .node-label {
      font-size: 0.9rem;
    }
  }

  @container (max-width: 640px) {
    .merge-gates {
      padding: 1.1rem;
      border-radius: var(--radius);
    }

    .heading-row { gap: 0.75rem; }
    .badge {
      width: 2rem;
      height: 2rem;
    }

    .segments {
      display: grid;
      width: 100%;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      border-radius: var(--radius);
    }

    .segments button { border-radius: var(--radius-sm); }
    .stage { min-height: 38rem; }
    .map-wide { display: none; }
    .map-narrow { display: block; }

    .rail-lit {
      stroke: url('#gate-flow-narrow');
    }

    .gate-layer {
      display: flex;
      flex-direction: column;
      gap: 0.95rem;
      align-items: stretch;
      justify-content: space-between;
      padding: 1.85rem 1rem 1.85rem 1.95rem;
    }

    .start-node,
    .merge-node,
    .gate-node {
      display: grid;
      width: 100%;
      min-height: 3.45rem;
      grid-template-columns: 2.25rem minmax(0, 1fr) auto;
      gap: 0.6rem;
      align-items: center;
      justify-items: start;
      text-align: left;
    }

    .node-mark {
      width: 2.25rem;
      height: 2.25rem;
    }

    .node-label {
      min-height: 2.35rem;
      justify-content: flex-start;
      padding: 0.34rem 0.78rem;
      background: color-mix(in srgb, var(--surface-solid, var(--bg)) 82%, transparent);
      border-radius: var(--radius-sm);
    }

    .policy-tags {
      display: inline-flex;
      flex-wrap: wrap;
      gap: 0.25rem;
      justify-content: flex-end;
    }

    .policy-tags span {
      padding: 0.18rem 0.44rem;
      color: var(--muted);
      font-size: 0.68rem;
      font-weight: 800;
      letter-spacing: 0.07em;
      text-transform: uppercase;
      background: color-mix(in srgb, var(--surface-2) 66%, transparent);
      border: 1px solid var(--border);
      border-radius: var(--radius-pill);
    }

    .track-dot {
      top: var(--dot-narrow);
      left: 3.05rem;
    }

    .detail-panel { grid-template-columns: 1fr; }
  }

  @media (prefers-reduced-motion: no-preference) {
    .track-dot { animation: dot-pulse 1.8s var(--ease) infinite; }

    @keyframes dot-pulse {
      0%, 100% {
        box-shadow: 0 0 0 0.32rem color-mix(in srgb, var(--accent-2) 20%, transparent), 0 0.75rem 1.8rem color-mix(in srgb, var(--accent-2) 22%, transparent);
      }

      50% {
        box-shadow: 0 0 0 0.58rem color-mix(in srgb, var(--accent-2) 11%, transparent), 0 1rem 2.1rem color-mix(in srgb, var(--accent-2) 32%, transparent);
      }
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .segments button,
    .gate-node,
    .track-dot {
      transition: none;
    }

    .gate-node:hover,
    .gate-node.active {
      transform: none;
    }
  }
</style>
