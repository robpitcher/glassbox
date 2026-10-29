<script lang="ts">
  import SectionHead from '../ui/SectionHead.svelte';
  import {
    ENTERPRISE_BUDGET_USD,
    METERED_ORDER,
    PLANS,
    TOTAL_SEATS,
    USER_BUDGETS,
    credits,
    fmt,
    licenseUsd,
    maxBillUsd,
    usd,
  } from './data';

  const plan = PLANS.business;
  const licenseTotal = licenseUsd(plan);
  const includedCredits = credits(plan, TOTAL_SEATS);
  const maximumBill = maxBillUsd(plan);
  const licenseShare = `${(licenseTotal / maximumBill) * 100}%`;
  const budgetShare = `${(ENTERPRISE_BUDGET_USD / maximumBill) * 100}%`;

  const checks = [
    {
      id: 'user',
      step: 'Check 1',
      title: 'User-level budget',
      pill: 'ALWAYS ON · HARD STOP',
      color: 'var(--accent)',
      aria: 'Check one, user-level budget',
    },
    {
      id: 'pool',
      step: 'Check 2',
      title: 'Shared pool',
      pill: 'INCLUDED IN SEATS',
      color: 'var(--ok)',
      aria: 'Check two, shared pool',
    },
    {
      id: 'metered',
      step: 'Check 3',
      title: 'Metered usage',
      pill: '$0.01 PER CREDIT',
      color: 'var(--warn)',
      aria: 'Check three, metered usage',
    },
  ] as const;
</script>

<!--
  THESIS: Budget controls are a sequence of gates over one shared pool, not three independent wallets.
  OWN-WORLD: Midnight Glass in the approved blue system: translucent cards, crisp borders, restrained gradients, token-only state color.
  STORY: A request moves through user budget, included credits, then metered budget; the bill bar separates license spend from metered risk.
  FIRST VIEWPORT: Numbered section header above a left-to-right request path, with maximum monthly bill grounded underneath.
  FORM: Approved mockup A section 2 translated from fixed SVG into responsive semantic HTML/CSS.
