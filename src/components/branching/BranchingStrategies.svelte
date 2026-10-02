<script lang="ts">
  import Segmented from '../shared/Segmented.svelte';
  import { CAPTIONS, HIGHLIGHT_OPTIONS, LANE_LABELS, TRADEOFFS, type Highlight, type LaneId } from './data';

  let highlight = $state<Highlight>('both');
  let focusedLane = $state<LaneId | null>(null);

  const activeCaption = $derived(CAPTIONS[highlight][focusedLane ?? 'overview']);
  const captionLead = $derived(focusedLane ? LANE_LABELS[focusedLane] : 'Shared timeline');

  function focusLane(lane: LaneId) {
    focusedLane = lane;
  }

  function blurLane(event: FocusEvent) {
    if (!event.currentTarget || !event.relatedTarget) {
      focusedLane = null;
      return;
    }

    if (!(event.currentTarget as HTMLElement).contains(event.relatedTarget as Node)) {
      focusedLane = null;
    }
  }
</script>

{@html '<!-- THESIS: One feature and one fix expose integration cadence, refusing a doctrine chart or Git UI clone. OWN-WORLD: Midnight wiki glass, abstract railway notation, colored arcs, dots, and release diamonds on one measured timeline. STORY: A reader compares where branches live, integrate, and release, then reads the tradeoffs in plain language. FIRST VIEWPORT: A numbered card opens with a compact control bar, shared Day 1-10 ruler, then three stacked lanes with consistent event geometry. FORM: Established wiki card system extended with a subway-map timeline and lane focus captions. -->'}
<section class="branching-strategies" aria-labelledby="branching-title">
  <div class="heading-row">
    <span class="badge" aria-hidden="true">1</span>
    <div>
      <h2 id="branching-title">One feature, one fix, three release paths</h2>
      <p>Each lane runs the same work across the same ten days, so branch lifetime and release path stay comparable.</p>
    </div>
  </div>

  <div class="controls" aria-label="Branching strategy controls">
    <span class="show-label">Highlight</span>
    <Segmented bind:value={highlight} options={HIGHLIGHT_OPTIONS} label="Highlight feature or urgent fix" />
  </div>

  <div class={`stage highlight-${highlight}`} aria-describedby="branching-caption">
    <div class="timeline" aria-hidden="true">
      {#each Array.from({ length: 10 }, (_, index) => index + 1) as day}
        <span>Day {day}</span>
      {/each}
    </div>

    <article
      class="lane lane-trunk"
      tabindex="0"
      aria-label="Trunk-based development timeline"
      onfocus={() => focusLane('trunk')}
      onblur={blurLane}
    >
      <div class="lane-copy">
        <h3>Trunk-based</h3>
        <p>Tiny merges, fast releases.</p>
      </div>

      <svg class="diagram" viewBox="0 0 980 164" role="img" aria-labelledby="trunk-title trunk-desc">
        <title id="trunk-title">Trunk-based development lane</title>
        <desc id="trunk-desc">Feature slices integrate into main on days two through six; an urgent fix integrates and releases on day five.</desc>
        <g class="ruler">
          {#each Array.from({ length: 10 }, (_, index) => index + 1) as day}
            <line x1={day * 90} x2={day * 90} y1="18" y2="146" />
          {/each}
        </g>
        <path class="main-line" d="M90 84H900" />
        <text x="42" y="89">main</text>

        <g class="feature work">
          <path class="arc" d="M176 84C196 42 226 42 246 84" />
          <path class="arc" d="M260 84C281 42 313 42 334 84" />
          <path class="arc" d="M350 84C371 42 403 42 424 84" />
          <path class="arc" d="M438 84C459 42 491 42 512 84" />
          <path class="arc" d="M528 84C549 42 581 42 602 84" />
          <text class="optional-label" x="384" y="35">flagged</text>
          <circle class="dot" cx="246" cy="84" r="7" />
          <circle class="dot" cx="334" cy="84" r="7" />
          <circle class="dot" cx="424" cy="84" r="7" />
          <circle class="dot" cx="512" cy="84" r="7" />
          <circle class="dot" cx="602" cy="84" r="7" />
        </g>

        <g class="fix work">
          <path class="arc" d="M480 84C496 124 522 124 538 84" />
          <text class="optional-label" x="472" y="143">fix</text>
          <circle class="dot" cx="538" cy="84" r="7" />
          <path class="diamond" d="M566 84l12-12 12 12-12 12z" />
        </g>

        <g class="release">
          <path class="diamond" d="M270 84l10-10 10 10-10 10z" />
          <path class="diamond" d="M630 84l10-10 10 10-10 10z" />
          <path class="diamond" d="M810 84l10-10 10 10-10 10z" />
          <text class="optional-label" x="638" y="119">release</text>
        </g>
      </svg>
    </article>

    <article
      class="lane lane-github"
      tabindex="0"
      aria-label="GitHub Flow timeline"
      onfocus={() => focusLane('github')}
      onblur={blurLane}
    >
      <div class="lane-copy">
        <h3>GitHub Flow</h3>
        <p>Review branch, merge, deploy.</p>
      </div>

      <svg class="diagram" viewBox="0 0 980 164" role="img" aria-labelledby="github-title github-desc">
        <title id="github-title">GitHub Flow lane</title>
        <desc id="github-desc">The fix branch merges and deploys before the longer feature branch merges and deploys.</desc>
        <g class="ruler">
          {#each Array.from({ length: 10 }, (_, index) => index + 1) as day}
            <line x1={day * 90} x2={day * 90} y1="18" y2="146" />
          {/each}
        </g>
        <path class="main-line" d="M90 92H900" />
        <text x="42" y="97">main</text>

        <g class="feature work">
          <path class="arc long" d="M180 92C250 28 526 28 628 92" />
          <circle class="dot" cx="628" cy="92" r="8" />
          <path class="diamond" d="M668 92l13-13 13 13-13 13z" />
          <text class="optional-label" x="690" y="124">deploy</text>
        </g>

        <g class="fix work">
          <path class="arc" d="M440 92C475 130 530 130 560 92" />
          <text class="optional-label" x="445" y="146">fix branch</text>
          <circle class="dot" cx="560" cy="92" r="8" />
          <path class="diamond" d="M596 92l12-12 12 12-12 12z" />
        </g>
      </svg>
    </article>

    <article
      class="lane lane-gitflow"
      tabindex="0"
      aria-label="Git Flow timeline"
      onfocus={() => focusLane('gitflow')}
      onblur={blurLane}
    >
      <div class="lane-copy">
        <h3>Git Flow</h3>
        <p>Develop, release, sync back.</p>
      </div>

      <svg class="diagram" viewBox="0 0 980 196" role="img" aria-labelledby="gitflow-title gitflow-desc">
        <title id="gitflow-title">Git Flow lane</title>
        <desc id="gitflow-desc">Feature work merges into develop, a release branch moves to main, and a hotfix releases from main then back-merges to develop.</desc>
        <g class="ruler">
          {#each Array.from({ length: 10 }, (_, index) => index + 1) as day}
            <line x1={day * 90} x2={day * 90} y1="22" y2="174" />
          {/each}
        </g>
        <path class="main-line" d="M90 56H900" />
        <path class="develop-line" d="M90 126H900" />
        <text x="42" y="61">main</text>
        <text x="18" y="131">develop</text>

        <g class="feature work">
          <path class="arc long" d="M180 126C260 68 456 68 540 126" />
          <circle class="dot" cx="540" cy="126" r="8" />
          <path class="arc release-branch" d="M602 126C650 82 726 82 774 56" />
          <text class="optional-label" x="636" y="80">release</text>
          <circle class="dot" cx="602" cy="126" r="7" />
          <circle class="dot" cx="774" cy="56" r="8" />
          <path class="diamond" d="M806 56l13-13 13 13-13 13z" />
          <path class="backmerge" d="M800 56C800 92 760 104 706 126" />
        </g>

        <g class="fix work">
          <path class="arc" d="M440 56C478 26 540 26 578 56" />
          <text class="optional-label" x="456" y="24">hotfix</text>
          <circle class="dot" cx="578" cy="56" r="8" />
          <path class="diamond" d="M606 56l12-12 12 12-12 12z" />
          <path class="backmerge" d="M578 56C594 92 602 108 626 126" />
          <circle class="dot" cx="626" cy="126" r="7" />
        </g>
      </svg>
    </article>

    <div class="legend" aria-label="Diagram legend">
      <span><i class="arc-key"></i>Arc = branch lifetime</span>
      <span><i class="dot-key"></i>Dot = integration</span>
      <span><i class="diamond-key"></i>Diamond = release</span>
    </div>
  </div>

  <div class="explainer" aria-live="polite">
    <span class="info" aria-hidden="true">i</span>
    <p id="branching-caption"><strong>{captionLead}.</strong> <span>{activeCaption}</span></p>
  </div>

  <div class="tradeoffs" aria-label="Branching strategy tradeoffs">
    {#each TRADEOFFS as tradeoff}
      <article>
        <h3>{tradeoff.label}</h3>
        <dl>
          <div><dt>Trunk</dt><dd>{tradeoff.trunk}</dd></div>
          <div><dt>GitHub</dt><dd>{tradeoff.github}</dd></div>
          <div><dt>Git Flow</dt><dd>{tradeoff.gitflow}</dd></div>
        </dl>
      </article>
    {/each}
  </div>
</section>

<style>
  .branching-strategies {
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

  .branching-strategies * {
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
  h3,
  p,
  dl,
  dd {
    margin: 0;
  }

  h2 {
    max-width: none;
    font-size: clamp(1.42rem, 2.35vw, 1.72rem);
    font-weight: 700;
    letter-spacing: -0.025em;
    line-height: 1.16;
  }

  .heading-row p {
    margin-top: 0.9rem;
    max-width: 70ch;
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

  .show-label {
    color: var(--muted);
    font-size: 0.72rem;
    font-weight: 800;
    letter-spacing: 0.16em;
    text-transform: uppercase;
  }

  .stage {
    position: relative;
    display: grid;
    gap: 0.85rem;
    margin-top: 1.45rem;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background:
      radial-gradient(circle at 16% 5%, color-mix(in srgb, var(--accent) 18%, transparent), transparent 28%),
      radial-gradient(circle at 90% 75%, color-mix(in srgb, var(--accent-2) 14%, transparent), transparent 34%),
      color-mix(in srgb, var(--surface) 54%, transparent);
    padding: clamp(0.85rem, 2vw, 1.15rem);
  }

  .timeline {
    display: grid;
    grid-template-columns: repeat(10, minmax(0, 1fr));
    gap: 0.2rem;
    padding-left: min(20%, 13rem);
    color: var(--muted);
    font-size: clamp(0.58rem, 1.2vw, 0.72rem);
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .timeline span {
    text-align: center;
  }

  .lane {
    display: grid;
    grid-template-columns: minmax(9.2rem, 0.23fr) minmax(0, 1fr);
    gap: clamp(0.75rem, 2vw, 1.25rem);
    align-items: center;
    min-width: 0;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    background: color-mix(in srgb, var(--surface-2) 68%, transparent);
    padding: clamp(0.75rem, 1.8vw, 1rem);
    transition:
      background var(--dur) var(--ease),
      border-color var(--dur) var(--ease),
      box-shadow var(--dur) var(--ease);
  }

  .lane:focus-visible {
    outline: 2px solid var(--accent-2);
    outline-offset: 3px;
  }

  .lane:hover,
  .lane:focus-within {
    border-color: color-mix(in srgb, var(--accent-2) 52%, var(--border));
    background: color-mix(in srgb, var(--surface-2) 86%, transparent);
    box-shadow: 0 10px 28px rgba(0, 0, 0, 0.14);
  }

  .lane-copy {
    display: grid;
    gap: 0.45rem;
  }

  .lane-copy h3,
  .tradeoffs h3 {
    color: var(--text);
    font-size: clamp(1rem, 1.7vw, 1.14rem);
    font-weight: 850;
    letter-spacing: -0.015em;
  }

  .lane-copy p {
    color: var(--muted);
    font-size: 0.86rem;
    line-height: 1.45;
  }

  .diagram {
    display: block;
    width: 100%;
    height: auto;
    min-width: 0;
  }

  svg text {
    fill: var(--muted);
    font-size: 15px;
    font-weight: 850;
    letter-spacing: -0.01em;
    pointer-events: none;
  }

  .ruler line {
    stroke: var(--faint);
    stroke-width: 1;
    opacity: 0.36;
  }

  .main-line,
  .develop-line {
    fill: none;
    stroke: var(--border-strong);
    stroke-linecap: round;
    stroke-width: 8;
  }

  .develop-line {
    stroke-dasharray: 2 15;
  }

  .arc,
  .backmerge {
    fill: none;
    stroke: var(--work-color);
    stroke-linecap: round;
    stroke-width: 6;
  }

  .arc.long {
    stroke-width: 7;
  }

  .backmerge {
    stroke-dasharray: 8 9;
    stroke-width: 4;
  }

  .feature {
    --work-color: var(--cc-0);
  }

  .fix {
    --work-color: var(--cc-2);
  }

  .dot {
    fill: var(--surface-solid, var(--bg));
    stroke: var(--work-color);
    stroke-width: 4;
  }

  .diamond {
    fill: color-mix(in srgb, var(--work-color, var(--accent-2)) 28%, var(--surface-solid, var(--bg)));
    stroke: var(--work-color, var(--accent-2));
    stroke-linejoin: round;
    stroke-width: 3;
  }

  .release {
    --work-color: var(--accent-2);
  }

  .work,
  .release {
    transition:
      opacity var(--dur) var(--ease),
      filter var(--dur) var(--ease);
  }

  .highlight-feature .fix,
  .highlight-feature .release,
  .highlight-fix .feature,
  .highlight-fix .release {
    opacity: 0.24;
    filter: saturate(0.5);
  }

  .highlight-feature .feature,
  .highlight-fix .fix,
  .highlight-both .work,
  .highlight-both .release {
    opacity: 1;
  }

  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: 0.55rem 1rem;
    align-items: center;
    justify-content: flex-end;
    color: var(--muted);
    font-size: 0.78rem;
    font-weight: 750;
  }

  .legend span {
    display: inline-flex;
    gap: 0.42rem;
    align-items: center;
  }

  .legend i {
    display: inline-block;
    width: 1.1rem;
    height: 0.72rem;
  }

  .arc-key {
    background:
      radial-gradient(120% 110% at 50% 100%, transparent 48%, var(--cc-0) 51% 62%, transparent 65%);
  }

  .dot-key {
    width: 0.68rem;
    height: 0.68rem;
    border-radius: var(--radius-pill);
    background: radial-gradient(circle, var(--surface-solid, var(--bg)) 34%, var(--accent) 38% 66%, transparent 70%);
  }

  .diamond-key {
    width: 0.66rem;
    transform: rotate(45deg);
    border: 2px solid var(--accent-2);
    background: color-mix(in srgb, var(--accent-2) 24%, transparent);
  }

  .explainer {
    display: flex;
    gap: 0.75rem;
    align-items: flex-start;
    margin-top: 1.05rem;
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

  .tradeoffs {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.85rem;
    margin-top: 1rem;
  }

  .tradeoffs article {
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    background: color-mix(in srgb, var(--surface-2) 72%, transparent);
    padding: 1rem;
  }

  .tradeoffs dl {
    display: grid;
    gap: 0.7rem;
    margin-top: 0.85rem;
  }

  .tradeoffs div {
    display: grid;
    gap: 0.12rem;
  }

  .tradeoffs dt {
    color: var(--muted);
    font-size: 0.72rem;
    font-weight: 850;
    letter-spacing: 0.13em;
    text-transform: uppercase;
  }

  .tradeoffs dd {
    color: var(--text);
    font-size: 0.9rem;
    line-height: 1.4;
  }

  @container (max-width: 760px) {
    .timeline {
      padding-left: 0;
    }

    .timeline span {
      font-size: 0;
      letter-spacing: 0.02em;
    }

    .timeline span::after {
      content: attr(data-day);
      font-size: 0.7rem;
    }

    .timeline span:nth-child(1)::after {
      content: 'D1';
    }

    .timeline span:nth-child(2)::after {
      content: 'D2';
    }

    .timeline span:nth-child(3)::after {
      content: 'D3';
    }

    .timeline span:nth-child(4)::after {
      content: 'D4';
    }

    .timeline span:nth-child(5)::after {
      content: 'D5';
    }

    .timeline span:nth-child(6)::after {
      content: 'D6';
    }

    .timeline span:nth-child(7)::after {
      content: 'D7';
    }

    .timeline span:nth-child(8)::after {
      content: 'D8';
    }

    .timeline span:nth-child(9)::after {
      content: 'D9';
    }

    .timeline span:nth-child(10)::after {
      content: 'D10';
    }

    .lane {
      grid-template-columns: 1fr;
    }

    .lane-copy p {
      max-width: 64ch;
    }

    .diagram {
      margin-inline: -0.15rem;
    }

    svg text {
      font-size: 32px;
    }

    .optional-label {
      display: none;
    }

    .tradeoffs {
      grid-template-columns: 1fr;
    }
  }

  @container (max-width: 460px) {
    .branching-strategies {
      padding: 1.05rem;
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

    .stage {
      padding: 0.65rem;
    }

    .lane {
      padding: 0.72rem;
    }

    .legend {
      justify-content: flex-start;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .lane,
    .work,
    .release {
      transition-duration: 0ms;
    }
  }
</style>
