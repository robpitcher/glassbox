// Single source of truth for the repository merge gates visual.
// Behavior follows GitHub Docs for GitHub.com / GitHub Enterprise Cloud: rulesets,
// protected branches, required status checks, and CODEOWNERS.

export type ScenarioId = 'blocked' | 'allowed';

export const SCENARIOS: Record<ScenarioId, { label: string }> = {
  blocked: { label: 'Blocked' },
  allowed: { label: 'Allowed' },
};

export const PULL = {
  number: 42,
  title: 'Add refund endpoint',
  author: 'kai',
  head: 'kai/refunds',
  base: 'main',
  repo: 'acme-web/checkout',
  file: 'src/payments/refunds.ts',
} as const;

export type SourceId = 'org-ruleset' | 'repo-ruleset' | 'branch-protection' | 'codeowners';

export interface Source {
  id: SourceId;
  kind: string;
  name: string;
  /** Where an admin edits it. */
  where: string;
  rules: string[];
  /** Index into the category colors. */
  color: 0 | 1 | 2 | 3;
}

export const SOURCES: Source[] = [
  {
    id: 'org-ruleset',
    kind: 'Org ruleset',
    name: 'baseline',
    where: 'acme-web › Settings › Rules',
    rules: ['Require a pull request', '1 approval', 'Check: build'],
    color: 0,
  },
  {
    id: 'repo-ruleset',
    kind: 'Repo ruleset',
    name: 'protect-main',
    where: 'checkout › Settings › Rules',
    rules: ['2 approvals', 'Code owner review', 'Check: test'],
    color: 1,
  },
  {
    id: 'branch-protection',
    kind: 'Branch protection',
    name: 'main',
    where: 'checkout › Settings › Branches',
    rules: ['Resolve conversations'],
    color: 2,
  },
  {
    id: 'codeowners',
    kind: 'File',
    name: '.github/CODEOWNERS',
    where: 'checkout, on main',
    rules: ['/src/payments/ @acme-web/payments'],
    color: 3,
  },
];

export type Actor = 'human' | 'automation';
export type GateId = 'pr' | 'checks' | 'codeowner' | 'approvals' | 'conversations';

export interface Gate {
  id: GateId;
  name: string;
  actor: Actor;
  actorLabel: string;
  /** Sources that contribute a rule to this gate. */
  sources: SourceId[];
  /** What #42 has, per scenario. */
  has: Record<ScenarioId, string>;
  pass: Record<ScenarioId, boolean>;
}

export const GATES: Gate[] = [
  {
    id: 'pr',
    name: 'Pull request',
    actor: 'human',
    actorLabel: 'kai',
    sources: ['org-ruleset'],
    has: { blocked: '#42 is open', allowed: '#42 is open' },
    pass: { blocked: true, allowed: true },
  },
  {
    id: 'checks',
    name: 'Required checks',
    actor: 'automation',
    actorLabel: 'GitHub Actions',
    sources: ['org-ruleset', 'repo-ruleset'],
    has: { blocked: 'build ✓ · test ✓', allowed: 'build ✓ · test ✓' },
    pass: { blocked: true, allowed: true },
  },
  {
    id: 'codeowner',
    name: 'Code owner review',
    actor: 'human',
    actorLabel: 'mona',
    sources: ['repo-ruleset', 'codeowners'],
    has: { blocked: 'mona approved', allowed: 'mona approved' },
    pass: { blocked: true, allowed: true },
  },
  {
    id: 'approvals',
    name: 'Approvals',
    actor: 'human',
    actorLabel: 'reviewers',
    sources: ['org-ruleset', 'repo-ruleset'],
    has: { blocked: '1 of 2: mona', allowed: '2 of 2: mona, ray' },
    pass: { blocked: false, allowed: true },
  },
  {
    id: 'conversations',
    name: 'Conversations',
    actor: 'human',
    actorLabel: 'kai, mona',
    sources: ['branch-protection'],
    has: { blocked: '3 of 3 resolved', allowed: '3 of 3 resolved' },
    pass: { blocked: true, allowed: true },
  },
];

export type OutcomeId = 'blocked' | 'allowed';

export const source = (id: SourceId) => SOURCES.find((s) => s.id === id)!;
export const gate = (id: GateId) => GATES.find((g) => g.id === id)!;
export const gatesFrom = (id: SourceId) => GATES.filter((g) => g.sources.includes(id));
export const failing = (scenario: ScenarioId) => GATES.filter((g) => !g.pass[scenario]);
export const outcomeOf = (scenario: ScenarioId): OutcomeId => (failing(scenario).length ? 'blocked' : 'allowed');

