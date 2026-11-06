// Single source of truth for the GitHub account and enterprise hierarchy visual.
// Behavior follows GitHub Docs for GitHub.com / GitHub Enterprise Cloud.

export type ModeId = 'emu' | 'personal';

export const MODES: Record<ModeId, { label: string; summary: string }> = {
  emu: {
    label: 'Managed users (EMU)',
    summary: 'Your identity provider creates every account through SCIM, so the accounts live inside the enterprise.',
  },
  personal: {
    label: 'Personal accounts',
    summary: 'People bring their own GitHub.com accounts and get invited into organizations. The accounts live outside the enterprise.',
  },
};

export const ENTERPRISE = { name: 'Acme', shortcode: 'acme' } as const;

export type OrgId = 'acme-web' | 'acme-data';
export const ORGS: OrgId[] = ['acme-web', 'acme-data'];

export type UserId = 'mona' | 'kai' | 'ray';
export const USERS: UserId[] = ['mona', 'kai', 'ray'];

export const userName = (mode: ModeId, user: UserId) => (mode === 'emu' ? `${user}_${ENTERPRISE.shortcode}` : user);

export interface Team {
  id: string;
  name: string;
  /** Owning organization, or null for an enterprise team. */
  org: OrgId | null;
  /** Organizations an enterprise team has been added to. */
  addedTo?: OrgId[];
  members: UserId[];
  /** Index into the --team-N color tokens. */
  color: 0 | 1 | 2 | 3 | 4;
}

export const TEAMS: Team[] = [
  { id: 'payments', name: 'payments', org: 'acme-web', members: ['mona', 'kai'], color: 0 },
  { id: 'mobile', name: 'mobile', org: 'acme-web', members: ['kai'], color: 1 },
  { id: 'analytics', name: 'analytics', org: 'acme-data', members: ['kai', 'ray'], color: 2 },
  { id: 'ml', name: 'ml', org: 'acme-data', members: ['ray'], color: 3 },
  { id: 'platform', name: 'platform', org: null, addedTo: ['acme-web', 'acme-data'], members: ['mona', 'ray'], color: 4 },
];

export interface Repo {
  id: string;
  name: string;
  org: OrgId;
  /** Teams granted access to this repository. */
  teams: string[];
}

export const REPOS: Repo[] = [
  { id: 'checkout', name: 'checkout', org: 'acme-web', teams: ['payments', 'platform'] },
  { id: 'app', name: 'app', org: 'acme-web', teams: ['mobile'] },
  { id: 'docs', name: 'docs', org: 'acme-web', teams: ['payments', 'mobile'] },
  { id: 'lake', name: 'lake', org: 'acme-data', teams: ['analytics', 'ml'] },
  { id: 'models', name: 'models', org: 'acme-data', teams: ['ml'] },
  { id: 'etl', name: 'etl', org: 'acme-data', teams: ['analytics', 'platform'] },
];

/** The diagram's teams and repos, depending on whether the enterprise team has been added to orgs. */
export interface World {
  teams: Team[];
  repos: Repo[];
  team: (id: string) => Team;
  teamsIn: (org: OrgId) => Team[];
  reposIn: (org: OrgId) => Repo[];
  reposFor: (teamId: string) => Repo[];
  teamsOf: (user: UserId) => Team[];
  orgsOf: (user: UserId) => OrgId[];
}

export function world(platformInOrgs = true): World {
  // An enterprise team that isn't added to any org has no org membership, so no repo access either.
  const teams = platformInOrgs ? TEAMS : TEAMS.map((t) => (t.org ? t : { ...t, addedTo: [] }));
  const unadded = new Set(teams.filter((t) => !t.org && !t.addedTo?.length).map((t) => t.id));
  const repos = REPOS.map((r) => ({ ...r, teams: r.teams.filter((id) => !unadded.has(id)) }));
  const inOrg = (t: Team, org: OrgId) => t.org === org || !!t.addedTo?.includes(org);
  const teamsOf = (user: UserId) => teams.filter((t) => t.members.includes(user));
  return {
    teams,
    repos,
    team: (id) => teams.find((t) => t.id === id)!,
    teamsIn: (org) => teams.filter((t) => inOrg(t, org)),
    reposIn: (org) => repos.filter((r) => r.org === org),
    reposFor: (teamId) => repos.filter((r) => r.teams.includes(teamId)),
    teamsOf,
    orgsOf: (user) => ORGS.filter((org) => teamsOf(user).some((t) => inOrg(t, org))),
  };
}

export const initial = (user: UserId) => user[0].toUpperCase();

