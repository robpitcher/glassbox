<script lang="ts">
  import InfoBar from '../ui/InfoBar.svelte';
  import SectionHead from '../ui/SectionHead.svelte';
  import { PLANES, ROWS, explainRow, type RowId } from './data';

  let selected = $state<RowId | null>(null);
  const info = $derived(explainRow(selected));

  const tone = (id: RowId) => (!selected ? '' : id === selected ? 'is-selected' : 'is-dim');

  function onkeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') selected = null;
  }
</script>

<!--
  THESIS: Copilot policy and managed client settings are two separate control planes with different homes, owners, and reach.
  STORY: Two lanes side by side; select a row to compare one dimension across both.
-->
<section class="visual" aria-labelledby="managed-planes-title" {onkeydown}>
  <SectionHead n={1} id="managed-planes-title" title="Two control planes">
    Policy decides what Copilot can do. Client settings decide how supported clients behave.
  </SectionHead>

  <div class="visual-controls">
    <span class="visual-hint">Select a row to compare the two</span>
  </div>

  <div class="stage">
    <div class="heads">
      <span class="spacer"></span>
      {#each [PLANES.policy, PLANES.client] as p (p.title)}
        <div class="lane-head" style:--c={p.color}>
          <strong>{p.title}</strong>
          <span>{p.sub}</span>
        </div>
      {/each}
    </div>

    <div class="rows">
      {#each ROWS as row (row.id)}
        <button
          type="button"
          class="row {tone(row.id)}"
          aria-pressed={selected === row.id}
          onclick={() => (selected = selected === row.id ? null : row.id)}
        >
          <span class="row-label">{row.label}</span>
          <span class="cell" style:--c={PLANES.policy.color}>
            <span class="cell-lane">{PLANES.policy.title}</span>
            {row.policy}
          </span>
          <span class="cell" style:--c={PLANES.client.color}>
            <span class="cell-lane">{PLANES.client.title}</span>
            {row.client}
          </span>
        </button>
      {/each}
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

  .stage {
    --cols: 8.5rem minmax(0, 1fr) minmax(0, 1fr);
    display: grid;
    gap: 0.5rem;
    margin-top: 1.25rem;
  }

  .heads,
  .row {
    display: grid;
    grid-template-columns: var(--cols);
    gap: 0.5rem;
  }

  .rows {
    display: grid;
    gap: 0.5rem;
  }

  .lane-head {
    display: grid;
    gap: 0.1rem;
    padding: 0.65rem 0.85rem;
    border: 1.5px solid var(--c);
    border-radius: var(--radius-sm);
    background: color-mix(in srgb, var(--c) 10%, transparent);
  }

  .lane-head span {
    color: var(--muted);
    font-family: var(--font-mono);
    font-size: 0.85rem;
  }

  .row {
    padding: 0;
    border: 0;
    border-radius: var(--radius-sm);
    background: none;
    text-align: left;
  }

  .row:focus-visible {
    outline: 2px solid var(--accent-2);
    outline-offset: 3px;
  }

  .row-label {
    align-self: center;
    color: var(--muted);
    font-size: 0.72rem;
    font-weight: 800;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .cell {
    min-width: 0;
    padding: 0.65rem 0.85rem;
    border: 1px solid color-mix(in srgb, var(--c) 35%, var(--border));
    border-radius: var(--radius-sm);
    background: var(--surface-solid);
    font-size: 0.95rem;
    line-height: 1.45;
    transition:
      color var(--dur) var(--ease),
      border-color var(--dur) var(--ease),
      box-shadow var(--dur) var(--ease);
  }

  .cell-lane {
    display: none;
    color: var(--c);
    font-size: 0.72rem;
    font-weight: 800;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .row:hover .cell {
    border-color: var(--accent);
  }

  .row.is-selected .cell {
    border-color: var(--accent-2);
    box-shadow: 0 0 0 1px var(--accent-2);
  }

  .row.is-selected .row-label {
    color: var(--accent-2);
  }

  .row.is-dim .cell {
    border-color: var(--border);
    color: var(--muted);
  }

  .row.is-dim .cell-lane {
    color: var(--muted);
  }

  @container (max-width: 720px) {
    .stage {
      --cols: minmax(0, 1fr) minmax(0, 1fr);
    }

    .spacer {
      display: none;
    }

    .row-label {
      grid-column: 1 / -1;
      margin-top: 0.35rem;
    }
  }

  @container (max-width: 480px) {
    .stage {
      --cols: minmax(0, 1fr);
    }

    .heads {
      display: none;
    }

    .cell-lane {
      display: block;
      margin-bottom: 0.2rem;
    }
  }
</style>