export type Selection =
  | { kind: 'source'; id: SourceId }
  | { kind: 'gate'; id: GateId }
  | { kind: 'outcome'; id: OutcomeId };

export interface Explanation {
  lead: string;
  text: string;
  note?: string;
}

const SOURCE_TEXT: Record<SourceId, Explanation> = {
  'org-ruleset': {
    lead: 'Org ruleset, set by acme-web owners.',
    text: 'It targets the default branch of every acme-web repo, so checkout gets its PR, 1-approval, and build rules without a repo admin doing anything.',
    note: 'Anyone with read access to checkout can view it. Org rulesets can target repos by name pattern or custom property.',
  },
  'repo-ruleset': {
    lead: 'Repo ruleset, set by checkout admins.',
    text: 'It adds code owner review and the test check, and asks for 2 approvals. Rulesets don’t override each other: every rule applies, and the stricter count wins.',
  },
  'branch-protection': {
    lead: 'Branch protection rule on main.',
    text: 'The older control still applies alongside rulesets. Here it adds one rule: resolve every conversation before merging.',
    note: 'Only one branch protection rule applies to a branch, but any number of rulesets can. You can convert it into a ruleset.',
  },
  codeowners: {
    lead: 'CODEOWNERS file on main.',
    text: 'It names @acme-web/payments as owners of /src/payments/, so GitHub requests their review on #42. It decides who, not whether.',
    note: 'The review becomes required only because the repo ruleset turns on code owner review. The last matching pattern wins.',
  },
};

/** One-sentence explanation of the selection for the current scenario. */
export function explain(scenario: ScenarioId, sel: Selection | null): Explanation {
  const outcome = outcomeOf(scenario);
  if (!sel || sel.kind === 'outcome') {
    const id = sel?.kind === 'outcome' ? sel.id : outcome;
    if (id === 'blocked') {
      return outcome === 'blocked'
        ? {
            lead: 'Merge blocked by approvals.',
            text: 'main needs 2 approvals because the repo ruleset is stricter than the org ruleset, and #42 has 1. Every other gate is green.',
            note: 'The PR’s merge box lists the unmet rule. Anyone on a ruleset’s bypass list could still merge.',
          }
        : {
            lead: 'Not blocked this time.',
            text: 'A single unmet rule from any source would block #42. With two approvals, none is unmet.',
          };
    }
    return outcome === 'allowed'
      ? {
          lead: 'Merge allowed.',
          text: 'ray’s approval makes 2, so every rule from all four sources is met and kai can merge #42 into main.',
        }
      : {
          lead: 'Not allowed yet.',
          text: 'One more approval from someone with write access, such as ray, would turn the last gate green.',
        };
  }
  if (sel.kind === 'source') return SOURCE_TEXT[sel.id];

  const g = gate(sel.id);
  const ok = g.pass[scenario];
  switch (g.id) {
    case 'pr':
      return {
        lead: 'Pull request required, from the org ruleset.',
        text: `kai can’t push to main directly, so the change arrives as #${PULL.number} from ${PULL.head}.`,
      };
    case 'checks':
      return {
        lead: 'Required checks, from both rulesets.',
        text: 'The org ruleset requires build and the repo ruleset requires test. GitHub Actions reports both on the PR’s latest commit, and both passed.',
        note: 'A required check passes as successful, skipped, or neutral. With the strict setting, the branch must also be up to date with main.',
      };
    case 'codeowner':
      return {
        lead: 'Code owner review, required by the repo ruleset.',
        text: 'CODEOWNERS says who owns src/payments/, and the ruleset says their approval is needed. mona is on payments and approved, which is enough.',
        note: 'kai is on payments too, but authors can’t approve their own PR.',
      };
    case 'approvals':
      return ok
        ? {
            lead: 'Approvals: 2 of 2.',
            text: 'mona’s code owner approval counts toward the total, and ray’s makes 2. The repo ruleset’s 2 beats the org ruleset’s 1.',
          }
        : {
            lead: 'Approvals: 1 of 2. This blocks the merge.',
            text: 'The org ruleset asks for 1 and the repo ruleset asks for 2. Both apply, so 2 is required. mona’s approval counts, but it’s only 1.',
            note: 'If the repo ruleset turns on stale-approval dismissal, a new push would reset this count.',
          };
    case 'conversations':
      return {
        lead: 'Conversations, from branch protection.',
        text: 'Every review thread on #42 must be resolved before merging. All three are.',
      };
  }
}
