// Questions, decisions, and every explanation sentence for the enterprise architecture questionnaire.

export type QuestionId = 'hosting' | 'residency' | 'collaboration' | 'lifecycle' | 'idp' | 'name' | 'isolation' | 'orgs';
export type DecisionId = 'hosting' | 'residency' | 'identity' | 'idp' | 'name' | 'enterprises' | 'orgs';
export type StageId = 'hosting' | 'residency' | 'identity' | 'name' | 'structure' | 'review';

export interface Info {
  lead: string;
  text: string;
}

export interface Answer {
  id: string;
  label: string;
  detail: string;
  info: Info;
}

export interface Question {
  id: QuestionId;
  stage: StageId;
  prompt: string;
  description: string;
  /** Empty for the free-text name question. */
  answers: Answer[];
  info: Info;
  context: { title: string; text: string };
  doc: { label: string; href: string };
}

export const STORAGE_KEY = 'glassbox:architecture-decisions:v1';

export const VISUAL = {
  title: 'Decide the foundations',
  description: 'Answer from your requirements. Each answer suggests a choice you can edit in the decision record.',
  trailLabel: 'Decision trail',
  back: 'Back',
  next: 'Continue',
  finish: 'See decision record',
  saved: 'Answers are saved in this browser only.',
  step: (n: number, total: number) => `Question ${n} of ${total}`,
};

const DOCS = {
  hosting: 'https://docs.github.com/en/enterprise-cloud@latest/admin/overview/about-github-for-enterprises',
  residency: 'https://docs.github.com/en/enterprise-cloud@latest/admin/data-residency/about-github-enterprise-cloud-with-data-residency',
  identity: 'https://docs.github.com/en/enterprise-cloud@latest/admin/concepts/enterprise-fundamentals/choose-an-enterprise-type',
  idp: 'https://docs.github.com/en/enterprise-cloud@latest/admin/managing-iam/reconfiguring-iam-for-enterprise-managed-users/migrating-your-enterprise-to-a-new-identity-provider-or-tenant',
  shortcode: 'https://docs.github.com/en/enterprise-cloud@latest/admin/managing-iam/iam-configuration-reference/username-considerations-for-external-authentication',
  subdomain: 'https://docs.github.com/en/enterprise-cloud@latest/admin/data-residency/getting-started-with-data-residency-for-github-enterprise-cloud',
  wellArchitected: 'https://learn.github.com/well-architected/governance/recommendations/governance-administration-essentials',
  organize: 'https://docs.github.com/en/enterprise-cloud@latest/admin/concepts/enterprise-best-practices/organize-work',
};

export const STAGES: { id: StageId; label: string }[] = [
  { id: 'hosting', label: 'Hosting' },
  { id: 'residency', label: 'Residency' },
  { id: 'identity', label: 'Identity' },
  { id: 'name', label: 'Name' },
  { id: 'structure', label: 'Structure' },
  { id: 'review', label: 'Review' },
];

export const STAGE_EMPTY = 'To decide';
export const STAGE_REVIEW = { pending: 'Not ready', ready: 'Decision record' };

const UNKNOWN_DETAIL = 'Record it as undecided and find who owns the requirement.';