-->
<section class="visual" aria-labelledby="budget-layers-title">
  <SectionHead n={2} id="budget-layers-title" title="Budgets layer on top of the pool">
    Every Copilot request passes through these checks, in order. Fail one and the request is blocked.
  </SectionHead>

  <ol class="flow" aria-label="Copilot request budget check order">
    <li class="flow-node request-node">
      <article class="request-card" aria-label="A user sends a Copilot request">
        <svg class="person-icon" viewBox="0 0 28 28" aria-hidden="true">
          <circle cx="14" cy="8" r="4.5" />
          <path d="M5.5 24c0.7-5.1 4-8.2 8.5-8.2s7.8 3.1 8.5 8.2Z" />
        </svg>
        <strong>A user sends a Copilot request</strong>
        <span>chat · CLI · agent</span>
      </article>
      <span class="arrow" aria-hidden="true">→</span>
    </li>

    {#each checks as check, index (check.id)}
      <li class="flow-node check-node">
        <article
          class="check-card check-{check.id}"
          style={`--gate-color: ${check.color}`}
          aria-label={check.aria}
        >
          <div class="check-kicker">{check.step}</div>
          <h3>{check.title}</h3>
          <span class="pill">{check.pill}</span>

          {#if check.id === 'user'}
            <p>Caps each person's usage — from the pool and beyond. Most specific one wins:</p>
            <ol class="budget-stack" aria-label="User budget precedence">
              {#each USER_BUDGETS as budget, budgetIndex}
                <li class="budget-row priority-{budgetIndex + 1}">
                  <strong>{budget.level}</strong>
                  <span>{budget.example}</span>
                </li>
              {/each}
            </ol>
            <p class="outcome bad">
              <span class="outcome-mark" aria-hidden="true">✕</span>
              <span class="outcome-text">Over budget → blocked</span>
            </p>
          {:else if check.id === 'pool'}
            <p>Credits left in the pool? Served at no extra cost.</p>
            <p>Cost-center caps (if on) are checked here too.</p>
            <div class="outcomes">
              <p class="outcome ok">
                <span class="outcome-mark" aria-hidden="true">✓</span>
                <span class="outcome-text">Credits left → served</span>
              </p>
              <p class="outcome next">
                <span class="outcome-mark" aria-hidden="true">↓</span>
                <span class="outcome-text">Pool empty → metered</span>
              </p>
            </div>
          {:else}
            <p>Charged to the first budget that matches:</p>
            <ol class="metered-list" aria-label="Metered budget order">
              {#each METERED_ORDER as item, meteredIndex}
                <li class:primary={meteredIndex === 0}>
                  <strong>{item.level}</strong>
                  {#if item.note}<span>{item.note}</span>{/if}
                </li>
              {/each}
            </ol>
            <p class="metered-note">
              The enterprise budget still counts it (unless excluded). Tightest budget blocks first.
            </p>
            <p class="outcome bad">
              <span class="outcome-mark" aria-hidden="true">✕</span>
              <span class="outcome-text">“Stop usage” at limit → blocked</span>
            </p>
          {/if}
        </article>
        {#if index < checks.length - 1}
          <span class="arrow" aria-hidden="true">→</span>
        {/if}
      </li>
    {/each}
  </ol>

  <p class="policy-note">
    Paid usage only happens if the “AI credits paid usage” policy is on (default). Off = blocked as soon as
    the pool is empty.
  </p>

  <div class="bill-block">
    <div class="divider" aria-hidden="true"></div>
    <p class="bill-label">YOUR MAXIMUM MONTHLY BILL</p>
    <div
      class="bill-row"
      style={`--license-share: ${licenseShare}; --budget-share: ${budgetShare}`}
      aria-label={`Maximum monthly bill ${usd(maximumBill)}`}
    >
      <div class="bill-bar" aria-label="Bill components">
        <div class="bill-segment licenses" style={`--segment-share: ${licenseShare}`}>
          <strong>Seat licenses {usd(licenseTotal)}</strong>
          <span>{TOTAL_SEATS} × {usd(plan.seatUsd)} — includes the {fmt(includedCredits)}-credit pool</span>
        </div>
        <div class="bill-segment enterprise" style={`--segment-share: ${budgetShare}`}>
          <strong>Enterprise budget {usd(ENTERPRISE_BUDGET_USD)}</strong>
          <span>caps metered usage after the pool</span>
        </div>
      </div>
      <div class="bill-total">
        <strong>= {usd(maximumBill)}</strong>
        <span>max per month</span>
      </div>
    </div>
    <p class="bill-caption">The enterprise budget isn't your total bill — it only limits spend once the pool runs out.</p>
  </div>
</section>

<style>
  h3,
  p,
  ol {
    margin: 0;
  }

  .flow {
    margin-top: clamp(1.75rem, 3vw, 2.35rem);
    display: grid;
    grid-template-columns: minmax(8.6rem, 0.58fr) minmax(14rem, 1.13fr) minmax(13rem, 1fr) minmax(14rem, 1.13fr);
    gap: clamp(1.35rem, 2vw, 1.75rem);
    align-items: stretch;
    list-style: none;
    padding: 0;
  }

  .flow-node {
    position: relative;
    display: flex;
    min-height: 100%;
    min-width: 0;
  }

  .request-node {
    align-items: center;
  }

  .check-node {
    align-items: stretch;
  }

  .arrow {
    position: absolute;
    top: 50%;
    right: calc(clamp(1.35rem, 2vw, 1.75rem) * -0.78);
    transform: translate(50%, -50%);
    color: var(--muted);
    font-size: 1.55rem;
    font-weight: 700;
    line-height: 1;
    z-index: 2;
  }

  .request-card {
    display: grid;
    justify-items: center;
    gap: 0.55rem;
    width: 100%;
    min-height: 8.8rem;
    padding: 1.2rem 0.9rem;
    text-align: center;
    background: color-mix(in srgb, var(--surface) 45%, transparent);
    border: 1px dashed var(--border-strong);
    border-radius: var(--radius);
  }

  .person-icon {
    width: 2rem;
    height: 2rem;
    fill: var(--text);
  }

  .person-icon path {
    fill: var(--text);
  }

  .request-card strong {
    max-width: 9rem;
    font-size: 0.96rem;
    line-height: 1.25;
  }

  .request-card span {
    color: var(--muted);
    font-size: 0.86rem;
  }

  .check-card {
    position: relative;
    display: flex;
    width: 100%;
    min-height: 20.25rem;
    flex-direction: column;
    padding: 1.35rem 1.35rem 1.05rem;
    background:
      linear-gradient(180deg, color-mix(in srgb, var(--gate-color) 7%, transparent), transparent 38%),
      var(--surface-2);
    border: 1px solid color-mix(in srgb, var(--gate-color) 82%, var(--border));
    border-radius: var(--radius);
    transition:
      opacity var(--dur) var(--ease),
      transform var(--dur) var(--ease),
      border-color var(--dur) var(--ease),
      box-shadow var(--dur) var(--ease);
  }

  .check-card::before {
    content: '';
    position: absolute;
    inset: -1px -1px auto;
    height: 0.32rem;
    border-radius: var(--radius) var(--radius) var(--radius-sm) var(--radius-sm);
    background: var(--gate-color);
  }

  .check-card:hover,
  .check-card:focus-within {
    transform: translateY(-0.25rem);
    border-color: var(--gate-color);
    box-shadow: 0 1rem 2.6rem color-mix(in srgb, var(--gate-color) 16%, transparent);
    outline: none;
  }

  .flow:has(.check-card:hover, .check-card:focus-within) .check-card:not(:hover):not(:focus-within) {
    opacity: 0.58;
  }

  .check-kicker {
    color: var(--gate-color);
    font-size: 0.72rem;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  h3 {
    margin-top: 0.55rem;
    font-size: clamp(1.18rem, 2vw, 1.4rem);
    line-height: 1.05;
    letter-spacing: -0.025em;
  }

  .pill {
    align-self: flex-start;
    margin-top: 0.82rem;
    padding: 0.33rem 0.62rem;
    border-radius: var(--radius-pill);
    background: color-mix(in srgb, var(--gate-color) 20%, transparent);
    color: var(--gate-color);
    font-size: 0.72rem;
    font-weight: 800;
    letter-spacing: -0.01em;
    line-height: 1;
  }

  .check-card > p:not(.outcome) {
    margin-top: 1.25rem;
    color: var(--muted);
    font-size: 0.95rem;
    line-height: 1.55;
  }

  .check-pool > p + p {
    margin-top: 1.2rem;
  }

  .budget-stack,
  .metered-list {
    list-style: none;
    padding: 0;
  }

  .budget-stack {
    display: grid;
    gap: 0.34rem;
    margin-top: 0.8rem;
  }

  .budget-row {
    display: flex;
    gap: 0.36rem;
    align-items: baseline;
    min-width: 0;
    padding: 0.48rem 0.62rem;
    border: 1px solid color-mix(in srgb, var(--accent) 62%, transparent);
    border-radius: var(--radius-sm);
    background: color-mix(in srgb, var(--accent) 18%, transparent);
    font-size: 0.83rem;
    line-height: 1.2;
  }

  .budget-row strong,
  .metered-list strong {
    color: var(--text);
  }

  .budget-row span {
    min-width: 0;
    color: var(--text);
  }

  .budget-row.priority-1 {
    background: color-mix(in srgb, var(--accent) 34%, transparent);
  }

  .budget-row.priority-2 {
    background: color-mix(in srgb, var(--accent) 22%, transparent);
  }

  .budget-row.priority-3 {
    background: color-mix(in srgb, var(--accent) 12%, transparent);
  }

  .outcomes {
    display: grid;
    gap: 0.7rem;
    margin-top: auto;
  }

  .outcome {
    display: flex;
    gap: 0.54rem;
    align-items: center;
    color: var(--text);
    font-size: 0.9rem;
    font-weight: 650;
    line-height: 1.25;
  }

  .check-card > .outcome {
    margin-top: auto;
  }

  .outcome-mark {
    display: inline-grid;
    flex: 0 0 auto;
    width: 1.15rem;
    height: 1.15rem;
    place-items: center;
    border: 1px solid currentColor;
    border-radius: var(--radius-pill);
    font-size: 0.72rem;
    line-height: 1;
  }

  .outcome.ok { color: var(--ok); }

  .outcome.bad { color: var(--bad); }

  .outcome.next { color: var(--muted); }

  .check-metered .outcome {
    gap: 0.4rem;
    font-size: 0.78rem;
  }

  .check-metered .outcome-text {
    white-space: nowrap;
  }

  .metered-list {
    display: grid;
    gap: 0.48rem;
    margin-top: 1rem;
  }

  .metered-list li {
    display: flex;
    gap: 0.75rem;
    justify-content: space-between;
    min-width: 0;
    padding: 0.58rem 0.72rem;
    border: 1px dashed color-mix(in srgb, var(--warn) 72%, transparent);
    border-radius: var(--radius-sm);
    color: var(--text);
    font-size: 0.86rem;
    line-height: 1.2;
  }

  .metered-list li.primary {
    border-style: solid;
  }

  .metered-list span {
    flex: 0 1 auto;
    color: var(--muted);
    font-size: 0.78rem;
    text-align: right;
  }

  .metered-note {
    margin: 0.8rem 0 1rem;
    color: var(--muted);
    font-size: 0.8rem;
    line-height: 1.4;
  }

  .policy-note {
    margin-top: 1.6rem;
    color: var(--muted);
    font-size: 0.93rem;
    line-height: 1.5;
  }

  .bill-block {
    margin-top: 1.85rem;
  }

  .divider {
    height: 1px;
    margin-bottom: 1.25rem;
    background: var(--border);
  }

  .bill-label {
    color: var(--muted);
    font-size: 0.78rem;
    font-weight: 800;
    letter-spacing: 0.14em;
  }

  .bill-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: clamp(1rem, 2vw, 1.35rem);
    align-items: center;
    margin-top: 0.85rem;
  }

  .bill-bar {
    display: flex;
    min-width: 0;
    gap: 0.5rem;
  }

  .bill-segment {
    display: flex;
    min-width: 0;
    min-height: 3.85rem;
    flex: 0 1 var(--segment-share);
    flex-direction: column;
    justify-content: center;
    padding: 0.75rem 1rem;
    border-radius: var(--radius-sm);
    overflow: hidden;
  }

  .bill-segment strong,
  .bill-segment span {
    position: relative;
    z-index: 1;
    min-width: 0;
    overflow-wrap: anywhere;
  }

  .bill-segment strong {
    font-size: clamp(0.98rem, 1.5vw, 1.08rem);
    line-height: 1.15;
  }

  .bill-segment span {
    margin-top: 0.2rem;
    font-size: 0.88rem;
    line-height: 1.25;
  }

  .licenses {
    color: var(--on-accent);
    background: var(--pool-grad);
  }

  .enterprise {
    color: var(--text);
    background:
      repeating-linear-gradient(
        135deg,
        color-mix(in srgb, var(--bad) 22%, transparent) 0 0.42rem,
        color-mix(in srgb, var(--warn) 14%, transparent) 0.42rem 0.84rem
      ),
      color-mix(in srgb, var(--surface-2) 82%, transparent);
    border: 1px dashed color-mix(in srgb, var(--bad) 72%, var(--warn));
  }

  .bill-total {
    min-width: 7.5rem;
  }

  .bill-total strong {
    display: block;
    color: var(--text);
    font-size: clamp(1.55rem, 3vw, 2rem);
    line-height: 1;
    letter-spacing: -0.035em;
  }

  .bill-total span {
    display: block;
    margin-top: 0.35rem;
    color: var(--muted);
    font-size: 0.86rem;
  }

  .bill-caption {
    margin-top: 1rem;
    color: var(--muted);
    font-size: 0.95rem;
    font-weight: 550;
    line-height: 1.5;
  }

  @container (max-width: 900px) {
    .flow {
      grid-template-columns: 1fr;
      gap: 2.35rem;
    }

    .request-card,
    .check-card {
      min-height: auto;
    }

    .request-card {
      min-height: 8rem;
    }

    @container (min-width: 901px) {
      .check-metered .outcome {
        gap: 0.4rem;
        font-size: 0.78rem;
      }

      .check-metered .outcome-text {
        white-space: nowrap;
      }
    }

    @media (min-width: 1121px) {
      .check-metered .outcome {
        gap: 0.4rem;
        font-size: 0.78rem;
      }

      .check-metered .outcome-text {
        white-space: nowrap;
      }
    }

    @media (max-width: 1120px) {
      .flow {
        grid-template-columns: 1fr;
        gap: 2.35rem;
      }

      .request-card,
      .check-card {
        min-height: auto;
      }

      .request-card {
        min-height: 8rem;
      }

      .arrow {
        top: auto;
        right: auto;
        bottom: -1.72rem;
        left: 50%;
        transform: translateX(-50%) rotate(90deg);
      }

      .check-card {
        padding-bottom: 1.35rem;
      }

      .check-card > .outcome,
      .outcomes {
        margin-top: 1.25rem;
      }
    }

    .arrow {
      top: auto;
      right: auto;
      bottom: -1.72rem;
      left: 50%;
      transform: translateX(-50%) rotate(90deg);
    }

    .check-card {
      padding-bottom: 1.35rem;
    }

    .check-card > .outcome,
    .outcomes {
      margin-top: 1.25rem;
    }
  }

  @media (max-width: 680px) {
    .bill-row {
      grid-template-columns: 1fr;
    }

    .bill-bar {
      flex-direction: column;
    }

    .bill-segment {
      flex-basis: auto;
    }

    .bill-total {
      min-width: 0;
    }
  }

  @media (max-width: 430px) {
    .budget-row,
    .metered-list li {
      flex-direction: column;
      gap: 0.22rem;
    }

    .metered-list span {
      align-self: flex-start;
      text-align: left;
    }

    .check-card {
      padding-inline: 1rem;
    }
  }
</style>
