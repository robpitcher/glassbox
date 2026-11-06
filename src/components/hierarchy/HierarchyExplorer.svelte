<script lang="ts">
  import InfoBar from '../ui/InfoBar.svelte';
  import SectionHead from '../ui/SectionHead.svelte';
  import SegmentedToggle from '../ui/SegmentedToggle.svelte';
  import {
    CONTROLS,
    ENTERPRISE,
    GROUPS,
    IDP,
    MODES,
    ORGS,
    USERS,
    explain,
    groupLinked,
    groupMembers,
    initial,
    userName,
    userRepoName,
    world,
    type Group,
    type ModeId,
    type OrgId,
    type Selection,
    type Team,
    type UserId,
  } from './data';
  import { routeWires, type WirePath } from './wires';

  interface Props {
    initialMode?: ModeId;
  }

  let { initialMode = 'emu' }: Props = $props();

  let modeId = $state<ModeId>(initialMode);
  let platformInOrgs = $state(true);
  let groupsOn = $state(false);
  let selection = $state<Selection | null>(null);

  const emu = $derived(modeId === 'emu');
  const w = $derived(world(platformInOrgs));
  const info = $derived(explain(modeId, selection, { platformInOrgs, groups: groupsOn }));
  const showIdp = $derived(emu || groupsOn);
  const linkedGroups = $derived(groupsOn ? GROUPS.filter((g) => groupLinked(modeId, g)) : []);

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
      t.addedTo?.forEach((o) => keys.add(`org:${o}`));
    };
    const addLinkedGroup = (teamId: string) => {
      const g = linkedGroups.find((x) => x.team === teamId);
      if (g) keys.add(`group:${g.id}`);
      return g;
    };

    switch (s.kind) {
      case 'idp':
        if (emu) USERS.forEach((u) => keys.add(`user:${u}`));
        if (groupsOn) GROUPS.forEach((g) => keys.add(`group:${g.id}`));
        linkedGroups.forEach((g) => keys.add(`team:${g.team}`));
        break;
      case 'enterprise':
        ORGS.forEach((o) => keys.add(`org:${o}`));
        w.teams.filter((t) => !t.org).forEach((t) => keys.add(`team:${t.id}`));
        if (emu) USERS.forEach((u) => keys.add(`user:${u}`));
        break;
      case 'org':
        keys.add('enterprise');
        w.teamsIn(s.id).forEach((t) => keys.add(`team:${t.id}`));
        w.reposIn(s.id).forEach((r) => keys.add(`repo:${r.id}`));
        break;
      case 'team': {
        const t = w.team(s.id);
        addTeam(t);
        t.members.forEach((u) => keys.add(`user:${u}`));
        w.reposFor(t.id).forEach((r) => keys.add(`repo:${r.id}`));
        if (addLinkedGroup(t.id)) keys.add('idp');
        break;
      }
      case 'group': {
        const g = GROUPS.find((x) => x.id === s.id)!;
        keys.add('idp');
        groupMembers(g).forEach((u) => keys.add(`user:${u}`));
        if (groupLinked(modeId, g)) {
          const t = w.team(g.team);
          addTeam(t);
          w.reposFor(t.id).forEach((r) => keys.add(`repo:${r.id}`));
        }
        break;
      }
      case 'repo': {
        const r = w.repos.find((x) => x.id === s.id)!;
        keys.add(`org:${r.org}`);
        r.teams.forEach((id) => {
          const t = w.team(id);
          keys.add(`team:${t.id}`);
          t.members.forEach((u) => keys.add(`user:${u}`));
          addLinkedGroup(t.id);
        });
        break;
      }
      case 'user':
        w.teamsOf(s.id).forEach((t) => {
          keys.add(`team:${t.id}`);
          w.reposFor(t.id).forEach((r) => keys.add(`repo:${r.id}`));
        });
        w.orgsOf(s.id).forEach((o) => keys.add(`org:${o}`));
        if (s.id === 'mona') keys.add('user-repo');
        if (emu) keys.add('idp');
        if (groupsOn) {
          keys.add('idp');
          GROUPS.filter((g) => groupMembers(g).includes(s.id)).forEach((g) => keys.add(`group:${g.id}`));
        }
        break;
      case 'user-repo':
        keys.add('user:mona');
        break;
    }
    return keys;
  });

  // With groups shown and nothing selected, everything but the IdP, its groups, and their teams steps back.
  const focus = $derived(groupsOn && !selection);
  const focusKeys = $derived(
    new Set(['idp', ...GROUPS.map((g) => `group:${g.id}`), ...linkedGroups.map((g) => `team:${g.team}`)]),
  );

  const tone = (s: Selection) => {
    const k = key(s);
    if (!selection) return focus && !focusKeys.has(k) ? 'is-dim' : '';
    if (k === selectedKey) return 'is-selected';
    return lit.has(k) ? 'is-lit' : 'is-dim';
  };

  // The owner box lights only when the personal repository is part of the selection.
  const ownTone = $derived(focus ? 'is-dim' : !selection ? '' : lit.has('user-repo') ? 'is-lit' : 'is-dim');

  const wireTone = (g: Group) => {
    if (!selection) return '';
    return lit.has(`group:${g.id}`) && lit.has(`team:${g.team}`) ? 'is-lit' : 'is-dim';
  };

  function select(s: Selection) {
    selection = selectedKey === key(s) ? null : s;
  }

  function setMode(next: ModeId) {
    modeId = next;
    if (selection?.kind === 'idp' && next === 'personal' && !groupsOn) selection = null;
  }

  function setGroups(on: boolean) {
    groupsOn = on;
    if (!on && (selection?.kind === 'group' || (selection?.kind === 'idp' && !emu))) selection = null;
  }

  function onkeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') selection = null;
  }

  const TEAM_COLORS = ['var(--cc-2)', 'var(--cc-4)', 'var(--cc-5)', 'var(--warn)', 'var(--cc-3)'];
  const teamColor = (t: Team) => TEAM_COLORS[t.color];
  const modeOptions = (['emu', 'personal'] as const).map((id) => ({ id, label: MODES[id].label }));
  const memberNames = (users: UserId[]) => users.map((u) => userName(modeId, u)).join(' and ');

  let stageEl = $state<HTMLDivElement>();
  let wires = $state<(WirePath & { group: Group; color: string })[]>([]);

  // Each linked group wires to its team's own pill: the org pill, or the enterprise pill for an enterprise team.
  function route(stage: HTMLElement) {
    const legs = linkedGroups.flatMap((g) => {
      const t = w.team(g.team);
      const from = stage.querySelector(`[data-group="${g.id}"]`);
      const to = stage.querySelector(t.org ? `[data-org="${t.org}"] [data-team="${t.id}"]` : `[data-team="${t.id}"][data-in="enterprise"]`);
      return from && to ? [{ id: g.id, from, to }] : [];
    });
    return routeWires(stage, legs).map((p) => {
      const g = linkedGroups.find((x) => x.id === p.id)!;
      return { ...p, group: g, color: teamColor(w.team(g.team)) };
    });
  }

  $effect(() => {
    const stage = stageEl;
    // Anything that moves boxes re-routes the wires; resizes are caught by the observer.
    void [groupsOn, platformInOrgs, modeId];
    if (!stage || !groupsOn) {
      wires = [];
      return;
    }
    let live = true;
    let frame = 0;
    const update = () => {
      if (live) wires = route(stage);
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    update();
    const observer = new ResizeObserver(schedule);
    observer.observe(stage);
    document.fonts?.ready.then(schedule);
    return () => {
      live = false;
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  });
</script>

<!--
  THESIS: Ownership nests (enterprise → org → team/repo); people attach by membership, and teams carry access to repos.
  OWN-WORLD: Midnight Glass blue system: nested translucent boundaries, one color per team, repos wear their teams' colors.
  STORY: Flip the account model to move accounts outside or inside the enterprise; add IdP groups or pull the enterprise team
    out of the orgs; select a team, repo, group, or person to trace who reaches what.
  FIRST VIEWPORT: Header, the control bars, then accounts → enterprise → two orgs with team pills and repo tiles.
  FORM: Responsive semantic HTML; every element is a keyboard-focusable toggle, with a live one-line explanation underneath.
-->
{#snippet avatar()}
  <svg class="avatar-glyph" viewBox="0 0 20 20" aria-hidden="true">
    <circle cx="10" cy="7" r="3.6" />
    <path d="M3.4 17.4c.6-3.7 3.2-6 6.6-6s6 2.3 6.6 6Z" />
  </svg>
{/snippet}

{#snippet initials(users: UserId[])}
  <span class="team-avatars" aria-hidden="true">
    {#each users as member (member)}<span class="mini-avatar">{initial(member)}</span>{/each}
  </span>
{/snippet}

{#snippet teamPill(t: Team, org: OrgId | null = null)}
  {@const ent = !t.org}
  <button
    type="button"
    class="team {tone({ kind: 'team', id: t.id })}"
    class:enterprise-team={ent}
    style:--team={teamColor(t)}
    data-team={t.id}
    data-in={org ?? 'enterprise'}
    aria-pressed={selectedKey === `team:${t.id}`}
    aria-label={`${t.name}, ${ent ? `enterprise team${org ? ` added to ${org}` : ''}` : `team in ${t.org}`}, members ${memberNames(t.members)}`}
    onclick={() => select({ kind: 'team', id: t.id })}
  >
    {@render initials(t.members)}
    <span class="team-name">{t.name}</span>
  </button>
{/snippet}

{#snippet groupChip(g: Group)}
  {@const linked = groupLinked(modeId, g)}
  {@const members = groupMembers(g)}
  <button
    type="button"
    class="group {tone({ kind: 'group', id: g.id })}"
    class:unlinked={!linked}
    style:--team={teamColor(w.team(g.team))}
    data-group={g.id}
    aria-pressed={selectedKey === `group:${g.id}`}
    aria-label={`${g.name}, IdP group ${linked ? `linked to ${g.team}` : 'not linked to a team'}, members ${memberNames(members)}`}
    onclick={() => select({ kind: 'group', id: g.id })}
  >
    {@render initials(members)}
    <span class="group-name">{g.name}</span>
    {#if !linked}<span class="group-note">{CONTROLS.unlinked}</span>{/if}
  </button>
{/snippet}

{#snippet idpBox()}
  <div class="idp-box {tone({ kind: 'idp' })}">
    <button type="button" class="idp" aria-pressed={selectedKey === 'idp'} onclick={() => select({ kind: 'idp' })}>
      <span class="tag tag-idp">Identity provider</span>
      <strong>{IDP[modeId].name}</strong>
      <span class="idp-sub">{IDP[modeId].sub}</span>
    </button>
    {#if groupsOn}
      <div class="groups" role="group" aria-label={CONTROLS.groupsLabel}>
        {#each GROUPS as g (g.id)}{@render groupChip(g)}{/each}
      </div>
    {/if}
  </div>
{/snippet}

{#snippet person(user: UserId)}
  <button
    type="button"
    class="person {tone({ kind: 'user', id: user })}"
    aria-pressed={selectedKey === `user:${user}`}
    onclick={() => select({ kind: 'user', id: user })}
  >
    <span class="avatar">{@render avatar()}</span>
    <span class="person-name">{userName(modeId, user)}</span>
  </button>
{/snippet}

{#snippet accounts()}
  <div class="accounts" class:inside={emu} role="group" aria-label={emu ? 'Managed user accounts' : 'Personal accounts'}>
    <p class="visual-label column-label">{emu ? 'Managed users' : 'Personal accounts'}</p>
    <ul>
      {#each USERS as user (user)}
        <li class:owner={user === 'mona'}>
          {#if user === 'mona'}
            <div class="own {ownTone}" role="group" aria-label={CONTROLS.ownerBox(userName(modeId, user))}>
              {@render person(user)}
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
          {:else}
            {@render person(user)}
          {/if}
        </li>
      {/each}
    </ul>
  </div>
{/snippet}

<section class="visual" aria-labelledby="hierarchy-title" {onkeydown}>
  <SectionHead n={1} id="hierarchy-title" title="Who owns what">
    Enterprises own orgs. Orgs own repos and teams. Teams give their members access to repos.
  </SectionHead>

  <div class="visual-controls">
    <span class="visual-label" id="hierarchy-mode-label">{CONTROLS.mode}</span>
    <SegmentedToggle options={modeOptions} value={modeId} onchange={setMode} labelledby="hierarchy-mode-label" />
  </div>

  <div class="visual-controls">
    <span class="visual-label">{CONTROLS.show}</span>
    <button
      type="button"
      class="switch"
      class:active={platformInOrgs}
      role="switch"
      aria-checked={platformInOrgs}
      onclick={() => (platformInOrgs = !platformInOrgs)}
    >
      <span class="switch-track" aria-hidden="true"><span></span></span>
      <span>{CONTROLS.platformInOrgs}</span>
    </button>
    <button
      type="button"
      class="switch"
      class:active={groupsOn}
      role="switch"
      aria-checked={groupsOn}
      onclick={() => setGroups(!groupsOn)}
    >
      <span class="switch-track" aria-hidden="true"><span></span></span>
      <span>{CONTROLS.groups}</span>
    </button>
    <span class="visual-hint">{CONTROLS.hint}</span>
  </div>

  <div class="stage" class:emu class:focus-groups={focus} class:has-selection={selection !== null} bind:this={stageEl}>
    <div class="outside">
      {#if showIdp}{@render idpBox()}{/if}
      {#if !emu}{@render accounts()}{/if}
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
          {#each w.teams.filter((t) => !t.org) as t (t.id)}{@render teamPill(t)}{/each}
        </div>
      </div>

      <div class="enterprise-body">
        {#if emu}{@render accounts()}{/if}

        <div class="orgs">
          {#each ORGS as org (org)}
            <div class="org {tone({ kind: 'org', id: org })}" data-org={org}>
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
                {#each w.teamsIn(org) as t (t.id)}{@render teamPill(t, org)}{/each}
              </div>

              <div class="repos" role="group" aria-label={`Repositories owned by ${org}`}>
                {#each w.reposIn(org) as repo (repo.id)}
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
                        {#each repo.teams as id (id)}<span style:--team={teamColor(w.team(id))}></span>{/each}
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

    {#if wires.length}
      <svg class="wires" aria-hidden="true">
        {#each wires as wire (wire.id)}
          <g class="wire {wireTone(wire.group)}" style:--team={wire.color}>
            <path class="wire-line" d={wire.d} />
            <path d={wire.head} />
          </g>
        {/each}
      </svg>
    {/if}
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

  /* Switches */
  .switch {
    display: inline-flex;
    min-height: 2rem;
    align-items: center;
    gap: 0.65rem;
    padding: 0;
    border: 0;
    background: transparent;
    color: var(--muted);
    font-size: 0.91rem;
    font-weight: 700;
    transition: color var(--dur) var(--ease);
  }

  .switch.active {
    color: var(--text);
  }

  .switch:focus-visible {
    outline-offset: 3px;
  }

  .switch-track {
    position: relative;
    display: inline-flex;
    flex: 0 0 auto;
    align-items: center;
    width: 2.95rem;
    height: 1.55rem;
    border: 1px solid var(--border-strong);
    border-radius: var(--radius-pill);
    background: var(--glass-track);
    box-shadow: var(--glass-track-shadow);
    transition:
      background var(--dur) var(--ease),
      border-color var(--dur) var(--ease),
      box-shadow var(--dur) var(--ease);
  }

  .switch-track span {
    position: absolute;
    left: 0.2rem;
    width: 1.08rem;
    height: 1.08rem;
    border: 1px solid var(--glass-knob-border);
    border-radius: var(--radius-pill);
    background: var(--glass-knob);
    box-shadow:
      inset 0 -1px 1px rgba(15, 23, 42, 0.12),
      0 2px 5px rgba(0, 0, 0, 0.3);
    transition:
      transform var(--dur) var(--ease),
      background var(--dur) var(--ease);
  }

  .switch.active .switch-track {
    border-color: color-mix(in srgb, var(--accent) 75%, var(--border));
    background: var(--glass-pill);
    box-shadow: var(--glass-pill-shadow);
  }

  .switch.active .switch-track span {
    transform: translateX(1.38rem);
  }

  /* Stage */
  .stage {
    position: relative;
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    align-items: center;
    gap: 0.6rem;
    margin-top: 1.25rem;
  }

  .outside {
    display: grid;
    justify-items: center;
    gap: 1.25rem;
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

  .team.is-dim,
  .group.is-dim {
    border-color: var(--border);
    background: transparent;
    color: var(--muted);
  }

  .team.is-dim .mini-avatar,
  .group.is-dim .mini-avatar {
    border-color: var(--border-strong);
    color: var(--muted);
  }

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

  .idp-box.is-dim {
    border-color: var(--border);
    background: transparent;
  }

  .idp-box.is-dim .idp {
    color: var(--muted);
  }

  /* With IdP groups shown and nothing selected, the frames step back too, so the groups and wires lead. */
  .stage.focus-groups .enterprise,
  .stage.focus-groups .accounts.inside {
    border-color: var(--border);
    background: transparent;
  }

  .stage.focus-groups :is(.enterprise-name, .org-name) {
    color: var(--muted);
  }

  .stage.focus-groups :is(.tag-enterprise, .tag-org) {
    background: color-mix(in srgb, var(--muted) 14%, transparent);
    color: var(--muted);
  }

  .stage.focus-groups .connector svg {
    stroke: var(--border-strong);
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
    justify-items: center;
    align-content: start;
    gap: 0.6rem;
  }

  .accounts.inside {
    align-self: stretch;
    padding: 0.85rem 0.6rem;
    border: 1px dashed color-mix(in srgb, var(--cc-1) 55%, var(--border));
    border-radius: calc(var(--radius-sm) + 2px);
    background: color-mix(in srgb, var(--cc-1) 6%, transparent);
  }

  .accounts .column-label {
    text-align: center;
  }

  .accounts ul {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0;
    list-style: none;
  }

  /* mona's account and the repository it owns, grouped so ownership reads at a glance. */
  .own {
    display: flex;
    flex-direction: row-reverse;
    align-items: center;
    gap: 0.6rem;
    padding: 0.4rem;
    border: 1px dashed var(--border-strong);
    border-radius: calc(var(--radius-sm) + 2px);
  }

  .own.is-lit {
    border-color: color-mix(in srgb, var(--accent-2) 70%, transparent);
  }

  .own.is-dim {
    border-color: var(--border);
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
  .idp-box {
    display: grid;
    width: min(100%, 22rem);
    border: 1px dashed color-mix(in srgb, var(--cc-1) 70%, transparent);
    border-radius: var(--radius);
    background: color-mix(in srgb, var(--cc-1) 8%, transparent);
  }

  .idp-box.is-selected {
    border-style: solid;
    border-color: var(--cc-1);
  }

  .idp {
    display: grid;
    justify-items: center;
    gap: 0.4rem;
    padding: 0.85rem;
    border: 0;
    border-radius: var(--radius);
    background: transparent;
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

  .groups {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.45rem 0.6rem;
    margin: 0 0.85rem;
    padding: 0.75rem 0 0.85rem;
    border-top: 1px dashed color-mix(in srgb, var(--cc-1) 45%, transparent);
  }

  .group {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.22rem 0.6rem 0.22rem 0.25rem;
    border: 1.5px solid color-mix(in srgb, var(--team) 55%, transparent);
    border-radius: var(--radius-sm);
    background: color-mix(in srgb, var(--team) 8%, var(--surface-solid));
  }

  .group:hover {
    border-color: var(--team);
  }

  .group.is-selected {
    border-color: var(--team);
    background: color-mix(in srgb, var(--team) 24%, var(--surface-solid));
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--team) 22%, transparent);
  }

  .group.unlinked {
    border-style: dashed;
    border-color: var(--border-strong);
    background: transparent;
  }

  .group.unlinked .mini-avatar {
    border-color: var(--border-strong);
    color: var(--muted);
  }

  .group-name {
    font-size: 0.8rem;
    font-weight: 750;
  }

  .group-note {
    color: var(--muted);
    font-size: 0.68rem;
    font-weight: 700;
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
    color: var(--team);
    font-size: 0.62rem;
    font-weight: 800;
    line-height: 1;
  }

  .mini-avatar + .mini-avatar {
    margin-left: -0.3rem;
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
    width: 8.5rem;
    gap: 0.55rem;
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

  /* Group wires */
  .wires {
    position: absolute;
    inset: 0;
    z-index: 1;
    width: 100%;
    height: 100%;
    overflow: visible;
    pointer-events: none;
  }

  .wire {
    animation: wire-in 320ms var(--ease) backwards;
    transition: opacity var(--dur) var(--ease);
  }

  .wire path {
    fill: none;
    stroke: var(--team);
    stroke-width: 1.5;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .wire-line {
    stroke-dasharray: 4 3.5;
  }

  .wire.is-dim {
    opacity: 0.18;
  }

  @keyframes wire-in {
    from {
      opacity: 0;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .wire {
      animation: none;
      transition: none;
    }
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
    /* mona's box takes its own row so kai and ray fit together beneath it. */
    .accounts li.owner {
      display: flex;
      flex-basis: 100%;
      justify-content: center;
    }

    .user-repo {
      width: 7rem;
    }
  }
</style>
