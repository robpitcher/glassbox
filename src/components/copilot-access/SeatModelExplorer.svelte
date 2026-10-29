<script lang="ts">
  import InfoBar from '../ui/InfoBar.svelte';
  import SectionHead from '../ui/SectionHead.svelte';
  import SegmentedToggle from '../ui/SegmentedToggle.svelte';
  import { BILL, ENTERPRISE, GROUPS, MODELS, PEOPLE, explain, type GroupId, type ModelId, type PersonId } from './data';

  interface Props {
    initialModel?: ModelId;
  }

  let { initialModel = 'access' }: Props = $props();

  let modelId = $state<ModelId>(initialModel);
  let selected = $state<PersonId | null>(null);

  const model = $derived(MODELS[modelId]);
  const info = $derived(explain(modelId, selected));

  const personTone = (p: PersonId) => (!selected ? '' : p === selected ? 'is-selected' : 'is-dim');
  const groupTone = (g: GroupId) => (!selected ? '' : PEOPLE[selected].group === g ? 'is-lit' : 'is-dim');

  function select(p: PersonId) {
    selected = selected === p ? null : p;
  }

  function onkeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') selected = null;
  }

  const modelOptions = (['access', 'business'] as const).map((id) => ({ id, label: MODELS[id].label }));
</script>

<!--
  THESIS: Under Copilot access the seat price follows the GHEC license, not the Copilot plan, and no seat brings credits.
  OWN-WORLD: Midnight Glass blue system: the same three people in the same enterprise, only the bill changes.
  STORY: Flip the billing model to watch seat prices and the usage meter change; select a person to see why they pay what they pay.
  FIRST VIEWPORT: Header, one control bar, then the Acme enterprise (org + enterprise team) beside a small monthly bill.
  FORM: Responsive semantic HTML; each seat is a keyboard-focusable toggle with a live one-line explanation underneath.
