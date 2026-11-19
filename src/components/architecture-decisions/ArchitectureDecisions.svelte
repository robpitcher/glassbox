<script lang="ts">
  import { onMount, tick } from 'svelte';
  import {
    CONFLICT_TEXT,
    CONFLICTS,
    DECISIONS,
    NAME,
    NAME_DOC_SUBDOMAIN,
    NOT_APPLICABLE,
    QUESTIONS,
    QUESTION_BY_ID,
    QUIZ,
    RATIONALE,
    REGIONS,
    REVIEW,
    STAGES,
    STORAGE_KEY,
    UNDECIDED,
    type DecisionId,
    type Question,
    type QuestionId,
    type StageId,
  } from './data';

  type Answers = Partial<Record<QuestionId, string>>;
  type Step = QuestionId | 'review';
  type IdentityKey = keyof typeof RATIONALE.identity | 'conflict' | 'conflictResidency';
  /** One side of a conflict: an answer (step) or an edited choice (decision). */
  type Side = { label: string; value: string; step?: QuestionId; decision?: DecisionId };
  type Conflict = { id: string; sides: [Side, Side]; message: string; rows: DecisionId[] };

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

  function optionLabel(id: DecisionId, value: string): string {
    if (id === 'name') return value === NOT_APPLICABLE ? 'Not applicable' : value ? (subdomain ? NAME.subdomainPreview(value) : value) : 'Not chosen';
    return DECISIONS.find((d) => d.id === id)?.options.find((x) => x.id === value)?.label ?? value;
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
        // Answer conflicts explain an undecided account model themselves, so skip the generic text.
        return key === 'conflict' || key === 'conflictResidency' ? '' : RATIONALE.identity.undecided;
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

  const answerSide = (q: QuestionId): Side => {
    const question = QUESTION_BY_ID[q];
    return { label: question.label, value: question.answers.find((x) => x.id === answers[q])?.label ?? '', step: q };
  };
  const decisionLabel = (id: DecisionId) => DECISIONS.find((d) => d.id === id)?.label ?? id;
  const choiceSide = (id: DecisionId): Side => ({ label: decisionLabel(id), value: optionLabel(id, choice[id]), decision: id });

  // Every conflict names both sides, so readers know exactly which two decisions to reconcile.
  const conflicts = $derived.by((): Conflict[] => {
    const out: Conflict[] = [];
    const key = suggestIdentity(answers).key;
    if (choice.identity === UNDECIDED && key === 'conflictResidency') {
      out.push({ id: 'residencyCollab', sides: [answerSide('residency'), answerSide('collaboration')], message: CONFLICTS.residencyCollab, rows: ['identity'] });
    }
    if (choice.identity === UNDECIDED && key === 'conflict') {
      out.push({ id: 'lifecycleCollab', sides: [answerSide('lifecycle'), answerSide('collaboration')], message: CONFLICTS.lifecycleCollab, rows: ['identity'] });
    }
    if (choice.hosting === 'server' && isRegion(choice.residency)) {
      out.push({ id: 'serverResidency', sides: [choiceSide('hosting'), choiceSide('residency')], message: CONFLICTS.serverResidency, rows: ['hosting', 'residency'] });
    }
    if (choice.identity === 'personal' && isRegion(choice.residency)) {
      out.push({ id: 'personalResidency', sides: [choiceSide('residency'), choiceSide('identity')], message: CONFLICTS.personalResidency, rows: ['residency', 'identity'] });
    }
    if (choice.hosting === 'server' && choice.identity === 'emu') {
      out.push({ id: 'serverEmu', sides: [choiceSide('hosting'), choiceSide('identity')], message: CONFLICTS.serverEmu, rows: ['hosting', 'identity'] });
    }
    return out;
  });

  const sideText = (s: Side) => `${s.label} (${s.value})`;
  const conflictText = (c: Conflict) => `${CONFLICT_TEXT.markdown(c.sides.map(sideText).join(' and '))} ${c.message}`;

  const rows = $derived(
    DECISIONS.map((d) => {
      const value = choice[d.id];
      const sug = suggestedFor(d.id);
      const changed = sug !== undefined && overrides[d.id] !== undefined && overrides[d.id] !== sug;
      const rowConflicts = conflicts.filter((c) => c.rows.includes(d.id));
      const open = value === UNDECIDED || (d.id === 'name' && (!value || !NAME_RE.test(value))) || rowConflicts.length > 0;
      return {
        decision: d,
        value,
        rationale: rationaleFor(d.id, value),
        override: changed ? RATIONALE.override(optionLabel(d.id, sug!)) : undefined,
        conflicts: rowConflicts,
        open,
        doc: d.id === 'name' && subdomain ? NAME_DOC_SUBDOMAIN : d.doc,
      };
    }),
  );

  const stepConflicts = $derived(question ? conflicts.filter((c) => c.sides.some((s) => s.step === question.id)) : []);
  const openCount = $derived(rows.filter((r) => r.open).length);
  const currentStage = $derived(question ? question.stage : 'review');
  const stageReachable = (s: StageId) => s === 'review' || active.some((q) => q.stage === s);
  const stageDone = (s: StageId) => s !== 'review' && active.filter((q) => q.stage === s).every((q) => (q.id === 'name' ? !!name : !!answers[q.id]));

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

  async function goSide(s: Side) {
    if (s.step) return go(s.step);
    await go('review', false);
    document.getElementById(`ad-choice-${s.decision}`)?.focus();
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
      const why = [...r.conflicts.map(conflictText), r.rationale, r.override].filter(Boolean).join(' ');
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
</script>

{#snippet conflictList(list: Conflict[], from?: QuestionId)}
  <div class="conflict" role="note">
    <p class="conflict-title">{list.length > 1 ? CONFLICT_TEXT.summary(list.length) : CONFLICT_TEXT.title}</p>
    {#each list as c (c.id)}
      <div class="conflict-item">
        <ul>
          {#each c.sides as s (s.label)}
            <li>
              <span class="side-label">{s.label}</span>
              <span class="side-value">{s.value}</span>
              {#if !from || s.step !== from}
                <button type="button" class="link" onclick={() => goSide(s)}>{CONFLICT_TEXT.change}<span class="sr"> {s.label}</span></button>
              {/if}
            </li>
          {/each}
        </ul>
        <p>{c.message} {c.sides[0].step ? CONFLICT_TEXT.answersBlock : CONFLICT_TEXT.choicesBlock}</p>
      </div>
    {/each}
  </div>
{/snippet}

<section class="quiz" aria-label={QUIZ.label}>
  <nav class="steps" aria-label={QUIZ.trailLabel}>
    <ol>
      {#each STAGES as s (s.id)}
        <li>
          <button
            type="button"
            class:is-current={currentStage === s.id}
            class:is-done={stageDone(s.id)}
            aria-current={currentStage === s.id ? 'step' : undefined}
            disabled={!stageReachable(s.id)}
            onclick={() => goStage(s.id)}
          >
            {s.label}
          </button>
        </li>
      {/each}
    </ol>
  </nav>

  {#if question}
    <form class="step" onsubmit={(e) => (e.preventDefault(), next())}>
      <p class="count">{QUIZ.step(index + 1, active.length)}</p>
      <fieldset>
        <legend>
          <h2 tabindex="-1" bind:this={heading}>{question.prompt}</h2>
        </legend>
        <p class="desc">{question.description}</p>

        {#if question.id === 'name'}
          <label class="field">
            <span class="field-label">{subdomain ? NAME.subdomainLabel : NAME.shortcodeLabel}</span>
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
          <div class="options">
            {#each question.answers as a (a.id)}
              <label class="option">
                <input type="radio" name="ad-{question.id}" value={a.id} checked={answers[question.id] === a.id} onchange={() => choose(a.id)} />
                <span>
                  <b>{a.label}</b>
                  <small>{a.detail}</small>
                </span>
              </label>
            {/each}
          </div>
        {/if}
      </fieldset>

      {#if stepConflicts.length}
        {@render conflictList(stepConflicts, question.id)}
      {/if}

      <p class="why">
        <strong>{QUIZ.whyLabel}:</strong>
        {question.context.title}.
        {question.context.text}
        <a href={question.doc.href} target="_blank" rel="noopener">{question.doc.label}</a>
      </p>

      <div class="nav">
        <button type="button" class="btn" onclick={back} disabled={index === 0}>{QUIZ.back}</button>
        <button type="submit" class="btn primary" disabled={!answered}>
          {index === active.length - 1 ? QUIZ.finish : QUIZ.next}
        </button>
      </div>
    </form>
  {:else}
    <div class="review">
      <h2 tabindex="-1" bind:this={heading}>{REVIEW.title}</h2>
      <p class="desc">{REVIEW.description}</p>
      <p class="status">{REVIEW.status(rows.length - openCount, rows.length, openCount)}</p>

      {#if conflicts.length}
        {@render conflictList(conflicts)}
      {/if}

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
                      id="ad-choice-name"
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
                  <select id="ad-choice-{d.id}" aria-label="{d.label} choice" value={r.value} onchange={(e) => setOverride(d.id, e.currentTarget.value)}>
                    {#each d.options as o (o.id)}
                      <option value={o.id}>{o.label}</option>
                    {/each}
                  </select>
                  {#if r.value === suggestedFor(d.id)}<small class="tag">{REVIEW.suggested}</small>{/if}
                {/if}
              </td>
              <td class="rationale">
                {#each r.conflicts as c (c.id)}
                  {@const others = c.sides.filter((s) => s.decision !== d.id)}
                  <p class="warn">
                    <strong>{others.length < c.sides.length ? CONFLICT_TEXT.with : CONFLICT_TEXT.between}</strong>
                    {others.map(sideText).join(' and ')}. {c.message}
                  </p>
                {/each}
                {#if r.rationale}<p>{r.rationale}</p>{/if}
                {#if r.override}<p class="muted">{r.override}</p>{/if}
                <a href={r.doc} target="_blank" rel="noopener">{REVIEW.docLink}</a>
                <label class="notes">
                  <span class="field-label">{REVIEW.notesLabel}</span>
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

      <div class="nav">
        <button type="button" class="btn" onclick={back}>{QUIZ.back}</button>
        <div class="actions">
          <button type="button" class="btn" onclick={reset}>{REVIEW.reset}</button>
          <button type="button" class="btn primary" onclick={copy}>{REVIEW.copy}</button>
        </div>
      </div>
      <p class="copy-note" aria-live="polite">{copyNote ?? ''}</p>
    </div>
  {/if}

  <p class="saved">{QUIZ.saved}</p>
</section>

<style>
  .quiz {
    container-type: inline-size;
    max-width: 52rem;
    margin-top: 2rem;
  }

  /* Step list: plain text, current step underlined. */
  .steps ol {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem 1.25rem;
    margin: 0;
    padding: 0 0 0.75rem;
    border-bottom: 1px solid var(--border);
    list-style: none;
  }

  .steps button {
    padding: 0.2rem 0;
    border: 0;
    border-bottom: 2px solid transparent;
    background: none;
    color: var(--muted);
    font: inherit;
    font-size: 0.88rem;
    font-weight: 600;
    cursor: pointer;
  }

  .steps button.is-done {
    color: var(--text);
  }

  .steps button.is-current {
    border-bottom-color: var(--accent);
    color: var(--text);
  }

  .steps button:disabled {
    color: var(--muted);
    text-decoration: line-through;
    cursor: default;
  }

  .step,
  .review {
    margin-top: 1.5rem;
  }

  .count {
    color: var(--muted);
    font-size: 0.85rem;
  }

  fieldset {
    margin: 0;
    padding: 0;
    border: 0;
  }

  legend {
    padding: 0;
  }

  h2 {
    margin: 0.25rem 0 0;
    font-size: clamp(1.15rem, 2.6vw, 1.4rem);
    line-height: 1.25;
    letter-spacing: -0.01em;
  }

  h2:focus {
    outline: none;
  }

  .desc {
    margin-top: 0.4rem;
    color: var(--muted);
    line-height: 1.55;
  }

  .options {
    display: grid;
    margin-top: 1rem;
  }

  .option {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    gap: 0.75rem;
    padding: 0.7rem 0;
    border-top: 1px solid var(--border);
    cursor: pointer;
  }

  .option:last-child {
    border-bottom: 1px solid var(--border);
  }

  .option input {
    width: 1rem;
    height: 1rem;
    margin: 0.2rem 0 0;
    accent-color: var(--accent);
  }

  .option b {
    display: block;
    font-weight: 600;
    line-height: 1.35;
  }

  .option small {
    display: block;
    margin-top: 0.15rem;
    color: var(--muted);
    font-size: 0.88rem;
    line-height: 1.45;
  }

  .field {
    display: grid;
    gap: 0.4rem;
    max-width: 24rem;
    margin-top: 1rem;
  }

  .field-label {
    color: var(--muted);
    font-size: 0.85rem;
    font-weight: 600;
  }

  input[type='text'],
  select,
  textarea {
    width: 100%;
    padding: 0.5rem 0.65rem;
    border: 1px solid var(--border-strong);
    border-radius: var(--radius-sm);
    background: var(--surface-solid);
    color: var(--text);
    font: inherit;
  }

  input[type='text'] {
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

  .why {
    margin-top: 1.25rem;
    color: var(--muted);
    font-size: 0.9rem;
    line-height: 1.55;
  }

  .why strong {
    color: var(--text);
  }

  a {
    color: var(--accent);
    font-weight: 600;
  }

  /* Conflicts name both sides so readers know exactly what to reconcile. */
  .conflict {
    display: grid;
    gap: 0.75rem;
    margin-top: 1.25rem;
    padding: 0.85rem 1rem;
    border-left: 3px solid var(--warn);
    background: color-mix(in srgb, var(--warn) 8%, transparent);
    font-size: 0.9rem;
    line-height: 1.5;
  }

  .conflict-title {
    font-weight: 700;
  }

  .conflict ul {
    display: grid;
    gap: 0.3rem;
    margin: 0 0 0.35rem;
    padding: 0;
    list-style: none;
  }

  .conflict li {
    display: flex;
    flex-wrap: wrap;
    gap: 0.2rem 0.5rem;
    align-items: baseline;
  }

  .side-label {
    font-weight: 700;
  }

  .side-label::after {
    content: ':';
  }

  .conflict-item + .conflict-item {
    padding-top: 0.75rem;
    border-top: 1px solid color-mix(in srgb, var(--warn) 35%, var(--border));
  }

  .link {
    padding: 0;
    border: 0;
    background: none;
    color: var(--accent);
    font: inherit;
    font-weight: 600;
    text-decoration: underline;
    cursor: pointer;
  }

  .sr {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  .nav,
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .nav {
    justify-content: space-between;
    margin-top: 1.5rem;
  }

  .btn {
    padding: 0.5rem 1rem;
    border: 1px solid var(--border-strong);
    border-radius: var(--radius-sm);
    background: var(--surface-solid);
    color: var(--text);
    font: inherit;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: border-color var(--dur) var(--ease);
  }

  .btn:hover:not(:disabled) {
    border-color: var(--accent);
  }

  .btn:disabled {
    color: var(--muted);
    cursor: default;
  }

  .btn.primary:not(:disabled) {
    border-color: var(--accent);
    background: var(--accent);
    color: var(--on-accent);
  }

  .steps button:focus-visible,
  .btn:focus-visible,
  .link:focus-visible,
  .option input:focus-visible,
  input:focus-visible,
  select:focus-visible,
  textarea:focus-visible,
  a:focus-visible {
    outline: 2px solid var(--accent-2);
    outline-offset: 2px;
  }

  /* Review */
  .status {
    margin-top: 0.75rem;
    font-size: 0.92rem;
    line-height: 1.5;
  }

  table {
    width: 100%;
    margin-top: 1.25rem;
    border-collapse: collapse;
  }

  th,
  td {
    padding: 0.85rem 0.75rem 0.85rem 0;
    border-top: 1px solid var(--border);
    text-align: left;
    vertical-align: top;
  }

  thead th {
    border-top: 0;
    color: var(--muted);
    font-size: 0.78rem;
    font-weight: 700;
  }

  th[scope='row'] {
    width: 22%;
  }

  th[scope='row'] b {
    display: block;
    font-size: 0.95rem;
  }

  tr.is-open th[scope='row'] b::before {
    content: '';
    display: inline-block;
    width: 0.5rem;
    height: 0.5rem;
    margin-right: 0.4rem;
    border-radius: var(--radius-pill);
    background: var(--warn);
    vertical-align: 0.1em;
  }

  .impact {
    display: block;
    margin-top: 0.25rem;
    color: var(--muted);
    font-size: 0.8rem;
  }

  .impact.fixed {
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
    font-size: 0.8rem;
  }

  .rationale {
    display: grid;
    gap: 0.4rem;
    font-size: 0.9rem;
    line-height: 1.5;
  }

  .muted {
    color: var(--muted);
  }

  .warn {
    padding-left: 0.6rem;
    border-left: 3px solid var(--warn);
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

  .copy-note {
    min-height: 1.4em;
    margin-top: 0.5rem;
    color: var(--muted);
    font-size: 0.88rem;
  }

  .saved {
    margin-top: 1rem;
    color: var(--muted);
    font-size: 0.82rem;
  }

  @container (max-width: 640px) {
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

    th,
    td {
      padding-right: 0;
      border-top: 0;
    }

    tr {
      border-top: 1px solid var(--border);
    }

    td.choice,
    td.rationale {
      padding-top: 0;
    }

    .nav .btn {
      flex: 1 1 auto;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .btn {
      transition: none;
    }
  }
</style>
