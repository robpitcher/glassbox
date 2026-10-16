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

export const team = (id: string) => TEAMS.find((t) => t.id === id)!;
export const teamsIn = (org: OrgId) => TEAMS.filter((t) => t.org === org || t.addedTo?.includes(org));
export const reposIn = (org: OrgId) => REPOS.filter((r) => r.org === org);
export const reposFor = (teamId: string) => REPOS.filter((r) => r.teams.includes(teamId));
export const teamsOf = (user: UserId) => TEAMS.filter((t) => t.members.includes(user));
export const orgsOf = (user: UserId) =>
  ORGS.filter((org) => teamsOf(user).some((t) => t.org === org || t.addedTo?.includes(org)));

const list = (items: string[]) =>
  items.length <= 1 ? (items[0] ?? 'none') : `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`;

export type Selection =
  | { kind: 'idp' }
  | { kind: 'enterprise' }
  | { kind: 'org'; id: OrgId }
  | { kind: 'team'; id: string }
  | { kind: 'repo'; id: string }
  | { kind: 'user'; id: UserId }
  | { kind: 'user-repo' };

export interface Explanation {
  lead: string;
  text: string;
  note?: string;
}

export const userRepoName = (mode: ModeId) => (mode === 'emu' ? `${userName(mode, 'mona')}/notes` : 'mona/dotfiles');

/** One-sentence explanation of who owns the selection and what it reaches. */
export function explain(mode: ModeId, sel: Selection | null): Explanation {
  const emu = mode === 'emu';
  if (!sel) return { lead: emu ? 'Managed users.' : 'Personal accounts.', text: MODES[mode].summary };

  switch (sel.kind) {
    case 'idp':
      return {
        lead: 'Identity provider, outside GitHub.',
        text: 'It creates, updates, and suspends managed user accounts through SCIM. Users sign in through it with SAML, or with OIDC on Entra ID.',
        note: 'Supported providers are Entra ID, Okta, and PingFederate, or any SAML 2.0 and SCIM 2.0 provider.',
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
      const t = team(sel.id);
      const repos = reposFor(t.id).map((r) => r.name);
      if (!t.org) {
        return {
          lead: `Enterprise team, owned by ${ENTERPRISE.name}.`,
          text: `It spans organizations. It's been added to ${list(t.addedTo ?? [])}, where org admins gave it access to ${list(repos)}.`,
          note: emu
            ? 'With EMU, an enterprise team can be linked to an IdP group.'
            : 'With personal accounts, enterprise teams can’t sync with an IdP group.',
        };
      }
      return {
        lead: `Org team, owned by ${t.org}.`,
        text: `Its members can use the repos with its color: ${list(repos)}. Child teams would inherit that access.`,
        note: emu
          ? 'With EMU, link the team to an IdP group and membership follows your IdP.'
          : 'Org owners and team maintainers manage members. Team sync with Entra ID or Okta is optional.',
      };
    }
    case 'repo': {
      const r = REPOS.find((x) => x.id === sel.id)!;
      return {
        lead: `Repository, owned by ${r.org}.`,
        text: `Its full name is ${r.org}/${r.name}. ${list(r.teams)} can use it. Teams grant access, but a repository belongs to an org or user account, never to a team.`,
      };
    }
    case 'user': {
      const name = userName(mode, sel.id);
      const teams = teamsOf(sel.id).map((t) => t.name);
      return emu
        ? {
            lead: `Managed user ${name}, created by your IdP.`,
            text: `This account lives inside ${ENTERPRISE.name} and is on the ${list(teams)} teams. The suffix _${ENTERPRISE.shortcode} is the enterprise shortcode.`,
            note: 'Managed users can view public repositories but can’t push, comment, or fork outside the enterprise.',
          }
        : {
            lead: `Personal account ${name}, owned by the person.`,
            text: `${name} was invited into ${list(orgsOf(sel.id))} and is on the ${list(teams)} teams. The person keeps the account if they leave.`,
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