export const QUESTIONS: Question[] = [
  {
    id: 'hosting',
    stage: 'hosting',
    prompt: 'Must you run GitHub on your own infrastructure?',
    description: 'Start from an operating requirement, not a product preference.',
    answers: [
      {
        id: 'cloud',
        label: 'No, GitHub can host it',
        detail: 'Suggests GitHub Enterprise Cloud, on GitHub.com or a regional GHE.com subdomain.',
        info: { lead: 'GitHub Enterprise Cloud.', text: 'GitHub hosts the platform, so new features and fixes arrive without upgrades.' },
      },
      {
        id: 'server',
        label: 'Yes, we must operate the instance',
        detail: 'Suggests GitHub Enterprise Server, on premises or in your public cloud.',
        info: { lead: 'GitHub Enterprise Server.', text: 'You run and upgrade your own instance, and create its user accounts.' },
      },
      {
        id: 'unknown',
        label: 'Not confirmed yet',
        detail: UNKNOWN_DETAIL,
        info: { lead: 'Hosting stays undecided.', text: 'The next questions still apply to Cloud, so you can keep going.' },
      },
    ],
    info: { lead: 'Hosting is a migration decision.', text: 'Data residency alone is not a reason to self-host: Cloud can store data in a chosen region.' },
    context: {
      title: 'One plan, two deployments',
      text: 'A GitHub Enterprise plan includes both Enterprise Cloud and Enterprise Server, and you can use either or both. Moving work between them is a migration, not a setting.',
    },
    doc: { label: 'About GitHub for enterprises', href: DOCS.hosting },
  },
  {
    id: 'residency',
    stage: 'residency',
    prompt: 'Must your code and data be stored in a specific region?',
    description: 'Ask your compliance or legal team, not just engineering.',
    answers: [
      {
        id: 'none',
        label: 'No regional requirement',
        detail: 'Suggests GitHub.com, which stores data in the USA by default.',
        info: { lead: 'GitHub.com.', text: 'With no regional requirement, the enterprise can live on GitHub.com.' },
      },
      {
        id: 'eu',
        label: 'Yes, in the EU',
        detail: 'GHE.com in the EU region, which includes Norway and Switzerland.',
        info: { lead: 'GHE.com, EU region.', text: 'Your enterprise gets its own GHE.com subdomain and must use managed users.' },
      },
      {
        id: 'australia',
        label: 'Yes, in Australia',
        detail: 'GHE.com in the Australia region.',
        info: { lead: 'GHE.com, Australia region.', text: 'Your enterprise gets its own GHE.com subdomain and must use managed users.' },
      },
      {
        id: 'us',
        label: 'Yes, in the US',
        detail: 'GHE.com in the US region.',
        info: { lead: 'GHE.com, US region.', text: 'Your enterprise gets its own GHE.com subdomain and must use managed users.' },
      },
      {
        id: 'japan',
        label: 'Yes, in Japan',
        detail: 'GHE.com in the Japan region.',
        info: { lead: 'GHE.com, Japan region.', text: 'Your enterprise gets its own GHE.com subdomain and must use managed users.' },
      },
      {
        id: 'unknown',
        label: 'Not confirmed yet',
        detail: UNKNOWN_DETAIL,
        info: { lead: 'Residency stays undecided.', text: 'Confirm it before creating the enterprise, because the region is chosen at signup.' },
      },
    ],
    info: { lead: 'Residency narrows identity.', text: 'GHE.com requires Enterprise Managed Users, and you choose the region when the enterprise is created.' },
    context: {
      title: 'Chosen at creation',
      text: 'Data residency is picked when the enterprise is created and can’t be reversed without a migration. Review region availability and feature differences before you commit.',
    },
    doc: { label: 'About GitHub Enterprise Cloud with data residency', href: DOCS.residency },
  },
  {
    id: 'collaboration',
    stage: 'identity',
    prompt: 'Do people need to contribute outside your enterprise?',
    description: 'Think of open source work, partner repositories, and public Pages or gists.',
    answers: [
      {
        id: 'same',
        label: 'Yes, with the same account they use for work',
        detail: 'Points to personal accounts. Managed users can only contribute inside the enterprise.',
        info: { lead: 'Same account outside.', text: 'Managed users can read public repositories but can’t push, open issues, or open pull requests outside the enterprise.' },
      },
      {
        id: 'separate',
        label: 'Sometimes, and a separate personal account is fine',
        detail: 'Managed users work, with a second personal account for outside work.',
        info: { lead: 'Two accounts.', text: 'People switch to a personal account for outside work, which managed users allow.' },
      },
      {
        id: 'internal',
        label: 'No, work stays inside the enterprise',
        detail: 'Managed users fit well.',
        info: { lead: 'Internal work only.', text: 'Managed users’ restrictions on public content won’t get in the way.' },
      },
      {
        id: 'unknown',
        label: 'Not confirmed yet',
        detail: UNKNOWN_DETAIL,
        info: { lead: 'Collaboration stays undecided.', text: 'Check with teams that publish open source before choosing an account model.' },
      },
    ],
    info: { lead: 'Collaboration shapes the account model.', text: 'Managed user accounts can’t create public repositories or contribute outside the enterprise.' },
    context: {
      title: 'Account model is permanent',
      text: 'You pick personal accounts or managed users before creating the enterprise. Switching later means migrating to a new enterprise account.',
    },
    doc: { label: 'Choosing an enterprise type', href: DOCS.identity },
  },
  {
    id: 'lifecycle',
    stage: 'identity',
    prompt: 'Must your identity provider own the accounts?',
    description: 'That means creating, naming, and suspending each GitHub account from your IdP.',
    answers: [
      {
        id: 'idp',
        label: 'Yes, the IdP creates and removes accounts',
        detail: 'Points to Enterprise Managed Users, provisioned with SCIM.',
        info: { lead: 'IdP-owned accounts.', text: 'With managed users, your IdP controls usernames, emails, and when accounts are suspended.' },
      },
      {
        id: 'access',
        label: 'No, we only need to control access',
        detail: 'Points to personal accounts, with optional SAML SSO.',
        info: { lead: 'Access only.', text: 'People bring personal accounts, and SAML SSO links them to your IdP to grant access.' },
      },
      {
        id: 'unknown',
        label: 'Not confirmed yet',
        detail: UNKNOWN_DETAIL,
        info: { lead: 'Account ownership stays undecided.', text: 'Personal accounts are simpler if you have no IdP onboarding process today.' },
      },
    ],
    info: { lead: 'Who owns the account?', text: 'Managed users are provisioned from your IdP; personal accounts belong to each person.' },
    context: {
      title: 'Not interchangeable',
      text: 'Personal and managed accounts are different account types. Moving between them needs migration tools and a separate process for user history.',
    },
    doc: { label: 'Choosing an enterprise type', href: DOCS.identity },
  },
  {
    id: 'idp',
    stage: 'identity',
    prompt: 'Which identity provider will manage your users?',
    description: 'Managed users sign in and are provisioned only through this IdP.',
    answers: [
      {
        id: 'entra',
        label: 'Microsoft Entra ID',
        detail: 'A partner IdP. Use OIDC, which supports Conditional Access policies.',
        info: { lead: 'Entra ID with OIDC.', text: 'GitHub recommends OIDC with Entra ID so your Conditional Access policies apply to GitHub.' },
      },
      {
        id: 'okta',
        label: 'Okta',
        detail: 'A partner IdP. Use SAML with SCIM.',
        info: { lead: 'Okta with SAML.', text: 'Okta is a partner IdP for managed users, using SAML for sign-in and SCIM for provisioning.' },
      },
      {
        id: 'ping',
        label: 'PingFederate',
        detail: 'A partner IdP. Use SAML with SCIM.',
        info: { lead: 'PingFederate with SAML.', text: 'PingFederate is a partner IdP for managed users, using SAML for sign-in and SCIM for provisioning.' },
      },
      {
        id: 'other',
        label: 'Another SAML 2.0 and SCIM 2.0 system',
        detail: 'Allowed if it meets GitHub’s integration guidelines.',
        info: { lead: 'A non-partner IdP.', text: 'Check it against GitHub’s guidelines for SAML 2.0 and SCIM 2.0 before you commit.' },
      },
      {
        id: 'unknown',
        label: 'Not confirmed yet',
        detail: UNKNOWN_DETAIL,
        info: { lead: 'IdP stays undecided.', text: 'Managed users can’t sign in until authentication and provisioning are configured.' },
      },
    ],
    info: { lead: 'The IdP is hard to swap.', text: 'Moving to a new IdP or tenant deletes tokens, SSH keys, and IdP group links on GitHub.' },
    context: {
      title: 'Changing IdP is disruptive',
      text: 'To move to a new IdP or tenant, you disable and reconfigure authentication. GitHub deletes SCIM identities, personal access tokens, SSH keys, and IdP-linked groups, then users are provisioned again.',
    },
    doc: { label: 'Migrating to a new identity provider', href: DOCS.idp },
  },
  {
    id: 'name',
    stage: 'name',
    prompt: 'What short name will identify your enterprise?',
    description: 'Lowercase letters and numbers. Availability is checked when you sign up.',
    answers: [],
    info: { lead: 'A name you can’t change.', text: 'Pick it with stakeholders now, because it can’t be modified after the enterprise exists.' },
    context: {
      title: 'Fixed at creation',
      text: 'Managed users get usernames that end in the enterprise shortcode. On GHE.com, you also choose a subdomain. Neither can be changed later.',
    },
    doc: { label: 'Username considerations', href: DOCS.shortcode },
  },
  {
    id: 'isolation',
    stage: 'structure',
    prompt: 'Must any part of the business be fully isolated?',
    description: 'For example a separate legal entity, or a regulated unit with its own administrators.',
    answers: [
      {
        id: 'none',
        label: 'No, one company and one set of policies',
        detail: 'Suggests one enterprise for all internal work.',
        info: { lead: 'One enterprise.', text: 'Well-Architected recommends one enterprise account for all internal work.' },
      },
      {
        id: 'entity',
        label: 'Yes, a legal or regulatory boundary',
        detail: 'Suggests a separate enterprise for that entity.',
        info: { lead: 'A separate enterprise.', text: 'Each enterprise has its own owners, policies, and bill, and nothing is shared between them.' },
      },
      {
        id: 'unknown',
        label: 'Not confirmed yet',
        detail: UNKNOWN_DETAIL,
        info: { lead: 'Isolation stays undecided.', text: 'Default to one enterprise unless a legal or regulatory boundary requires another.' },
      },
    ],
    info: { lead: 'Enterprises split identity and policy.', text: 'With managed users, someone who works in two enterprises needs two accounts.' },
    context: {
      title: 'Organizations separate work too',
      text: 'Most separation needs fit in organizations inside one enterprise. A second enterprise duplicates identity setup, owners, and policies.',
    },
    doc: { label: 'Well-Architected: governance essentials', href: DOCS.wellArchitected },
  },
  {
    id: 'orgs',
    stage: 'structure',
    prompt: 'How should work be grouped into organizations?',
    description: 'Organizations are boundaries for collaboration and policy, not an org chart.',
    answers: [
      {
        id: 'shared',
        label: 'Most work is shared; a few repositories are need-to-know',
        detail: 'Suggests a single organization, with teams for access.',
        info: { lead: 'Single organization.', text: 'Teams and repository permissions handle access, and an all-members team keeps innersource open.' },
      },
      {
        id: 'boundary',
        label: 'Need-to-know work needs its own boundary',
        detail: 'Suggests red, green, and sandbox organizations.',
        info: { lead: 'Red-green-sandbox.', text: 'Shared work goes in green, need-to-know work in red, and experiments in a sandbox.' },
      },
      {
        id: 'units',
        label: 'Business units run independently',
        detail: 'Suggests one organization per top-level unit or portfolio company.',
        info: { lead: 'One organization per unit.', text: 'Map organizations to stable top-level divisions or portfolio companies, not to teams.' },
      },
      {
        id: 'teams',
        label: 'Each team or department wants its own',
        detail: 'Well-Architected advises against this; teams are the better fit.',
        info: { lead: 'Avoid an organization per team.', text: 'Reorganizations would force organization changes, so use teams within fewer organizations.' },
      },
      {
        id: 'unknown',
        label: 'Not confirmed yet',
        detail: UNKNOWN_DETAIL,
        info: { lead: 'Structure stays undecided.', text: 'Start small: it’s easier to add organizations than to remove them.' },
      },
    ],
    info: { lead: 'Start with few organizations.', text: 'Mentions and search work within one organization, and removing organizations later is harder than adding them.' },
    context: {
      title: 'Reorganizing has a cost',
      text: 'Moving repositories between organizations changes their owner/name paths, so integrations and links need updating.',
    },
    doc: { label: 'Best practices for organizing work', href: DOCS.organize },
  },
];

