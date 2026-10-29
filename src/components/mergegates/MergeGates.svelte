<script lang="ts">
  import { GATES, RESULT, SCENARIOS, SOURCES, type ScenarioId } from './data';

  let scenario = $state<ScenarioId>('blocked');
  let selected = $state<string | null>(null);

  const gate = $derived(GATES.find((g) => g.id === selected) ?? null);
  const failing = $derived(GATES.filter((g) => g.outcome[scenario].status === 'fail'));
  const result = $derived(failing.length === 0 ? 'allowed' : 'blocked');

  function pick(id: string) {
    selected = selected === id ? null : id;
  }

  function onKey(e: KeyboardEvent) {
    if (e.key === 'Escape') selected = null;
  }
</script>

<svelte:window onkeydown={onKey} />

<section class="mg card" aria-labelledby="mg-title">
  <div class="section-head">
    <span class="badge" aria-hidden="true">1</span>
    <div>
      <h2 id="mg-title">Walk a pull request to the merge button</h2>
      <p>One PR into <code>acme-web/checkout</code> main. Select a gate to see where it is configured.</p>
    </div>
  </div>

  <div class="toggle" role="group" aria-label="Scenario">
    {#each Object.entries(SCENARIOS) as [id, s] (id)}
      <button type="button" aria-pressed={scenario === id} onclick={() => (scenario = id as ScenarioId)}>
        <strong>{s.label}</strong> <span>{s.blurb}</span>
      </button>
    {/each}
  </div>

  <ol class="track" aria-label="Merge gates in order">
    {#each GATES as g, i (g.id)}
      {@const o = g.outcome[scenario]}
      <li>
        <button
          type="button"
          class="gate"
          class:dim={selected !== null && selected !== g.id}
          class:fail={o.status === 'fail'}
          class:pass={o.status === 'pass'}
          aria-pressed={selected === g.id}
          onclick={() => pick(g.id)}
        >
          <span class="step">{i + 1}</span>
          <strong class="name">{g.name}</strong>
          <span class="status" class:fail={o.status === 'fail'}>
            <span aria-hidden="true">{o.status === 'pass' ? '✓' : '✕'}</span>
            {o.status === 'pass' ? 'Met' : 'Not met'}
          </span>
          <span class="chip src-{g.source}" class:hot={selected === g.id}>{SOURCES[g.source].label}</span>
          <span class="actor">
            <span class="actor-mark actor-{g.actor}" aria-hidden="true"></span>
            {g.actorLabel}
          </span>
        </button>
      </li>
    {/each}
    <li class="end">
      <div class="result" class:ok={result === 'allowed'} class:bad={result === 'blocked'}>
        <span aria-hidden="true">{result === 'allowed' ? '✓' : '✕'}</span>
        <strong>{RESULT[result].title}</strong>
      </div>
    </li>
  </ol>

  <div class="legend" aria-label="Where gates are configured">
    {#each Object.entries(SOURCES) as [id, s] (id)}
      <span class="chip src-{id}" class:hot={gate?.source === id}>{s.label}</span>
    {/each}
    <span class="actor"><span class="actor-mark actor-human" aria-hidden="true"></span>person</span>
    <span class="actor"><span class="actor-mark actor-automation" aria-hidden="true"></span>automation</span>
  </div>

  <p class="info" aria-live="polite">
    {#if gate}
      {@const o = gate.outcome[scenario]}
      <strong>{gate.name}: {o.status === 'pass' ? 'met' : 'not met'}.</strong>
      {gate.requirement} {o.detail} Configured in {SOURCES[gate.source].label.toLowerCase()}: {SOURCES[gate.source].where}.
    {:else}
      <strong>{RESULT[result].title}.</strong>
      {RESULT[result].detail}
      {#if failing.length}Blocked by: {failing.map((g) => g.name.toLowerCase()).join(' and ')}.{/if}
    {/if}
  </p>
</section>

<style>
  .mg { padding: clamp(1.25rem, 3vw, 2rem); container-type: inline-size; }
  .section-head { display: flex; gap: 1rem; margin-bottom: 1.25rem; }
  .section-head h2 { margin: 0; font-size: clamp(1.35rem, 3vw, 1.8rem); letter-spacing: -0.03em; line-height: 1.1; }
  .section-head p { margin: 0.6rem 0 0; color: var(--muted); }
  .badge { flex: none; display: grid; place-items: center; width: 2.25rem; height: 2.25rem; border-radius: var(--radius-pill); background: var(--accent-grad, var(--accent)); color: var(--on-accent); font-weight: 800; }

  .toggle { display: inline-flex; flex-wrap: wrap; gap: 4px; padding: 4px; margin-bottom: 1.25rem; border: 1px solid var(--border-strong); border-radius: var(--radius-pill); }
  .toggle button { padding: 8px 16px; border: 0; border-radius: var(--radius-pill); background: transparent; color: var(--muted); font: inherit; cursor: pointer; }
  .toggle button strong { color: var(--text); }
  .toggle button[aria-pressed='true'] { background: var(--accent-soft); box-shadow: inset 0 0 0 1px var(--accent); }

  .track { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 22px; list-style: none; margin: 0; padding: 0; }
  .track li { position: relative; display: flex; min-width: 0; }
  .track li:not(:last-child)::after { content: ''; position: absolute; top: 50%; left: 100%; width: 22px; height: 2px; background: var(--border-strong); }

  .gate { display: flex; flex-direction: column; align-items: flex-start; gap: 8px; width: 100%; padding: 14px; text-align: left; color: var(--text); font: inherit; background: var(--surface); border: 1px solid var(--border-strong); border-radius: var(--radius); cursor: pointer; }
  .gate.pass { border-color: color-mix(in srgb, var(--ok) 55%, var(--border)); }
  .gate.fail { border-color: var(--bad); }
  .gate.dim { border-color: var(--border); background: transparent; }
  .gate.dim .actor, .gate.dim .status { color: var(--muted); }
  .gate[aria-pressed='true'] { box-shadow: 0 0 0 2px var(--accent); }
  .gate:focus-visible, .toggle button:focus-visible { outline: 2px solid var(--accent-2); outline-offset: 2px; }
  .step { display: grid; place-items: center; width: 1.5rem; height: 1.5rem; border-radius: var(--radius-pill); background: var(--surface-2); font-size: 0.8rem; font-weight: 800; }
  .name { line-height: 1.2; }
  .status { font-size: 0.85rem; font-weight: 700; color: var(--ok); }
  .status.fail { color: var(--bad); }
  .actor { display: inline-flex; align-items: center; gap: 6px; font-size: 0.8rem; color: var(--muted); }
  .actor-mark { width: 10px; height: 10px; flex: none; }
  .actor-human { border-radius: 50%; background: var(--text); }
  .actor-automation { border-radius: 2px; background: var(--accent-2); transform: rotate(45deg) scale(0.85); }

  .chip { padding: 3px 10px; border-radius: var(--radius-pill); border: 1px solid var(--cc, var(--border-strong)); color: var(--text); font-size: 0.78rem; font-weight: 700; }
  .src-ruleset { --cc: var(--cc-3); }
  .src-protection { --cc: var(--cc-4); }
  .chip.hot { background: color-mix(in srgb, var(--cc) 25%, transparent); }

  .end { align-items: center; }
  .result { width: 100%; padding: 16px 12px; text-align: center; border: 2px solid; border-radius: var(--radius); display: grid; gap: 4px; }
  .result.ok { border-color: var(--ok); color: var(--ok); }
  .result.bad { border-color: var(--bad); color: var(--bad); }

  .legend { display: flex; flex-wrap: wrap; align-items: center; gap: 10px 16px; margin-top: 1.25rem; }
  .info { margin: 1rem 0 0; padding: 12px 16px; border-radius: var(--radius); background: var(--surface-2); line-height: 1.5; }
  .info strong { color: var(--text); }

  @container (max-width: 760px) {
    .track { grid-template-columns: 1fr; gap: 22px; }
    .track li:not(:last-child)::after { top: 100%; left: 50%; width: 2px; height: 22px; }
  }
  @media (prefers-reduced-motion: no-preference) {
    .gate { transition: border-color 0.15s, box-shadow 0.15s; }
  }
</style>
