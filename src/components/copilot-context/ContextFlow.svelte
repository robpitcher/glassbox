<script lang="ts">
  import { MODES, OUTPUT_LABELS, SOURCES_NODES, SUPPLY_LABELS, type ModeId, type OutputKind, type SourceId } from './data';

  const task = 'Add rate limiting to the login endpoint.';
  const sourceMap = new Map(SOURCES_NODES.map((source) => [source.id, source]));
  const modeIds = MODES.map((mode) => mode.id);

  let selectedId = $state<ModeId>('completions');
  const selected = $derived(MODES.find((mode) => mode.id === selectedId) ?? MODES[0]);
  const activeSourceIds = $derived(new Set<SourceId>(selected.sources.map((source) => source.id)));
  const sourceSupply = $derived(new Map(selected.sources.map((source) => [source.id, source.supply])));
  const activeOutputs = $derived(new Set<OutputKind>(selected.outputs));
  const selectedIndex = $derived(modeIds.indexOf(selectedId));

  function selectMode(id: ModeId) {
    selectedId = id;
  }

  function handleTabsKeydown(event: KeyboardEvent) {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();

    const nextIndex =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? modeIds.length - 1
          : event.key === 'ArrowRight'
            ? (selectedIndex + 1) % modeIds.length
            : (selectedIndex - 1 + modeIds.length) % modeIds.length;

    selectedId = modeIds[nextIndex];
    requestAnimationFrame(() => {
      document.querySelector<HTMLButtonElement>(`[data-mode="${modeIds[nextIndex]}"]`)?.focus();
    });
  }

  const outputPosition = (kind: OutputKind) => {
    if (kind === 'action') return { x: 626, y: 310 };
    if (kind === 'answer') return { x: 626, y: 198 };
    return { x: 626, y: 110 };
  };

  const suggestionPos = outputPosition('suggestion');
  const answerPos = outputPosition('answer');
  const actionPos = outputPosition('action');

  const pathFor = (id: SourceId) => {
    const source = sourceMap.get(id);
    if (!source) return '';
    const sourceY = source.y + 18;
    return `M ${source.x + 154} ${sourceY} C 252 ${sourceY}, 288 198, 350 198`;
  };

  const outputPath = (kind: OutputKind) => {
    const output = outputPosition(kind);
    return `M 470 198 C 518 198, 532 ${output.y}, ${output.x - 74} ${output.y}`;
  };
</script>

