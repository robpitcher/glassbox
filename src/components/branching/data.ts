export type Highlight = 'feature' | 'fix' | 'both';
export type LaneId = 'trunk' | 'github' | 'gitflow';

export const HIGHLIGHT_OPTIONS: { value: Highlight; label: string }[] = [
  { value: 'feature', label: 'Feature' },
  { value: 'fix', label: 'Fix' },
  { value: 'both', label: 'Both' },
];

export const LANE_LABELS: Record<LaneId, string> = {
  trunk: 'Trunk-based',
  github: 'GitHub Flow',
  gitflow: 'Git Flow',
};

export const CAPTIONS: Record<Highlight, Record<LaneId | 'overview', string>> = {
  feature: {
    overview: 'The same feature either lands in small flagged slices, waits on one branch, or moves through develop and release branches.',
    trunk: 'Trunk-based development keeps the feature behind a flag and integrates it in many tiny same-day arcs.',
    github: 'GitHub Flow lets the feature branch live for several days, then merges and deploys from main.',
    gitflow: 'Git Flow keeps feature work on develop before a release branch carries it to main.',
  },
  fix: {
    overview: 'The urgent fix takes the shortest release path each convention offers.',
    trunk: 'The trunk fix is a tiny arc into main, followed by another release from trunk.',
    github: 'The GitHub Flow fix branches from main, merges quickly, and deploys before the feature.',
    gitflow: 'The Git Flow hotfix starts from main, releases there, then back-merges into develop.',
  },
  both: {
    overview: 'The comparison is about integration cadence and release path, not rigid rules every team must copy.',
    trunk: 'Trunk-based development minimizes branch lifetime, so feature and fix both converge on main quickly.',
    github: 'GitHub Flow keeps one production line, with branch lifetime driven by review and deployment readiness.',
    gitflow: 'Git Flow separates integration and production, giving the fix a direct path while the feature waits for release.',
  },
};

export const TRADEOFFS = [
  {
    label: 'Integration cadence',
    trunk: 'Many tiny integrations.',
    github: 'Per-branch integration.',
    gitflow: 'Batch through develop.',
  },
  {
    label: 'Release path',
    trunk: 'Release from trunk or short release branches.',
    github: 'Deploy after merge to main.',
    gitflow: 'Release branch, tag on main.',
  },
  {
    label: 'Fits when',
    trunk: 'Teams can test often and hide incomplete work.',
    github: 'A simple mainline and review loop matches deployment.',
    gitflow: 'Versioned products need supported releases or hotfix lanes.',
  },
] as const;

export const SOURCES = [
  { title: 'Trunk-Based Development', url: 'https://trunkbaseddevelopment.com/' },
  { title: 'GitHub Docs: GitHub flow', url: 'https://docs.github.com/en/get-started/using-github/github-flow' },
  { title: 'A successful Git branching model', url: 'https://nvie.com/posts/a-successful-git-branching-model/' },
  { title: 'Martin Fowler: Branching Patterns', url: 'https://martinfowler.com/articles/branching-patterns.html' },
];
