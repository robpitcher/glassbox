<script lang="ts">
  import {
    ACCOUNT_MODES,
    CAPTIONS,
    INSPECT_TARGETS,
    MODE_NOTES,
    type AccountMode,
    type InspectTarget,
  } from './data';

  let mode = $state<AccountMode>('personal');
  let inspect = $state<InspectTarget>('repository');

  const caption = $derived(CAPTIONS[mode][inspect]);
  const modeNote = $derived(MODE_NOTES[mode]);

  function setMode(next: AccountMode) {
    mode = next;
  }

  function setInspect(next: InspectTarget) {
    inspect = next;
  }

  function handleKeys<T extends string>(
    event: KeyboardEvent,
    values: readonly T[],
    current: T,
    setter: (next: T) => void
  ) {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;

    event.preventDefault();
    const currentIndex = values.indexOf(current);
    const lastIndex = values.length - 1;
    const nextIndex =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? lastIndex
          : event.key === 'ArrowLeft' || event.key === 'ArrowUp'
            ? (currentIndex - 1 + values.length) % values.length
            : (currentIndex + 1) % values.length;
    const next = values[nextIndex];
    setter(next);

    const buttons = Array.from((event.currentTarget as HTMLElement).querySelectorAll('button'));
    buttons[nextIndex]?.focus();
  }

  const modeIds = ACCOUNT_MODES.map((item) => item.id);
  const inspectIds = INSPECT_TARGETS.map((item) => item.id);
</script>

