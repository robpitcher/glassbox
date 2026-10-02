export type GateId = 'ruleset' | 'checks' | 'owners' | 'approvals';
export type ScenarioId = 'clear' | 'check-fails' | 'owner-missing' | 'two-approvals';

export interface Gate {
  id: GateId;
  label: string;
  shortLabel: string;
  detail: string;
  configured: string;
}

export interface Scenario {
  id: ScenarioId;
  label: string;
  caption: string;
  blockedBy?: GateId;
  wideDot: string;
  narrowDot: string;
}

export const GATES: Gate[] = [
  {
    id: 'ruleset',
    label: 'Rules',
    shortLabel: 'Rules',
    detail: 'Rulesets and branch protection define matching policy layers; enterprise, organization, and repository requirements combine.',
    configured: 'rulesets or branch protection',
  },
  {
    id: 'checks',
    label: 'Checks',
    shortLabel: 'Checks',
    detail: 'Required status checks name the CI results that must pass before the target branch accepts the PR.',
    configured: 'ruleset or branch protection rule',
  },
  {
    id: 'owners',
    label: 'Code owners',
    shortLabel: 'Owners',
    detail: 'CODEOWNERS maps changed paths to people or teams; review rules can require one owner approval.',
    configured: 'CODEOWNERS and review rule',
  },
  {
    id: 'approvals',
    label: 'Approvals',
    shortLabel: 'Reviews',
    detail: 'Review rules set the approval count and can dismiss stale approvals after new commits.',
    configured: 'review rule',
  },
];

export const SCENARIOS: Scenario[] = [
  {
    id: 'clear',
    label: 'All clear',
    caption: 'Allowed: every matching rule is satisfied, so the PR reaches merge.',
    wideDot: '92%',
    narrowDot: '86%',
  },
  {
    id: 'check-fails',
    label: 'Check fails',
    caption: 'Blocked: required check `test` failed — required by the organization ruleset targeting `main`.',
    blockedBy: 'checks',
    wideDot: '34%',
    narrowDot: '34%',
  },
  {
    id: 'owner-missing',
    label: 'Review missing',
    caption: 'Blocked: Code Owners review is missing — CODEOWNERS selects @security and the repo rule requires owner review.',
    blockedBy: 'owners',
    wideDot: '51%',
    narrowDot: '49%',
  },
  {
    id: 'two-approvals',
    label: 'Needs 2 approvals',
    caption: 'Blocked: only one approval is present — the repo rule requires two approving reviews before merge.',
    blockedBy: 'approvals',
    wideDot: '68%',
    narrowDot: '64%',
  },
];

export const SOURCES = [
  {
    title: 'About rulesets',
    url: 'https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets',
  },
  {
    title: 'Available rules for rulesets',
    url: 'https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets',
  },
  {
    title: 'About protected branches',
    url: 'https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches',
  },
  {
    title: 'Require status checks before merging',
    url: 'https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches#require-status-checks-before-merging',
  },
  {
    title: 'Managing a merge queue',
    url: 'https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/managing-a-merge-queue',
  },
  {
    title: 'About code owners',
    url: 'https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners',
  },
];