-->
{#snippet avatar()}
  <svg class="avatar-glyph" viewBox="0 0 20 20" aria-hidden="true">
    <circle cx="10" cy="7" r="3.6" />
    <path d="M3.4 17.4c.6-3.7 3.2-6 6.6-6s6 2.3 6.6 6Z" />
  </svg>
{/snippet}

{#snippet orgIcon()}
  <svg viewBox="0 0 16 16" aria-hidden="true">
    <path
      d="M1.75 16A1.75 1.75 0 0 1 0 14.25V1.75C0 .784.784 0 1.75 0h8.5C11.216 0 12 .784 12 1.75v12.5c0 .085-.006.168-.018.25h2.268a.25.25 0 0 0 .25-.25V8.285a.25.25 0 0 0-.111-.208l-1.055-.703a.749.749 0 1 1 .832-1.248l1.055.703c.487.325.779.871.779 1.456v5.965A1.75 1.75 0 0 1 14.25 16h-3.5a.766.766 0 0 1-.197-.026c-.099.017-.2.026-.303.026h-3a.75.75 0 0 1-.75-.75V14h-1v1.25a.75.75 0 0 1-.75.75Zm-.25-1.75c0 .138.112.25.25.25H4v-1.25a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 .75.75v1.25h2.25a.25.25 0 0 0 .25-.25V1.75a.25.25 0 0 0-.25-.25h-8.5a.25.25 0 0 0-.25.25ZM3.75 6h.5a.75.75 0 0 1 0 1.5h-.5a.75.75 0 0 1 0-1.5ZM3 3.75A.75.75 0 0 1 3.75 3h.5a.75.75 0 0 1 0 1.5h-.5A.75.75 0 0 1 3 3.75Zm4 3A.75.75 0 0 1 7.75 6h.5a.75.75 0 0 1 0 1.5h-.5A.75.75 0 0 1 7 6.75ZM7.75 3h.5a.75.75 0 0 1 0 1.5h-.5a.75.75 0 0 1 0-1.5ZM3 9.75A.75.75 0 0 1 3.75 9h.5a.75.75 0 0 1 0 1.5h-.5A.75.75 0 0 1 3 9.75ZM7.75 9h.5a.75.75 0 0 1 0 1.5h-.5a.75.75 0 0 1 0-1.5Z"
    />
  </svg>
{/snippet}

{#snippet teamIcon()}
  <svg viewBox="0 0 16 16" aria-hidden="true">
    <path
      d="M2 5.5a3.5 3.5 0 1 1 5.898 2.549 5.508 5.508 0 0 1 3.034 4.084.75.75 0 1 1-1.482.235 4 4 0 0 0-7.9 0 .75.75 0 0 1-1.482-.236A5.507 5.507 0 0 1 3.102 8.05 3.493 3.493 0 0 1 2 5.5ZM11 4a3.001 3.001 0 0 1 2.22 5.018 5.01 5.01 0 0 1 2.56 3.012.749.749 0 0 1-.885.954.752.752 0 0 1-.549-.514 3.507 3.507 0 0 0-2.522-2.372.75.75 0 0 1-.574-.73v-.352a.75.75 0 0 1 .416-.672A1.5 1.5 0 0 0 11 5.5.75.75 0 0 1 11 4Zm-5.5-.5a2 2 0 1 0-.001 3.999A2 2 0 0 0 5.5 3.5Z"
    />
  </svg>
{/snippet}

<section class="visual" aria-labelledby="copilot-access-title" {onkeydown}>
  <SectionHead n={1} id="copilot-access-title" title="Same people, different bill">
    Switch billing models to see where each Copilot seat comes from and how usage is charged.
  </SectionHead>

  <div class="visual-controls">
    <span class="visual-label" id="copilot-access-model-label">Billing model</span>
    <SegmentedToggle options={modelOptions} value={modelId} onchange={(id: ModelId) => (modelId = id)} labelledby="copilot-access-model-label" />
    <span class="visual-hint">Select a person to trace their seat</span>
  </div>

  <div class="stage">
    <div class="enterprise">
      <div class="enterprise-head">
        <span class="visual-label">Enterprise</span>
        <strong>{ENTERPRISE.name}</strong>
        <span class="model-pill">{model.pill}</span>
      </div>

      <div class="groups">
        {#each GROUPS as g (g.id)}
          <div class="group {g.kind} {groupTone(g.id)}" style:--c={g.color} role="group" aria-label={g.name ? `${g.label} ${g.name}` : g.label}>
            <div class="group-head">
              <span class="kind">{#if g.kind === 'org'}{@render orgIcon()}{:else}{@render teamIcon()}{/if}{g.label}</span>
              {#if g.name}<span class="group-name">{g.name}</span>{/if}
            </div>
            <span class="group-note">{g.note}</span>

            {#each g.members as p (p)}
              {@const seat = model.seat(PEOPLE[p].ghec)}
              <button
                type="button"
                class="seat {personTone(p)}"
                aria-pressed={selected === p}
                aria-label={`${p}: ${seat.price} per month, ${seat.unit}. ${seat.chips.map((c) => c.text).join(', ')}`}
                onclick={() => select(p)}
              >
                <span class="avatar">{@render avatar()}</span>
                <span class="who">{p}</span>
                <span class="price"><b>{seat.price}</b><small>{seat.unit}</small></span>
                <span class="chips">
                  {#each seat.chips as c (c.text)}<span class="pill {c.tone}">{c.text}</span>{/each}
                </span>
              </button>
            {/each}
          </div>
        {/each}
      </div>

      <p class="scope">
        <svg viewBox="0 0 16 16" aria-hidden="true">
          <path
            d="M4 4a4 4 0 0 1 8 0v2h.25c.966 0 1.75.784 1.75 1.75v5.5A1.75 1.75 0 0 1 12.25 15h-8.5A1.75 1.75 0 0 1 2 13.25v-5.5C2 6.784 2.784 6 3.75 6H4Zm8.25 3.5h-8.5a.25.25 0 0 0-.25.25v5.5c0 .138.112.25.25.25h8.5a.25.25 0 0 0 .25-.25v-5.5a.25.25 0 0 0-.25-.25ZM10.5 6V4a2.5 2.5 0 1 0-5 0v2Z"
          />
        </svg>
        {model.scope}
      </p>
    </div>

    <div class="bill">
      <span class="visual-label">{BILL.label}</span>
      <div class="row"><span>{BILL.seats}</span><b>{model.seatTotal}</b></div>
      <div>
        <div class="row usage"><span>{BILL.usage}</span><span class="note">{model.usageNote}</span></div>
        <div
          class="meter"
          role="img"
          aria-label={model.includedPct
            ? `${model.includedPct}% ${BILL.included.toLowerCase()}, the rest ${BILL.metered.toLowerCase()}`
            : `All usage ${BILL.metered.toLowerCase()}`}
        >
          <span class="paid"></span>
          <span class="incl" style:--pct={`${model.includedPct}%`}></span>
        </div>
      </div>
      <div class="legend">
        <span><i class="swatch incl"></i>{BILL.included}</span>
        <span><i class="swatch paid"></i>{BILL.metered}</span>
      </div>
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
    grid-template-columns: minmax(0, 1fr) minmax(15rem, 18rem);
    align-items: stretch;
    gap: 1.25rem;
    margin-top: 1.25rem;
  }

  /* Enterprise */
  .enterprise {
    min-width: 0;
    padding: 1rem;
    border: 1.5px solid color-mix(in srgb, var(--accent) 45%, var(--border));
    border-radius: calc(var(--radius) + 2px);
    background: color-mix(in srgb, var(--accent) 5%, transparent);
  }

  .enterprise-head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.6rem;
    margin-bottom: 0.9rem;
  }

  .enterprise-head strong {
    font-size: 1.3rem;
    letter-spacing: -0.02em;
  }

  .model-pill {
    margin-left: auto;
    padding: 0.25rem 0.7rem;
    border-radius: var(--radius-pill);
    background: var(--accent-soft);
    color: var(--accent);
    font-size: 0.75rem;
    font-weight: 800;
  }

  .groups {
    display: grid;
    grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr);
    align-items: start;
    gap: 0.9rem;
  }

  .group {
    display: grid;
    align-content: start;
    gap: 0.6rem;
    min-width: 0;
    padding: 0.8rem;
    border: 1px solid color-mix(in srgb, var(--c) 40%, var(--border));
    border-radius: var(--radius-sm);
    background: color-mix(in srgb, var(--surface-solid) 55%, transparent);
    transition: border-color var(--dur) var(--ease);
  }

  .group.team {
    padding: 0.65rem;
    border-style: dashed;
    background: transparent;
  }

  .group.is-lit {
    border-color: var(--c);
  }

  .group.is-dim {
    border-color: var(--border);
  }

  .group-head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem;
  }

  .kind {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.15rem 0.5rem;
    border-radius: var(--radius-pill);
    background: color-mix(in srgb, var(--c) 14%, transparent);
    color: var(--c);
    font-size: 0.66rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .kind svg {
    width: 0.75rem;
    height: 0.75rem;
    fill: currentColor;
  }

  .group.is-dim .kind {
    background: transparent;
    color: var(--muted);
  }

  .group-name {
    color: var(--c);
    font-family: var(--font-mono);
    font-size: 0.9rem;
    font-weight: 800;
  }

  .group.is-dim .group-name {
    color: var(--muted);
  }

  .group-note {
    color: var(--muted);
    font-size: 0.75rem;
  }

  /* Seats */
  .seat {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: 0.2rem 0.7rem;
    min-width: 0;
    padding: 0.7rem;
    border: 1px solid var(--border-strong);
    border-radius: var(--radius-sm);
    background: var(--surface-solid);
    text-align: left;
    transition:
      color var(--dur) var(--ease),
      border-color var(--dur) var(--ease),
      box-shadow var(--dur) var(--ease);
  }

  .seat:hover {
    border-color: var(--accent);
  }

  .seat.is-selected {
    border-color: var(--accent-2);
    box-shadow: 0 0 0 1px var(--accent-2);
  }

  .seat.is-dim {
    border-color: var(--border);
    color: var(--muted);
  }

  .avatar {
    display: grid;
    place-items: center;
    width: 2.2rem;
    height: 2.2rem;
    border: 2px solid color-mix(in srgb, var(--accent) 50%, transparent);
    border-radius: var(--radius-pill);
    background: color-mix(in srgb, var(--accent) 22%, var(--surface-solid));
  }

  .avatar-glyph {
    width: 70%;
    fill: var(--accent);
  }

  .seat.is-selected .avatar {
    border-color: var(--accent-2);
  }

  .seat.is-dim .avatar {
    border-color: var(--border);
    background: var(--surface);
  }

  .seat.is-dim .avatar-glyph {
    fill: var(--muted);
  }

  .who {
    font-family: var(--font-mono);
    font-weight: 750;
  }

  .seat.is-selected .who {
    color: var(--accent-2);
  }

  .price {
    display: grid;
    justify-items: end;
    text-align: right;
  }

  .price b {
    font-size: 1.35rem;
    letter-spacing: -0.03em;
    line-height: 1.1;
  }

  .price small {
    color: var(--muted);
    font-size: 0.72rem;
  }

  .chips {
    display: flex;
    flex-wrap: wrap;
    grid-column: 1 / -1;
    gap: 0.4rem;
    margin-top: 0.35rem;
  }

  .pill {
    padding: 0.2rem 0.55rem;
    border: 1px solid var(--border-strong);
    border-radius: var(--radius-pill);
    color: var(--muted);
    font-size: 0.72rem;
    font-weight: 700;
  }

  .pill.ok {
    border-color: color-mix(in srgb, var(--ok) 45%, transparent);
    background: color-mix(in srgb, var(--ok) 12%, transparent);
    color: var(--ok);
  }

  .pill.warn {
    border-color: color-mix(in srgb, var(--warn) 45%, transparent);
    background: color-mix(in srgb, var(--warn) 12%, transparent);
    color: var(--warn);
  }

  .seat.is-dim .pill {
    border-color: var(--border);
    background: transparent;
    color: var(--muted);
  }

  .scope {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0.9rem 0 0;
    color: var(--muted);
    font-size: 0.82rem;
  }

  .scope svg {
    flex: none;
    width: 0.9rem;
    height: 0.9rem;
    fill: currentColor;
  }

  /* Bill */
  .bill {
    display: grid;
    align-content: start;
    gap: 0.9rem;
    min-width: 0;
    padding: 1rem;
    border: 1px solid var(--border-strong);
    border-radius: var(--radius);
    background: var(--surface);
  }

  .row {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.25rem 0.75rem;
  }

  .row b {
    font-size: 1.4rem;
    letter-spacing: -0.03em;
  }

  .row.usage {
    margin-bottom: 0.45rem;
  }

  .note {
    color: var(--muted);
    font-size: 0.75rem;
  }

  .meter {
    position: relative;
    height: 1.6rem;
    overflow: hidden;
    border: 1px solid var(--border);
    border-radius: 8px;
  }

  .meter .paid,
  .meter .incl {
    position: absolute;
    inset: 0;
  }

  .meter .incl {
    background:
      repeating-linear-gradient(135deg, color-mix(in srgb, var(--ok) 35%, transparent) 0 6px, transparent 6px 12px),
      var(--surface-solid);
    clip-path: inset(0 calc(100% - var(--pct)) 0 0);
    transition: clip-path var(--dur) var(--ease);
  }

  .paid {
    background: color-mix(in srgb, var(--warn) 70%, transparent);
  }

  .legend {
    display: grid;
    gap: 0.35rem;
    color: var(--muted);
    font-size: 0.8rem;
  }

  .swatch {
    display: inline-block;
    width: 0.75rem;
    height: 0.75rem;
    margin-right: 0.4rem;
    border-radius: 3px;
    vertical-align: -1px;
  }

  .swatch.incl {
    border: 1px solid var(--ok);
    background: repeating-linear-gradient(135deg, var(--ok) 0 3px, transparent 3px 6px);
  }

  .swatch.paid {
    background: var(--warn);
  }

  @container (max-width: 720px) {
    .stage {
      grid-template-columns: minmax(0, 1fr);
    }
  }

  @container (max-width: 560px) {
    .groups {
      grid-template-columns: minmax(0, 1fr);
    }

    .enterprise {
      padding: 0.7rem;
    }
  }
</style>
