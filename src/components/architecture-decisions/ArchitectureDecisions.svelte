<script lang="ts">
  import { onMount, tick } from 'svelte';
  import InfoBar from '../ui/InfoBar.svelte';
  import SectionHead from '../ui/SectionHead.svelte';
  import {
    CONFLICT_NOTICE,
    CONFLICTS,
    DECISIONS,
    NAME,
    NAME_DOC_SUBDOMAIN,
    NOT_APPLICABLE,
    QUESTIONS,
    QUESTION_BY_ID,
    RATIONALE,
    REGIONS,
    REVIEW,
    STAGE_EMPTY,
    STAGE_REVIEW,
    STAGES,
    STORAGE_KEY,
    UNDECIDED,
    VISUAL,
    type DecisionId,
    type Info,
    type Question,
    type QuestionId,
    type StageId,
  } from './data';

  type Answers = Partial<Record<QuestionId, string>>;
  type Step = QuestionId | 'review';
  type IdentityKey = keyof typeof RATIONALE.identity;

  const NAME_RE = /^[a-z0-9]+$/;

  let answers = $state<Answers>({});
  let name = $state('');
  let overrides = $state<Partial<Record<DecisionId, string>>>({});
  let notes = $state<Partial<Record<DecisionId, string>>>({});
  let current = $state<Step>('hosting');
  let loaded = $state(false);
  let copyNote = $state<string | undefined>();
  let heading: HTMLElement | undefined = $state();

  const isRegion = (v?: string) => !!v && v in REGIONS;

  /** The account model the answers point to, and which rationale explains it. */
  function suggestIdentity(a: Answers): { value: string; key: IdentityKey } {
    if (a.hosting === 'server') return { value: 'instance', key: 'instance' };
    const c = a.collaboration;
    if (isRegion(a.residency)) {
      return c === 'same' ? { value: UNDECIDED, key: 'conflictResidency' } : { value: 'emu', key: 'emuResidency' };
    }
    if (!c || c === 'unknown' || !a.lifecycle || a.lifecycle === 'unknown') return { value: UNDECIDED, key: 'undecided' };
    if (c === 'same') {
      return a.lifecycle === 'idp' ? { value: UNDECIDED, key: 'conflict' } : { value: 'personal', key: 'personalOutside' };
    }
    return a.lifecycle === 'idp' ? { value: 'emu', key: 'emu' } : { value: 'personal', key: 'personal' };
  }

  function applies(q: Question, a: Answers): boolean {
    const server = a.hosting === 'server';
    switch (q.id) {
      case 'residency':
      case 'collaboration':
      case 'isolation':
        return !server;
      case 'lifecycle':
        return !server && !isRegion(a.residency);
      case 'idp':
      case 'name': {
        const id = suggestIdentity(a).value;
        return !server && (id === 'emu' || id === UNDECIDED);
      }
      default:
        return true;
    }
  }

  const active = $derived(QUESTIONS.filter((q) => applies(q, answers)));
  const question = $derived(current === 'review' ? null : QUESTION_BY_ID[current]);
  const index = $derived(question ? active.findIndex((q) => q.id === question.id) : active.length);

  // Suggested choices come from answers; effective choices layer the reader's edits on top.
  const suggested = $derived.by(() => {
    const a = answers;
    const pick = (v: string | undefined, map: Record<string, string>) => (v && map[v]) || UNDECIDED;
    return {
      hosting: pick(a.hosting, { cloud: 'cloud', server: 'server' }),
      residency: a.hosting === 'server' ? NOT_APPLICABLE : pick(a.residency, { none: 'github', eu: 'eu', australia: 'australia', us: 'us', japan: 'japan' }),
      identity: suggestIdentity(a).value,
      enterprises: a.hosting === 'server' ? NOT_APPLICABLE : pick(a.isolation, { none: 'single', entity: 'separate' }),
      orgs: pick(a.orgs, { shared: 'single', boundary: 'red-green', units: 'per-unit', teams: 'single' }),
    };
  });

  const choice = $derived.by(() => {
    const hosting = overrides.hosting ?? suggested.hosting;
    const residency = overrides.residency ?? suggested.residency;
    const identity = overrides.identity ?? suggested.identity;
    const noIdp = hosting === 'server' || identity === 'personal' || identity === 'instance';
    const idpSuggested = noIdp ? NOT_APPLICABLE : (answers.idp && answers.idp !== 'unknown' ? answers.idp : UNDECIDED);
    return {
      hosting,
      residency,
      identity,
      idpSuggested,
      idp: overrides.idp ?? idpSuggested,
      name: noIdp && !isRegion(residency) ? NOT_APPLICABLE : name,
      enterprises: overrides.enterprises ?? suggested.enterprises,
      orgs: overrides.orgs ?? suggested.orgs,
    };
  });

  const subdomain = $derived(isRegion(choice.residency));
  const nameValid = $derived(name === '' || NAME_RE.test(name));

  function optionLabel(id: DecisionId, value: string, short = false): string {
    if (id === 'name') return value === NOT_APPLICABLE ? 'Not applicable' : value ? (subdomain ? NAME.subdomainPreview(value) : value) : 'Not chosen';
    const o = DECISIONS.find((d) => d.id === id)?.options.find((x) => x.id === value);
    return (short && o?.short) || o?.label || value;
  }

  function rationaleFor(id: DecisionId, value: string): string {
    const a = answers;
    switch (id) {
      case 'hosting':
        return RATIONALE.hosting[value as keyof typeof RATIONALE.hosting] ?? RATIONALE.hosting.undecided;
      case 'residency':
        if (isRegion(value)) return RATIONALE.residency.region(REGIONS[value]);
        return value === 'github' ? RATIONALE.residency.github : value === NOT_APPLICABLE ? RATIONALE.residency.na : RATIONALE.residency.undecided;
      case 'identity': {
        const key = suggestIdentity(a).key;
        if (value === 'emu') {
          const base = isRegion(choice.residency) ? RATIONALE.identity.emuResidency : RATIONALE.identity.emu;
          return a.collaboration === 'separate' ? `${base} ${RATIONALE.identity.separate}` : base;
        }
        if (value === 'personal') return a.collaboration === 'same' ? RATIONALE.identity.personalOutside : RATIONALE.identity.personal;
        if (value === 'instance') return RATIONALE.identity.instance;
        return key === 'conflict' || key === 'conflictResidency' ? RATIONALE.identity[key] : RATIONALE.identity.undecided;
      }
      case 'idp':
        if (value === NOT_APPLICABLE) return choice.hosting === 'server' ? RATIONALE.idp.server : RATIONALE.idp.personal;
        if (value === UNDECIDED) return RATIONALE.idp.undecided;
        return `${RATIONALE.idp[value as 'entra' | 'okta' | 'ping' | 'other']} ${RATIONALE.idp.change}`;
      case 'name':
        if (value === NOT_APPLICABLE) return RATIONALE.name.na;
        if (!value || !NAME_RE.test(value)) return RATIONALE.name.empty;
        return subdomain ? RATIONALE.name.subdomain(value) : RATIONALE.name.shortcode(value);
      case 'enterprises':
        return RATIONALE.enterprises[value as keyof typeof RATIONALE.enterprises] ?? RATIONALE.enterprises.undecided;
      case 'orgs':
        if (value === 'single') return a.orgs === 'teams' ? RATIONALE.orgs.fromTeams : RATIONALE.orgs.single;
        if (value === 'red-green') return RATIONALE.orgs.redGreen;
        if (value === 'per-unit') return RATIONALE.orgs.perUnit;
        return RATIONALE.orgs.undecided;
    }
  }

  const suggestedFor = (id: DecisionId): string | undefined =>
    id === 'idp' ? choice.idpSuggested : id === 'name' ? undefined : suggested[id as keyof typeof suggested];

  const conflicts = $derived.by(() => {
    const out: Partial<Record<DecisionId, string>> = {};
    if (choice.hosting === 'server' && isRegion(choice.residency)) out.residency = CONFLICTS.serverResidency;
    if (choice.identity === 'personal' && isRegion(choice.residency)) out.identity = CONFLICTS.personalResidency;
    if (choice.hosting === 'server' && choice.identity === 'emu') out.identity = CONFLICTS.serverEmu;
    return out;
  });

  const rows = $derived(
    DECISIONS.map((d) => {
      const value = choice[d.id];
      const sug = suggestedFor(d.id);
      const changed = sug !== undefined && overrides[d.id] !== undefined && overrides[d.id] !== sug;
      const open = value === UNDECIDED || (d.id === 'name' && (!value || !NAME_RE.test(value))) || !!conflicts[d.id];
      return {
        decision: d,
        value,
        rationale: rationaleFor(d.id, value),
        override: changed ? RATIONALE.override(optionLabel(d.id, sug!)) : undefined,
        conflict: conflicts[d.id],
        open,
        doc: d.id === 'name' && subdomain ? NAME_DOC_SUBDOMAIN : d.doc,
      };
    }),
  );

  // Trail: one cell per stage, showing the choice it led to.
  const stageValue = (s: StageId): string | null => {
    const qs = active.filter((q) => q.stage === s);
    if (s === 'review') return active.every((q) => q.id === 'name' || answers[q.id]) ? STAGE_REVIEW.ready : STAGE_REVIEW.pending;
    if (!qs.length) return null;
    const touched = qs.some((q) => (q.id === 'name' ? name : answers[q.id]));
    if (!touched) return STAGE_EMPTY;
    const id: DecisionId = s === 'structure' ? 'orgs' : (s as DecisionId);
    return optionLabel(id, choice[id], true);
  };

  const stageOpen = (s: StageId) =>
    s !== 'review' && rows.some((r) => r.open && (r.decision.id === (s === 'structure' ? 'orgs' : s) || (s === 'identity' && r.decision.id === 'idp')));
  const currentStage = $derived(question ? question.stage : 'review');
  const progress = $derived(current === 'review' ? 100 : Math.round((index / active.length) * 100));

  async function go(step: Step, focus = true) {
    current = step;
    copyNote = undefined;
    if (!focus) return;
    await tick();
    heading?.focus();
  }

  function goStage(s: StageId) {
    if (s === 'review') return go('review');
    const q = active.find((x) => x.stage === s);
    if (q) go(q.id);
  }

  const answered = $derived(question ? (question.id === 'name' ? nameValid : !!answers[question.id]) : true);

  function next() {
    if (!question || !answered) return;
    const list = QUESTIONS.filter((q) => applies(q, answers));
    const i = list.findIndex((q) => q.id === question.id);
    go(list[i + 1]?.id ?? 'review');
  }

  function back() {
    if (current === 'review') return go(active[active.length - 1].id);
    if (index > 0) go(active[index - 1].id);
  }

  function choose(id: string) {
    if (!question) return;
    answers = { ...answers, [question.id]: id };
  }

  function clearAnswer() {
    if (!question || question.id === 'name' || !answers[question.id]) return;
    const { [question.id]: _, ...rest } = answers;
    answers = rest;
  }

  function setOverride(id: DecisionId, value: string) {
    const { [id]: _, ...rest } = overrides;
    overrides = value === suggestedFor(id) ? rest : { ...rest, [id]: value };
  }

  function reset() {
    answers = {};
    name = '';
    overrides = {};
    notes = {};
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    go('hosting');
  }

  const cell = (s: string) => s.replace(/\|/g, '\\|').replace(/\r?\n/g, '<br>').trim();

  function markdown(): string {
    const head = REVIEW.markdownHeader;
    const lines = [REVIEW.markdownTitle, '', `| ${head.join(' | ')} |`, `| ${head.map(() => '---').join(' | ')} |`];
    for (const r of rows) {
      const why = [r.conflict && `${REVIEW.conflictPrefix} ${r.conflict}`, r.rationale, r.override].filter(Boolean).join(' ');
      lines.push(
        `| ${[r.decision.label, optionLabel(r.decision.id, r.value), r.decision.impact, why, notes[r.decision.id] ?? ''].map(cell).join(' | ')} |`,
      );
    }
    return lines.join('\n') + '\n';
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(markdown());
      copyNote = REVIEW.copied;
    } catch {
      copyNote = REVIEW.copyFailed;
    }
  }

  onMount(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        answers = s.answers ?? {};
        name = typeof s.name === 'string' ? s.name : '';
        overrides = s.overrides ?? {};
        notes = s.notes ?? {};
        const step = s.current as Step;
        current = step === 'review' || QUESTIONS.some((q) => q.id === step && applies(q, answers)) ? step : 'hosting';
      }
    } catch {}
    loaded = true;
  });

  $effect(() => {
    const data = JSON.stringify({ answers, name, overrides, notes, current });
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, data);
    } catch {}
  });

  const selectedAnswer = $derived(question ? question.answers.find((a) => a.id === answers[question.id]) : undefined);
  const conflictHere = $derived(
    !!question && (question.id === 'collaboration' || question.id === 'lifecycle') && suggestIdentity(answers).key.startsWith('conflict'),
  );
  const openCount = $derived(rows.filter((r) => r.open).length);

  const info = $derived.by((): Info => {
    if (!question) return REVIEW.info(rows.length - openCount, rows.length, openCount);
    if (question.id === 'name') return name && nameValid ? NAME.answeredInfo(name, subdomain) : question.info;
    return selectedAnswer?.info ?? question.info;
  });
