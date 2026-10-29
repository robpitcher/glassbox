<script lang="ts">
  import InfoBar from '../ui/InfoBar.svelte';
  import SectionHead from '../ui/SectionHead.svelte';
  import SegmentedToggle from '../ui/SegmentedToggle.svelte';
  import {
    ENTERPRISE,
    MODES,
    ORGS,
    REPOS,
    TEAMS,
    USERS,
    explain,
    orgsOf,
    reposFor,
    reposIn,
    team,
    teamsIn,
    teamsOf,
    userName,
    userRepoName,
    type ModeId,
    type Selection,
    type Team,
    type UserId,
  } from './data';

  interface Props {
    initialMode?: ModeId;
  }

  let { initialMode = 'emu' }: Props = $props();

  let modeId = $state<ModeId>(initialMode);
  let selection = $state<Selection | null>(null);

  const emu = $derived(modeId === 'emu');
  const info = $derived(explain(modeId, selection));

  const key = (s: Selection) => ('id' in s ? `${s.kind}:${s.id}` : s.kind);
  const selectedKey = $derived(selection ? key(selection) : null);

  // Everything connected to the current selection stays lit; the rest dims.
  const lit = $derived.by(() => {
    const keys = new Set<string>();
    const s = selection;
    if (!s) return keys;
    keys.add(key(s));
    const addTeam = (t: Team) => {
      keys.add(`team:${t.id}`);
      if (t.org) keys.add(`org:${t.org}`);
      else keys.add('enterprise');
    };

    switch (s.kind) {
      case 'idp':
        USERS.forEach((u) => keys.add(`user:${u}`));
        break;
      case 'enterprise':
        ORGS.forEach((o) => keys.add(`org:${o}`));
        TEAMS.filter((t) => !t.org).forEach((t) => keys.add(`team:${t.id}`));
        if (emu) USERS.forEach((u) => keys.add(`user:${u}`));
        break;
      case 'org':
        keys.add('enterprise');
        teamsIn(s.id).forEach((t) => keys.add(`team:${t.id}`));
        reposIn(s.id).forEach((r) => keys.add(`repo:${r.id}`));
        break;
      case 'team': {
        const t = team(s.id);
        addTeam(t);
        t.addedTo?.forEach((o) => keys.add(`org:${o}`));
        t.members.forEach((u) => keys.add(`user:${u}`));
        reposFor(t.id).forEach((r) => keys.add(`repo:${r.id}`));
        break;
      }
      case 'repo': {
        const r = REPOS.find((x) => x.id === s.id)!;
        keys.add(`org:${r.org}`);
        r.teams.map(team).forEach((t) => {
          keys.add(`team:${t.id}`);
          t.members.forEach((u) => keys.add(`user:${u}`));
        });
        break;
      }
      case 'user':
        teamsOf(s.id).forEach((t) => {
          keys.add(`team:${t.id}`);
          reposFor(t.id).forEach((r) => keys.add(`repo:${r.id}`));
        });
        orgsOf(s.id).forEach((o) => keys.add(`org:${o}`));
        if (s.id === 'mona') keys.add('user-repo');
        if (emu) keys.add('idp');
        break;
      case 'user-repo':
        keys.add('user:mona');
        break;
    }
    return keys;
  });

  const tone = (s: Selection) => {
    const k = key(s);
    if (!selection) return '';
    if (k === selectedKey) return 'is-selected';
    return lit.has(k) ? 'is-lit' : 'is-dim';
  };

  function select(s: Selection) {
    selection = selectedKey === key(s) ? null : s;
  }

  function setMode(next: ModeId) {
    modeId = next;
    if (selection?.kind === 'idp' && next === 'personal') selection = null;
  }

  function onkeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') selection = null;
  }

  const TEAM_COLORS = ['var(--cc-2)', 'var(--cc-4)', 'var(--cc-5)', 'var(--warn)', 'var(--cc-3)'];
  const teamColor = (t: Team) => TEAM_COLORS[t.color];
  const modeOptions = (['emu', 'personal'] as const).map((id) => ({ id, label: MODES[id].label }));
</script>

