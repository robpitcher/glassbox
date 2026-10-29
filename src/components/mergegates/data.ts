// Single source of truth for the merge-gates visual.
// Illustrative setup: real repositories may use rulesets, branch protection, or both.

export type ScenarioId = 'blocked' | 'allowed';
export type SourceId = 'ruleset' | 'protection';
export type Status = 'pass' | 'fail';
export type Actor = 'human' | 'automation';

export const SOURCES: Record<SourceId, { label: string; where: string }> = {
  ruleset: {
    label: 'Ruleset',
    where: 'Org settings → Rules → Rulesets (acme-web), targeting main',
  },
  protection: {
    label: 'Branch protection',
    where: 'checkout → Settings → Branches → rule for main',
  },
};

export interface Gate {
  id: string;
  name: string;
  requirement: string;
  source: SourceId;
  actor: Actor;
  actorLabel: string;
  outcome: Record<ScenarioId, { status: Status; detail: string }>;
}

export const GATES: Gate[] = [
  {
    id: 'pr',
    name: 'Pull request',
    requirement: 'Changes to main must arrive through a pull request.',
    source: 'ruleset',
    actor: 'human',
    actorLabel: 'mona opens the PR',
    outcome: {
      blocked: { status: 'pass', detail: 'mona opened a PR from a feature branch, so the rule is met.' },
      allowed: { status: 'pass', detail: 'mona opened a PR from a feature branch, so the rule is met.' },
    },
  },
  {
    id: 'checks',
    name: 'Required checks',
    requirement: 'The build and test checks must pass.',
    source: 'ruleset',
    actor: 'automation',
    actorLabel: 'GitHub Actions runs them',
    outcome: {
      blocked: { status: 'fail', detail: 'build passed, but test failed. A required check that fails or is missing blocks the merge.' },
      allowed: { status: 'pass', detail: 'mona pushed a fix, and both build and test now pass.' },
    },
  },
  {
    id: 'approvals',
    name: 'Approvals',
    requirement: 'At least 1 approving review.',
    source: 'ruleset',
    actor: 'human',
    actorLabel: 'a reviewer approves',
    outcome: {
      blocked: { status: 'pass', detail: 'ray approved, which satisfies the approval count.' },
      allowed: { status: 'pass', detail: 'ray approved, which satisfies the approval count.' },
    },
  },
  {
    id: 'owners',
    name: 'Code owners',
    requirement: 'An owner listed in CODEOWNERS must approve changes to the files they own.',
    source: 'protection',
    actor: 'human',
    actorLabel: 'kai owns the files',
    outcome: {
      blocked: { status: 'fail', detail: 'The PR touches files owned by kai, who has not reviewed yet. ray\'s approval does not count as a code owner review.' },
      allowed: { status: 'pass', detail: 'kai approved, so the code owner requirement is met.' },
    },
  },
];

export const SCENARIOS: Record<ScenarioId, { label: string; blurb: string }> = {
  blocked: { label: 'Blocked', blurb: 'PR #42 from mona' },
  allowed: { label: 'Allowed', blurb: 'after the fixes' },
};

export const RESULT: Record<ScenarioId, { title: string; detail: string }> = {
  blocked: { title: 'Merge blocked', detail: 'Every requirement that applies must be met, so one failing gate is enough.' },
  allowed: { title: 'Merge allowed', detail: 'All applicable requirements are met. Someone with write access can merge.' },
};
