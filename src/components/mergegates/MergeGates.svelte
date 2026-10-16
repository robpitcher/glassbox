<script lang="ts">
  import { GATES, SCENARIOS, SOURCES, STATUS_LABEL, STATUS_MARK, type ScenarioId, type SourceId } from './data';

  let scenarioId = $state<ScenarioId>('blocked');
  let selection = $state<{ kind: 'gate' | 'source'; id: string } | null>(null);

  const scenario = $derived(SCENARIOS[scenarioId]);
  const unmet = $derived(GATES.filter((g) => g.states[scenarioId].status !== 'pass'));
  const sourceById = (id: SourceId) => SOURCES.find((s) => s.id === id)!;

  const litGates = $derived(
    selection === null
      ? null
      : selection.kind === 'gate'
        ? new Set([selection.id])
        : new Set(GATES.filter((g) => g.source === selection!.id).map((g) => g.id)),
  );
  const litSources = $derived(
    selection === null
      ? null
      : selection.kind === 'source'
        ? new Set([selection.id])
        : new Set([GATES.find((g) => g.id === selection!.id)!.source]),
  );

  function toggle(kind: 'gate' | 'source', id: string) {
    selection = selection?.kind === kind && selection.id === id ? null : { kind, id };
  }

  function onkeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') selection = null;
  }

  const infoLead = $derived.by(() => {
    if (!selection) return scenario.verdict;
    if (selection.kind === 'gate') return GATES.find((g) => g.id === selection!.id)!.title;
    return sourceById(selection.id as SourceId).name;
  });
  const infoText = $derived.by(() => {
    if (!selection) {
      return scenarioId === 'blocked'
        ? `${unmet.length} requirements are unmet: ${unmet.map((g) => g.title.toLowerCase()).join('; ')}. Select one to see where it is configured.`
        : 'All requirements are met, so the merge button is enabled. Select a requirement to see where it is configured.';
    }
    if (selection.kind === 'gate') {
      const gate = GATES.find((g) => g.id === selection!.id)!;
      const src = sourceById(gate.source);
      return `${gate.states[scenarioId].note} Configured in ${src.where}.`;
    }
    const src = sourceById(selection.id as SourceId);
    const supplied = GATES.filter((g) => g.source === src.id).map((g) => g.title.toLowerCase());
    return `${src.where}. ${src.detail} It supplies: ${supplied.join('; ')}.`;
  });
</script>