export const QUESTION_BY_ID = Object.fromEntries(QUESTIONS.map((q) => [q.id, q])) as Record<QuestionId, Question>;

export const NAME = {
  shortcodeLabel: 'Enterprise shortcode',
  subdomainLabel: 'GHE.com subdomain',
  placeholder: 'acme',
  shortcodePreview: (v: string) => `Usernames like mona_${v}`,
  subdomainPreview: (v: string) => `${v}.ghe.com`,
  invalid: 'Use lowercase letters and numbers only.',
  answeredInfo: (v: string, subdomain: boolean): Info =>
    subdomain
      ? { lead: `${v}.ghe.com.`, text: 'You can’t change the subdomain later, so confirm it before signup.' }
      : { lead: `Shortcode ${v}.`, text: `Managed users will be named like mona_${v}, and the shortcode can’t change later.` },
};

export interface ChoiceOption {
  id: string;
  label: string;
  /** Compact label for the decision trail. */
  short?: string;
}

export interface Decision {
  id: DecisionId;
  label: string;
  impact: string;
  /** Impacts that can never be changed get the warning color. */
  fixed?: boolean;
  options: ChoiceOption[];
  doc: string;
}

export const UNDECIDED = 'undecided';
export const NOT_APPLICABLE = 'na';

const undecided = { id: UNDECIDED, label: 'Undecided' };
const notApplicable = { id: NOT_APPLICABLE, label: 'Not applicable' };

