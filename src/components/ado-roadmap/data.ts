export type StageId = 'repos' | 'cicd' | 'engineering' | 'planning';
export type Zone = 'ado' | 'github';
export type TileId = 'repos' | 'pipelines' | 'packages' | 'security' | 'boards' | 'actions' | 'issues';
export type TileState = 'record' | 'linked' | 'future' | 'retired' | 'moving';

export interface Tile {
  id: TileId;
  label: string;
  zone: Zone;
  state: TileState;
}

export interface Integration {
  from: string;
  to: string;
  label: string;
  path: string;
  labelX: number;
  labelY: number;
  tone: 'solid' | 'dashed';
}

export interface Stage {
  id: StageId;
  number: string;
  tabLabel: string;
  title: string;
  caption: string;
  benefit: string;
  prerequisite: string;
  tradeoff: string;
  moving: string;
  tiles: Tile[];
  integrations: Integration[];
}

const baseTiles = {
  adoRepos: { id: 'repos', label: 'Repos', zone: 'ado' },
  adoPipelines: { id: 'pipelines', label: 'Pipelines', zone: 'ado' },
  adoPackages: { id: 'packages', label: 'Packages', zone: 'ado' },
  adoSecurity: { id: 'security', label: 'Security', zone: 'ado' },
  adoBoards: { id: 'boards', label: 'Boards', zone: 'ado' },
  ghRepos: { id: 'repos', label: 'Repos', zone: 'github' },
  ghActions: { id: 'actions', label: 'Actions', zone: 'github' },
  ghPackages: { id: 'packages', label: 'Packages', zone: 'github' },
  ghSecurity: { id: 'security', label: 'Security', zone: 'github' },
  ghIssues: { id: 'issues', label: 'Issues', zone: 'github' },
} satisfies Record<string, Omit<Tile, 'state'>>;