<section class="context-flow" aria-labelledby="context-flow-title">
  <div class="heading-row">
    <span class="badge" aria-hidden="true">1</span>
    <div>
      <h2 id="context-flow-title">One task, three context paths</h2>
      <p>Copilot’s context changes by experience: what is open, what you attach, and what your organization enables.</p>
    </div>
  </div>

  <div class="controls">
    <span class="show-label">Experience</span>
    <div class="segments" role="group" aria-label="Choose Copilot experience" onkeydown={handleTabsKeydown}>
      {#each MODES as mode (mode.id)}
        <button
          type="button"
          data-mode={mode.id}
          class:active={selectedId === mode.id}
          aria-pressed={selectedId === mode.id}
          onclick={() => selectMode(mode.id)}
        >
          {mode.label}
        </button>
      {/each}
    </div>
  </div>

  <div class="task-card" aria-label="Example developer task">
    <span>Example task</span>
    <strong>{task}</strong>
  </div>

  <div class="stage" aria-label={`${selected.label} context flow`}>
    <svg class="diagram" viewBox="0 0 760 410" role="img" aria-labelledby="diagram-title diagram-desc">
      <title id="diagram-title">{selected.label} context flow</title>
      <desc id="diagram-desc">{selected.caption} Solid paths are gathered automatically; dashed paths are attached or configured.</desc>

      <defs>
        <linearGradient id="hubGrad" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stop-color="var(--accent)" />
          <stop offset="1" stop-color="var(--accent-2)" />
        </linearGradient>
        <filter id="softGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="10" result="blur" />
          <feOffset dy="8" result="offset" />
          <feMerge>
            <feMergeNode in="offset" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <text class="column-label" x="36" y="30">Sources</text>
      <text class="column-label" x="378" y="30">Copilot</text>
      <text class="column-label" x="594" y="30">Output</text>

      <g class="legend" transform="translate(214 48)">
        <path d="M0 0h34" />
        <text x="44" y="5">Auto</text>
        <path class="dashed" d="M150 0h34" />
        <text x="194" y="5">Attach / configure</text>
      </g>

      {#each SOURCES_NODES as source (source.id)}
        {@const active = activeSourceIds.has(source.id)}
        {@const supply = sourceSupply.get(source.id)}
        <path
          class="flow-line"
          class:active
          class:dashed={supply === 'manual' || supply === 'configured'}
          d={pathFor(source.id)}
        />
      {/each}

      {#each selected.outputs as kind (kind)}
        <path class="flow-line active output-line" class:dashed={kind !== 'action'} d={outputPath(kind)} />
      {/each}

      {#each SOURCES_NODES as source (source.id)}
        {@const active = activeSourceIds.has(source.id)}
        {@const supply = sourceSupply.get(source.id)}
        <g class="source-node" class:active class:inactive={!active} transform={`translate(${source.x} ${source.y})`}>
          <rect width="154" height="36" rx="18" />
          <circle cx="18" cy="18" r="7" />
          <text x="34" y="23">{source.short}</text>
        </g>
      {/each}

      <g class="hub" transform="translate(410 198)" filter="url(#softGlow)">
        <circle class="hub-ring" r="66" />
        <circle class="hub-core" r="47" />
        <path class="hub-mark" d="M-22 -6c11-21 35-23 48-7 13 17 1 41-21 39-18-2-28-16-20-31 8-15 29-12 31 3" />
        <text y="90">Copilot hub</text>
      </g>

      <g class="output ghost" class:active={activeOutputs.has('suggestion')} transform={`translate(${suggestionPos.x} ${suggestionPos.y})`}>
        <rect x="-70" y="-32" width="140" height="64" rx="30" />
        <text y="4">{OUTPUT_LABELS.suggestion}</text>
      </g>

      <g class="output answer" class:active={activeOutputs.has('answer')} transform={`translate(${answerPos.x} ${answerPos.y})`}>
        <path d="M-70 -32h106a24 24 0 0 1 24 24v16a24 24 0 0 1-24 24h-77l-29 20v-20a24 24 0 0 1-24-24v-16a24 24 0 0 1 24-24Z" />
        <text y="4">{OUTPUT_LABELS.answer}</text>
      </g>

      <g class="output action" class:active={activeOutputs.has('action')} transform={`translate(${actionPos.x} ${actionPos.y})`}>
        <rect x="-70" y="-36" width="140" height="72" rx="20" />
        <g transform="translate(0 -10)">
          <path d="M-30 -9h32l12 9-12 9h-32l12-9Z" />
          <path d="M22 -12v24M38 -12v24" />
        </g>
        <text y="26">{OUTPUT_LABELS.action}</text>
      </g>

      <g class="initiator {selected.initiator}" transform="translate(548 384)">
        {#if selected.initiator === 'person'}
          <circle cx="0" cy="-9" r="8" />
          <path d="M-15 18c3-14 9-21 15-21s12 7 15 21Z" />
        {:else}
          <path d="M-16 -13h32l9 13-9 13h-32L-25 0Z" />
          <circle cx="-6" cy="0" r="3" />
          <circle cx="7" cy="0" r="3" />
        {/if}
        <text x="23" y="5">{selected.reviewer}</text>
      </g>

      <g class="scope-note" transform="translate(245 347)">
        <rect width="232" height="56" rx="18" />
        <text x="18" y="24">Scope: open, attach, or grant</text>
        <text x="18" y="42">Content exclusion can remove files</text>
      </g>
    </svg>

    <div class="mobile-flow" aria-hidden="true">
      <div class="mobile-sources">
        {#each SOURCES_NODES as source (source.id)}
          {@const active = activeSourceIds.has(source.id)}
          {@const supply = sourceSupply.get(source.id)}
          <span class:active class:inactive={!active}>{source.short}<em>{supply ? SUPPLY_LABELS[supply] : 'Not used'}</em></span>
        {/each}
      </div>
      <div class="mobile-hub">Copilot hub</div>
      <div class="mobile-outputs">
        {#each ['suggestion', 'answer', 'action'] as kind}
          <span class:active={activeOutputs.has(kind as OutputKind)}>{OUTPUT_LABELS[kind as OutputKind]}</span>
        {/each}
      </div>
    </div>
  </div>

  <div class="explainer" aria-live="polite">
    <span class="info" aria-hidden="true">i</span>
    <p><strong>{selected.title}</strong> <span>{selected.caption}</span></p>
  </div>
</section>

<style>
  .context-flow {
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

  .context-flow * {
    box-sizing: border-box;
  }

  .heading-row {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 1rem;
    align-items: start;
  }

  .badge {
    display: grid;
    width: 2.125rem;
    height: 2.125rem;
    place-items: center;
    border-radius: var(--radius-pill);
    background: var(--accent-grad);
    color: var(--on-accent);
    font-weight: 800;
    line-height: 1;
  }

  h2,
  p {
    margin: 0;
  }

  h2 {
    max-width: none;
    font-size: clamp(1.42rem, 2.35vw, 1.68rem);
    font-weight: 700;
    letter-spacing: -0.02em;
    line-height: 1.16;
  }

  .heading-row p {
    margin-top: 0.9rem;
    max-width: 72ch;
    color: var(--muted);
    font-size: 0.94rem;
    line-height: 1.55;
  }

  .controls {
    display: flex;
    flex-wrap: wrap;
    gap: 0.9rem 1.45rem;
    align-items: center;
    margin-top: 1.7rem;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    background: var(--surface-2);
    padding: 0.72rem clamp(0.85rem, 2vw, 1.4rem);
  }

  .show-label {
    color: var(--muted);
    font-size: 0.72rem;
    font-weight: 800;
    letter-spacing: 0.16em;
    text-transform: uppercase;
  }

  .segments {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    min-width: min(100%, 26rem);
    margin-left: auto;
    border: 1px solid var(--border);
    border-radius: var(--radius-pill);
    background: var(--bg);
    padding: 0.18rem;
  }

  button {
    font: inherit;
  }

  .segments button {
    border: 0;
    border-radius: var(--radius-pill);
    background: transparent;
    color: var(--muted);
    cursor: pointer;
    font-weight: 800;
    padding: 0.48rem 0.82rem;
    transition:
      background var(--dur) var(--ease),
      color var(--dur) var(--ease),
      box-shadow var(--dur) var(--ease);
  }

  .segments button.active {
    background: var(--accent-grad);
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--on-accent) 30%, transparent);
    color: var(--on-accent);
  }

  .segments button:focus-visible {
    outline: 2px solid var(--accent-2);
    outline-offset: 3px;
  }

  .task-card {
    display: grid;
    gap: 0.35rem;
    margin-top: 1rem;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    background: color-mix(in srgb, var(--surface) 72%, transparent);
    padding: 0.85rem 1rem;
  }

  .task-card span {
    color: var(--muted);
    font-size: 0.72rem;
    font-weight: 800;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }

  .task-card strong {
    font-size: clamp(1rem, 2vw, 1.18rem);
    letter-spacing: -0.01em;
  }

  .stage {
    margin-top: 1.25rem;
  }

  .diagram {
    display: block;
    width: 100%;
    height: auto;
    min-height: 30rem;
  }

  .column-label {
    fill: var(--muted);
    font-size: 13px;
    font-weight: 800;
    letter-spacing: 0.13em;
    text-transform: uppercase;
  }

  .legend text {
    fill: var(--muted);
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .flow-line {
    fill: none;
    stroke: var(--faint);
    stroke-linecap: round;
    stroke-width: 2;
    opacity: 0.2;
    transition:
      opacity var(--dur) var(--ease),
      stroke var(--dur) var(--ease),
      stroke-width var(--dur) var(--ease);
  }

  .flow-line.active {
    stroke: var(--accent-2);
    stroke-width: 3;
    opacity: 0.82;
  }

  .flow-line.dashed,
  .legend .dashed {
    stroke-dasharray: 7 8;
  }

  .legend path {
    fill: none;
    stroke: var(--accent-2);
    stroke-linecap: round;
    stroke-width: 3;
  }

  .source-node {
    transition:
      opacity var(--dur) var(--ease),
      transform var(--dur) var(--ease);
  }

  .source-node rect {
    fill: var(--surface-2);
    stroke: var(--border-strong);
    stroke-width: 1.5;
  }

  .source-node circle {
    fill: var(--faint);
    opacity: 0.65;
    stroke: none;
  }

  .source-node text {
    fill: var(--text);
    font-size: 12px;
    font-weight: 800;
    text-anchor: start;
  }

  .source-node.active rect {
    fill: color-mix(in srgb, var(--accent) 18%, var(--surface-2));
    stroke: var(--accent-2);
  }

  .source-node.active circle {
    fill: var(--accent-2);
    opacity: 1;
  }

  .source-node.inactive {
    opacity: 0.34;
  }

  .hub-ring {
    fill: color-mix(in srgb, var(--accent) 10%, transparent);
    stroke: color-mix(in srgb, var(--accent-2) 52%, transparent);
    stroke-width: 1.5;
  }

  .hub-core {
    fill: url(#hubGrad);
  }

  .hub-mark {
    fill: none;
    stroke: var(--on-accent);
    stroke-linecap: round;
    stroke-width: 7;
  }

  .hub text {
    fill: var(--text);
    font-size: 13px;
    font-weight: 900;
    letter-spacing: -0.01em;
    text-anchor: middle;
  }

  .output {
    opacity: 0.28;
    transition:
      opacity var(--dur) var(--ease),
      transform var(--dur) var(--ease);
  }

  .output.active {
    opacity: 1;
  }

  .output text {
    fill: var(--text);
    font-size: 13px;
    font-weight: 900;
    text-anchor: middle;
  }

  .ghost rect {
    fill: color-mix(in srgb, var(--accent-2) 11%, transparent);
    stroke: var(--accent-2);
    stroke-dasharray: 6 7;
    stroke-width: 2;
  }

  .ghost path {
    stroke: var(--accent-2);
    stroke-linecap: round;
    stroke-width: 4;
    opacity: 0.55;
  }

  .answer path:first-child {
    fill: color-mix(in srgb, var(--surface-2) 88%, transparent);
    stroke: color-mix(in srgb, var(--accent) 74%, var(--border));
    stroke-width: 2;
  }

  .action rect {
    fill: color-mix(in srgb, var(--accent) 72%, var(--accent-2));
    stroke: color-mix(in srgb, var(--on-accent) 28%, transparent);
    stroke-width: 2;
  }

  .action path {
    fill: none;
    stroke: var(--on-accent);
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-width: 4;
  }

  .action text {
    fill: var(--on-accent);
  }

  .initiator {
    fill: color-mix(in srgb, var(--surface-2) 84%, transparent);
    stroke: var(--border-strong);
    stroke-width: 2;
  }

  .initiator.agent {
    fill: color-mix(in srgb, var(--accent) 18%, var(--surface-2));
    stroke: var(--accent-2);
  }

  .initiator text {
    fill: var(--text);
    stroke: none;
    font-size: 14px;
    font-weight: 850;
  }

  .scope-note rect {
    fill: color-mix(in srgb, var(--surface-2) 82%, transparent);
    stroke: var(--border);
  }

  .scope-note text {
    fill: var(--muted);
    font-size: 12px;
    font-weight: 750;
  }

  .mobile-flow {
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
    display: grid;
    width: 1.25rem;
    height: 1.25rem;
    flex: 0 0 auto;
    place-items: center;
    border-radius: var(--radius-pill);
    background: var(--accent);
    color: var(--on-accent);
    font-size: 0.78rem;
    font-weight: 900;
    line-height: 1;
  }

  .explainer p {
    color: var(--muted);
    font-size: 0.94rem;
    line-height: 1.55;
  }

  .explainer strong {
    color: var(--text);
  }

  @container (max-width: 640px) {
    .context-flow {
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

    .controls {
      display: grid;
      gap: 0.65rem;
    }

    .segments {
      width: 100%;
      min-width: 0;
      margin-left: 0;
    }

    .segments button {
      padding-inline: 0.42rem;
    }

    .diagram {
      display: none;
    }

    .mobile-flow {
      display: grid;
      gap: 0.9rem;
    }

    .mobile-sources,
    .mobile-outputs {
      display: grid;
      gap: 0.55rem;
    }

    .mobile-sources {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .mobile-sources span,
    .mobile-outputs span,
    .mobile-hub {
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      background: var(--surface-2);
      padding: 0.75rem;
      color: var(--muted);
      font-weight: 850;
      text-align: center;
    }

    .mobile-sources span.active,
    .mobile-outputs span.active {
      border-color: var(--accent-2);
      background: color-mix(in srgb, var(--accent) 18%, var(--surface-2));
      color: var(--text);
    }

    .mobile-sources span.inactive {
      opacity: 0.42;
    }

    .mobile-sources em {
      display: block;
      margin-top: 0.25rem;
      color: var(--muted);
      font-size: 0.72rem;
      font-style: normal;
    }

    .mobile-hub {
      position: relative;
      background: var(--accent-grad);
      color: var(--on-accent);
    }

    .mobile-hub::before,
    .mobile-hub::after {
      content: '↓';
      position: absolute;
      left: 50%;
      color: var(--muted);
      transform: translateX(-50%);
    }

    .mobile-hub::before {
      top: -1rem;
    }

    .mobile-hub::after {
      bottom: -1rem;
    }
  }

  @media (prefers-reduced-motion: no-preference) {
    .hub-ring {
      animation: pulse var(--dur) var(--ease);
    }

    @keyframes pulse {
      0% {
        transform: scale(0.96);
        opacity: 0.68;
      }
      100% {
        transform: scale(1);
        opacity: 1;
      }
    }
  }
</style>
