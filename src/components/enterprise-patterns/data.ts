// Single source of truth for the EMU enterprise patterns visual.
// Behavior follows GitHub Docs for GitHub Enterprise Cloud with Enterprise Managed Users and Entra ID.

export type PatternId = 'per-company' | 'central' | 'delegated';

export type ActorKind = 'role' | 'org-owners' | 'users';

export const KIND_LABEL = {
  group: 'IdP group',
  app: 'Entra app',
  role: 'Role',
  'org-owners': 'Org owners',
  users: 'Users',
  org: 'Org',
  policy: 'Policies',
} as const;

/** Category color, as an index into the --cc-N tokens. */
export type Tone = 0 | 2 | 3;

export const TENANT = 'acme.com';

export interface Node {
  id: string;
  name: string;
  sub: string;
  tone?: Tone;
  /** Protocol chip on an Entra app. */
  tag?: 'OIDC' | 'SAML';
}

export interface Actor extends Node {
  kind: ActorKind;
}

export interface Enterprise {
  id: string;
  name: string;
  shortcode: string;
  tone: Tone;
  billing: string;
  actors: Actor[];
  policy: Node;
  orgs: Node[];
}

/** [from, to, label]. Edges with a label (even an empty one) are control lines; the rest are provisioning. */
export type Edge = [string, string, ('sets' | '')?];

export const SUMMARY_KEYS = ['Identity', 'Control', 'Cost'] as const;
export type SummaryKey = (typeof SUMMARY_KEYS)[number];

export interface Pattern {
  label: string;
  lead: string;
  text: string;
  summary: Record<SummaryKey, string>;
  groups: Node[];
  apps: Node[];
  enterprises: Enterprise[];
  edges: Edge[];
  /** Everything that lights up when an item is selected. */
  links: Record<string, string[]>;
  info: Record<string, { lead: string; text: string }>;
}

export const LANE_LABELS = { tenant: 'Entra ID tenant', apps: 'Entra apps', github: 'GitHub Enterprise Cloud' };

export const SUB_LABELS = { who: 'Who', what: 'What they control' };

export const VISUAL = {
  title: 'Three ways to set up Acme',
  description: 'The same tenant and companies, wired as separate enterprises, one central enterprise, or one enterprise with delegated orgs.',
  label: 'Pattern',
  hint: 'Select anything to trace who controls it',
};

const OIDC_APP: Node = { id: 'app-oidc', name: 'EMU OIDC app', sub: 'Only one per tenant', tag: 'OIDC' };

const AZURE_NOTE = 'If you pay through Azure, each cost center can bill a different Azure subscription.';

export const PATTERN_IDS: PatternId[] = ['per-company', 'central', 'delegated'];

