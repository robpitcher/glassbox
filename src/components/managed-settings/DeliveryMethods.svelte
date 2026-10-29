<script lang="ts">
  import InfoBar from '../ui/InfoBar.svelte';
  import SectionHead from '../ui/SectionHead.svelte';
  import SegmentedToggle from '../ui/SegmentedToggle.svelte';
  import { CLIENTS, CLOUD_CLIENT, DELIVERY, DELIVERY_ORDER, EXAMPLE, explainStep, type DeliveryId } from './data';

  let deliveryId = $state<DeliveryId>('server');
  let selected = $state<number | null>(null);

  const delivery = $derived(DELIVERY[deliveryId]);
  const info = $derived(explainStep(deliveryId, selected));

  const tone = (i: number) => (selected === null ? '' : i === selected ? 'is-selected' : 'is-dim');

  function setDelivery(id: DeliveryId) {
    deliveryId = id;
    selected = null;
  }

  function onkeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') selected = null;
  }

  const options = DELIVERY_ORDER.map((id) => ({ id, label: DELIVERY[id].label }));
</script>

<!--
  THESIS: The same managed-settings keys can arrive three ways, and each changes where the file lives, who deploys it, and who it reaches.
  STORY: Toggle the delivery method; the five-step track and the two example people update together.
-->
<section class="visual" aria-labelledby="managed-delivery-title" {onkeydown}>
  <SectionHead n={2} id="managed-delivery-title" title="Where the file lives">
    One set of keys, three ways to deliver it. Each one changes who it reaches.
  </SectionHead>

  <div class="visual-controls">
    <span class="visual-label" id="managed-delivery-label">Delivery</span>
    <SegmentedToggle {options} value={deliveryId} onchange={setDelivery} labelledby="managed-delivery-label" />
    <span class="visual-hint">Select a step for details</span>
  </div>

  <div class="stage">
    <ol class="track">
      {#each delivery.steps as step, i (step.label)}
        <li>
          <button type="button" class="step {tone(i)}" aria-pressed={selected === i} onclick={() => (selected = selected === i ? null : i)}>
            <span class="step-head"><span class="n" aria-hidden="true">{i + 1}</span><span class="visual-label">{step.label}</span></span>
            {#if step.paths}
              <span class="paths">{#each step.paths as p (p)}<code>{#each p.split(/(?<=[\\/])/) as part, j (j)}{part}<wbr />{/each}</code>{/each}</span>
            {:else if step.reach}
              <span class="clients">
                {#each CLIENTS as c (c)}
                  {@const off = step.reach === 'local' && c === CLOUD_CLIENT}
                  <span class="client" class:off>{c}{#if off}<span class="visually-hidden"> (not reached)</span>{/if}</span>
                {/each}
              </span>
            {:else}
              <strong>{step.value}</strong>
            {/if}
            <span class="note">{step.note}</span>
          </button>
        </li>
      {/each}
    </ol>

    <div class="example">
      <span class="visual-label">{EXAMPLE.label}</span>
      <code class="json">{EXAMPLE.json}</code>
      <span class="visual-label">{EXAMPLE.reaches}</span>
      <span class="people">
        {#each delivery.people as p (p.name)}
          <span class="person" class:covered={p.covered}>
            <span class="mark" aria-hidden="true">{p.covered ? '✓' : '✗'}</span>
            <b>{p.name}</b>
            <span class="detail">{p.detail}</span>
            <span class="visually-hidden">{p.covered ? 'covered' : 'not covered'}</span>
          </span>
        {/each}
      </span>
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
    margin-top: 1.25rem;
  }

  .track {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 0.6rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .track li {
    display: grid;
    min-width: 0;
  }

  .step {
    --c: var(--cc-1);
    display: grid;
    align-content: start;
    gap: 0.5rem;
    min-width: 0;
    padding: 0.75rem 0.8rem;
    border: 1px solid color-mix(in srgb, var(--c) 35%, var(--border));
    border-radius: var(--radius-sm);
    background: var(--surface-solid);
    text-align: left;
    transition:
      color var(--dur) var(--ease),
      border-color var(--dur) var(--ease),
      box-shadow var(--dur) var(--ease);
  }

  .step:hover {
    border-color: var(--accent);
  }

  .step.is-selected {
    border-color: var(--accent-2);
    box-shadow: 0 0 0 1px var(--accent-2);
  }

  .step.is-dim {
    border-color: var(--border);
    color: var(--muted);
  }

  .step-head {
    display: flex;
    align-items: center;
    gap: 0.45rem;
  }

  .n {
    display: inline-grid;
    flex: none;
    width: 1.4rem;
    height: 1.4rem;
    place-items: center;
    border-radius: var(--radius-pill);
    background: color-mix(in srgb, var(--c) 18%, transparent);
    color: var(--c);
    font-size: 0.72rem;
    font-weight: 800;
  }

  .step.is-dim .n {
    background: transparent;
    color: var(--muted);
  }

  .step strong {
    line-height: 1.3;
  }

  .paths {
    display: grid;
    gap: 0.2rem;
  }

  code {
    font-family: var(--font-mono);
    font-size: 0.85rem;
  }

  .paths code {
    color: var(--c);
    overflow-wrap: anywhere;
  }

  .step.is-dim .paths code {
    color: var(--muted);
  }

  .clients {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem;
  }

  .client {
    padding: 0.15rem 0.5rem;
    border: 1px solid color-mix(in srgb, var(--ok) 45%, transparent);
    border-radius: var(--radius-pill);
    color: var(--ok);
    font-size: 0.72rem;
    font-weight: 700;
  }

  .client.off {
    border-style: dashed;
    border-color: var(--border-strong);
    color: var(--muted);
    text-decoration: line-through;
  }

  .step.is-dim .client {
    border-color: var(--border);
    color: var(--muted);
  }

  .note {
    color: var(--muted);
    font-size: 0.85rem;
    line-height: 1.4;
  }

  .example {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.6rem 0.9rem;
    margin-top: 0.9rem;
    padding: 0.7rem 0.9rem;
    border: 1px dashed var(--border-strong);
    border-radius: var(--radius-sm);
  }

  .json {
    color: var(--cc-1);
  }

  .people {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .person {
    display: inline-flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 0.35rem;
    padding: 0.25rem 0.65rem;
    border: 1px solid color-mix(in srgb, var(--warn) 45%, transparent);
    border-radius: var(--radius-sm);
    font-size: 0.85rem;
  }

  .person b {
    font-family: var(--font-mono);
  }

  .person .mark {
    color: var(--warn);
    font-weight: 800;
  }

  .person.covered {
    border-color: color-mix(in srgb, var(--ok) 45%, transparent);
  }

  .person.covered .mark {
    color: var(--ok);
  }

  .detail {
    color: var(--muted);
  }

  @container (max-width: 860px) {
    .track {
      grid-template-columns: minmax(0, 1fr);
    }

    .step {
      grid-template-columns: 9.5rem minmax(0, 1fr);
      align-items: baseline;
      gap: 0.3rem 0.8rem;
    }

    .step > :not(.step-head) {
      grid-column: 2;
    }

    .step .note {
      grid-column: 2;
    }
  }

  @container (max-width: 480px) {
    .step {
      grid-template-columns: minmax(0, 1fr);
    }

    .step > :not(.step-head),
    .step .note {
      grid-column: 1;
    }
  }
</style>
