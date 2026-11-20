// Single source of truth for the Azure DevOps to GitHub roadmap visual.
// Behavior follows GitHub Docs (GitHub Enterprise Importer, GitHub Actions Importer) and
// Microsoft Learn (Azure Pipelines and Azure Boards apps for GitHub). GitHub.com / Enterprise Cloud.

export type StageId = '1' | '2' | '3' | '4';
export type ServiceId = 'repos' | 'pipelines' | 'packages' | 'security' | 'boards';

export const STAGE_IDS: StageId[] = ['1', '2', '3', '4'];

export const VISUAL = {
  title: 'What lives where at each stage',
  description:
    'Acme moves its web team from Azure DevOps to the acme-web organization on GitHub, one stage at a time. Pick a stage to see what has moved and which apps keep the rest connected.',
  label: 'Stage',
  hint: 'Select a service to see its system of record',
};

export const LANES = { ado: 'Azure DevOps', gh: 'GitHub · acme-web' };

export const SUMMARY_KEYS = ['Benefit', 'Before you start', 'Tradeoff'] as const;
export type SummaryKey = (typeof SUMMARY_KEYS)[number];

export interface Side {
  name: string;
  sub: string;
}

export interface Service {
  id: ServiceId;
  kind: string;
  ado: Side;
  gh: Side;
  /** Stage in which the service moves to GitHub. */
  moves: StageId;
  /** Shown as the tile's sub line in the stage it moves. */
  handoff: string;
  /** The integration that connects it to the GitHub repositories while it stays in Azure DevOps. */
  bridge?: { app: string; surface: string };
  /** Moving it is optional, so its Azure DevOps slot offers to keep it. */
  optional?: boolean;
}

export const SERVICES: Service[] = [
  {
    id: 'repos',
    kind: 'Code',
    ado: { name: 'Azure Repos', sub: 'Git repositories' },
    gh: { name: 'Repositories', sub: 'checkout · app · docs' },
    moves: '1',
    handoff: 'Moved with GitHub Enterprise Importer',
  },
  {
    id: 'pipelines',
    kind: 'CI/CD',
    ado: { name: 'Azure Pipelines', sub: 'Build and release pipelines' },
    gh: { name: 'GitHub Actions', sub: 'Workflows in each repository' },
    moves: '2',
    handoff: 'Moved with GitHub Actions Importer',
    bridge: { app: 'Azure Pipelines app', surface: 'Checks on pull requests' },
  },
  {
    id: 'packages',
    kind: 'Packages',
    ado: { name: 'Azure Artifacts', sub: 'npm and NuGet feeds' },
    gh: { name: 'GitHub Packages', sub: 'Registries in acme-web' },
    moves: '3',
    handoff: 'Republished to GitHub Packages',
  },
  {
    id: 'security',
    kind: 'Security',
    ado: { name: 'Current scanners', sub: 'Scan tasks in pipelines' },
    gh: { name: 'GitHub security', sub: 'Dependabot, code and secret scanning' },
    moves: '3',
    handoff: 'Turned on across acme-web',
  },
  {
    id: 'boards',
    kind: 'Planning',
    ado: { name: 'Azure Boards', sub: 'Work items and sprints' },
    gh: { name: 'Issues & Projects', sub: 'Issues, boards, and roadmaps' },
    moves: '4',
    handoff: 'Moved by script, if at all',
    bridge: { app: 'Azure Boards app', surface: 'AB# links to work items' },
    optional: true,
  },
];

export const SLOT_TEXT = {
  moved: (n: StageId) => `Moved in stage ${n}`,
  pending: (n: StageId) => `Moves in stage ${n}`,
  keep: 'Or keep it linked',
  via: 'via',
};

export const TAGS = { now: 'Moves now', optional: 'Optional' };

export interface Info {
  lead: string;
  text: string;
}

export interface Stage {
  label: string;
  lead: string;
  text: string;
  summary: Record<SummaryKey, string>;
  info: Record<ServiceId, Info>;
}

const NO_CHANGE = 'No change from stage 3.';