export const REGIONS: Record<string, string> = { eu: 'EU', australia: 'Australia', us: 'US', japan: 'Japan' };

export const DECISIONS: Decision[] = [
  {
    id: 'hosting',
    label: 'Hosting',
    impact: 'Migration to change',
    options: [
      { id: 'cloud', label: 'GitHub Enterprise Cloud', short: 'Cloud' },
      { id: 'server', label: 'GitHub Enterprise Server', short: 'Server' },
      undecided,
    ],
    doc: DOCS.hosting,
  },
  {
    id: 'residency',
    label: 'Data residency',
    impact: 'Migration to change',
    options: [
      { id: 'github', label: 'GitHub.com' },
      ...Object.entries(REGIONS).map(([id, r]) => ({ id, label: `GHE.com, ${r} region`, short: `GHE.com ${r}` })),
      notApplicable,
      undecided,
    ],
    doc: DOCS.residency,
  },
  {
    id: 'identity',
    label: 'Account model',
    impact: 'New enterprise to change',
    options: [
      { id: 'emu', label: 'Enterprise Managed Users', short: 'Managed users' },
      { id: 'personal', label: 'Personal accounts', short: 'Personal' },
      { id: 'instance', label: 'Server instance accounts', short: 'Instance' },
      undecided,
    ],
    doc: DOCS.identity,
  },
  {
    id: 'idp',
    label: 'Identity provider',
    impact: 'Disruptive to change',
    options: [
      { id: 'entra', label: 'Entra ID with OIDC' },
      { id: 'okta', label: 'Okta with SAML' },
      { id: 'ping', label: 'PingFederate with SAML' },
      { id: 'other', label: 'Other SAML 2.0 and SCIM IdP' },
      notApplicable,
      undecided,
    ],
    doc: DOCS.idp,
  },
  {
    id: 'name',
    label: 'Shortcode or subdomain',
    impact: 'Can’t change',
    fixed: true,
    options: [],
    doc: DOCS.shortcode,
  },
  {
    id: 'enterprises',
    label: 'Enterprise accounts',
    impact: 'Splits identity and policy',
    options: [
      { id: 'single', label: 'One enterprise' },
      { id: 'separate', label: 'Separate enterprise for isolated entities' },
      notApplicable,
      undecided,
    ],
    doc: DOCS.wellArchitected,
  },
  {
    id: 'orgs',
    label: 'Organizations',
    impact: 'Easier to add than remove',
    options: [
      { id: 'single', label: 'Single organization', short: 'One org' },
      { id: 'red-green', label: 'Red, green, and sandbox', short: 'Red-green' },
      { id: 'per-unit', label: 'One per business unit', short: 'Org per unit' },
      undecided,
    ],
    doc: DOCS.organize,
  },
];

