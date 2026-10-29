<script lang="ts">
  import InfoBar from '../ui/InfoBar.svelte';
  import SectionHead from '../ui/SectionHead.svelte';
  import SegmentedToggle from '../ui/SegmentedToggle.svelte';
  import {
    ASSIGNED_SETTING,
    BOX_NOTES,
    ENTERPRISE,
    ORGS,
    ORG_SETTING,
    PEOPLE,
    POLICIES,
    POLICY_SHORT,
    enterpriseOptions,
    explain,
    resolve,
    valueLabel,
    type Decider,
    type EnterpriseState,
    type PersonId,
    type PolicyId,
  } from './data';

  let policy = $state<PolicyId>('cli');
  let entState = $state<EnterpriseState>('orgs');
  let selected = $state<PersonId | null>(null);

  const pol = $derived(POLICIES[policy]);
  const enforced = $derived(entState !== 'orgs');
  const info = $derived(explain(entState, policy, selected));
  const deciders = $derived(selected ? resolve(entState, policy, selected).by : []);

  const boxTone = (d: Decider) => (!selected ? '' : deciders.includes(d) ? 'is-lit' : 'is-dim');
  const personTone = (p: PersonId) => (!selected ? '' : p === selected ? 'is-selected' : 'is-dim');

  function select(p: PersonId) {
    selected = selected === p ? null : p;
  }

  function onkeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') selected = null;
  }

  const policyOptions = (['cli', 'code'] as const).map((id) => ({ id, label: POLICY_SHORT[id] }));
</script>

<!--
  THESIS: The enterprise either decides a Copilot policy or hands it down; each person's result follows their license source, and a per-policy rule settles conflicts.
  OWN-WORLD: Midnight Glass blue system: Acme wraps its orgs and the enterprise-assigned bucket; people sit below with their result.
  STORY: Pick a policy and Acme's setting, then select a person to light up the level that decided for them.
  FIRST VIEWPORT: Header, two control rows, the Acme box with three decision points, the conflict rule, and three people.
  FORM: Responsive semantic HTML; each person is a keyboard-focusable toggle with a live one-line explanation underneath.
