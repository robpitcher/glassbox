<script lang="ts">
  import InfoBar from '../ui/InfoBar.svelte';
  import SectionHead from '../ui/SectionHead.svelte';
  import SegmentedToggle from '../ui/SegmentedToggle.svelte';
  import {
    SERVICES,
    STAGES,
    VISUAL,
    selectionInfo,
    type Handoff,
    type PlatformId,
    type Selection,
    type ServiceId,
    type StageId,
  } from './data';

  let stageId = $state<StageId>('repositories');
  let selected = $state<Selection | null>(null);

  const stage = $derived(STAGES.find((item) => item.id === stageId)!);
  const info = $derived(selectionInfo(stage, selected));
  const options = STAGES.map((item) => ({
    id: item.id,
    label: `${item.number}. ${item.label}${item.optional ? ` · ${VISUAL.optional}` : ''}`,
  }));

  const servicesFor = (platform: PlatformId) =>
    SERVICES.filter((service) => stage.owners[service.id] === platform);

  function pickStage(next: StageId) {
    stageId = next;
    selected = null;
  }

  function selectService(id: ServiceId) {
    selected = selected?.kind === 'service' && selected.id === id ? null : { kind: 'service', id };
  }

  function selectHandoff(id: string) {
    selected = selected?.kind === 'handoff' && selected.id === id ? null : { kind: 'handoff', id };
  }

  function serviceTone(id: ServiceId) {
    if (!selected) return '';
    if (selected.kind === 'service') return selected.id === id ? 'is-selected' : 'is-dim';
    const handoff = stage.handoffs.find((item) => item.id === selected?.id);
    return handoff?.services.includes(id) ? 'is-related' : 'is-dim';
  }

  function handoffTone(handoff: Handoff) {
    if (!selected) return '';
    if (selected.kind === 'handoff') return selected.id === handoff.id ? 'is-selected' : 'is-dim';
    return handoff.services.includes(selected.id) ? 'is-related' : 'is-dim';
  }

  function onkeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') selected = null;
  }
</script>