export const STAGES: Record<StageId, Stage> = {
  '1': {
    label: '1 · Repositories',
    lead: 'Stage 1: repositories.',
    text: 'Code moves to acme-web, and Azure Pipelines and Azure Boards keep working against it through their GitHub apps.',
    summary: {
      Benefit: 'Developers review and merge in GitHub pull requests while builds and planning keep running unchanged.',
      'Before you start':
        'Create the enterprise and decide on managed users first. Install both apps in acme-web, and plan one cutover per repository, because migrations can’t be re-run as deltas.',
      Tradeoff:
        'You run two systems and grant access in both. Imported activity belongs to placeholder mannequins until people reclaim it.',
    },
    info: {
      repos: {
        lead: 'GitHub repositories now hold the code.',
        text: 'GitHub Enterprise Importer moved checkout, app, and docs with their commit history, pull requests, work item links on pull requests, and repository branch policies. Git LFS objects and pipelines don’t move with them.',
      },
      pipelines: {
        lead: 'Azure Pipelines still builds and deploys.',
        text: 'Once each pipeline is rewired to its GitHub repository, the Azure Pipelines app starts runs on pushes and pull requests and reports results back to GitHub as checks.',
      },
      packages: {
        lead: 'Azure Artifacts still hosts packages.',
        text: 'Pipelines keep publishing to and restoring from the same feeds, so nothing changes for package consumers yet.',
      },
      security: {
        lead: 'Existing scanners keep running in pipelines.',
        text: 'GitHub Advanced Security for Azure DevOps only covers Azure Repos, so teams that rely on it often turn on GitHub’s security features now instead of waiting for stage 3.',
      },
      boards: {
        lead: 'Azure Boards stays the planning tool.',
        text: 'With the Azure Boards app, AB#123 in a commit message or a pull request or issue description links it to work item 123, and “Fixes AB#123” resolves the item when the pull request merges into the default branch.',
      },
    },
  },
  '2': {
    label: '2 · CI/CD',
    lead: 'Stage 2: CI/CD.',
    text: 'Builds and deployments move to GitHub Actions. Azure Boards stays linked, and packages stay in Azure Artifacts.',
    summary: {
      Benefit: 'Builds run next to the code, with checks, environments, and secrets managed in GitHub.',
      'Before you start':
        'Audit pipelines with GitHub Actions Importer. Re-create secrets, service connections, self-hosted agents, environments, and approvals yourself.',
      Tradeoff:
        'Some tasks, gates, and triggers have no automatic equivalent, and every deployment path needs re-testing.',
    },
    info: {
      repos: {
        lead: 'The repositories also hold the CI/CD now.',
        text: 'Each repository carries the GitHub Actions workflows that build and deploy it, alongside the code.',
      },
      pipelines: {
        lead: 'GitHub Actions takes over CI/CD.',
        text: 'GitHub Actions Importer audits the Azure pipelines and opens pull requests with converted workflows. Unknown tasks, secrets, service connections, and approvals need manual work.',
      },
      packages: {
        lead: 'Azure Artifacts still hosts packages.',
        text: 'Workflows authenticate to the existing Azure Artifacts feeds to publish and restore until packages move in stage 3.',
      },
      security: {
        lead: 'Existing scans move with the pipelines.',
        text: 'Scan tasks that ran in Azure Pipelines now run as workflow steps, until stage 3 switches to GitHub’s own security features.',
      },
      boards: {
        lead: 'Azure Boards stays linked.',
        text: 'AB# links from commits and pull requests keep working, but the “Integrated in build” links that Azure Pipelines added to work items stop with the pipelines.',
      },
    },
  },
  '3': {
    label: '3 · Packages & security',
    lead: 'Stage 3: remaining engineering workflows.',
    text: 'Packages and security scanning move to GitHub. Azure Boards is the only Azure DevOps service left, still linked for planning and traceability.',
    summary: {
      Benefit: 'Dependencies, packages, and security alerts sit next to the code and workflows that use them.',
      'Before you start':
        'Check that each feed’s package type exists in GitHub Packages, update every consumer’s registry URL, and choose which security products to enable.',
      Tradeoff: 'Planning and code still live in different products, joined only by the Azure Boards app.',
    },
    info: {
      repos: {
        lead: 'The repositories hold everything but planning.',
        text: 'Code, workflows, packages, and security alerts all live in acme-web.',
      },
      pipelines: {
        lead: 'GitHub Actions runs CI/CD.',
        text: 'Workflows now publish to GitHub Packages and run GitHub’s code scanning on pull requests.',
      },
      packages: {
        lead: 'GitHub Packages hosts packages.',
        text: 'The npm and NuGet feeds are republished to acme-web. GitHub Packages has no Python registry, so a PyPI feed might stay in Azure Artifacts.',
      },
      security: {
        lead: 'GitHub’s security features take over.',
        text: 'Dependabot alerts are free on every plan. Code scanning and secret scanning on private repositories come with GitHub Code Security and GitHub Secret Protection.',
      },
      boards: {
        lead: 'Azure Boards is the last Azure DevOps service.',
        text: 'It stays linked to acme-web through the Azure Boards app, so planning and traceability don’t change. Many teams stop here.',
      },
    },
  },
  '4': {
    label: '4 · Planning (optional)',
    lead: 'Stage 4 (optional): planning.',
    text: 'Teams that want an all-GitHub workflow move planning to GitHub Issues and Projects. Staying at stage 3 is a valid end state.',
    summary: {
      Benefit: 'Code, automation, and planning live in one place, and issues link to pull requests natively.',
      'Before you start':
        'Map work item types, states, and fields to issues and project fields, then script the move. There’s no built-in importer.',
      Tradeoff:
        'Azure Boards features such as process templates and delivery plans may not map one to one, so teams relearn their planning views.',
    },
    info: {
      repos: {
        lead: 'Everything is in GitHub.',
        text: 'Issues and pull requests in acme-web link to each other directly, without the AB# bridge.',
      },
      pipelines: { lead: 'GitHub Actions runs CI/CD.', text: NO_CHANGE },
      packages: { lead: 'GitHub Packages hosts packages.', text: NO_CHANGE },
      security: { lead: 'GitHub’s security features cover the code.', text: NO_CHANGE },
      boards: {
        lead: 'GitHub Issues and Projects replace Azure Boards.',
        text: 'Teams script the move of active work items through the REST APIs or a CSV export, and can leave closed history in Azure Boards for reference.',
      },
    },
  },
};