export interface Group {
  id: string;
  name: string;
  /** The GitHub team this IdP group is linked to. Members match that team's. */
  team: string;
}

// Two example groups: one feeds an org team, the other the enterprise team. Listed left to right.
export const GROUPS: Group[] = [
  { id: 'sg-mobile', name: 'sg-mobile', team: 'mobile' },
  { id: 'sg-platform', name: 'sg-platform', team: 'platform' },
];

export const group = (id: string) => GROUPS.find((g) => g.id === id)!;
export const groupFor = (teamId: string) => GROUPS.find((g) => g.team === teamId);
export const groupMembers = (g: Group) => TEAMS.find((t) => t.id === g.team)!.members;
/** Enterprise teams can only be linked to an IdP group with EMU. */
export const groupLinked = (mode: ModeId, g: Group) => mode === 'emu' || TEAMS.find((t) => t.id === g.team)!.org !== null;

export const IDP: Record<ModeId, { name: string; sub: string }> = {
  emu: { name: 'Entra ID · Okta · PingFederate', sub: 'source of truth for users and groups' },
  personal: { name: 'Entra ID · Okta', sub: 'SAML SSO and team sync' },
};

export const CONTROLS = {
  mode: 'Accounts',
  show: 'Show',
  platformInOrgs: 'Platform team in orgs',
  groups: 'IdP groups',
  hint: 'Select a team, repo, or person',
  groupsLabel: 'IdP groups',
  unlinked: 'no sync',
  ownerBox: (owner: string) => `${owner} and the repository it owns`,
};

const list = (items: string[]) =>
  items.length <= 1 ? (items[0] ?? 'none') : `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`;

export type Selection =
  | { kind: 'idp' }
  | { kind: 'enterprise' }
  | { kind: 'org'; id: OrgId }
  | { kind: 'team'; id: string }
  | { kind: 'group'; id: string }
  | { kind: 'repo'; id: string }
  | { kind: 'user'; id: UserId }
  | { kind: 'user-repo' };

export interface ExplainOptions {
  platformInOrgs: boolean;
  groups: boolean;
}

export interface Explanation {
  lead: string;
  text: string;
  note?: string;
}

export const userRepoName = (mode: ModeId) => (mode === 'emu' ? `${userName(mode, 'mona')}/notes` : 'mona/dotfiles');