<section class="visual" aria-labelledby="migration-roadmap-title" {onkeydown}>
  <SectionHead n={1} id="migration-roadmap-title" title={VISUAL.title}>
    {VISUAL.description}
  </SectionHead>

  <div class="visual-controls">
    <span class="visual-label" id="migration-stage-label">{VISUAL.stageLabel}</span>
    <SegmentedToggle {options} value={stageId} onchange={pickStage} wrap labelledby="migration-stage-label" />
    <span class="visual-hint">{VISUAL.hint}</span>
  </div>

  <div class="roadmap">
    <section class="platform azure" aria-label={VISUAL.azure}>
      <div class="platform-head">
        <div>
          <span class="platform-owner">{VISUAL.systemOfRecord}</span>
          <h3>{VISUAL.azure}</h3>
        </div>
        <span class="platform-status">{servicesFor('azure').length ? VISUAL.source : VISUAL.complete}</span>
      </div>
      <div class="service-list">
        {#each servicesFor('azure') as service (service.id)}
          <button
            type="button"
            class="service {serviceTone(service.id)}"
            aria-pressed={selected?.kind === 'service' && selected.id === service.id}
            aria-label={`${service.name}, owned by ${VISUAL.azure}`}
            onclick={() => selectService(service.id)}
          >
            <span>
              <b>{service.name}</b>
              <small>{service.detail}</small>
            </span>
            <span class="service-status">{VISUAL.active}</span>
          </button>
        {:else}
          <div class="empty">{VISUAL.noAzureServices}</div>
        {/each}
      </div>
    </section>

    <div class="handoff-rail" aria-label="Integration handoffs">
      {#each stage.handoffs as handoff (handoff.id)}
        <button
          type="button"
          class="handoff {handoffTone(handoff)}"
          class:complete={stage.optional}
          aria-pressed={selected?.kind === 'handoff' && selected.id === handoff.id}
          aria-label={handoff.label}
          onclick={() => selectHandoff(handoff.id)}
        >
          <span>{handoff.label}</span>
          <small>{handoff.sub}</small>
        </button>
      {/each}
    </div>

    <section class="platform github" aria-label={VISUAL.github}>
      <div class="platform-head">
        <div>
          <span class="platform-owner">{VISUAL.systemOfRecord}</span>
          <h3>{VISUAL.github}</h3>
        </div>
        <span class="platform-status">{VISUAL.destination}</span>
      </div>
      <div class="service-list">
        {#each servicesFor('github') as service (service.id)}
          <button
            type="button"
            class="service {serviceTone(service.id)}"
            class:just-moved={stage.moved.includes(service.id)}
            aria-pressed={selected?.kind === 'service' && selected.id === service.id}
            aria-label={`${service.name}, owned by ${VISUAL.github}`}
            onclick={() => selectService(service.id)}
          >
            <span>
              <b>{service.name}</b>
              <small>{service.detail}</small>
            </span>
            <span class="service-status">{stage.moved.includes(service.id) ? VISUAL.moved : VISUAL.active}</span>
          </button>
        {:else}
          <div class="empty">{VISUAL.noGithubServices}</div>
        {/each}
      </div>
    </section>
  </div>

  <InfoBar lead={info.lead} text={info.text} />
</section>

<style>
  button {
    color: inherit;
    font: inherit;
    cursor: pointer;
  }

  button:focus-visible {
    outline: 2px solid var(--accent-2);
    outline-offset: 3px;
  }

  .roadmap {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(7rem, 0.34fr) minmax(0, 1fr);
    gap: 0.75rem;
    margin-top: 1.25rem;
  }

  .platform {
    min-width: 0;
    min-height: 22rem;
    padding: 1rem;
    border: 1px solid var(--border-strong);
    border-radius: var(--radius);
    background: color-mix(in srgb, var(--bg) 32%, var(--surface-solid));
  }

  .platform-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    min-height: 4rem;
    padding-bottom: 0.8rem;
    border-bottom: 1px solid var(--border);
  }

  .platform-owner {
    display: block;
    margin-bottom: 0.25rem;
    color: var(--muted);
    font-size: 0.65rem;
    font-weight: 800;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  h3 {
    font-size: clamp(1.15rem, 2.5vw, 1.45rem);
    letter-spacing: -0.025em;
  }

  .platform-status,
  .service-status {
    flex: none;
    border: 1px solid color-mix(in srgb, var(--c) 50%, transparent);
    border-radius: var(--radius-pill);
    color: var(--c);
    font-size: 0.68rem;
    font-weight: 800;
    line-height: 1;
    text-align: center;
  }

  .platform-status {
    max-width: 8rem;
    padding: 0.32rem 0.55rem;
  }

  .azure {
    --c: var(--cc-1);
  }

  .github {
    --c: var(--cc-4);
  }

  .service-list {
    display: grid;
    gap: 0.65rem;
    margin-top: 0.9rem;
  }

  .service {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    min-width: 0;
    padding: 0.75rem 0.8rem;
    border: 1px solid color-mix(in srgb, var(--c) 24%, var(--border));
    border-radius: var(--radius-sm);
    background: var(--surface-solid);
    text-align: left;
    transition:
      border-color var(--dur) var(--ease),
      background-color var(--dur) var(--ease),
      box-shadow var(--dur) var(--ease);
  }

  .service:hover {
    border-color: var(--c);
  }

  .service b,
  .service small {
    display: block;
  }

  .service b {
    line-height: 1.2;
  }

  .service small {
    margin-top: 0.25rem;
    color: var(--muted);
    font-size: 0.78rem;
    line-height: 1.3;
  }

  .service-status {
    padding: 0.25rem 0.45rem;
    white-space: nowrap;
  }

  .service.just-moved {
    border-color: color-mix(in srgb, var(--ok) 58%, var(--border));
    box-shadow: var(--glass-sheen);
  }

  .handoff-rail {
    display: grid;
    align-content: center;
    gap: 1rem;
    min-width: 0;
    padding-top: 4.5rem;
  }

  .handoff {
    position: relative;
    min-width: 0;
    padding: 0.55rem 0.4rem;
    border: 1px solid var(--border-strong);
    border-radius: var(--radius-sm);
    background: var(--surface);
    text-align: center;
    transition:
      border-color var(--dur) var(--ease),
      background-color var(--dur) var(--ease),
      color var(--dur) var(--ease),
      box-shadow var(--dur) var(--ease);
  }

  .handoff::before,
  .handoff::after {
    position: absolute;
    top: 50%;
    width: 0.75rem;
    height: 1px;
    background: linear-gradient(90deg, var(--cc-1), var(--cc-4));
    content: '';
  }

  .handoff::before {
    right: 100%;
  }

  .handoff::after {
    left: 100%;
  }

  .handoff span,
  .handoff small {
    display: block;
  }

  .handoff span {
    font-size: 0.72rem;
    font-weight: 800;
    line-height: 1.25;
  }

  .handoff small {
    margin-top: 0.25rem;
    color: var(--muted);
    font-size: 0.66rem;
    line-height: 1.25;
  }

  .handoff.complete {
    border-color: color-mix(in srgb, var(--ok) 48%, var(--border));
    background: color-mix(in srgb, var(--ok) 10%, var(--surface-solid));
  }

  .service.is-selected,
  .handoff.is-selected {
    border-color: var(--accent);
    box-shadow: 0 0 0 1px var(--accent), 0 0 1.5rem color-mix(in srgb, var(--accent) 16%, transparent);
  }

  .service.is-related,
  .handoff.is-related {
    border-color: var(--accent-2);
    background: color-mix(in srgb, var(--accent) 8%, var(--surface-solid));
  }

  .service.is-dim {
    border-color: var(--border);
    background: var(--surface-solid);
  }

  .service.is-dim b,
  .handoff.is-dim span,
  .service.is-dim .service-status {
    color: var(--muted);
  }

  .handoff.is-dim {
    border-color: var(--border);
    background: transparent;
  }

  .handoff.is-dim::before,
  .handoff.is-dim::after {
    background: var(--border);
  }

  .empty {
    display: grid;
    min-height: 5rem;
    place-items: center;
    padding: 1rem;
    border: 1px dashed var(--border-strong);
    border-radius: var(--radius-sm);
    color: var(--muted);
    font-size: 0.82rem;
    line-height: 1.4;
    text-align: center;
  }

  @container (max-width: 700px) {
    .roadmap {
      grid-template-columns: minmax(0, 1fr);
    }

    .platform {
      min-height: 0;
    }

    .handoff-rail {
      grid-template-columns: repeat(auto-fit, minmax(8rem, 1fr));
      align-content: start;
      padding-top: 0;
    }

    .handoff::before,
    .handoff::after {
      top: auto;
      left: 50%;
      width: 1px;
      height: 0.75rem;
      background: linear-gradient(var(--cc-1), var(--cc-4));
    }

    .handoff::before {
      right: auto;
      bottom: 100%;
    }

    .handoff::after {
      top: 100%;
    }
  }

  @container (max-width: 430px) {
    .service {
      align-items: flex-start;
    }

    .service-status {
      white-space: normal;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .service,
    .handoff {
      transition: none;
    }
  }
</style>