export const PATTERNS: Record<PatternId, Pattern> = {
  'per-company': {
    label: 'Enterprise per company',
    lead: 'Enterprise per company:',
    text: 'strongest isolation, but a person in both companies has two accounts, and only one enterprise gets OIDC.',
    summary: {
      Identity: 'Two Entra apps: OIDC for one enterprise, SAML for the rest. Anyone in both companies gets two accounts.',
      Control: 'Each company has its own enterprise owners and policies. Nothing is shared or inherited.',
      Cost: 'Each enterprise is its own billing account with its own bill.',
    },
    groups: [
      { id: 'g-acme', name: 'GH-Acme', sub: 'Acme staff and admins', tone: 0 },
      { id: 'g-labs', name: 'GH-Labs', sub: 'Acme Labs staff and admins', tone: 2 },
    ],
    apps: [OIDC_APP, { id: 'app-saml', name: 'EMU SAML app', sub: 'Every other enterprise', tag: 'SAML' }],
    enterprises: [
      {
        id: 'e-acme',
        name: 'Acme',
        shortcode: 'acme',
        tone: 0,
        billing: 'Own billing',
        actors: [{ id: 'o-acme', kind: 'role', name: 'Enterprise owners', sub: 'Acme IT', tone: 0 }],
        policy: { id: 'p-acme', name: 'Enterprise policies', sub: 'Apply to Acme’s orgs only' },
        orgs: [
          { id: 'acme-web', name: 'acme-web', sub: 'Owner: Acme IT' },
          { id: 'acme-data', name: 'acme-data', sub: 'Owner: Acme IT' },
        ],
      },
      {
        id: 'e-labs',
        name: 'Acme Labs',
        shortcode: 'acmelabs',
        tone: 2,
        billing: 'Own billing',
        actors: [{ id: 'o-labs', kind: 'role', name: 'Enterprise owners', sub: 'Labs IT', tone: 2 }],
        policy: { id: 'p-labs', name: 'Enterprise policies', sub: 'Apply to Acme Labs only' },
        orgs: [{ id: 'labs-core', name: 'labs-core', sub: 'Owner: Labs IT' }],
      },
    ],
    edges: [
      ['g-acme', 'app-oidc'],
      ['g-labs', 'app-saml'],
      ['app-oidc', 'o-acme'],
      ['app-saml', 'o-labs'],
      ['o-acme', 'p-acme', 'sets'],
      ['o-acme', 'acme-web', 'sets'],
      ['o-acme', 'acme-data', ''],
      ['o-labs', 'p-labs', 'sets'],
      ['o-labs', 'labs-core', 'sets'],
    ],
    links: {
      'g-acme': ['app-oidc', 'o-acme', 'p-acme', 'acme-web', 'acme-data'],
      'g-labs': ['app-saml', 'o-labs', 'p-labs', 'labs-core'],
      'app-oidc': ['g-acme', 'o-acme'],
      'app-saml': ['g-labs', 'o-labs'],
      'o-acme': ['g-acme', 'app-oidc', 'p-acme', 'acme-web', 'acme-data'],
      'o-labs': ['g-labs', 'app-saml', 'p-labs', 'labs-core'],
      'p-acme': ['o-acme', 'acme-web', 'acme-data'],
      'p-labs': ['o-labs', 'labs-core'],
      'acme-web': ['o-acme', 'p-acme'],
      'acme-data': ['o-acme', 'p-acme'],
      'labs-core': ['o-labs', 'p-labs'],
    },
    info: {
      'g-acme': { lead: 'GH-Acme:', text: 'assigned to the OIDC app, so its members become managed users like mona_acme in the Acme enterprise.' },
      'g-labs': { lead: 'GH-Labs:', text: 'assigned to the SAML app, so its members get separate accounts like kai_acmelabs in Acme Labs.' },
      'app-oidc': { lead: 'EMU OIDC app:', text: 'a tenant supports only one OIDC integration, so only one enterprise can use it.' },
      'app-saml': { lead: 'EMU SAML app:', text: 'every additional enterprise from the same tenant has to use SAML.' },
      'o-acme': { lead: 'Acme enterprise owners:', text: 'set Acme’s policies and own its orgs; they have no rights in Acme Labs.' },
      'o-labs': { lead: 'Acme Labs enterprise owners:', text: 'run their own enterprise, policies, and billing independently.' },
      'p-acme': { lead: 'Acme policies:', text: 'flow down to Acme’s orgs only; Acme Labs sets its own.' },
      'p-labs': { lead: 'Acme Labs policies:', text: 'flow down to labs-core only.' },
      'acme-web': { lead: 'acme-web:', text: 'lives in the Acme enterprise and is invisible to Acme Labs.' },
      'acme-data': { lead: 'acme-data:', text: 'lives in the Acme enterprise and is invisible to Acme Labs.' },
      'labs-core': { lead: 'labs-core:', text: 'lives in the Acme Labs enterprise, fully isolated from Acme.' },
    },
  },

  central: {
    label: 'Central enterprise',
    lead: 'Central enterprise:',
    text: 'simplest to run; acquisitions become enterprise teams and cost centers, not new enterprises or new admins.',
    summary: {
      Identity: 'One OIDC app and one account per person, including acquired staff.',
      Control: 'Central enterprise owners set every policy and own every org. Each company is an enterprise team with no admin role.',
      Cost: `One enterprise account split into cost centers by enterprise team. ${AZURE_NOTE}`,
    },
    groups: [
      { id: 'g-plat', name: 'GH-Platform', sub: 'Central admins', tone: 3 },
      { id: 'g-acme', name: 'GH-Acme', sub: 'Acme staff', tone: 0 },
      { id: 'g-labs', name: 'GH-Labs', sub: 'Acquired: Acme Labs', tone: 2 },
    ],
    apps: [OIDC_APP],
    enterprises: [
      {
        id: 'e-acme',
        name: 'Acme',
        shortcode: 'acme',
        tone: 0,
        billing: 'Cost centers: acme, labs',
        actors: [
          { id: 'o-ent', kind: 'role', name: 'Enterprise owners', sub: 'GH-Platform members', tone: 3 },
          { id: 'u-acme', kind: 'users', name: 'GH-Acme', sub: 'acme team · cost center acme', tone: 0 },
          { id: 'u-labs', kind: 'users', name: 'GH-Labs', sub: 'labs team · cost center labs', tone: 2 },
        ],
        policy: { id: 'p-ent', name: 'Enterprise policies', sub: 'Set centrally for every org' },
        orgs: [
          { id: 'acme-web', name: 'acme-web', sub: 'Owner: central team' },
          { id: 'acme-data', name: 'acme-data', sub: 'Owner: central team' },
          { id: 'labs-core', name: 'labs-core', sub: 'Owner: central team' },
        ],
      },
    ],
    edges: [
      ['g-plat', 'app-oidc'],
      ['g-acme', 'app-oidc'],
      ['g-labs', 'app-oidc'],
      ['app-oidc', 'o-ent'],
      ['app-oidc', 'u-acme'],
      ['app-oidc', 'u-labs'],
      ['o-ent', 'p-ent', 'sets'],
      ['o-ent', 'acme-web', ''],
      ['o-ent', 'acme-data', ''],
      ['o-ent', 'labs-core', ''],
      ['u-acme', 'acme-web'],
      ['u-acme', 'acme-data'],
      ['u-labs', 'labs-core'],
    ],
    links: {
      'g-plat': ['app-oidc', 'o-ent', 'p-ent', 'acme-web', 'acme-data', 'labs-core'],
      'g-acme': ['app-oidc', 'u-acme', 'acme-web', 'acme-data'],
      'g-labs': ['app-oidc', 'u-labs', 'labs-core'],
      'app-oidc': ['g-plat', 'g-acme', 'g-labs', 'o-ent', 'u-acme', 'u-labs'],
      'o-ent': ['g-plat', 'app-oidc', 'p-ent', 'acme-web', 'acme-data', 'labs-core'],
      'u-acme': ['g-acme', 'app-oidc', 'acme-web', 'acme-data'],
      'u-labs': ['g-labs', 'app-oidc', 'labs-core'],
      'p-ent': ['o-ent', 'acme-web', 'acme-data', 'labs-core'],
      'acme-web': ['o-ent', 'p-ent', 'u-acme', 'g-acme', 'app-oidc'],
      'acme-data': ['o-ent', 'p-ent', 'u-acme', 'g-acme', 'app-oidc'],
      'labs-core': ['o-ent', 'p-ent', 'u-labs', 'g-labs', 'app-oidc'],
    },
    info: {
      'g-plat': { lead: 'GH-Platform:', text: 'its members are the enterprise owners, and they also own every org.' },
      'g-acme': { lead: 'GH-Acme:', text: 'Acme staff, synced to the acme enterprise team, which bills to the acme cost center.' },
      'g-labs': { lead: 'GH-Labs:', text: 'the acquired company gets an enterprise team and a cost center, not its own enterprise.' },
      'app-oidc': { lead: 'EMU OIDC app:', text: 'one app provisions every group into the single enterprise.' },
      'o-ent': { lead: 'Enterprise owners:', text: 'one central team sets policy and owns every org; no company administers anything itself.' },
      'u-acme': { lead: 'GH-Acme users:', text: 'provisioned as managed users, synced to the acme enterprise team, and added to acme-web and acme-data as members with no admin role.' },
      'u-labs': { lead: 'GH-Labs users:', text: 'provisioned the same way, synced to the labs enterprise team, and added to labs-core as members with no admin role.' },
      'p-ent': { lead: 'Enterprise policies:', text: 'set by the central team and flow down to every org inside the frame.' },
      'acme-web': { lead: 'acme-web:', text: 'owned by the central team; GH-Acme users work here as members and bill to the acme cost center.' },
      'acme-data': { lead: 'acme-data:', text: 'owned by the central team; GH-Acme users work here as members and bill to the acme cost center.' },
      'labs-core': { lead: 'labs-core:', text: 'Acme Labs’ code, still owned by the central team; GH-Labs users work here and bill to the labs cost center.' },
    },
  },

  delegated: {
    label: 'Delegated orgs',
    lead: 'Delegated orgs:',
    text: 'one enterprise sets guardrails, and each company’s admins own their orgs and cost centers.',
    summary: {
      Identity: 'Same as central: one OIDC app and one account per person.',
      Control: 'Enterprise owners enforce a few policies and leave the rest to org owners. Each company’s admins own its orgs.',
      Cost: `One enterprise account with a cost center per org, which its org owners can manage. ${AZURE_NOTE}`,
    },
    groups: [
      { id: 'g-plat', name: 'GH-Platform', sub: 'Central admins', tone: 3 },
      { id: 'g-acme', name: 'GH-Acme-Admins', sub: 'Acme admins', tone: 0 },
      { id: 'g-labs', name: 'GH-Labs-Admins', sub: 'Acme Labs admins', tone: 2 },
    ],
    apps: [OIDC_APP],
    enterprises: [
      {
        id: 'e-acme',
        name: 'Acme',
        shortcode: 'acme',
        tone: 0,
        billing: 'Cost center per org',
        actors: [
          { id: 'o-ent', kind: 'role', name: 'Enterprise owners', sub: 'GH-Platform members', tone: 3 },
          { id: 'own-acme', kind: 'org-owners', name: 'Acme admins', sub: 'acme-web, acme-data', tone: 0 },
          { id: 'own-labs', kind: 'org-owners', name: 'Labs admins', sub: 'labs-core', tone: 2 },
        ],
        policy: { id: 'p-ent', name: 'Enterprise policies', sub: 'Enforced on every org; the rest is each owner’s call' },
        orgs: [
          { id: 'acme-web', name: 'acme-web', sub: 'Owner: Acme admins · own cost center' },
          { id: 'acme-data', name: 'acme-data', sub: 'Owner: Acme admins · own cost center' },
          { id: 'labs-core', name: 'labs-core', sub: 'Owner: Labs admins · own cost center' },
        ],
      },
    ],
    edges: [
      ['g-plat', 'app-oidc'],
      ['g-acme', 'app-oidc'],
      ['g-labs', 'app-oidc'],
      ['app-oidc', 'o-ent'],
      ['app-oidc', 'own-acme'],
      ['app-oidc', 'own-labs'],
      ['o-ent', 'p-ent', 'sets'],
      ['own-acme', 'acme-web', 'sets'],
      ['own-acme', 'acme-data', ''],
      ['own-labs', 'labs-core', 'sets'],
    ],
    links: {
      'g-plat': ['app-oidc', 'o-ent', 'p-ent'],
      'g-acme': ['app-oidc', 'own-acme', 'acme-web', 'acme-data'],
      'g-labs': ['app-oidc', 'own-labs', 'labs-core'],
      'app-oidc': ['g-plat', 'g-acme', 'g-labs', 'o-ent', 'own-acme', 'own-labs'],
      'o-ent': ['g-plat', 'app-oidc', 'p-ent'],
      'own-acme': ['g-acme', 'app-oidc', 'acme-web', 'acme-data'],
      'own-labs': ['g-labs', 'app-oidc', 'labs-core'],
      'p-ent': ['o-ent', 'acme-web', 'acme-data', 'labs-core'],
      'acme-web': ['own-acme', 'p-ent'],
      'acme-data': ['own-acme', 'p-ent'],
      'labs-core': ['own-labs', 'p-ent'],
    },
    info: {
      'g-plat': { lead: 'GH-Platform:', text: 'enterprise owners who set guardrails and billing but don’t run the orgs day to day.' },
      'g-acme': { lead: 'GH-Acme-Admins:', text: 'Acme’s admins; each one is made an owner of Acme’s orgs.' },
      'g-labs': { lead: 'GH-Labs-Admins:', text: 'Acme Labs’ admins; each one is made an owner of labs-core.' },
      'app-oidc': { lead: 'EMU OIDC app:', text: 'still one app and one account per person; delegation happens inside GitHub.' },
      'o-ent': { lead: 'Enterprise owners:', text: 'enforce the few policies that matter and leave the rest at “No policy” for org owners to decide.' },
      'own-acme': { lead: 'Acme admins:', text: 'own acme-web and acme-data, and manage their settings and cost centers within enterprise policy.' },
      'own-labs': { lead: 'Labs admins:', text: 'run labs-core on their own, including its cost center.' },
      'p-ent': { lead: 'Enterprise policies:', text: 'enforced policies flow down to every org in the frame; anything not enforced is each org owner’s call.' },
      'acme-web': { lead: 'acme-web:', text: 'owned by Acme admins, inside enterprise policy, and billed to its own cost center.' },
      'acme-data': { lead: 'acme-data:', text: 'owned by Acme admins, inside enterprise policy, and billed to its own cost center.' },
      'labs-core': { lead: 'labs-core:', text: 'owned by Labs admins; enterprise owners don’t see its content unless they join it.' },
    },
  },
};
