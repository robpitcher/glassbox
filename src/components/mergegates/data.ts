// Single source of truth for the merge-gates visual. One illustrative repository:
// settings differ per repository, so every value here is an example.

export type ScenarioId = 'blocked' | 'allowed';
export type SourceId = 'ruleset' | 'protection' | 'codeowners';
export type GateStatus = 'pass' | 'fail' | 'pending';

export interface Source {
  id: SourceId;
  name: string;
  where: string;
  detail: string;
  /** Index into the --cc-N color tokens. */
  color: 0 | 1 | 2;
}

export const SOURCES: Source[] = [
  {
    id: 'ruleset',
    name: 'Ruleset “main-gate”',
    where: 'Organization acme-web › Settings › Rules › Rulesets',
    detail: 'Targets the default branch of matching repos, including checkout. Can also be set per repository.',
    color: 0,
  },
  {
    id: 'protection',
    name: 'Branch protection rule on main',
    where: 'Repository checkout › Settings › Branches',
    detail: 'The older, per-repository mechanism. It can apply alongside rulesets.',
    color: 1,
  },
  {
    id: 'codeowners',
    name: 'CODEOWNERS file',
    where: 'checkout › .github/CODEOWNERS',
    detail: 'Maps paths to owners. It only gates merging when a rule requires code owner review.',
    color: 2,
  },
];

export interface Gate {
  id: string;
  title: string;
  /** What the requirement says, in this example. */
  rule: string;
  source: SourceId;
  /** Per-scenario state and one-line detail. */
  states: Record<ScenarioId, { status: GateStatus; note: string }>;
}

export const GATES: Gate[] = [
  {
    id: 'pr',
    title: 'Changes go through a pull request',
    rule: 'No direct pushes to main.',
    source: 'ruleset',
    states: {
      blocked: { status: 'pass', note: 'mona opened PR #42 from branch fix-tax-rounding.' },
      allowed: { status: 'pass', note: 'mona opened PR #42 from branch fix-tax-rounding.' },
    },
  },
  {
    id: 'checks',
    title: 'Required status checks pass',
    rule: 'build and test must succeed.',
    source: 'ruleset',
    states: {
      blocked: { status: 'fail', note: 'build passed, but test failed.' },
      allowed: { status: 'pass', note: 'build and test both passed.' },
    },
  },
  {
    id: 'codeowners',
    title: 'Code owner reviews',
    rule: 'Owners of changed paths must approve. Here payments/ is owned by ray.',
    source: 'codeowners',
    states: {
      blocked: { status: 'pending', note: 'Waiting on ray, the owner of payments/.' },
      allowed: { status: 'pass', note: 'ray approved.' },
    },
  },
  {
    id: 'approvals',
    title: 'Enough approving reviews',
    rule: 'Ruleset asks for 1, the branch protection rule asks for 2, so the stricter 2 applies.',
    source: 'protection',
    states: {
      blocked: { status: 'pending', note: '1 of 2 approvals: kai approved.' },
      allowed: { status: 'pass', note: '2 of 2 approvals: kai and ray.' },
    },
  },
];

export interface Scenario {
  id: ScenarioId;
  label: string;
  verdict: string;
  summary: string;
}

export const SCENARIOS: Record<ScenarioId, Scenario> = {
  blocked: {
    id: 'blocked',
    label: 'Blocked',
    verdict: 'Merge blocked',
    summary: 'Three requirements are unmet, each from a different place.',
  },
  allowed: {
    id: 'allowed',
    label: 'Allowed',
    verdict: 'Merge allowed',
    summary: 'Every applicable requirement is satisfied.',
  },
};

export const STATUS_LABEL: Record<GateStatus, string> = {
  pass: 'Met',
  fail: 'Failing',
  pending: 'Waiting',
};

export const STATUS_MARK: Record<GateStatus, string> = {
  pass: '✓',
  fail: '✕',
  pending: '…',
};