<section class="account-hierarchy" aria-labelledby="account-hierarchy-title">
  <div class="heading-row">
    <span class="badge" aria-hidden="true">1</span>
    <div>
      <h2 id="account-hierarchy-title">Accounts, organizations, and enterprises are different layers</h2>
      <p>Use the toggles to see who owns an account, where work lives, and how governance reaches it.</p>
    </div>
  </div>

  <div class="controls" aria-label="Hierarchy controls">
    <span class="show-label">Show</span>

    <div
      class="segmented"
      role="group"
      aria-label="Account model"
      onkeydown={(event) => handleKeys(event, modeIds, mode, setMode)}
    >
      {#each ACCOUNT_MODES as item (item.id)}
        <button
          type="button"
          class:active={mode === item.id}
          aria-pressed={mode === item.id}
          onclick={() => setMode(item.id)}
        >
          {item.label}
        </button>
      {/each}
    </div>

    <span class="show-label inspect-label">Inspect</span>

    <div
      class="segmented"
      role="group"
      aria-label="Inspect a hierarchy example"
      onkeydown={(event) => handleKeys(event, inspectIds, inspect, setInspect)}
    >
      {#each INSPECT_TARGETS as item (item.id)}
        <button
          type="button"
          class:active={inspect === item.id}
          aria-pressed={inspect === item.id}
          onclick={() => setInspect(item.id)}
        >
          {item.label}
        </button>
      {/each}
    </div>
  </div>

  <div class={`stage mode-${mode} inspect-${inspect}`} aria-describedby="hierarchy-caption hierarchy-note">
    <svg class="map map-desktop" viewBox="0 0 820 470" role="img" aria-labelledby="desktop-map-title">
      <title id="desktop-map-title">Abstract GitHub account hierarchy diagram</title>
      <defs>
        <marker id="arrow-head" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" class="marker-fill"></path>
        </marker>
        <linearGradient id="policy-gradient" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stop-color="var(--accent)" stop-opacity="0.55"></stop>
          <stop offset="1" stop-color="var(--accent-2)" stop-opacity="0.22"></stop>
        </linearGradient>
      </defs>

      <g class="policy-flow map-piece">
        <path d="M512 106 C508 126 506 140 506 158" marker-end="url(#arrow-head)"></path>
        <path d="M512 106 C612 126 688 140 708 174" marker-end="url(#arrow-head)"></path>
      </g>

      <g class="member-lines personal-only map-piece">
        <path d="M130 148 C190 166 234 196 292 238"></path>
        <path d="M104 298 C190 292 264 302 332 316"></path>
        <path d="M722 126 C696 162 674 196 656 236"></path>
      </g>

      <g class="scim emu-only map-piece">
        <rect x="48" y="166" width="88" height="52" rx="17"></rect>
        <text x="92" y="198" text-anchor="middle">IdP</text>
        <path d="M140 192 C178 184 204 160 232 136" marker-end="url(#arrow-head)"></path>
        <text x="176" y="165" text-anchor="middle">SCIM</text>
      </g>

      <g class="enterprise-frame map-piece">
        <rect x="230" y="46" width="540" height="372" rx="34"></rect>
        <text x="262" y="88">Enterprise</text>
      </g>

      <g class="org-region org-web map-piece">
        <rect x="286" y="146" width="230" height="212" rx="28"></rect>
        <text x="316" y="184">octo-web</text>

        <g class="repository-focus map-piece">
          <rect x="318" y="218" width="58" height="58" rx="13"></rect>
          <text x="347" y="252" text-anchor="middle">site</text>
        </g>
        <g class="repo-secondary map-piece">
          <rect x="434" y="218" width="44" height="44" rx="11"></rect>
          <text x="456" y="245" text-anchor="middle">docs</text>
        </g>

        <g class="team-focus map-piece">
          <ellipse cx="406" cy="310" rx="82" ry="34"></ellipse>
          <text x="406" y="300" text-anchor="middle">web-core</text>
        </g>

        <g class="org-users">
          <circle class="team-member map-piece" cx="372" cy="316" r="6"></circle>
          <circle class="team-member map-piece" cx="398" cy="323" r="6"></circle>
          <circle class="team-member map-piece" cx="422" cy="316" r="6"></circle>
          <circle class="team-member map-piece" cx="444" cy="326" r="6"></circle>
        </g>

        <path class="team-access map-piece" d="M372 286 C362 276 354 268 350 260" marker-end="url(#arrow-head)"></path>
      </g>

      <g class="org-region org-data map-piece">
        <rect x="558" y="164" width="174" height="182" rx="28"></rect>
        <text x="588" y="202">octo-data</text>
        <rect x="604" y="244" width="50" height="50" rx="12"></rect>
        <text x="629" y="274" text-anchor="middle">api</text>
        <circle class="team-member" cx="676" cy="300" r="6"></circle>
        <circle class="team-member" cx="700" cy="290" r="6"></circle>
      </g>

      <g class="managed-users emu-only map-piece">
        <circle cx="296" cy="112" r="6"></circle>
        <circle cx="320" cy="112" r="6"></circle>
        <circle cx="344" cy="112" r="6"></circle>
        <text x="374" y="117">managed</text>
      </g>

      <g class="personal-users personal-only map-piece">
        <circle cx="90" cy="138" r="9"></circle>
        <circle cx="124" cy="150" r="9"></circle>
        <circle cx="84" cy="298" r="9"></circle>
        <circle cx="724" cy="112" r="9"></circle>
        <text x="78" y="108">personal</text>
        <rect x="152" y="128" width="30" height="30" rx="8"></rect>
        <text x="167" y="118" text-anchor="middle">repo</text>
      </g>
    </svg>

    <svg class="map map-mobile" viewBox="0 0 390 590" role="img" aria-labelledby="mobile-map-title">
      <title id="mobile-map-title">Stacked account hierarchy diagram</title>
      <defs>
        <marker id="arrow-head-mobile" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" class="marker-fill"></path>
        </marker>
      </defs>

      <g class="personal-users personal-only map-piece">
        <circle cx="80" cy="54" r="9"></circle>
        <circle cx="114" cy="54" r="9"></circle>
        <circle cx="96" cy="88" r="9"></circle>
        <text x="134" y="62">personal</text>
        <rect x="270" y="50" width="30" height="30" rx="8"></rect>
        <text x="285" y="42" text-anchor="middle">repo</text>
      </g>

      <g class="member-lines personal-only map-piece">
        <path d="M102 100 C124 132 146 158 172 190" marker-end="url(#arrow-head-mobile)"></path>
      </g>

      <g class="scim emu-only map-piece">
        <rect x="48" y="34" width="86" height="50" rx="17"></rect>
        <text x="91" y="64" text-anchor="middle">IdP</text>
        <path d="M136 59 C174 58 198 82 226 120" marker-end="url(#arrow-head-mobile)"></path>
        <text x="174" y="47" text-anchor="middle">SCIM</text>
      </g>

      <g class="enterprise-frame map-piece">
        <rect x="42" y="126" width="306" height="414" rx="30"></rect>
        <text x="70" y="166">Enterprise</text>
      </g>

      <g class="policy-flow map-piece">
        <path d="M194 172 C254 184 296 196 308 232" marker-end="url(#arrow-head-mobile)"></path>
        <path d="M194 172 C292 270 300 350 286 418" marker-end="url(#arrow-head-mobile)"></path>
      </g>

      <g class="managed-users emu-only map-piece">
        <text x="230" y="144">managed</text>
        <circle cx="238" cy="164" r="6"></circle>
        <circle cx="260" cy="164" r="6"></circle>
        <circle cx="282" cy="164" r="6"></circle>
      </g>

      <g class="org-region org-web map-piece">
        <rect x="78" y="212" width="234" height="162" rx="26"></rect>
        <text x="108" y="249">octo-web</text>
        <g class="repository-focus map-piece">
          <rect x="116" y="282" width="52" height="52" rx="12"></rect>
          <text x="142" y="313" text-anchor="middle">site</text>
        </g>
        <g class="team-focus map-piece">
          <ellipse cx="228" cy="318" rx="60" ry="32"></ellipse>
          <text x="228" y="308" text-anchor="middle">web-core</text>
        </g>
        <circle class="team-member map-piece" cx="204" cy="322" r="6"></circle>
        <circle class="team-member map-piece" cx="228" cy="328" r="6"></circle>
        <circle class="team-member map-piece" cx="252" cy="322" r="6"></circle>
        <path class="team-access map-piece" d="M184 298 C176 298 168 300 160 304" marker-end="url(#arrow-head-mobile)"></path>
      </g>

      <g class="org-region org-data map-piece">
        <rect x="88" y="404" width="214" height="98" rx="24"></rect>
        <text x="118" y="443">octo-data</text>
        <rect x="222" y="432" width="44" height="44" rx="11"></rect>
        <text x="244" y="459" text-anchor="middle">api</text>
      </g>
    </svg>

    <div class="legend-strip" aria-hidden="true">
      <span><i class="owner"></i> Owner</span>
      <span><i class="reach"></i> Reach</span>
      <span><i class="member"></i> Member</span>
    </div>
  </div>

  <div class="explainer" aria-live="polite">
    <span class="info" aria-hidden="true">i</span>
    <p id="hierarchy-caption"><strong>{caption}</strong> <span id="hierarchy-note">{modeNote}</span></p>
  </div>
</section>

<style>
  .account-hierarchy {
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

  .account-hierarchy * {
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
    font-size: clamp(1.42rem, 2.35vw, 1.72rem);
    font-weight: 700;
    letter-spacing: -0.025em;
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

  .inspect-label {
    margin-left: auto;
  }

  .segmented {
    display: inline-grid;
    grid-auto-flow: column;
    gap: 0.18rem;
    border: 1px solid var(--border);
    border-radius: var(--radius-pill);
    background: var(--bg);
    padding: 0.18rem;
  }

  button {
    border: 0;
    border-radius: var(--radius-pill);
    background: transparent;
    color: var(--muted);
    cursor: pointer;
    font: inherit;
    font-size: 0.9rem;
    font-weight: 800;
    padding: 0.46rem 0.86rem;
    transition:
      background var(--dur) var(--ease),
      box-shadow var(--dur) var(--ease),
      color var(--dur) var(--ease);
  }

  button.active {
    background: var(--accent-grad);
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--on-accent) 30%, transparent);
    color: var(--on-accent);
  }

  button:focus-visible {
    outline: 2px solid var(--accent-2);
    outline-offset: 3px;
  }

  .stage {
    position: relative;
    margin-top: 1.55rem;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background:
      radial-gradient(circle at 20% 12%, color-mix(in srgb, var(--accent) 18%, transparent), transparent 28%),
      radial-gradient(circle at 84% 78%, color-mix(in srgb, var(--accent-2) 16%, transparent), transparent 32%),
      color-mix(in srgb, var(--surface) 54%, transparent);
    padding: clamp(0.45rem, 1vw, 0.8rem);
  }

  .map {
    display: block;
    width: 100%;
    height: auto;
  }

  .map-mobile {
    display: none;
  }

  svg text {
    fill: var(--text);
    font-size: 0.92rem;
    font-weight: 800;
    letter-spacing: -0.01em;
    pointer-events: none;
  }

  svg rect,
  svg ellipse,
  svg circle,
  svg path {
    transition:
      opacity var(--dur) var(--ease),
      stroke var(--dur) var(--ease),
      stroke-width var(--dur) var(--ease),
      fill var(--dur) var(--ease),
      transform var(--dur) var(--ease);
  }

  .marker-fill {
    fill: var(--accent-2);
  }

  .enterprise-frame rect {
    fill: color-mix(in srgb, var(--accent) 6%, transparent);
    stroke: var(--border-strong);
    stroke-width: 2;
  }

  .org-region > rect {
    fill: color-mix(in srgb, var(--surface-2) 82%, transparent);
    stroke: var(--border-strong);
    stroke-width: 1.5;
  }

  .repository-focus rect {
    fill: color-mix(in srgb, var(--accent) 24%, var(--surface-2));
    stroke: color-mix(in srgb, var(--accent) 70%, var(--border));
    stroke-width: 1.6;
  }

  .repo-secondary rect,
  .org-data rect:not(:first-child),
  .personal-users rect {
    fill: color-mix(in srgb, var(--cc-1) 18%, var(--surface-2));
    stroke: color-mix(in srgb, var(--cc-1) 64%, var(--border));
    stroke-width: 1.3;
  }

  .team-focus ellipse {
    fill: color-mix(in srgb, var(--accent-2) 8%, transparent);
    stroke: color-mix(in srgb, var(--accent-2) 75%, var(--border));
    stroke-dasharray: 7 7;
    stroke-width: 2;
  }

  .team-member,
  .managed-users circle,
  .personal-users circle {
    fill: var(--accent-2);
    stroke: color-mix(in srgb, var(--surface-solid, var(--bg)) 90%, transparent);
    stroke-width: 2;
  }

  .personal-users circle {
    fill: var(--cc-2);
  }

  .member-lines path,
  .scim path,
  .team-access,
  .policy-flow path {
    fill: none;
    stroke: var(--accent-2);
    stroke-linecap: round;
    stroke-width: 1.8;
  }

  .member-lines path {
    stroke: color-mix(in srgb, var(--muted) 75%, transparent);
    stroke-dasharray: 4 6;
  }

  .policy-flow path {
    opacity: 0;
    stroke: color-mix(in srgb, var(--accent-2) 74%, transparent);
    stroke-width: 6;
  }

  .scim rect {
    fill: color-mix(in srgb, var(--warn) 15%, var(--surface-2));
    stroke: color-mix(in srgb, var(--warn) 70%, var(--border));
    stroke-width: 1.5;
  }

  .personal-only,
  .emu-only {
    transition:
      opacity var(--dur) var(--ease),
      visibility 0s linear var(--dur);
  }

  .mode-personal .emu-only,
  .mode-emu .personal-only {
    opacity: 0;
    pointer-events: none;
    visibility: hidden;
  }

  .mode-personal .personal-only,
  .mode-emu .emu-only {
    opacity: 1;
    visibility: visible;
    transition-delay: 0s;
  }

  .inspect-repository .map-piece,
  .inspect-team .map-piece,
  .inspect-policy .map-piece {
    opacity: 0.28;
  }

  .inspect-repository .enterprise-frame,
  .inspect-repository .org-web,
  .inspect-repository .repository-focus,
  .inspect-repository .team-access,
  .inspect-repository .member-lines,
  .inspect-repository .scim,
  .inspect-team .enterprise-frame,
  .inspect-team .org-web,
  .inspect-team .team-focus,
  .inspect-team .team-member,
  .inspect-team .team-access,
  .inspect-team .member-lines,
  .inspect-team .scim,
  .inspect-policy .enterprise-frame,
  .inspect-policy .org-region,
  .inspect-policy .policy-flow,
  .inspect-policy .repository-focus,
  .inspect-policy .repo-secondary {
    opacity: 1;
  }

  .inspect-repository .repository-focus rect,
  .inspect-team .team-focus ellipse,
  .inspect-policy .enterprise-frame rect {
    stroke: var(--accent-2);
    stroke-width: 3;
  }

  .inspect-policy .org-region > rect {
    fill: color-mix(in srgb, var(--accent) 13%, var(--surface-2));
  }

  .inspect-policy .policy-flow path {
    opacity: 0.54;
  }

  .stage.mode-personal .emu-only,
  .stage.mode-emu .personal-only {
    opacity: 0;
    pointer-events: none;
    visibility: hidden;
  }

  .legend-strip {
    display: flex;
    flex-wrap: wrap;
    gap: 0.6rem 1rem;
    align-items: center;
    justify-content: flex-end;
    margin: -0.25rem 0.45rem 0.25rem;
    color: var(--muted);
    font-size: 0.78rem;
    font-weight: 700;
  }

  .legend-strip span {
    display: inline-flex;
    gap: 0.4rem;
    align-items: center;
  }

  .legend-strip i {
    width: 0.68rem;
    height: 0.68rem;
    border-radius: var(--radius-pill);
  }

  .legend-strip .owner {
    background: var(--accent);
  }

  .legend-strip .reach {
    background: var(--accent-2);
  }

  .legend-strip .member {
    background: var(--cc-2);
  }

  .explainer {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 0.8rem;
    align-items: start;
    margin-top: 1rem;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    background: color-mix(in srgb, var(--surface-2) 78%, transparent);
    padding: 0.9rem 1rem;
  }

  .info {
    display: grid;
    width: 1.35rem;
    height: 1.35rem;
    place-items: center;
    border-radius: var(--radius-pill);
    background: var(--accent-soft);
    color: var(--accent-2);
    font-size: 0.78rem;
    font-weight: 900;
  }

  .explainer p {
    color: var(--muted);
    font-size: 0.95rem;
    line-height: 1.5;
  }

  .explainer strong {
    color: var(--text);
  }

  @container (max-width: 760px) {
    .controls {
      align-items: stretch;
    }

    .inspect-label {
      margin-left: 0;
    }

    .segmented {
      grid-auto-flow: row;
      grid-template-columns: 1fr 1fr;
      width: 100%;
    }

    .controls .segmented:last-child {
      grid-template-columns: repeat(3, 1fr);
    }

    button {
      padding-inline: 0.65rem;
    }
  }

  @container (max-width: 640px) {
    .account-hierarchy {
      padding: 1rem;
      border-radius: var(--radius);
    }

    .heading-row {
      gap: 0.75rem;
    }

    .badge {
      width: 2rem;
      height: 2rem;
    }

    .map-desktop {
      display: none;
    }

    .map-mobile {
      display: block;
    }

    svg text {
      font-size: 0.84rem;
    }

    .legend-strip {
      justify-content: flex-start;
      margin-top: 0.3rem;
    }
  }

  @container (max-width: 430px) {
    .segmented,
    .controls .segmented:last-child {
      grid-template-columns: 1fr;
    }

    .explainer {
      grid-template-columns: 1fr;
    }
  }

  @media (prefers-reduced-motion: no-preference) {
    .inspect-repository .repository-focus,
    .inspect-team .team-focus,
    .inspect-policy .enterprise-frame {
      animation: focus-breathe 3.2s var(--ease) infinite;
      transform-origin: center;
    }

    @keyframes focus-breathe {
      0%,
      100% {
        transform: scale(1);
      }
      50% {
        transform: scale(1.015);
      }
    }
  }
</style>
