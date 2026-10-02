export type AccountMode = 'personal' | 'emu';
export type InspectTarget = 'repository' | 'team' | 'policy';

export const ACCOUNT_MODES: { id: AccountMode; label: string }[] = [
  { id: 'personal', label: 'Personal accounts' },
  { id: 'emu', label: 'Managed users (EMU)' },
];

export const INSPECT_TARGETS: { id: InspectTarget; label: string }[] = [
  { id: 'repository', label: 'Repository' },
  { id: 'team', label: 'Team' },
  { id: 'policy', label: 'Policy' },
];

export const CAPTIONS: Record<AccountMode, Record<InspectTarget, string>> = {
  personal: {
    repository: 'Owned by octo-web · affects access, settings, and activity in the site repository.',
    team: 'Owned by octo-web · affects repository access for organization members only.',
    policy: 'Owned by Octo Enterprise · affects every organization unless delegated or loosened.',
  },
  emu: {
    repository: 'Owned by octo-web · affects managed members who are provisioned into the organization.',
    team: 'Owned by octo-web · affects repo access, often synced from IdP groups.',
    policy: 'Owned by Octo Enterprise · affects all managed-user organizations and their repositories.',
  },
};

export const MODE_NOTES: Record<AccountMode, string> = {
  personal:
    'People keep their own GitHub identities outside the enterprise; organization membership brings those accounts into company work.',
  emu:
    'An IdP provisions managed accounts into the enterprise with SCIM; those accounts are owned by the enterprise and cannot contribute outside it.',
};

export const SOURCES = [
  {
    title: 'Types of GitHub accounts',
    url: 'https://docs.github.com/en/get-started/learning-about-github/types-of-github-accounts',
  },
  {
    title: 'Enterprise accounts',
    url: 'https://docs.github.com/en/enterprise-cloud@latest/admin/concepts/enterprise-fundamentals/enterprise-accounts',
  },
  {
    title: 'About Enterprise Managed Users',
    url: 'https://docs.github.com/en/enterprise-cloud@latest/admin/concepts/identity-and-access-management/enterprise-managed-users',
  },
  {
    title: 'Configuring SCIM provisioning for Enterprise Managed Users',
    url: 'https://docs.github.com/en/enterprise-cloud@latest/admin/managing-iam/provisioning-user-accounts-with-scim/configuring-scim-provisioning-for-users',
  },
  {
    title: 'About organization teams',
    url: 'https://docs.github.com/en/organizations/organizing-members-into-teams/about-teams',
  },
  {
    title: 'Enforcing repository management policies in your enterprise',
    url: 'https://docs.github.com/en/enterprise-cloud@latest/admin/enforcing-policies/enforcing-policies-for-your-enterprise/enforcing-repository-management-policies-in-your-enterprise',
  },
];