export const NAME_DOC_SUBDOMAIN = DOCS.subdomain;

/** Generated rationale for each suggested choice. */
export const RATIONALE = {
  hosting: {
    cloud: 'There’s no requirement to operate the platform yourselves, so GitHub hosts it and ships features and fixes without upgrades.',
    server: 'You must run the instance on your own infrastructure, on premises or in a public cloud, so you also own its upgrades and accounts.',
    undecided: 'Who must operate the platform isn’t confirmed. Find the requirement owner first, because moving between Cloud and Server is a migration.',
  },
  residency: {
    github: 'There’s no regional storage requirement, so the enterprise can live on GitHub.com, which stores data in the USA by default.',
    region: (r: string) =>
      `Code and data must stay in the ${r} region, so the enterprise lives on its own GHE.com subdomain, which requires managed users. Review feature differences and storage scope with security and legal before committing.`,
    na: 'With Enterprise Server, you choose where the instance runs, so there’s no separate residency choice.',
    undecided: 'Whether data must stay in a region isn’t confirmed. Settle it first: the region is chosen when the enterprise is created.',
  },
  identity: {
    emuResidency: 'GHE.com requires Enterprise Managed Users, so your IdP provisions every account.',
    emu: 'Your IdP must own account lifecycle and work stays inside the enterprise, so managed users fit.',
    separate: 'People who contribute outside the enterprise use a separate personal account.',
    personal: 'You only need to control access, so people bring personal accounts. Add SAML SSO to tie access to your IdP.',
    personalOutside: 'People need the same account for work outside the enterprise, so they bring personal accounts. Add SAML SSO to tie access to your IdP.',
    conflictResidency: 'Conflict: GHE.com requires managed users, but people must contribute outside the enterprise with the same account. Revisit one of these requirements.',
    conflict: 'Conflict: you want your IdP to own accounts, but people must contribute outside with the same account. Managed users would need a second, personal account for outside work.',
    instance: 'On Enterprise Server, you create accounts on the instance, with built-in or external authentication.',
    undecided: 'Account ownership isn’t decided yet. Settle it before creating the enterprise, because switching means a new enterprise account.',
  },
  idp: {
    entra: 'Entra ID supports OIDC, which GitHub recommends because it applies your Conditional Access policies. A tenant can back one OIDC enterprise; other enterprises from that tenant use SAML.',
    okta: 'Okta is a partner IdP for managed users, with SAML for sign-in and SCIM for provisioning.',
    ping: 'PingFederate is a partner IdP for managed users, with SAML for sign-in and SCIM for provisioning.',
    other: 'A non-partner IdP must meet GitHub’s SAML 2.0 and SCIM 2.0 guidelines.',
    change: 'Changing IdP later deletes tokens, SSH keys, and IdP group links on GitHub.',
    personal: 'Personal accounts don’t need an IdP to exist. You can add SAML SSO for access later.',
    server: 'Enterprise Server configures authentication on the instance.',
    undecided: 'No IdP is chosen yet. Managed users can’t sign in until authentication and provisioning are set up.',
  },
  name: {
    subdomain: (v: string) => `The enterprise will live at ${v}.ghe.com. The subdomain can’t be changed later.`,
    shortcode: (v: string) => `Managed users will be named like mona_${v}. The shortcode can’t be changed after the enterprise is created.`,
    empty: 'Not chosen yet. Pick it with stakeholders before creating the enterprise, because it can’t be changed afterward.',
    na: 'Only managed-user enterprises have a shortcode, and only GHE.com has a subdomain.',
  },
  enterprises: {
    single: 'No part of the business needs full isolation, so use one enterprise for all internal work, as Well-Architected recommends, and separate work with organizations.',
    separate: 'A legal or regulatory boundary needs full isolation, so that entity gets its own enterprise, with its own owners and policies. With managed users, someone in both needs two accounts.',
    na: 'An Enterprise Server instance has its own enterprise account.',
    undecided: 'Isolation needs aren’t confirmed. Default to one enterprise unless a legal or regulatory boundary requires another.',
  },
  orgs: {
    single: 'Most work can be shared, so start with one organization. Use teams for access, and an all-members team to keep innersource open.',
    redGreen: 'Need-to-know work needs its own boundary: a green organization for shared work, a red one for need-to-know repositories, and a sandbox for experiments.',
    perUnit: 'Business units run independently, so map one organization to each stable top-level unit or portfolio company.',
    fromTeams: 'An organization per team or department breaks when the company reorganizes. Start with one organization and use teams for access.',
    undecided: 'Not decided yet. Start with a few organizations, because it’s easier to add organizations than to remove them.',
  },
  override: (suggested: string) => `You changed this from the suggested ${suggested}.`,
};

