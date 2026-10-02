<script lang="ts">
  import Segmented from '../shared/Segmented.svelte';
  import { STAGES, type StageId } from './data';

  const options = STAGES.map((stage) => ({ value: stage.id, label: stage.tabLabel }));
  const stageIds = STAGES.map((stage) => stage.id);

  let selectedId = $state<StageId>('repos');
  const selectedIndex = $derived(stageIds.indexOf(selectedId));
  const stage = $derived(STAGES[selectedIndex] ?? STAGES[0]);
  const adoTiles = $derived(stage.tiles.filter((tile) => tile.zone === 'ado'));
  const githubTiles = $derived(stage.tiles.filter((tile) => tile.zone === 'github'));

  function step(delta: number) {
    selectedId = stageIds[(selectedIndex + delta + stageIds.length) % stageIds.length];
  }
</script>

<!--
  THESIS: The roadmap is a staged handoff map, not a mandate to replace every Azure DevOps service at once.
  OWN-WORLD: Midnight Glass with abstract service tiles, fine connector lines, and one pulse marking the current handoff.
  STORY: Readers see what remains the system of record, what is linked, and what moves at each transition.
  FIRST VIEWPORT: Controls lead into two zones split by a boundary, with compact stage facts below the diagram.
  FORM: Existing wiki card language extended into a responsive migration map; no logos, no product UI mimicry.