<section class="mg" aria-labelledby="mg-title" {onkeydown}>
  <div class="section-head">
    <span class="section-badge" aria-hidden="true">1</span>
    <div>
      <h2 id="mg-title">One pull request, several gates</h2>
      <p>
        PR #42 from <code>mona</code> targets <code>acme-web/checkout</code> on <code>main</code>. Each requirement
        must be met, and they can come from different places.
      </p>
    </div>
  </div>

  <div class="toggle" role="group" aria-label="Scenario">
    {#each Object.values(SCENARIOS) as s (s.id)}
      <button type="button" class:active={scenarioId === s.id} aria-pressed={scenarioId === s.id} onclick={() => (scenarioId = s.id)}>
        {s.label}
      </button>
    {/each}
  </div>

  <div class="layout">
    <ol class="gates" aria-label="Requirements for merging">
      {#each GATES as gate, i (gate.id)}
        {@const st = gate.states[scenarioId]}
        {@const src = sourceById(gate.source)}
        <li>
          <button
            type="button"
            class="gate {st.status}"
            class:lit={litGates?.has(gate.id)}
            class:dim={litGates && !litGates.has(gate.id)}
            style={`--src: var(--cc-${src.color})`}
            aria-pressed={selection?.kind === 'gate' && selection.id === gate.id}
            onclick={() => toggle('gate', gate.id)}
          >
            <span class="mark" aria-hidden="true">{STATUS_MARK[st.status]}</span>
            <span class="body">
              <span class="gate-title"><span class="num">{i + 1}.</span> {gate.title}</span>
              <span class="gate-note">{st.note}</span>
            </span>
            <span class="state">{STATUS_LABEL[st.status]}</span>
          </button>
        </li>
      {/each}
    </ol>

    <div class="sources" role="group" aria-label="Where requirements are configured">
      <p class="label">Configured in</p>
      {#each SOURCES as src (src.id)}
        <button
          type="button"
          class="source"
          class:lit={litSources?.has(src.id)}
          class:dim={litSources && !litSources.has(src.id)}
          style={`--src: var(--cc-${src.color})`}
          aria-pressed={selection?.kind === 'source' && selection.id === src.id}
          onclick={() => toggle('source', src.id)}
        >
          <strong>{src.name}</strong>
          <span>{src.where}</span>
        </button>
      {/each}
    </div>
  </div>

  <div class="result" class:ok={scenarioId === 'allowed'} class:bad={scenarioId === 'blocked'}>
    <span class="mark" aria-hidden="true">{scenarioId === 'allowed' ? '✓' : '✕'}</span>
    <strong>{scenario.verdict}</strong>
    <span>{scenario.summary}</span>
  </div>

  <p class="info" aria-live="polite" aria-atomic="true"><strong>{infoLead}.</strong> {infoText}</p>
</section>

<style>
  .mg {
    box-sizing: border-box;
    width: 100%;
    padding: clamp(1.1rem, 3vw, 2rem);
    background: var(--card-grad);
    border: 1px solid var(--border);
    border-radius: calc(var(--radius) + 2px);
    box-shadow: var(--shadow);
    color: var(--text);
  }
  .mg * { box-sizing: border-box; }
  h2, p { margin: 0; }
  .section-head { display: flex; gap: 1rem; align-items: flex-start; margin-bottom: 1.25rem; }
  .section-badge {
    display: inline-grid; flex: 0 0 auto; width: 2.25rem; height: 2.25rem; place-items: center;
    border-radius: var(--radius-pill); background: var(--accent-grad); color: var(--on-accent); font-weight: 800;
  }
  h2 { font-size: clamp(1.4rem, 3.4vw, 1.9rem); line-height: 1.1; letter-spacing: -0.03em; }
  .section-head p { margin-top: 0.6rem; color: var(--muted); line-height: 1.55; }
  code { font-family: var(--font-mono); font-size: 0.9em; }

  .toggle { display: inline-flex; gap: 4px; padding: 4px; margin-bottom: 1.25rem; border: 1px solid var(--border); border-radius: var(--radius-pill); background: var(--surface); }
  .toggle button {
    padding: 0.4rem 1rem; border: 0; border-radius: var(--radius-pill); background: transparent;
    color: var(--muted); font: inherit; font-weight: 700; cursor: pointer;
  }
  .toggle button.active { background: var(--accent); color: var(--on-accent); }

  .layout { display: grid; grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr); gap: 1.5rem; align-items: start; }
  .gates { display: grid; gap: 0.7rem; margin: 0; padding: 0; list-style: none; }

  button.gate, button.source {
    width: 100%; text-align: left; font: inherit; color: var(--text); cursor: pointer;
    background: var(--surface-2); border: 1px solid var(--border-strong); border-radius: var(--radius-sm);
    transition: border-color var(--dur) var(--ease), background var(--dur) var(--ease);
  }
  button.gate { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; gap: 0.8rem; align-items: center; padding: 0.8rem 1rem; border-left: 4px solid var(--src); }
  button.gate.pass { --state: var(--ok); }
  button.gate.fail { --state: var(--bad); }
  button.gate.pending { --state: var(--warn); }
  .mark {
    display: inline-grid; width: 1.6rem; height: 1.6rem; place-items: center; border: 1px solid currentColor;
    border-radius: var(--radius-pill); font-size: 0.85rem; font-weight: 800; color: var(--state, currentColor);
  }
  .body { display: grid; gap: 0.2rem; min-width: 0; }
  .gate-title { font-weight: 750; line-height: 1.25; }
  .num { color: var(--muted); }
  .gate-note { color: var(--muted); font-size: 0.88rem; line-height: 1.4; }
  .state { color: var(--state); font-size: 0.78rem; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; }

  .sources { display: grid; gap: 0.7rem; }
  .label { color: var(--muted); font-size: 0.75rem; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; }
  button.source { display: grid; gap: 0.25rem; padding: 0.8rem 1rem; border-left: 4px solid var(--src); }
  button.source span { color: var(--muted); font-size: 0.85rem; line-height: 1.4; }

  button.lit { border-color: var(--src); background: color-mix(in srgb, var(--src) 14%, var(--surface-2)); }
  button.dim { border-color: var(--border); background: var(--surface); }
  button.dim .gate-note, button.dim span, button.dim .num { color: var(--muted); }
  button.dim .state, button.dim .mark { color: var(--muted); }
  button:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

  .result {
    display: flex; flex-wrap: wrap; gap: 0.6rem; align-items: center; margin-top: 1.25rem; padding: 0.9rem 1.1rem;
    border: 1px solid var(--state); border-radius: var(--radius-sm);
    background: color-mix(in srgb, var(--state) 12%, transparent);
  }
  .result.ok { --state: var(--ok); }
  .result.bad { --state: var(--bad); }
  .result span:last-child { color: var(--muted); }

  .info { margin-top: 1rem; padding: 0.8rem 1rem; border-radius: var(--radius-sm); background: var(--accent-soft); line-height: 1.5; }

  @media (max-width: 650px) {
    .layout { grid-template-columns: 1fr; }
    button.gate { grid-template-columns: auto minmax(0, 1fr); }
    .state { grid-column: 2; }
  }
</style>