export const STAGES: Stage[] = [
  {
    id: 'repos',
    number: '1',
    tabLabel: '1 Repos',
    title: 'Move repositories first',
    caption: 'GitHub becomes the code system of record while Azure Boards and Pipelines stay connected.',
    benefit: 'Developers start in GitHub.',
    prerequisite: 'Import repos and PR history.',
    tradeoff: 'ADO remains in daily use.',
    moving: 'Repos',
    tiles: [
      { ...baseTiles.adoRepos, state: 'retired' },
      { ...baseTiles.adoPipelines, state: 'linked' },
      { ...baseTiles.adoPackages, state: 'record' },
      { ...baseTiles.adoSecurity, state: 'record' },
      { ...baseTiles.adoBoards, state: 'linked' },
      { ...baseTiles.ghRepos, state: 'moving' },
      { ...baseTiles.ghActions, state: 'future' },
      { ...baseTiles.ghPackages, state: 'future' },
      { ...baseTiles.ghSecurity, state: 'future' },
      { ...baseTiles.ghIssues, state: 'future' },
    ],
    integrations: [
      {
        from: 'Pipelines',
        to: 'Repos',
        label: 'builds',
        path: 'M 392 154 C 470 116, 530 116, 608 154',
        labelX: 470,
        labelY: 116,
        tone: 'solid',
      },
      {
        from: 'Boards',
        to: 'Repos',
        label: 'AB# links',
        path: 'M 392 318 C 472 384, 528 384, 608 318',
        labelX: 452,
        labelY: 382,
        tone: 'dashed',
      },
    ],
  },
  {
    id: 'cicd',
    number: '2',
    tabLabel: '2 CI/CD',
    title: 'Shift CI/CD when workflows are ready',
    caption: 'GitHub Actions takes over build and release paths; planning can still live in Boards.',
    benefit: 'Automation follows the repo.',
    prerequisite: 'Map runners, secrets, approvals.',
    tradeoff: 'YAML and runner gaps need review.',
    moving: 'CI/CD',
    tiles: [
      { ...baseTiles.adoRepos, state: 'retired' },
      { ...baseTiles.adoPipelines, state: 'retired' },
      { ...baseTiles.adoPackages, state: 'record' },
      { ...baseTiles.adoSecurity, state: 'record' },
      { ...baseTiles.adoBoards, state: 'linked' },
      { ...baseTiles.ghRepos, state: 'record' },
      { ...baseTiles.ghActions, state: 'moving' },
      { ...baseTiles.ghPackages, state: 'future' },
      { ...baseTiles.ghSecurity, state: 'future' },
      { ...baseTiles.ghIssues, state: 'future' },
    ],
    integrations: [
      {
        from: 'Boards',
        to: 'Repos',
        label: 'trace',
        path: 'M 392 318 C 472 384, 528 384, 608 318',
        labelX: 474,
        labelY: 382,
        tone: 'dashed',
      },
    ],
  },
  {
    id: 'engineering',
    number: '3',
    tabLabel: '3 Workflows',
    title: 'Move the rest of engineering',
    caption: 'Packages and security signals move to GitHub; Boards can remain the planning record.',
    benefit: 'One engineering surface.',
    prerequisite: 'Inventory feeds and policies.',
    tradeoff: 'Planning remains hybrid.',
    moving: 'Workflows',
    tiles: [
      { ...baseTiles.adoRepos, state: 'retired' },
      { ...baseTiles.adoPipelines, state: 'retired' },
      { ...baseTiles.adoPackages, state: 'retired' },
      { ...baseTiles.adoSecurity, state: 'retired' },
      { ...baseTiles.adoBoards, state: 'linked' },
      { ...baseTiles.ghRepos, state: 'record' },
      { ...baseTiles.ghActions, state: 'record' },
      { ...baseTiles.ghPackages, state: 'moving' },
      { ...baseTiles.ghSecurity, state: 'moving' },
      { ...baseTiles.ghIssues, state: 'future' },
    ],
    integrations: [
      {
        from: 'Boards',
        to: 'Repos',
        label: 'trace',
        path: 'M 392 318 C 472 384, 528 384, 608 318',
        labelX: 474,
        labelY: 382,
        tone: 'dashed',
      },
    ],
  },
  {
    id: 'planning',
    number: '4',
    tabLabel: '4 Optional',
    title: 'Optionally move planning later',
    caption: 'Teams can move planning to GitHub Issues and Projects when they want that system of record.',
    benefit: 'Planning joins delivery.',
    prerequisite: 'Agree fields and reporting.',
    tradeoff: 'Not required for every org.',
    moving: 'Planning',
    tiles: [
      { ...baseTiles.adoRepos, state: 'retired' },
      { ...baseTiles.adoPipelines, state: 'retired' },
      { ...baseTiles.adoPackages, state: 'retired' },
      { ...baseTiles.adoSecurity, state: 'retired' },
      { ...baseTiles.adoBoards, state: 'retired' },
      { ...baseTiles.ghRepos, state: 'record' },
      { ...baseTiles.ghActions, state: 'record' },
      { ...baseTiles.ghPackages, state: 'record' },
      { ...baseTiles.ghSecurity, state: 'record' },
      { ...baseTiles.ghIssues, state: 'moving' },
    ],
    integrations: [
      {
        from: 'Boards',
        to: 'Issues',
        label: 'handoff',
        path: 'M 392 318 C 470 354, 530 354, 608 318',
        labelX: 460,
        labelY: 352,
        tone: 'dashed',
      },
    ],
  },
];

export const SOURCES = [
  {
    title: 'Understand migrations from Azure DevOps to GitHub',
    url: 'https://docs.github.com/en/migrations/ado/understand-migrations-from-azure-devops-to-github',
  },
  {
    title: 'Connect Azure Boards to GitHub',
    url: 'https://learn.microsoft.com/en-us/azure/devops/boards/github/connect-to-github',
  },
  {
    title: 'Build GitHub repositories with Azure Pipelines',
    url: 'https://learn.microsoft.com/en-us/azure/devops/pipelines/repos/github',
  },
  {
    title: 'Migrating from Azure Pipelines to GitHub Actions',
    url: 'https://docs.github.com/en/actions/tutorials/migrate-to-github-actions/manual-migrations/migrate-from-azure-pipelines',
  },
  {
    title: 'Automating migration with GitHub Actions Importer',
    url: 'https://docs.github.com/en/actions/tutorials/migrate-to-github-actions/automated-migrations/use-github-actions-importer',
  },
];