-->
<section class="ado-roadmap" aria-labelledby="ado-roadmap-title">
  <div class="heading-row">
    <span class="badge" aria-hidden="true">{stage.number}</span>
    <div>
      <h2 id="ado-roadmap-title">A phased roadmap keeps work connected</h2>
      <p>Move one system of record at a time, and keep live integrations visible while teams transition.</p>
    </div>
  </div>

  <div class="controls">
    <span class="show-label">Stage</span>
    <Segmented bind:value={selectedId} label="Choose migration stage" {options} />
    <div class="step-buttons" aria-label="Move between stages">
      <button type="button" onclick={() => step(-1)}>Previous</button>
      <button type="button" onclick={() => step(1)}>Next</button>
    </div>
  </div>

  <div class:optional={stage.id === 'planning'} class="stage-shell" aria-describedby="stage-caption">
    <div class="zone zone-ado" aria-label="Azure DevOps services">
      <h3>Azure DevOps</h3>
      <div class="tile-grid">
        {#each adoTiles as tile (tile.id)}
          <span class={`tile tile-${tile.id} ${tile.state}`} aria-label={`${tile.label}: ${tile.state}`}>
            {tile.label}
            {#if tile.state === 'moving'}<i aria-hidden="true"></i>{/if}
          </span>
        {/each}
      </div>
    </div>

    <svg class="links" viewBox="0 0 1000 460" role="img" aria-label="Current integrations across the boundary">
      <line class="boundary" x1="500" x2="500" y1="42" y2="418"></line>
      {#each stage.integrations as link (link.label)}
        <path class:dashed={link.tone === 'dashed'} d={link.path}></path>
        <text x={link.labelX} y={link.labelY}>{link.label}</text>
      {/each}
    </svg>

    <div class="mobile-links" aria-hidden="true">
      {#each stage.integrations as link (link.label)}
        <span>{link.from} ↔ {link.to}<em>{link.label}</em></span>
      {/each}
    </div>

    <div class="zone zone-github" aria-label="GitHub services">
      <h3>GitHub</h3>
      <div class="tile-grid">
        {#each githubTiles as tile (tile.id)}
          <span class={`tile tile-${tile.id} ${tile.state}`} aria-label={`${tile.label}: ${tile.state}`}>
            {tile.label}
            {#if tile.state === 'moving'}<i aria-hidden="true"></i>{/if}
          </span>
        {/each}
      </div>
    </div>
  </div>

  <div class="explainer" aria-live="polite">
    <span class="info" aria-hidden="true">i</span>
    <p id="stage-caption"><strong>{stage.title}.</strong> <span>{stage.caption}</span></p>
  </div>

  <dl class="stage-notes" aria-label="Stage notes">
    <div>
      <dt>Benefit</dt>
      <dd>{stage.benefit}</dd>
    </div>
    <div>
      <dt>Prerequisite</dt>
      <dd>{stage.prerequisite}</dd>
    </div>
    <div>
      <dt>Tradeoff</dt>
      <dd>{stage.tradeoff}</dd>
    </div>
  </dl>
</section>

<style>
  .ado-roadmap {
    container-type: inline-size;
    overflow: hidden;
    border: 1px solid var(--border);
    border-radius: calc(var(--radius) + 2px);
    background: var(--card-grad);
    box-shadow: var(--shadow);
    color: var(--text);
    font-family: var(--font-sans);
    padding: clamp(1.25rem, 3vw, 2.25rem);
  }

  .ado-roadmap * {
    box-sizing: border-box;
  }

  .heading-row {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 1rem;
    align-items: start;
  }

  .badge,
  .info {
    display: grid;
    place-items: center;
    border-radius: var(--radius-pill);
    background: var(--accent-grad);
    color: var(--on-accent);
    font-weight: 850;
    line-height: 1;
  }

  .badge {
    width: 2.125rem;
    height: 2.125rem;
  }

  h2,
  h3,
  p,
  dl,
  dd {
    margin: 0;
  }

  h2 {
    max-width: none;
    font-size: clamp(1.42rem, 2.35vw, 1.74rem);
    line-height: 1.16;
    letter-spacing: -0.025em;
  }

  .heading-row p {
    max-width: 72ch;
    margin-top: 0.9rem;
    color: var(--muted);
    font-size: 0.94rem;
    line-height: 1.55;
  }

  .controls {
    display: flex;
    flex-wrap: wrap;
    gap: 0.8rem 1rem;
    align-items: center;
    margin-top: 1.7rem;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    background: var(--surface-2);
    padding: 0.72rem clamp(0.85rem, 2vw, 1.4rem);
  }

  .show-label,
  dt {
    color: var(--muted);
    font-size: 0.72rem;
    font-weight: 800;
    letter-spacing: 0.16em;
    text-transform: uppercase;
  }

  .step-buttons {
    display: inline-flex;
    gap: 0.5rem;
    margin-left: auto;
  }

  button {
    min-height: 2rem;
    border: 1px solid var(--border);
    border-radius: var(--radius-pill);
    background: color-mix(in srgb, var(--surface) 76%, transparent);
    color: var(--text);
    cursor: pointer;
    font: inherit;
    font-size: 0.84rem;
    font-weight: 760;
    padding: 0.35rem 0.82rem;
    transition:
      border-color var(--dur) var(--ease),
      color var(--dur) var(--ease),
      transform var(--dur) var(--ease);
  }

  button:hover {
    border-color: var(--border-strong);
    color: var(--accent-2);
  }

  button:focus-visible {
    outline: 2px solid var(--accent-2);
    outline-offset: 3px;
  }

  .stage-shell {
    position: relative;
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: clamp(3.25rem, 8vw, 5rem);
    margin-top: 1.25rem;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background:
      radial-gradient(circle at 22% 16%, color-mix(in srgb, var(--accent) 16%, transparent), transparent 26%),
      radial-gradient(circle at 82% 80%, color-mix(in srgb, var(--accent-2) 14%, transparent), transparent 28%),
      color-mix(in srgb, var(--surface) 54%, transparent);
    padding: clamp(1rem, 2.6vw, 1.6rem);
  }

  .stage-shell.optional {
    border-style: dashed;
  }

  .zone {
    position: relative;
    z-index: 2;
    min-width: 0;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: color-mix(in srgb, var(--surface-2) 70%, transparent);
    padding: 1rem;
  }

  h3 {
    color: var(--muted);
    font-size: 0.82rem;
    font-weight: 850;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .tile-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.7rem;
    margin-top: 0.9rem;
  }

  .tile {
    position: relative;
    display: grid;
    min-height: 4.4rem;
    place-items: center;
    border: 1px solid var(--border-strong);
    border-radius: var(--radius-sm);
    color: var(--text);
    font-size: clamp(0.88rem, 1.5vw, 1rem);
    font-weight: 850;
    letter-spacing: -0.015em;
    isolation: isolate;
    overflow: hidden;
    transition:
      opacity var(--dur) var(--ease),
      transform var(--dur) var(--ease),
      border-color var(--dur) var(--ease),
      background var(--dur) var(--ease);
  }

  .tile.record {
    border-color: color-mix(in srgb, var(--accent-2) 58%, var(--border));
    background: linear-gradient(135deg, color-mix(in srgb, var(--accent) 26%, var(--surface-2)), color-mix(in srgb, var(--accent-2) 13%, var(--surface-2)));
  }

  .tile.linked {
    border-color: color-mix(in srgb, var(--warn) 70%, var(--border));
    background: repeating-linear-gradient(
        135deg,
        color-mix(in srgb, var(--warn) 13%, transparent) 0 0.48rem,
        transparent 0.48rem 0.96rem
      ),
      color-mix(in srgb, var(--surface-2) 82%, transparent);
  }

  .tile.future {
    border-style: dashed;
    color: var(--muted);
    background: color-mix(in srgb, var(--surface) 48%, transparent);
    opacity: 0.66;
  }

  .tile.retired {
    border-style: dashed;
    color: color-mix(in srgb, var(--muted) 76%, transparent);
    background: color-mix(in srgb, var(--surface) 32%, transparent);
    opacity: 0.45;
  }

  .tile.moving {
    transform: translateY(-0.12rem);
    border-color: var(--accent-2);
    background: var(--accent-grad);
    color: var(--on-accent);
    box-shadow: 0 1rem 2.4rem color-mix(in srgb, var(--accent) 22%, transparent);
  }

  .tile.moving i {
    position: absolute;
    width: 1.05rem;
    height: 1.05rem;
    right: 0.65rem;
    top: 0.65rem;
    border-radius: var(--radius-pill);
    background: var(--on-accent);
  }

  .tile.moving i::after {
    content: '';
    position: absolute;
    inset: -0.45rem;
    border: 1px solid var(--on-accent);
    border-radius: inherit;
    animation: pulse 1.8s var(--ease) infinite;
  }

  .links {
    position: absolute;
    inset: 0;
    z-index: 1;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }

  .links path {
    fill: none;
    stroke: var(--accent-2);
    stroke-linecap: round;
    stroke-width: 3;
  }

  .links path.dashed {
    stroke: var(--warn);
    stroke-dasharray: 9 10;
  }

  .links text {
    fill: var(--text);
    font-size: 24px;
    font-weight: 850;
    letter-spacing: -0.02em;
  }

  .boundary {
    stroke: var(--border-strong);
    stroke-dasharray: 5 8;
    stroke-width: 2;
  }

  .mobile-links {
    display: none;
  }

  .explainer {
    display: flex;
    gap: 0.75rem;
    align-items: flex-start;
    margin-top: 1.2rem;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    background: var(--surface-2);
    padding: 0.9rem 1rem;
  }

  .info {
    width: 1.25rem;
    height: 1.25rem;
    flex: 0 0 auto;
    font-size: 0.78rem;
  }

  .explainer p {
    color: var(--muted);
    font-size: 0.94rem;
    line-height: 1.55;
  }

  .explainer strong {
    color: var(--text);
  }

  .stage-notes {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.8rem;
    margin-top: 0.85rem;
  }

  .stage-notes div {
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    background: color-mix(in srgb, var(--surface) 64%, transparent);
    padding: 0.9rem 1rem;
  }

  dd {
    margin-top: 0.45rem;
    color: var(--text);
    font-size: 0.95rem;
    font-weight: 720;
    line-height: 1.35;
  }

  @keyframes pulse {
    from {
      opacity: 0.75;
      transform: scale(0.66);
    }

    to {
      opacity: 0;
      transform: scale(1.65);
    }
  }

  @container (max-width: 760px) {
    .controls {
      display: grid;
    }

    .step-buttons {
      margin-left: 0;
    }

    .stage-notes {
      grid-template-columns: 1fr;
    }
  }

  @container (max-width: 640px) {
    .ado-roadmap {
      padding: 1.1rem;
      border-radius: var(--radius);
    }

    .heading-row {
      gap: 0.75rem;
    }

    .badge {
      width: 2rem;
      height: 2rem;
    }

    .stage-shell {
      grid-template-columns: 1fr;
      gap: 0.8rem;
    }

    .links {
      display: none;
    }

    .mobile-links {
      display: grid;
      gap: 0.5rem;
    }

    .mobile-links span {
      display: flex;
      justify-content: space-between;
      gap: 0.8rem;
      border: 1px dashed var(--border-strong);
      border-radius: var(--radius-pill);
      color: var(--text);
      font-size: 0.85rem;
      font-weight: 760;
      padding: 0.45rem 0.7rem;
    }

    .mobile-links em {
      color: var(--warn);
      font-style: normal;
    }
  }

  @container (max-width: 430px) {
    .tile-grid {
      grid-template-columns: 1fr;
    }

    .controls :global(.segmented) {
      border-radius: var(--radius);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .tile,
    button,
    .links path {
      transition-duration: 0ms;
    }

    .tile.moving i::after {
      animation: none;
    }
  }
</style>
