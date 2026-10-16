<script lang="ts">
  import {
    GATES,
    PULL,
    SCENARIOS,
    SOURCES,
    explain,
    failing,
    gate,
    gatesFrom,
    outcomeOf,
    type Gate,
    type OutcomeId,
    type ScenarioId,
    type Selection,
  } from './data';

  interface Props {
    initialScenario?: ScenarioId;
  }

  let { initialScenario = 'blocked' }: Props = $props();

  let scenarioId = $state<ScenarioId>(initialScenario);
  let selection = $state<Selection | null>(null);

  const outcome = $derived(outcomeOf(scenarioId));
  const info = $derived(explain(scenarioId, selection));

  const key = (s: Selection) => `${s.kind}:${s.id}`;
  const selectedKey = $derived(selection ? key(selection) : null);

  // Everything connected to the current selection stays lit; the rest dims.
  const lit = $derived.by(() => {
    const keys = new Set<string>();
    const s = selection;
    if (!s) return keys;
    keys.add(key(s));
    const addGate = (g: Gate) => {
      keys.add(`gate:${g.id}`);
      g.sources.forEach((id) => keys.add(`source:${id}`));
    };

    switch (s.kind) {
      case 'source':
        gatesFrom(s.id).forEach((g) => keys.add(`gate:${g.id}`));
        break;
      case 'gate': {
        const g = gate(s.id);
        addGate(g);
        if (!g.pass[scenarioId]) keys.add('outcome:blocked');
        break;
      }
      case 'outcome':
        (outcome === 'blocked' ? failing(scenarioId) : GATES).forEach(addGate);
        break;
    }
    return keys;
  });

  const tone = (s: Selection) => {
    const k = key(s);
    if (!selection) return '';
    if (k === selectedKey) return 'is-selected';
    return lit.has(k) ? 'is-lit' : 'is-dim';
  };

  function select(s: Selection) {
    selection = selectedKey === key(s) ? null : s;
  }

  function onkeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') selection = null;
  }

  const SOURCE_COLORS = ['var(--cc-3)', 'var(--cc-1)', 'var(--cc-4)', 'var(--cc-2)'];
  const scenarioIds: ScenarioId[] = ['blocked', 'allowed'];
  const outcomeIds: OutcomeId[] = ['blocked', 'allowed'];
  const OUTCOME_LABELS: Record<OutcomeId, { title: string; sub: string }> = {
    blocked: { title: 'Merge blocked', sub: 'at least one gate unmet' },
    allowed: { title: 'Merge allowed', sub: 'every gate met' },
  };
</script>

<!--
  THESIS: A PR merges only when every rule from every source is met; sources stack, and the strictest version of a rule wins.
  OWN-WORLD: Midnight Glass; four sources each wear a category color; selecting a gate lights the sources that set it.
  STORY: Flip between one and two approvals to move #42 from blocked to allowed; select a source or gate to trace where a rule lives.
  FIRST VIEWPORT: Header, control bar, the PR strip, four sources, five gates, and the two outcomes.
  FORM: Responsive semantic HTML; every element is a keyboard-focusable toggle, with a live one-line explanation underneath.