</script>

<section class="visual" aria-labelledby="ad-title" onkeydown={(e) => e.key === 'Escape' && clearAnswer()}>
  <SectionHead n={1} id="ad-title" title={VISUAL.title}>{VISUAL.description}</SectionHead>

  <nav class="trail" aria-label={VISUAL.trailLabel}>
    <span class="bar" aria-hidden="true"><span style="clip-path: inset(0 {100 - progress}% 0 0)"></span></span>
    <ol>
      {#each STAGES as s, i (s.id)}
        {@const value = stageValue(s.id)}
        <li>
          <button
            type="button"
            class="stage"
            class:is-current={currentStage === s.id}
            class:is-open={stageOpen(s.id) && value !== STAGE_EMPTY}
            aria-current={currentStage === s.id ? 'step' : undefined}
            disabled={value === null}
            onclick={() => goStage(s.id)}
          >
            <span class="num" aria-hidden="true">{i + 1}</span>
            <span class="visual-label">{s.label}</span>
            <span class="val">{value ?? 'Not applicable'}</span>
          </button>
        </li>
      {/each}
    </ol>
  </nav>

  {#if question}
    <div class="step">
      <div class="ask">
        <span class="visual-label">{VISUAL.step(index + 1, active.length)}</span>
        <h3 tabindex="-1" bind:this={heading}>{question.prompt}</h3>
        <p class="desc">{question.description}</p>

        {#if question.id === 'name'}
          <label class="field">
            <span class="visual-label">{subdomain ? NAME.subdomainLabel : NAME.shortcodeLabel}</span>
            <input
              type="text"
              bind:value={name}
              placeholder={NAME.placeholder}
              autocomplete="off"
              spellcheck="false"
              maxlength="40"
              aria-invalid={!nameValid}
              aria-describedby="ad-name-hint"
            />
            <span id="ad-name-hint" class="hint" class:bad={!nameValid}>
              {#if !nameValid}{NAME.invalid}{:else}{(subdomain ? NAME.subdomainPreview : NAME.shortcodePreview)(name || NAME.placeholder)}{/if}
            </span>
          </label>
        {:else}
          <div class="answers" role="group" aria-label={question.prompt}>
            {#each question.answers as a (a.id)}
              <button
                type="button"
                class="answer"
                class:is-unknown={a.id === 'unknown'}
                aria-pressed={answers[question.id] === a.id}
                onclick={() => choose(a.id)}
              >
                <span class="mark" aria-hidden="true"></span>
                <b>{a.label}</b>
                <small>{a.detail}</small>
              </button>
            {/each}
          </div>
        {/if}

        {#if conflictHere}
          <p class="notice" role="note"><span aria-hidden="true">!</span> {CONFLICT_NOTICE}</p>
        {/if}

        <div class="nav">
          <button type="button" class="btn" onclick={back} disabled={index === 0}>{VISUAL.back}</button>
          <button type="button" class="btn primary" onclick={next} disabled={!answered}>
            {index === active.length - 1 ? VISUAL.finish : VISUAL.next}
          </button>
        </div>
      </div>

      <aside class="context">
        <span class="visual-label">Why it’s hard to change</span>
        <b>{question.context.title}</b>
        <p>{question.context.text}</p>
        <a href={question.doc.href} target="_blank" rel="noopener">{question.doc.label}</a>
      </aside>
    </div>
  {:else}
    <div class="review">
      <div class="review-head">
        <div>
          <h3 tabindex="-1" bind:this={heading}>{REVIEW.title}</h3>
          <p class="desc">{REVIEW.description}</p>
        </div>
        <div class="actions">
          <button type="button" class="btn" onclick={() => go('hosting')}>{REVIEW.edit}</button>
          <button type="button" class="btn" onclick={reset}>{REVIEW.reset}</button>
          <button type="button" class="btn primary" onclick={copy}>{REVIEW.copy}</button>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th scope="col">{REVIEW.columns.decision}</th>
            <th scope="col">{REVIEW.columns.choice}</th>
            <th scope="col">{REVIEW.columns.rationale}</th>
          </tr>
        </thead>
        <tbody>
          {#each rows as r (r.decision.id)}
            {@const d = r.decision}
            <tr class:is-open={r.open}>
              <th scope="row">
                <b>{d.label}</b>
                <span class="impact" class:fixed={d.fixed}>{d.impact}</span>
              </th>
              <td class="choice">
                {#if d.id === 'name'}
                  {#if r.value === NOT_APPLICABLE}
                    <span class="na">Not applicable</span>
                  {:else}
                    <input
                      type="text"
                      bind:value={name}
                      placeholder={NAME.placeholder}
                      aria-label={subdomain ? NAME.subdomainLabel : NAME.shortcodeLabel}
                      aria-invalid={!nameValid}
                      spellcheck="false"
                    />
                    {#if subdomain && name && nameValid}<small>{NAME.subdomainPreview(name)}</small>{/if}
                  {/if}
                {:else}
                  <select aria-label="{d.label} choice" value={r.value} onchange={(e) => setOverride(d.id, e.currentTarget.value)}>
                    {#each d.options as o (o.id)}
                      <option value={o.id}>{o.label}</option>
                    {/each}
                  </select>
                  {#if r.value === suggestedFor(d.id)}<small class="tag">{REVIEW.suggested}</small>{/if}
                {/if}
              </td>
              <td class="why">
                {#if r.conflict}<p class="warn"><span aria-hidden="true">!</span> {r.conflict}</p>{/if}
                <p>{r.rationale}</p>
                {#if r.override}<p class="muted">{r.override}</p>{/if}
                <a href={r.doc} target="_blank" rel="noopener">{REVIEW.docLink}</a>
                <label class="notes">
                  <span class="visual-label">{REVIEW.notesLabel}</span>
                  <textarea
                    rows="2"
                    placeholder={REVIEW.notesPlaceholder}
                    value={notes[d.id] ?? ''}
                    oninput={(e) => (notes = { ...notes, [d.id]: e.currentTarget.value })}
                  ></textarea>
                </label>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}

  <p class="saved">{VISUAL.saved}</p>
  <InfoBar lead={info.lead} text={info.text} note={current === 'review' ? copyNote : undefined} />
</section>

<style>
  /* Decision trail */
  .trail {
    position: relative;
    margin-top: 1.5rem;
  }

  .bar {
    display: block;
    height: 3px;
    margin-bottom: 0.6rem;
    border-radius: var(--radius-pill);
    background: var(--border);
    overflow: hidden;
  }

  .bar span {
    display: block;
    height: 100%;
    background: var(--accent-grad);
    transition: clip-path var(--dur) var(--ease);
  }

  .trail ol {
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 0.5rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .stage {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    gap: 0.1rem 0.5rem;
    align-items: center;
    width: 100%;
    height: 100%;
    padding: 0.55rem 0.65rem;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    background: var(--surface);
    color: var(--text);
    font: inherit;
    text-align: left;
    cursor: pointer;
    transition:
      border-color var(--dur) var(--ease),
      background-color var(--dur) var(--ease);
  }

  .stage:hover:not(:disabled) {
    border-color: var(--border-strong);
  }

  .stage:disabled {
    cursor: default;
    border-style: dashed;
    background: transparent;
  }

  .stage:disabled .val {
    color: var(--muted);
  }

  .stage.is-current {
    border-color: var(--accent);
    background: var(--accent-soft);
  }

  .stage.is-open:not(.is-current) {
    border-color: color-mix(in srgb, var(--warn) 60%, var(--border));
  }

  .num {
    display: inline-grid;
    grid-row: 1 / 3;
    width: 1.4rem;
    height: 1.4rem;
    place-items: center;
    border: 1px solid var(--border-strong);
    border-radius: var(--radius-pill);
    color: var(--muted);
    font-size: 0.72rem;
    font-weight: 800;
  }

  .is-current .num {
    border-color: var(--accent);
    background: var(--accent);
    color: var(--on-accent);
  }

  .val {
    overflow: hidden;
    font-size: 0.8rem;
    font-weight: 650;
    line-height: 1.25;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .stage:focus-visible,
  .answer:focus-visible,
  .btn:focus-visible,
  h3:focus-visible,
  input:focus-visible,
  select:focus-visible,
  textarea:focus-visible,
  a:focus-visible {
    outline: 2px solid var(--accent-2);
    outline-offset: 2px;
  }

  h3:focus:not(:focus-visible) {
    outline: none;
  }

  /* Question step */
  .step {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 18rem);
    gap: 1.25rem;
    margin-top: 1.25rem;
  }

  h3 {
    margin-top: 0.4rem;
    font-size: clamp(1.15rem, 2.6vw, 1.45rem);
    line-height: 1.2;
    letter-spacing: -0.02em;
  }

  .desc {
    margin-top: 0.4rem;
    color: var(--muted);
    line-height: 1.5;
  }

  .answers {
    display: grid;
    gap: 0.5rem;
    margin-top: 1rem;
  }

  .answer {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    gap: 0.15rem 0.7rem;
    width: 100%;
    padding: 0.7rem 0.85rem;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    background: var(--surface-solid);
    color: var(--text);
    font: inherit;
    text-align: left;
    cursor: pointer;
    transition:
      border-color var(--dur) var(--ease),
      background-color var(--dur) var(--ease);
  }

  .answer:hover {
    border-color: var(--border-strong);
  }

  .answer.is-unknown {
    border-style: dashed;
  }

  .answer[aria-pressed='true'] {
    border-color: var(--accent);
    border-style: solid;
    background: color-mix(in srgb, var(--accent) 10%, var(--surface-solid));
  }

  .mark {
    grid-row: 1 / 3;
    width: 1rem;
    height: 1rem;
    margin-top: 0.15rem;
    border: 2px solid var(--border-strong);
    border-radius: var(--radius-pill);
    transition: border-color var(--dur) var(--ease);
  }

  [aria-pressed='true'] .mark {
    border: 5px solid var(--accent);
  }

  .answer b {
    font-weight: 700;
    line-height: 1.3;
  }

  .answer small {
    color: var(--muted);
    font-size: 0.85rem;
    line-height: 1.4;
  }

  .field {
    display: grid;
    gap: 0.4rem;
    max-width: 24rem;
    margin-top: 1rem;
  }

  input,
  select,
  textarea {
    width: 100%;
    padding: 0.55rem 0.7rem;
    border: 1px solid var(--border-strong);
    border-radius: var(--radius-sm);
    background: var(--surface-solid);
    color: var(--text);
    font: inherit;
  }

  input {
    font-family: var(--font-mono);
  }

  input[aria-invalid='true'] {
    border-color: var(--bad);
  }

  .hint {
    color: var(--muted);
    font-family: var(--font-mono);
    font-size: 0.85rem;
  }

  .hint.bad {
    color: var(--bad);
    font-family: var(--font-sans);
  }

  .notice,
  .warn {
    display: flex;
    gap: 0.5rem;
    align-items: flex-start;
    color: var(--text);
    line-height: 1.45;
  }

  .notice {
    margin-top: 0.85rem;
    padding: 0.6rem 0.8rem;
    border: 1px solid color-mix(in srgb, var(--warn) 60%, var(--border));
    border-radius: var(--radius-sm);
    background: color-mix(in srgb, var(--warn) 10%, var(--surface-solid));
    font-size: 0.9rem;
  }

  .notice span,
  .warn span {
    display: inline-grid;
    flex: 0 0 auto;
    width: 1.2rem;
    height: 1.2rem;
    place-items: center;
    border-radius: var(--radius-pill);
    background: var(--warn);
    color: var(--bg);
    font-size: 0.75rem;
    font-weight: 800;
  }

  .nav,
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .nav {
    justify-content: space-between;
    margin-top: 1.1rem;
  }

  .btn {
    padding: 0.5rem 1rem;
    border: 1px solid var(--border-strong);
    border-radius: var(--radius-pill);
    background: var(--surface-solid);
    color: var(--text);
    font: inherit;
    font-size: 0.9rem;
    font-weight: 650;
    cursor: pointer;
    transition:
      border-color var(--dur) var(--ease),
      background-color var(--dur) var(--ease);
  }

  .btn:hover:not(:disabled) {
    border-color: var(--accent);
  }

  .btn:disabled {
    border-style: dashed;
    background: transparent;
    color: var(--muted);
    cursor: default;
  }

  .btn.primary:not(:disabled) {
    border-color: var(--accent);
    background: var(--accent);
    color: var(--on-accent);
  }

  .context {
    display: grid;
    gap: 0.45rem;
    align-content: start;
    align-self: start;
    padding: 1rem;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: var(--surface);
  }

  .context p {
    color: var(--muted);
    font-size: 0.9rem;
    line-height: 1.5;
  }

  a {
    color: var(--accent);
    font-size: 0.88rem;
    font-weight: 650;
  }

  /* Review */
  .review {
    margin-top: 1.25rem;
  }

  .review-head {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem 1.5rem;
    align-items: flex-end;
    justify-content: space-between;
  }

  table {
    width: 100%;
    margin-top: 1rem;
    border-collapse: separate;
    border-spacing: 0;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: var(--surface);
    overflow: hidden;
  }

  th,
  td {
    padding: 0.8rem 0.9rem;
    border-top: 1px solid var(--border);
    text-align: left;
    vertical-align: top;
  }

  thead th {
    border-top: 0;
    color: var(--muted);
    font-size: 0.7rem;
    font-weight: 800;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }

  th[scope='row'] {
    width: 22%;
  }

  th[scope='row'] b {
    display: block;
    font-size: 0.95rem;
  }

  tr.is-open th[scope='row'] {
    box-shadow: inset 3px 0 0 var(--warn);
  }

  .impact {
    display: inline-block;
    margin-top: 0.35rem;
    padding: 0.1rem 0.5rem;
    border: 1px solid var(--border-strong);
    border-radius: var(--radius-pill);
    color: var(--muted);
    font-size: 0.72rem;
    font-weight: 700;
  }

  .impact.fixed {
    border-color: color-mix(in srgb, var(--warn) 70%, var(--border));
    color: var(--text);
  }

  td.choice {
    width: 28%;
  }

  .choice small,
  .na {
    display: block;
    margin-top: 0.35rem;
    color: var(--muted);
    font-family: var(--font-mono);
    font-size: 0.82rem;
  }

  .choice small.tag {
    font-family: var(--font-sans);
    font-size: 0.75rem;
    font-weight: 700;
  }

  .na {
    margin-top: 0.5rem;
    font-family: var(--font-sans);
  }

  .why {
    display: grid;
    gap: 0.4rem;
    font-size: 0.9rem;
    line-height: 1.5;
  }

  .why .muted {
    color: var(--muted);
  }

  .warn {
    font-weight: 650;
  }

  .notes {
    display: grid;
    gap: 0.3rem;
    margin-top: 0.3rem;
  }

  textarea {
    resize: vertical;
    font-size: 0.88rem;
  }

  .saved {
    margin-top: 1rem;
    color: var(--muted);
    font-size: 0.82rem;
  }

  @container (max-width: 860px) {
    .trail ol {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    .step {
      grid-template-columns: minmax(0, 1fr);
    }
  }

  @container (max-width: 640px) {
    .trail ol {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    table,
    tbody,
    tr,
    th,
    td {
      display: block;
      width: 100% !important;
    }

    thead {
      display: none;
    }

    tr + tr {
      border-top: 1px solid var(--border);
    }

    th,
    td {
      border-top: 0;
    }

    td.choice,
    td.why {
      padding-top: 0;
    }

    .nav .btn {
      flex: 1 1 auto;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .bar span,
    .stage,
    .answer,
    .mark,
    .btn {
      transition: none;
    }
  }
</style>
