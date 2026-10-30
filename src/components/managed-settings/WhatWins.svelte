<script lang="ts">
  import InfoBar from '../ui/InfoBar.svelte';
  import SectionHead from '../ui/SectionHead.svelte';
  import SegmentedToggle from '../ui/SegmentedToggle.svelte';
  import { KEYS, KEY_ORDER, LAYERS, OUTCOME_LABEL, STACK_LABELS, explainLayer, type KeyId } from './data';

  let keyId = $state<KeyId>('model');
  let selected = $state<number | null>(null);

  const k = $derived(KEYS[keyId]);
  const info = $derived(explainLayer(keyId, selected));

  const tone = (i: number) => (selected === null ? '' : i === selected ? 'is-selected' : 'is-dim');

  function setKey(id: KeyId) {
    keyId = id;
    selected = null;
  }

  function onkeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') selected = null;
  }

  const options = KEY_ORDER.map((id) => ({ id, label: KEYS[id].label }));
</script>

<!--
  THESIS: Policy gates first; then managed sources outrank the user's own settings, MDM first, except permission rules, which combine.
  STORY: Toggle a key to see which layer wins and whether the result is a default, a lock, or a merged list.
-->
<section class="visual" aria-labelledby="managed-wins-title" {onkeydown}>
  <SectionHead n={3} id="managed-wins-title" title="What wins">
    Policy gates first. Then managed sources outrank the user's settings, top to bottom.
  </SectionHead>

  <div class="visual-controls">
    <span class="visual-label" id="managed-wins-label">Key</span>
    <SegmentedToggle {options} value={keyId} onchange={setKey} labelledby="managed-wins-label" />
    <span class="visual-hint">Select a layer</span>
  </div>

  <div class="stage">
    <div class="gate">
      <span class="visual-label">{STACK_LABELS.policy}</span>
      <strong>{k.gate.title}</strong>
      <span class="muted">{k.gate.text}</span>
    </div>

    <div class="key-line">
      <code>{k.key}</code>
      <span class="muted">{STACK_LABELS.clients}: {k.clients}</span>
    </div>

    <ol class="stack">
      {#each LAYERS as name, i (name)}
        {@const layer = k.layers[i]}
        <li>
          <button
            type="button"
            class="layer {layer.outcome} {tone(i)}"
            aria-pressed={selected === i}
            onclick={() => (selected = selected === i ? null : i)}
          >
            <span class="rank" aria-hidden="true">{i + 1}</span>
            <strong class="name">{name}</strong>
            <span class="val">
              {#if layer.value === null}<span class="muted">—</span>{:else if layer.code}<code>{layer.value}</code>{:else}{layer.value}{/if}
            </span>
            <span class="tag {layer.outcome}">{OUTCOME_LABEL[layer.outcome]}</span>
          </button>
        </li>
      {/each}
    </ol>

    <div class="result {k.tag.tone}">
      <span class="visual-label">{STACK_LABELS.result}</span>
      <span class="tag {k.tag.tone}">{k.tag.text}</span>
      {#if k.resultCode}<code>{k.result}</code>{:else}<span>{k.result}</span>{/if}
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
    gap: 0.6rem;
    margin-top: 1.25rem;
  }

  .muted {
    color: var(--muted);
  }

  code {
    font-family: var(--font-mono);
    font-size: 0.85rem;
    overflow-wrap: anywhere;
  }

  .gate {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 0.35rem 0.8rem;
    padding: 0.7rem 0.9rem;
    border: 1.5px solid var(--cc-0);
    border-radius: var(--radius-sm);
    background: color-mix(in srgb, var(--cc-0) 10%, transparent);
  }

  .gate strong {
    color: var(--cc-0);
  }

  .gate .muted,
  .key-line .muted {
    font-size: 0.85rem;
  }

  .key-line {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 0.35rem 0.8rem;
    padding: 0.2rem 0.2rem 0;
  }

  .key-line code {
    color: var(--text);
    font-weight: 700;
  }

  .stack {
    display: grid;
    gap: 0.45rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .layer {
    display: grid;
    grid-template-columns: 1.6rem 9rem minmax(0, 1fr) auto;
    align-items: center;
    gap: 0.8rem;
    width: 100%;
    padding: 0.65rem 0.85rem;
    border: 1px solid color-mix(in srgb, var(--cc-1) 30%, var(--border));
    border-radius: var(--radius-sm);
    background: var(--surface-solid);
    text-align: left;
    transition:
      color var(--dur) var(--ease),
      border-color var(--dur) var(--ease),
      box-shadow var(--dur) var(--ease);
  }

  .layer.wins,
  .layer.applies {
    border-color: color-mix(in srgb, var(--ok) 60%, var(--border));
  }

  .layer:hover {
    border-color: var(--accent);
  }

  .layer.is-selected {
    border-color: var(--accent-2);
    box-shadow: 0 0 0 1px var(--accent-2);
  }

  .layer.is-dim {
    border-color: var(--border);
    color: var(--muted);
  }

  .rank {
    color: var(--muted);
    font-weight: 800;
    text-align: center;
  }

  .val {
    min-width: 0;
  }

  .layer.overridden .val code,
  .layer.overridden .val {
    text-decoration: line-through;
    text-decoration-color: var(--muted);
  }

  .tag {
    justify-self: end;
    padding: 0.15rem 0.55rem;
    border: 1px solid var(--border-strong);
    border-radius: var(--radius-pill);
    color: var(--muted);
    font-size: 0.72rem;
    font-weight: 800;
    white-space: nowrap;
  }

  .tag.unset {
    border-style: dashed;
  }

  .tag.wins,
  .tag.applies,
  .tag.ok {
    border-color: color-mix(in srgb, var(--ok) 45%, transparent);
    color: var(--text);
  }

  .tag.bad {
    border-color: color-mix(in srgb, var(--bad) 45%, transparent);
    color: var(--bad);
  }

  .layer.is-dim .tag {
    border-color: var(--border);
    color: var(--muted);
  }

  .result {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem 0.8rem;
    margin-top: 0.2rem;
    padding: 0.7rem 0.9rem;
    border: 1px solid color-mix(in srgb, var(--ok) 55%, var(--border));
    border-radius: var(--radius-sm);
    background: color-mix(in srgb, var(--ok) 8%, transparent);
  }

  .result.bad {
    border-color: color-mix(in srgb, var(--bad) 55%, var(--border));
    background: color-mix(in srgb, var(--bad) 8%, transparent);
  }

  .result .tag {
    justify-self: auto;
  }

  @container (max-width: 560px) {
    .layer {
      grid-template-columns: 1.2rem minmax(0, 1fr) auto;
      gap: 0.3rem 0.6rem;
    }

    .tag {
      grid-row: 1;
      grid-column: 3;
    }

    .val {
      grid-row: 2;
      grid-column: 2 / -1;
    }
  }
</style>