/** Warnings when an edited choice contradicts another decision. */
export const CONFLICTS = {
  personalResidency: 'GHE.com requires Enterprise Managed Users.',
  serverResidency: 'Data residency applies to Enterprise Cloud on GHE.com, not to Enterprise Server.',
  serverEmu: 'Enterprise Managed Users is an Enterprise Cloud feature.',
};

export const REVIEW = {
  title: 'Your decision record',
  description: 'Edit any choice, add your own context, then copy the table into your design doc.',
  columns: { decision: 'Decision', choice: 'Choice', rationale: 'Rationale' },
  suggested: 'Suggested',
  notesLabel: 'Your notes (optional)',
  notesPlaceholder: 'Business reason, owner, or follow-up…',
  docLink: 'GitHub guidance',
  copy: 'Copy as Markdown',
  copied: 'Copied to clipboard.',
  copyFailed: 'Couldn’t copy. Your browser blocked clipboard access.',
  edit: 'Edit answers',
  reset: 'Start over',
  info: (decided: number, total: number, open: number): Info =>
    open
      ? { lead: `${decided} of ${total} decisions set.`, text: `${open} still ${open === 1 ? 'needs' : 'need'} an owner or a resolved conflict before you create the enterprise.` }
      : { lead: `All ${total} decisions set.`, text: 'Review them with your stakeholders: none of these are easy to change after the enterprise exists.' },
  conflictPrefix: 'Conflict:',
  markdownTitle: '## GitHub Enterprise architecture decisions',
  markdownHeader: ['Decision', 'Choice', 'Change impact', 'Rationale', 'Notes'],
};

export const CONFLICT_NOTICE = 'These requirements conflict. The account model will stay undecided until you revisit one of them.';