<!--
  THESIS: Ownership nests (enterprise → org → team/repo); people attach by membership, and teams carry access to repos.
  OWN-WORLD: Midnight Glass blue system: nested translucent boundaries, one color per team, repos wear their teams' colors.
  STORY: Flip the account model to move accounts outside or inside the enterprise; select a team, repo, or person to trace who reaches what.
  FIRST VIEWPORT: Header, a single control bar, then accounts → enterprise → two orgs with team pills and repo tiles.
  FORM: Responsive semantic HTML; every element is a keyboard-focusable toggle, with a live one-line explanation underneath.
-->
{#snippet avatar()}
  <svg class="avatar-glyph" viewBox="0 0 20 20" aria-hidden="true">
    <circle cx="10" cy="7" r="3.6" />
    <path d="M3.4 17.4c.6-3.7 3.2-6 6.6-6s6 2.3 6.6 6Z" />
  </svg>
{/snippet}

{#snippet teamPill(t: Team, org: string | null = null)}
  {@const ent = !t.org}
  <button
    type="button"
    class="team {tone({ kind: 'team', id: t.id })}"
    class:enterprise-team={ent}
    style:--team={teamColor(t)}
    aria-pressed={selectedKey === `team:${t.id}`}
    aria-label={`${t.name}, ${ent ? `enterprise team${org ? ` added to ${org}` : ''}` : `team in ${t.org}`}, ${t.members.length} ${t.members.length === 1 ? 'member' : 'members'}`}
    onclick={() => select({ kind: 'team', id: t.id })}
  >
    <span class="team-avatars" aria-hidden="true">
      {#each t.members as member (member)}<span class="mini-avatar">{@render avatar()}</span>{/each}
    </span>
    <span class="team-name">{t.name}</span>
  </button>
{/snippet}

{#snippet accounts()}
  <div class="accounts" class:inside={emu} role="group" aria-label={emu ? 'Managed user accounts' : 'Personal accounts'}>
    <p class="visual-label column-label">{emu ? 'Managed users' : 'Personal accounts'}</p>
    <ul>
      {#each USERS as user (user)}
        <li>
          <button
            type="button"
            class="person {tone({ kind: 'user', id: user })}"
            aria-pressed={selectedKey === `user:${user}`}
            onclick={() => select({ kind: 'user', id: user })}
          >
            <span class="avatar">{@render avatar()}</span>
            <span class="person-name">{userName(modeId, user)}</span>
          </button>
        </li>
      {/each}
    </ul>
    <button
      type="button"
      class="repo user-repo {tone({ kind: 'user-repo' })}"
      aria-pressed={selectedKey === 'user-repo'}
      onclick={() => select({ kind: 'user-repo' })}
    >
      <span class="repo-top">
        <svg class="repo-icon" viewBox="0 0 16 16" aria-hidden="true"><rect x="1.5" y="3" width="13" height="10" rx="2" /></svg>
        <span class="visibility">{emu ? 'private' : 'public'}</span>
      </span>
      <span class="repo-name">{userRepoName(modeId).split('/')[0]}/<wbr />{userRepoName(modeId).split('/')[1]}</span>
    </button>
  </div>
{/snippet}

<section class="visual" aria-labelledby="hierarchy-title" {onkeydown}>
  <SectionHead n={1} id="hierarchy-title" title="Who owns what">
    Enterprises own orgs. Orgs own repos and teams. Teams give their members access to repos.
  </SectionHead>

  <div class="visual-controls">
    <span class="visual-label" id="hierarchy-mode-label">Show</span>
    <SegmentedToggle options={modeOptions} value={modeId} onchange={setMode} labelledby="hierarchy-mode-label" />
    <span class="visual-hint">Select a team, repo, or person</span>
  </div>

  <div class="stage" class:emu class:has-selection={selection !== null}>
    <div class="outside">
      {#if emu}
        <button
          type="button"
          class="idp {tone({ kind: 'idp' })}"
          aria-pressed={selectedKey === 'idp'}
          onclick={() => select({ kind: 'idp' })}
        >
          <span class="tag tag-idp">Identity provider</span>
          <strong>Entra ID · Okta · PingFederate</strong>
          <span class="idp-sub">source of truth for users and groups</span>
        </button>
      {:else}
        {@render accounts()}
      {/if}
    </div>

    <div class="connector" aria-hidden="true">
      <span>{emu ? 'SCIM provisions' : 'Invited'}</span>
      <svg viewBox="0 0 120 12" preserveAspectRatio="none">
        <path d="M2 6h108" />
        <path d="m106 1.5 6 4.5-6 4.5" />
      </svg>
    </div>

    <div class="enterprise {tone({ kind: 'enterprise' })}">
      <div class="enterprise-head">
        <button
          type="button"
          class="enterprise-name"
          aria-pressed={selectedKey === 'enterprise'}
          onclick={() => select({ kind: 'enterprise' })}
        >
          <span class="tag tag-enterprise">Enterprise</span>
          <strong>{ENTERPRISE.name}</strong>
        </button>
        <div class="enterprise-teams">
          <span class="visual-label">Enterprise team</span>
          {#each TEAMS.filter((t) => !t.org) as t (t.id)}{@render teamPill(t)}{/each}
        </div>
      </div>

      <div class="enterprise-body">
        {#if emu}{@render accounts()}{/if}

        <div class="orgs">
          {#each ORGS as org (org)}
            <div class="org {tone({ kind: 'org', id: org })}">
              <button
                type="button"
                class="org-name"
                aria-pressed={selectedKey === `org:${org}`}
                onclick={() => select({ kind: 'org', id: org })}
              >
                <span class="tag tag-org">Org</span>
                <strong>{org}</strong>
              </button>

              <div class="teams" role="group" aria-label={`Teams in ${org}`}>
                {#each teamsIn(org) as t (t.id)}{@render teamPill(t, org)}{/each}
              </div>

              <div class="repos" role="group" aria-label={`Repositories owned by ${org}`}>
                {#each reposIn(org) as repo (repo.id)}
                  <button
                    type="button"
                    class="repo {tone({ kind: 'repo', id: repo.id })}"
                    aria-pressed={selectedKey === `repo:${repo.id}`}
                    aria-label={`${org}/${repo.name}, accessed by ${repo.teams.join(' and ')}`}
                    onclick={() => select({ kind: 'repo', id: repo.id })}
                  >
                    <span class="repo-top">
                      <svg class="repo-icon" viewBox="0 0 16 16" aria-hidden="true"><rect x="1.5" y="3" width="13" height="10" rx="2" /></svg>
                      <span class="dots" aria-hidden="true">
                        {#each repo.teams as id (id)}<span style:--team={teamColor(team(id))}></span>{/each}
                      </span>
                    </span>
                    <span class="repo-name">{repo.name}</span>
                  </button>
                {/each}
              </div>
            </div>
          {/each}
        </div>
      </div>
    </div>
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

  /* Stage */
  .stage {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    align-items: center;
    gap: 0.6rem;
    margin-top: 1.25rem;
  }

  .outside {
    display: grid;
    justify-items: center;
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

  /*
    Unrelated items fade their decoration (borders, fills, color accents), never the whole
    button, so labels keep --muted text contrast and focus outlines stay fully visible.
  */
  .org.is-dim {
    border-color: var(--border);
  }

  .team.is-dim {
    border-color: var(--border);
    background: transparent;
    color: var(--muted);
  }

  .team.is-dim .mini-avatar {
    border-color: var(--border-strong);
  }

  .team.is-dim .avatar-glyph,
  .person.is-dim .avatar-glyph {
    fill: var(--muted);
  }

  .repo.is-dim {
    border-color: var(--border);
    background: var(--surface);
    color: var(--muted);
  }

  .repo.is-dim .dots span {
    background: color-mix(in srgb, var(--team) 35%, transparent);
  }

  .person.is-dim {
    color: var(--muted);
  }

  .person.is-dim .avatar {
    border-color: var(--border);
    background: var(--surface);
  }

  .idp.is-dim {
    border-color: var(--border);
    background: transparent;
    color: var(--muted);
  }

  .connector {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    justify-items: center;
    gap: 0.75rem;
    padding: 1.1rem 0.4rem;
    color: var(--muted);
    font-size: 0.66rem;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-align: center;
    text-transform: uppercase;
  }

  .connector span {
    grid-column: 3;
    justify-self: start;
  }

  .connector svg {
    grid-column: 2;
    grid-row: 1;
    width: 2.4rem;
    height: 0.75rem;
    transform: rotate(90deg);
    fill: none;
    stroke: var(--accent);
    stroke-width: 1.6;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .connector path:first-child {
    stroke-dasharray: 5 5;
  }

  .stage.emu .connector svg {
    stroke: var(--cc-1);
  }

  /* Accounts */
  .accounts {
    display: grid;
    grid-template-columns: auto auto;
    grid-template-areas:
      'label label'
      'repo people';
    justify-content: center;
    justify-items: center;
    align-items: center;
    gap: 0.6rem;
    column-gap: 1.25rem;
    align-content: start;
  }

  .accounts.inside {
    align-self: stretch;
    padding: 0.85rem 0.6rem;
    border: 1px dashed color-mix(in srgb, var(--cc-1) 55%, var(--border));
    border-radius: calc(var(--radius-sm) + 2px);
    background: color-mix(in srgb, var(--cc-1) 6%, transparent);
  }

  .accounts .column-label {
    grid-area: label;
    text-align: center;
  }

  .accounts ul {
    display: grid;
    grid-area: people;
    grid-auto-flow: column;
    gap: 0.5rem;
    padding: 0;
    list-style: none;
  }

  .person {
    display: grid;
    justify-items: center;
    gap: 0.3rem;
    padding: 0.35rem 0.5rem;
    border: 1px solid transparent;
    border-radius: var(--radius-sm);
    background: transparent;
  }

  .person:hover .avatar,
  .person.is-selected .avatar {
    border-color: var(--accent-2);
  }

  .person.is-lit .avatar {
    border-color: var(--accent);
  }

  .avatar {
    display: grid;
    place-items: center;
    width: 2.6rem;
    height: 2.6rem;
    border: 2px solid color-mix(in srgb, var(--accent) 50%, transparent);
    border-radius: var(--radius-pill);
    background: color-mix(in srgb, var(--accent) 22%, var(--surface-solid));
  }

  .avatar-glyph {
    width: 70%;
    fill: var(--accent);
  }

  .person-name {
    font-size: 0.86rem;
    font-weight: 700;
  }

  .person.is-selected .person-name {
    color: var(--accent-2);
  }

  /* IdP */
  .idp {
    display: grid;
    width: min(100%, 22rem);
    justify-items: center;
    gap: 0.4rem;
    padding: 0.85rem;
    border: 1px dashed color-mix(in srgb, var(--cc-1) 70%, transparent);
    border-radius: var(--radius);
    background: color-mix(in srgb, var(--cc-1) 8%, transparent);
    text-align: center;
  }

  .idp .tag {
    justify-self: center;
  }

  .idp strong {
    font-size: 0.92rem;
    line-height: 1.25;
  }

  .idp-sub {
    color: var(--muted);
    font-size: 0.76rem;
    line-height: 1.35;
  }

  .idp.is-selected {
    border-style: solid;
    border-color: var(--cc-1);
  }

  /* Tags */
  .tag {
    justify-self: start;
    padding: 0.25rem 0.5rem;
    border-radius: 0.4rem;
    font-size: 0.66rem;
    font-weight: 800;
    letter-spacing: 0.12em;
    line-height: 1;
    text-transform: uppercase;
  }

  .tag-enterprise {
    background: color-mix(in srgb, var(--accent) 22%, transparent);
    color: var(--accent);
  }

  .tag-org {
    background: color-mix(in srgb, var(--accent-2) 16%, transparent);
    color: var(--accent-2);
  }

  .tag-idp {
    background: color-mix(in srgb, var(--cc-1) 18%, transparent);
    color: var(--cc-1);
  }

  /* Enterprise */
  .enterprise {
    min-width: 0;
    padding: 1rem;
    border: 1.5px solid color-mix(in srgb, var(--accent) 45%, var(--border));
    border-radius: calc(var(--radius) + 2px);
    background: color-mix(in srgb, var(--accent) 5%, transparent);
  }

  .enterprise.is-selected {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 18%, transparent);
  }

  .enterprise-head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
  }

  .enterprise-name,
  .org-name {
    display: inline-flex;
    align-items: center;
    gap: 0.7rem;
    padding: 0.2rem 0.4rem 0.2rem 0.2rem;
    border: 1px solid transparent;
    border-radius: var(--radius-sm);
    background: transparent;
  }

  .enterprise-name:hover,
  .org-name:hover {
    border-color: var(--border-strong);
  }

  .enterprise-name strong {
    font-size: 1.3rem;
    letter-spacing: -0.02em;
  }

  .enterprise-teams {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .enterprise-body {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 0.85rem;
    margin-top: 0.9rem;
  }

  .orgs {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.85rem;
  }

  .org {
    display: grid;
    align-content: start;
    gap: 0.8rem;
    min-width: 0;
    padding: 0.9rem;
    border: 1px solid var(--border-strong);
    border-radius: var(--radius);
    background: color-mix(in srgb, var(--surface-solid) 55%, transparent);
  }

  .org.is-selected,
  .org.is-lit {
    border-color: color-mix(in srgb, var(--accent-2) 60%, var(--border));
  }

  .org-name strong {
    font-size: 1.1rem;
    letter-spacing: -0.015em;
  }

  /* Teams */
  .teams {
    display: flex;
    flex-wrap: wrap;
    gap: 0.45rem;
  }

  .team {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    padding: 0.25rem 0.75rem 0.25rem 0.3rem;
    border: 1.5px solid color-mix(in srgb, var(--team) 55%, transparent);
    border-radius: var(--radius-pill);
    background: color-mix(in srgb, var(--team) 10%, transparent);
  }

  .team.enterprise-team {
    border-style: dashed;
  }

  .team:hover {
    border-color: var(--team);
  }

  .team.is-selected {
    border-color: var(--team);
    background: color-mix(in srgb, var(--team) 26%, transparent);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--team) 22%, transparent);
  }

  .team-avatars {
    display: inline-flex;
  }

  .mini-avatar {
    display: grid;
    place-items: center;
    width: 1.4rem;
    height: 1.4rem;
    border: 1.5px solid var(--team);
    border-radius: var(--radius-pill);
    background: var(--surface-solid);
  }

  .mini-avatar + .mini-avatar {
    margin-left: -0.45rem;
  }

  .mini-avatar .avatar-glyph {
    fill: var(--team);
  }

  .team-name {
    font-size: 0.86rem;
    font-weight: 750;
  }

  /* Repos */
  .repos {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(6.2rem, 1fr));
    gap: 0.5rem;
  }

  .repo {
    display: grid;
    gap: 0.9rem;
    min-width: 0;
    padding: 0.6rem 0.7rem;
    border: 1.5px solid var(--border-strong);
    border-radius: var(--radius-sm);
    background: color-mix(in srgb, var(--accent) 14%, var(--surface-2));
    text-align: left;
  }

  .repo:hover {
    border-color: var(--accent);
  }

  .repo.is-lit {
    border-color: color-mix(in srgb, var(--accent-2) 70%, transparent);
    background: color-mix(in srgb, var(--accent-2) 18%, var(--surface-2));
  }

  .repo.is-selected {
    border-color: var(--accent-2);
    background: color-mix(in srgb, var(--accent-2) 30%, var(--surface-2));
    box-shadow: 0 0.5rem 1.4rem color-mix(in srgb, var(--accent-2) 24%, transparent);
  }

  .repo-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.4rem;
  }

  .repo-icon {
    width: 1rem;
    fill: none;
    stroke: var(--muted);
    stroke-width: 1.6;
  }

  .dots {
    display: inline-flex;
    gap: 0.15rem;
  }

  .dots span {
    width: 0.62rem;
    height: 0.62rem;
    border-radius: var(--radius-pill);
    background: var(--team);
  }

  .repo-name {
    min-width: 0;
    font-size: 0.9rem;
    font-weight: 750;
    overflow-wrap: anywhere;
  }

  .user-repo {
    grid-area: repo;
    width: 8.5rem;
    gap: 0.55rem;
    border-style: dashed;
    background: transparent;
  }

  .user-repo .repo-name {
    font-size: 0.78rem;
    overflow-wrap: break-word;
  }

  .visibility {
    color: var(--muted);
    font-size: 0.66rem;
    font-weight: 700;
  }

  @container (max-width: 600px) {
    .orgs {
      grid-template-columns: minmax(0, 1fr);
    }

    .enterprise {
      padding: 0.7rem;
    }
  }

  @container (max-width: 480px) {
    .accounts,
    .accounts.inside {
      grid-template-columns: minmax(0, 1fr);
      grid-template-areas:
        'label'
        'people'
        'repo';
      justify-items: center;
      row-gap: 0.6rem;
    }
  }
</style>