-->
{#snippet avatar()}
  <svg class="actor-glyph" viewBox="0 0 20 20" aria-hidden="true">
    <circle cx="10" cy="7" r="3.6" />
    <path d="M3.4 17.4c.6-3.7 3.2-6 6.6-6s6 2.3 6.6 6Z" />
  </svg>
{/snippet}

{#snippet bot()}
  <svg class="actor-glyph" viewBox="0 0 20 20" aria-hidden="true">
    <rect x="3.5" y="6" width="13" height="10" rx="2.5" />
    <path d="M10 2.5v3.5" />
    <circle cx="7.5" cy="11" r="1.2" />
    <circle cx="12.5" cy="11" r="1.2" />
  </svg>
{/snippet}

<section class="gates" aria-labelledby="gates-title" {onkeydown}>
  <div class="section-head">
    <span class="section-badge" aria-hidden="true">1</span>
    <div>
      <h2 id="gates-title">Can #{PULL.number} merge into {PULL.base}?</h2>
      <p>Rules come from several places and all of them apply. The merge waits until every gate is green.</p>
    </div>
  </div>

  <div class="controls">
    <span class="show-label" id="gates-scenario-label">Show</span>
    <div class="mode-toggle" role="group" aria-labelledby="gates-scenario-label">
      {#each scenarioIds as id (id)}
        <button type="button" class:active={scenarioId === id} aria-pressed={scenarioId === id} onclick={() => (scenarioId = id)}>
          {SCENARIOS[id].label}
        </button>
      {/each}
    </div>
    <span class="hint">Select a source, gate, or outcome</span>
  </div>

  <div class="pr-strip">
    <span class="pr-state">Open</span>
    <span class="pr-title"><strong>{PULL.title}</strong> <span class="pr-number">#{PULL.number}</span></span>
    <span class="pr-meta">
      <span>{PULL.author} wants to merge</span>
      <code>{PULL.head}</code>
      <span aria-hidden="true">→</span><span class="sr-only">into</span>
      <code>{PULL.base}</code>
      <span>in {PULL.repo} · changes <code>{PULL.file}</code></span>
    </span>
  </div>

  <p class="column-label">Where {PULL.base}’s rules are configured</p>
  <ul class="source-list">
    {#each SOURCES as s (s.id)}
      <li>
        <button
          type="button"
          class="source {tone({ kind: 'source', id: s.id })}"
          style:--cat={SOURCE_COLORS[s.color]}
          aria-pressed={selectedKey === `source:${s.id}`}
          onclick={() => select({ kind: 'source', id: s.id })}
        >
          <span class="tag">{s.kind}</span>
          <strong class="source-name">{s.name}</strong>
          <span class="source-where">{s.where}</span>
          <span class="rules">
            {#each s.rules as rule (rule)}<span class="rule">{rule}</span>{/each}
          </span>
        </button>
      </li>
    {/each}
  </ul>

  <div class="down" aria-hidden="true">
    <svg viewBox="0 0 12 40"><path d="M6 2v32" /><path d="m1.5 30 4.5 6 4.5-6" /></svg>
    <span>All apply · strictest wins</span>
  </div>

  <p class="column-label">Gates on #{PULL.number}</p>
  <ol class="track">
    {#each GATES as g, i (g.id)}
      {@const ok = g.pass[scenarioId]}
      <li>
        <button
          type="button"
          class="gate {tone({ kind: 'gate', id: g.id })}"
          class:fail={!ok}
          aria-pressed={selectedKey === `gate:${g.id}`}
          aria-label={`Step ${i + 1}, ${g.name}: ${ok ? 'met' : 'not met'}. ${g.has[scenarioId]}.`}
          onclick={() => select({ kind: 'gate', id: g.id })}
        >
          <span class="step">{i + 1}</span>
          <strong class="gate-name">{g.name}</strong>
          <span class="actor actor-{g.actor}">
            {#if g.actor === 'human'}{@render avatar()}{:else}{@render bot()}{/if}
            <span>{g.actorLabel}</span>
          </span>
          <span class="status" class:ok>
            <span class="status-mark" aria-hidden="true">{ok ? '✓' : '✕'}</span>
            <span>{g.has[scenarioId]}</span>
          </span>
        </button>
      </li>
    {/each}
  </ol>

  <div class="down" aria-hidden="true">
    <svg viewBox="0 0 12 40"><path d="M6 2v32" /><path d="m1.5 30 4.5 6 4.5-6" /></svg>
  </div>

  <div class="outcomes" role="group" aria-label="Merge outcome">
    {#each outcomeIds as id (id)}
      <button
        type="button"
        class="outcome outcome-{id} {tone({ kind: 'outcome', id })}"
        class:current={outcome === id}
        aria-pressed={selectedKey === `outcome:${id}`}
        aria-label={`${OUTCOME_LABELS[id].title}${outcome === id ? ', current result' : ''}`}
        onclick={() => select({ kind: 'outcome', id })}
      >
        <span class="outcome-mark" aria-hidden="true">{id === 'blocked' ? '✕' : '✓'}</span>
        <span>
          <strong>{OUTCOME_LABELS[id].title}</strong>
          <span class="outcome-sub">{outcome === id ? OUTCOME_LABELS[id].sub : 'not this time'}</span>
        </span>
      </button>
    {/each}
  </div>

  <div class="info" aria-live="polite" aria-atomic="true">
    <span class="info-icon" aria-hidden="true">i</span>
    <div>
      <p><strong>{info.lead}</strong> {info.text}</p>
      {#if info.note}<p class="info-note">{info.note}</p>{/if}
    </div>
  </div>
</section>

<style>
  .gates {
    box-sizing: border-box;
    container-type: inline-size;
    width: 100%;
    color: var(--text);
    background: var(--card-grad);
    border: 1px solid var(--border);
    border-radius: calc(var(--radius) + 2px);
    box-shadow: var(--shadow);
    padding: clamp(1.1rem, 3vw, 2rem);
    overflow: hidden;
  }

  .gates * {
    box-sizing: border-box;
  }

  h2,
  p,
  ul,
  ol {
    margin: 0;
  }

  ul,
  ol {
    padding: 0;
    list-style: none;
  }

  button {
    font: inherit;
    color: inherit;
    cursor: pointer;
  }

  button:focus-visible {
    outline: 2px solid var(--accent-2);
    outline-offset: 2px;
  }

  code {
    font-family: var(--font-mono);
    font-size: 0.82em;
    padding: 0.1rem 0.35rem;
    border-radius: 0.35rem;
    background: var(--surface-2);
    overflow-wrap: anywhere;
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  .section-head {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
  }

  .section-badge {
    display: inline-grid;
    flex: 0 0 auto;
    width: 2.25rem;
    height: 2.25rem;
    place-items: center;
    border-radius: var(--radius-pill);
    background: var(--accent-grad);
    color: var(--on-accent);
    font-weight: 800;
    box-shadow: 0 0.75rem 1.8rem color-mix(in srgb, var(--accent) 28%, transparent);
  }

  h2 {
    font-size: clamp(1.45rem, 3.4vw, 2rem);
    line-height: 1.05;
    letter-spacing: -0.035em;
  }

  .section-head p {
    max-width: 74ch;
    margin-top: 0.7rem;
    color: var(--muted);
    line-height: 1.55;
  }

  /* Controls */
  .controls {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.75rem 1rem;
    margin-top: 1.5rem;
    padding: 0.7rem 1rem;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: var(--surface);
  }

  .show-label,
  .column-label {
    color: var(--muted);
    font-size: 0.7rem;
    font-weight: 800;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }

  .mode-toggle {
    display: inline-flex;
    padding: 0.25rem;
    border: 1px solid var(--border);
    border-radius: var(--radius-pill);
    background: color-mix(in srgb, var(--bg) 60%, transparent);
  }

  .mode-toggle button {
    padding: 0.5rem 1rem;
    border: 0;
    border-radius: var(--radius-pill);
    background: transparent;
    color: var(--muted);
    font-size: 0.88rem;
    font-weight: 750;
    transition: background var(--dur) var(--ease), color var(--dur) var(--ease);
  }

  .mode-toggle button:hover {
    color: var(--text);
  }

  .mode-toggle button.active {
    background: var(--accent-grad);
    color: var(--on-accent);
  }

  .hint {
    margin-left: auto;
    color: var(--muted);
    font-size: 0.85rem;
  }

  /* PR strip */
  .pr-strip {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    align-items: center;
    gap: 0.35rem 0.75rem;
    margin-top: 1.25rem;
    padding: 0.8rem 1rem;
    border: 1px solid var(--border-strong);
    border-radius: var(--radius);
    background: color-mix(in srgb, var(--surface-solid) 55%, transparent);
  }

  .pr-state {
    grid-row: span 2;
    align-self: start;
    padding: 0.3rem 0.65rem;
    border-radius: var(--radius-pill);
    background: color-mix(in srgb, var(--ok) 18%, transparent);
    color: var(--ok);
    font-size: 0.75rem;
    font-weight: 800;
  }

  .pr-title {
    font-size: 1.02rem;
  }

  .pr-number {
    color: var(--muted);
  }

  .pr-meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.3rem 0.4rem;
    color: var(--muted);
    font-size: 0.85rem;
  }

  .column-label {
    margin-top: 1.25rem;
    margin-bottom: 0.6rem;
  }

  /* Shared selection states */
  .is-lit,
  .is-selected,
  .is-dim {
    transition:
      color var(--dur) var(--ease),
      background var(--dur) var(--ease),
      border-color var(--dur) var(--ease),
      box-shadow var(--dur) var(--ease);
  }

  /* Sources */
  .source-list {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0.6rem;
  }

  .source-list li {
    display: grid;
  }

  .source {
    display: grid;
    align-content: start;
    gap: 0.35rem;
    min-width: 0;
    padding: 0.8rem;
    border: 1.5px solid color-mix(in srgb, var(--cat) 55%, transparent);
    border-radius: var(--radius-sm);
    background: color-mix(in srgb, var(--cat) 8%, transparent);
    text-align: left;
  }

  .source:hover {
    border-color: var(--cat);
  }

  .source.is-selected {
    border-color: var(--cat);
    background: color-mix(in srgb, var(--cat) 20%, transparent);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--cat) 22%, transparent);
  }

  .source.is-lit {
    border-color: var(--cat);
  }

  .source.is-dim {
    border-color: var(--border);
    background: transparent;
    color: var(--muted);
  }

  .source.is-dim .tag {
    background: var(--surface-2);
    color: var(--muted);
  }

  .tag {
    justify-self: start;
    padding: 0.25rem 0.5rem;
    border-radius: 0.4rem;
    background: color-mix(in srgb, var(--cat) 18%, transparent);
    color: var(--cat);
    font-size: 0.66rem;
    font-weight: 800;
    letter-spacing: 0.12em;
    line-height: 1;
    text-transform: uppercase;
  }

  .source-name {
    font-size: 0.95rem;
    overflow-wrap: anywhere;
  }

  .source-where {
    color: var(--muted);
    font-size: 0.76rem;
    line-height: 1.35;
  }

  .rules {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem;
    margin-top: 0.2rem;
  }

  .rule {
    padding: 0.2rem 0.45rem;
    border: 1px solid var(--border);
    border-radius: 0.4rem;
    background: var(--surface);
    font-size: 0.74rem;
    font-weight: 650;
    overflow-wrap: anywhere;
  }

  /* Downward connectors */
  .down {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    gap: 0.75rem;
    margin-top: 0.6rem;
    color: var(--muted);
    font-size: 0.66rem;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .down svg {
    grid-column: 2;
    width: 0.75rem;
    height: 2.2rem;
    fill: none;
    stroke: var(--accent);
    stroke-width: 1.6;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .down path:first-child {
    stroke-dasharray: 5 5;
  }

  .down span {
    grid-column: 3;
  }

  .down + .column-label {
    margin-top: 0.4rem;
  }

  /* Gate track */
  .track {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 1.3rem;
  }

  .track li {
    position: relative;
    display: grid;
  }

  /* Chevron between gates, centered in the gap. */
  .track li + li::before {
    content: '';
    position: absolute;
    top: 50%;
    left: -0.95rem;
    width: 0.55rem;
    height: 0.55rem;
    border-top: 2px solid var(--accent);
    border-right: 2px solid var(--accent);
    transform: translateY(-50%) rotate(45deg);
  }

  .gate {
    display: grid;
    align-content: start;
    gap: 0.5rem;
    min-width: 0;
    padding: 0.75rem;
    border: 1.5px solid color-mix(in srgb, var(--ok) 45%, var(--border));
    border-radius: var(--radius-sm);
    background: color-mix(in srgb, var(--ok) 6%, var(--surface));
    text-align: left;
  }

  .gate.fail {
    border-color: color-mix(in srgb, var(--bad) 70%, var(--border));
    background: color-mix(in srgb, var(--bad) 9%, var(--surface));
  }

  .gate:hover {
    border-color: var(--accent);
  }

  .gate.is-lit {
    border-color: color-mix(in srgb, var(--accent-2) 70%, transparent);
  }

  .gate.is-selected {
    border-color: var(--accent-2);
    box-shadow: 0 0.5rem 1.4rem color-mix(in srgb, var(--accent-2) 24%, transparent);
  }

  .gate.is-dim {
    border-color: var(--border);
    background: var(--surface);
    color: var(--muted);
  }

  .step {
    display: inline-grid;
    width: 1.4rem;
    height: 1.4rem;
    place-items: center;
    border: 1px solid var(--border-strong);
    border-radius: var(--radius-pill);
    color: var(--muted);
    font-size: 0.74rem;
    font-weight: 800;
  }

  .gate-name {
    font-size: 0.95rem;
    line-height: 1.2;
  }

  /* Actors: humans get an avatar, automation a dashed bot chip. */
  .actor {
    justify-self: start;
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    max-width: 100%;
    padding: 0.15rem 0.5rem 0.15rem 0.2rem;
    border: 1px solid var(--border-strong);
    border-radius: var(--radius-pill);
    font-size: 0.74rem;
    font-weight: 700;
  }

  .actor-automation {
    border-style: dashed;
    border-radius: 0.4rem;
  }

  .actor-glyph {
    flex: 0 0 auto;
    width: 1.05rem;
    fill: var(--muted);
  }

  .actor-automation .actor-glyph {
    fill: none;
    stroke: var(--muted);
    stroke-width: 1.5;
  }

  .actor-automation .actor-glyph circle {
    fill: var(--muted);
    stroke: none;
  }

  .status {
    display: flex;
    align-items: flex-start;
    gap: 0.35rem;
    margin-top: auto;
    color: var(--bad);
    font-size: 0.8rem;
    font-weight: 750;
    line-height: 1.3;
  }

  .status.ok {
    color: var(--ok);
  }

  .gate.is-dim .status {
    color: var(--muted);
  }

  .status-mark {
    flex: 0 0 auto;
  }

  /* Outcomes */
  .outcomes {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.6rem;
    max-width: 36rem;
    margin: 0.6rem auto 0;
  }

  .outcome {
    --tone: var(--bad);
    display: flex;
    align-items: center;
    gap: 0.7rem;
    padding: 0.7rem 0.9rem;
    border: 1.5px dashed var(--border-strong);
    border-radius: var(--radius);
    background: transparent;
    color: var(--muted);
    text-align: left;
  }

  .outcome-allowed {
    --tone: var(--ok);
  }

  .outcome.current {
    border-style: solid;
    border-color: var(--tone);
    background: color-mix(in srgb, var(--tone) 12%, transparent);
    color: var(--text);
  }

  .outcome:hover {
    border-color: var(--tone);
  }

  .outcome.is-selected {
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--tone) 24%, transparent);
  }

  .outcome.current.is-dim {
    border-color: var(--border-strong);
    background: transparent;
  }

  .outcome.current.is-dim .outcome-mark {
    background: color-mix(in srgb, var(--tone) 30%, var(--surface-2));
  }

  .outcome-mark {
    display: inline-grid;
    flex: 0 0 auto;
    width: 1.8rem;
    height: 1.8rem;
    place-items: center;
    border-radius: var(--radius-pill);
    background: var(--surface-2);
    color: var(--muted);
    font-weight: 800;
  }

  .outcome.current .outcome-mark {
    background: var(--tone);
    color: var(--on-accent);
  }

  .outcome strong {
    display: block;
    font-size: 0.95rem;
  }

  .outcome-sub {
    display: block;
    color: var(--muted);
    font-size: 0.78rem;
  }

  /* Info bar */
  .info {
    display: flex;
    align-items: flex-start;
    gap: 0.85rem;
    margin-top: 1.25rem;
    padding: 0.9rem 1.1rem;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: var(--surface);
  }

  .info-icon {
    display: inline-grid;
    flex: 0 0 auto;
    width: 1.6rem;
    height: 1.6rem;
    place-items: center;
    border-radius: var(--radius-pill);
    background: var(--accent-soft);
    color: var(--accent);
    font-size: 0.85rem;
    font-weight: 800;
  }

  .info p {
    color: var(--muted);
    font-size: 0.95rem;
    line-height: 1.5;
  }

  .info strong {
    color: var(--text);
  }

  .info .info-note {
    margin-top: 0.3rem;
    font-size: 0.86rem;
  }

  @container (max-width: 860px) {
    .source-list {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .track {
      grid-template-columns: minmax(0, 1fr);
      gap: 1.3rem;
    }

    .track li + li::before {
      top: -0.95rem;
      left: 50%;
      transform: translate(-50%, -25%) rotate(135deg);
    }

    .gate {
      grid-template-columns: auto minmax(0, 1fr);
      grid-template-areas:
        'step name'
        'step actor'
        'step status';
      column-gap: 0.75rem;
    }

    .step {
      grid-area: step;
    }

    .gate-name {
      grid-area: name;
      align-self: center;
    }

    .actor {
      grid-area: actor;
    }

    .status {
      grid-area: status;
    }

    .hint {
      margin-left: 0;
      flex-basis: 100%;
    }
  }

  @container (max-width: 480px) {
    .source-list,
    .outcomes {
      grid-template-columns: minmax(0, 1fr);
    }

    .pr-strip {
      grid-template-columns: minmax(0, 1fr);
    }

    .pr-state {
      grid-row: auto;
      justify-self: start;
    }

    .down span {
      grid-column: 1 / -1;
      grid-row: 2;
      text-align: center;
    }

    .down + .column-label {
      margin-top: 0.9rem;
    }
  }
</style>