/** One-sentence explanation of who owns the selection and what it reaches. */
export function explain(mode: ModeId, sel: Selection | null, opts: ExplainOptions): Explanation {
  const emu = mode === 'emu';
  const w = world(opts.platformInOrgs);
  const linkedGroup = (teamId: string) => {
    const g = opts.groups ? groupFor(teamId) : undefined;
    return g && groupLinked(mode, g) ? g : undefined;
  };

  if (!sel) {
    return {
      lead: emu ? 'Managed users.' : 'Personal accounts.',
      text: MODES[mode].summary,
      note: !opts.groups
        ? undefined
        : emu
          ? 'Here sg-mobile feeds the mobile org team and sg-platform the platform enterprise team, so your IdP decides who’s on them.'
          : 'Team sync links sg-mobile to the mobile org team. sg-platform has no sync: enterprise teams can’t sync with personal accounts.',
    };
  }

  switch (sel.kind) {
    case 'idp':
      if (!emu) {
        return {
          lead: 'Identity provider, outside GitHub.',
          text: 'People sign in through it with SAML SSO, and team sync lets its groups decide who’s on org teams.',
          note: 'Team sync works with Entra ID or Okta. It doesn’t create accounts.',
        };
      }
      return {
        lead: 'Identity provider, outside GitHub.',
        text: opts.groups
          ? 'It creates, updates, and suspends managed user accounts through SCIM, and its groups decide who’s on each linked team.'
          : 'It creates, updates, and suspends managed user accounts through SCIM. Users sign in through it with SAML, or with OIDC on Entra ID.',
        note: opts.groups
          ? 'With Entra ID, teams can only be linked to security groups, not Microsoft 365 or nested groups.'
          : 'Supported providers are Entra ID, Okta, and PingFederate, or any SAML 2.0 and SCIM 2.0 provider.',
      };
    case 'enterprise':
      return {
        lead: `Enterprise account ${ENTERPRISE.name}.`,
        text: `It owns ${list(ORGS)}. Nobody signs in to an enterprise: enterprise owners use their own user accounts.`,
      };
    case 'org':
      return {
        lead: `Organization, owned by ${ENTERPRISE.name}.`,
        text: `${sel.id} owns its teams and repositories. People are members of it, not its owners.`,
        note: emu ? undefined : 'Org owners invite personal accounts in. A person can belong to many organizations, inside or outside the enterprise.',
      };
    case 'team': {
      const t = w.team(sel.id);
      const repos = w.reposFor(t.id).map((r) => r.name);
      const g = linkedGroup(t.id);
      if (!t.org) {
        const added = t.addedTo ?? [];
        return {
          lead: `Enterprise team, owned by ${ENTERPRISE.name}.`,
          text: added.length
            ? `It’s been added to ${list(added)}, which makes its members members there without an invitation. Org admins gave it access to ${list(repos)}.`
            : 'It isn’t added to any organization, so it gives no org membership or repo access. It can still get Copilot licenses and enterprise roles.',
          note: !emu
            ? 'With personal accounts, enterprise teams can’t sync with an IdP group.'
            : g
              ? `It’s linked to the IdP group ${g.name}, so membership follows your IdP.`
              : 'With EMU, an enterprise team can be linked to an IdP group.',
        };
      }
      return {
        lead: `Org team, owned by ${t.org}.`,
        text: `Its members can use the repos with its color: ${list(repos)}. Child teams would inherit that access.`,
        note: g
          ? `${emu ? 'It’s linked to' : 'Team sync links it to'} the IdP group ${g.name}, so membership follows your IdP and can’t be changed on GitHub.`
          : emu
            ? 'With EMU, link the team to an IdP group and membership follows your IdP.'
            : 'Org owners and team maintainers manage members. Team sync with Entra ID or Okta is optional.',
      };
    }
    case 'group': {
      const g = group(sel.id);
      const t = w.team(g.team);
      const members = groupMembers(g);
      const who = `${list(members.map((u) => userName(mode, u)))} ${members.length === 1 ? 'is' : 'are'}`;
      if (!groupLinked(mode, g)) {
        return {
          lead: `IdP group ${g.name}, not linked.`,
          text: `With personal accounts, enterprise teams can’t sync with an IdP group, so ${t.name}’s members are managed on GitHub.`,
        };
      }
      if (!t.org) {
        const added = t.addedTo ?? [];
        return {
          lead: `IdP group ${g.name}, outside GitHub.`,
          text: `It’s linked to the ${t.name} enterprise team, so ${who} on that team${added.length ? ` and in ${list(added)}` : ''}.`,
          note: 'Linking an enterprise team to an IdP group needs EMU. Repo access is still granted on GitHub.',
        };
      }
      return emu
        ? {
            lead: `IdP group ${g.name}, outside GitHub.`,
            text: `It’s linked to the ${t.name} team in ${t.org}, so ${who} on that team and in ${t.org}.`,
            note: 'A team links to one IdP group, and one group can feed many teams. Repo access is still granted on GitHub.',
          }
        : {
            lead: `IdP group ${g.name}, outside GitHub.`,
            text: `Team sync links it to the ${t.name} team in ${t.org}, so ${who} on that team.`,
            note: `Team sync usually adds only people who are already ${t.org} members and have signed in with SAML SSO.`,
          };
    }
    case 'repo': {
      const r = w.repos.find((x) => x.id === sel.id)!;
      return {
        lead: `Repository, owned by ${r.org}.`,
        text: `Its full name is ${r.org}/${r.name}. ${list(r.teams)} can use it. Teams grant access, but a repository belongs to an org or user account, never to a team.`,
      };
    }
    case 'user': {
      const name = userName(mode, sel.id);
      const teams = w.teamsOf(sel.id).map((t) => t.name);
      return emu
        ? {
            lead: `Managed user ${name}, created by your IdP.`,
            text: `This account lives inside ${ENTERPRISE.name} and is on the ${list(teams)} teams. The suffix _${ENTERPRISE.shortcode} is the enterprise shortcode.`,
            note: 'Managed users can view public repositories but can’t push, comment, or fork outside the enterprise.',
          }
        : {
            lead: `Personal account ${name}, owned by the person.`,
            text: `${name} was invited into ${list(w.orgsOf(sel.id))} and is on the ${list(teams)} teams. The person keeps the account if they leave.`,
            note: 'With SAML SSO, the account is linked to an IdP identity, not created by it.',
          };
    }
    case 'user-repo':
      return emu
        ? {
            lead: `Repository, owned by ${userName(mode, 'mona')}.`,
            text: 'It must be private, and it exists only if enterprise policy lets managed users create repositories. Collaborators must be enterprise members.',
          }
        : {
            lead: 'Repository, owned by mona’s personal account.',
            text: 'It sits outside the enterprise, so it can be public, and enterprise and org settings don’t reach it.',
          };
  }
}