-->
{#snippet value(on: boolean, ignored = false)}
  <span class="value" class:on class:off={!on} class:ignored>{valueLabel(policy, on)}</span>
{/snippet}

{#snippet avatar()}
  <svg class="avatar-glyph" viewBox="0 0 20 20" aria-hidden="true">
    <circle cx="10" cy="7" r="3.6" />
    <path d="M3.4 17.4c.6-3.7 3.2-6 6.6-6s6 2.3 6.6 6Z" />
  </svg>
{/snippet}

<section class="visual" aria-labelledby="policy-scope-title" {onkeydown}>
  <SectionHead n={1} id="policy-scope-title" title="Who decides a Copilot policy">
    The enterprise sets a policy or lets organizations decide. Each person gets the result from where their license comes from.
  </SectionHead>

  <div class="visual-controls">
    <span class="visual-label" id="policy-scope-policy-label">Policy</span>
    <SegmentedToggle options={policyOptions} value={policy} onchange={(id: PolicyId) => (policy = id)} labelledby="policy-scope-policy-label" />
  </div>

  <div class="visual-controls">
    <span class="visual-label" id="policy-scope-state-label">{ENTERPRISE.name} sets</span>
    <SegmentedToggle
      options={enterpriseOptions(policy)}
      value={entState}
      onchange={(id: EnterpriseState) => (entState = id)}
      labelledby="policy-scope-state-label"
    />
    <span class="visual-hint">Select a person</span>
  </div>

  <div class="stage">
    <div class="enterprise {boxTone('enterprise')}">
      <div class="box-head">
        <span class="name"><span class="tag tag-enterprise">Enterprise</span><strong>{ENTERPRISE.name}</strong></span>
        {#if enforced}
          {@render value(entState === 'on')}
        {:else}
          <span class="value delegated">Let organizations decide</span>
        {/if}
      </div>

      <div class="levels">
        {#each ORGS as org (org)}
          <div class="level {boxTone(org)}">
            <div class="box-head">
              <span class="name"><span class="tag tag-org">Org</span><strong>{org}</strong></span>
              {@render value(ORG_SETTING[org], enforced)}
            </div>
            <span class="sub">{enforced ? BOX_NOTES.orgLocked : BOX_NOTES.orgDelegated}</span>
          </div>
        {/each}
        <div class="level assigned {boxTone('assigned')}">
          <div class="box-head">
            <span class="name"><span class="tag tag-assigned">Enterprise-assigned</span></span>
            {@render value(ASSIGNED_SETTING, enforced)}
          </div>
          <span class="sub">{BOX_NOTES.assigned}</span>
        </div>
      </div>
    </div>

    <p class="rule">
      {#if enforced}
        <span>Organization settings don’t apply</span>
      {:else}
        <span>If orgs disagree</span> <b>{pol.ruleLabel}</b>
      {/if}
    </p>

    <ul class="people" aria-label="People with Copilot licenses">
      {#each PEOPLE as p (p.id)}
        {@const r = resolve(entState, policy, p.id)}
        <li>
          <button
            type="button"
            class="person {personTone(p.id)}"
            aria-pressed={selected === p.id}
            aria-label={`${p.id}, ${p.source}, gets ${valueLabel(policy, r.on)}`}
            onclick={() => select(p.id)}
          >
            <span class="avatar">{@render avatar()}</span>
            <span class="who">
              <span class="person-name">{p.id}</span>
              <span class="source">{p.source}</span>
            </span>
            <span class="result" class:on={r.on} class:off={!r.on}>{valueLabel(policy, r.on)}</span>
          </button>
        </li>
      {/each}
    </ul>
  </div>

  <InfoBar lead={info.lead} text={info.text} note={info.note} />
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

  .visual-controls + .visual-controls {
    margin-top: 0.6rem;
  }

  .stage {
    display: grid;
    gap: 0.9rem;
    margin-top: 1.25rem;
  }

  .is-lit,
  .is-selected,
  .is-dim {
    transition:
      color var(--dur) var(--ease),
      background var(--dur) var(--ease),
      border-color var(--dur) var(--ease),
      box-shadow var(--dur) var(--ease);
  }

  /* Enterprise and decision levels */
  .enterprise {
    display: grid;
    gap: 0.9rem;
    min-width: 0;
    padding: 1rem;
    border: 1.5px solid color-mix(in srgb, var(--accent) 45%, var(--border));
    border-radius: calc(var(--radius) + 2px);
    background: color-mix(in srgb, var(--accent) 5%, transparent);
  }

  .enterprise.is-lit {
    border-color: var(--accent-2);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent-2) 18%, transparent);
  }

  .box-head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }

  .name {
    display: inline-flex;
    align-items: center;
    gap: 0.6rem;
    min-width: 0;
  }

  .enterprise > .box-head strong {
    font-size: 1.3rem;
    letter-spacing: -0.02em;
  }

  .levels {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.75rem;
  }

  .level {
    display: grid;
    align-content: start;
    gap: 0.5rem;
    min-width: 0;
    padding: 0.85rem 0.9rem;
    border: 1px solid var(--border-strong);
    border-radius: var(--radius);
    background: color-mix(in srgb, var(--surface-solid) 55%, transparent);
  }

  .level.assigned {
    border-style: dashed;
  }

  .level strong {
    font-size: 1.1rem;
    letter-spacing: -0.015em;
  }

  .level.is-lit {
    border-color: var(--accent-2);
    background: color-mix(in srgb, var(--accent-2) 10%, var(--surface-solid));
    box-shadow: 0 0 0 1px var(--accent-2) inset;
  }

  .level.is-dim,
  .enterprise.is-dim {
    border-color: var(--border);
  }

  .level.is-dim .tag,
  .enterprise.is-dim > .box-head .tag {
    background: var(--surface);
    color: var(--muted);
  }

  .sub {
    color: var(--muted);
    font-size: 0.8rem;
    line-height: 1.4;
  }

  /* Tags */
  .tag {
    padding: 0.25rem 0.5rem;
    border-radius: 0.4rem;
    font-size: 0.66rem;
    font-weight: 800;
    letter-spacing: 0.12em;
    line-height: 1;
    text-transform: uppercase;
    white-space: nowrap;
  }

  .tag-enterprise {
    background: color-mix(in srgb, var(--accent) 22%, transparent);
    color: var(--accent);
  }

  .tag-org {
    background: color-mix(in srgb, var(--accent-2) 16%, transparent);
    color: var(--accent-2);
  }

  .tag-assigned {
    background: color-mix(in srgb, var(--cc-3) 18%, transparent);
    color: var(--cc-3);
  }

  /* Policy values */
  .value {
    padding: 0.3rem 0.65rem;
    border: 1px solid var(--border-strong);
    border-radius: var(--radius-pill);
    font-size: 0.8rem;
    font-weight: 750;
    line-height: 1;
    white-space: nowrap;
  }

  .value.on {
    border-color: color-mix(in srgb, var(--ok) 55%, transparent);
    color: var(--ok);
  }

  .value.off {
    border-color: color-mix(in srgb, var(--bad) 55%, transparent);
    color: var(--bad);
  }

  .value.delegated {
    border-style: dashed;
    color: var(--muted);
  }

  .value.ignored {
    border-color: var(--border);
    color: var(--muted);
    text-decoration: line-through;
  }

  /* Conflict rule */
  .rule {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.5rem;
    color: var(--muted);
    font-size: 0.66rem;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-align: center;
    text-transform: uppercase;
  }

  .rule b {
    color: var(--text);
  }

  /* People */
  .people {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.75rem;
    padding: 0;
    list-style: none;
  }

  .person {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: 0.7rem;
    width: 100%;
    height: 100%;
    padding: 0.7rem 0.85rem;
    border: 1px solid var(--border-strong);
    border-radius: var(--radius-sm);
    background: var(--surface);
    text-align: left;
  }

  .person:hover {
    border-color: var(--accent);
  }

  .person.is-selected {
    border-color: var(--accent-2);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent-2) 18%, transparent);
  }

  .person.is-dim {
    border-color: var(--border);
    color: var(--muted);
  }

  .person.is-dim .avatar {
    border-color: var(--border);
    background: var(--surface);
  }

  .person.is-dim .avatar-glyph {
    fill: var(--muted);
  }

  .avatar {
    display: grid;
    place-items: center;
    width: 2.4rem;
    height: 2.4rem;
    border: 2px solid color-mix(in srgb, var(--accent) 50%, transparent);
    border-radius: var(--radius-pill);
    background: color-mix(in srgb, var(--accent) 22%, var(--surface-solid));
  }

  .avatar-glyph {
    width: 70%;
    fill: var(--accent);
  }

  .who {
    display: grid;
    gap: 0.15rem;
    min-width: 0;
  }

  .person-name {
    font-weight: 750;
  }

  .source {
    color: var(--muted);
    font-size: 0.8rem;
    line-height: 1.35;
  }

  .result {
    padding: 0.25rem 0.6rem;
    border-radius: var(--radius-pill);
    font-size: 0.8rem;
    font-weight: 800;
    white-space: nowrap;
  }

  .result.on {
    background: color-mix(in srgb, var(--ok) 16%, transparent);
    color: var(--ok);
  }

  .result.off {
    background: color-mix(in srgb, var(--bad) 16%, transparent);
    color: var(--bad);
  }

  @container (max-width: 760px) {
    .levels,
    .people {
      grid-template-columns: minmax(0, 1fr);
    }
  }

  @container (max-width: 600px) {
    .enterprise {
      padding: 0.7rem;
    }
  }
</style>
