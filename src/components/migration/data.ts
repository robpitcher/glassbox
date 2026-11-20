// Single source of truth for the Azure DevOps to GitHub migration roadmap visual.
// The sequence is an example, not a required migration plan for every organization.

export type StageId = 'repositories' | 'cicd' | 'workflows' | 'planning';
export type PlatformId = 'azure' | 'github';
export type ServiceId = 'repositories' | 'cicd' | 'workflows' | 'planning';

export interface Service {
  id: ServiceId;
  name: string;
  detail: string;
}

export interface Handoff {
  id: string;
  label: string;
  sub: string;
  services: ServiceId[];
  lead: string;
  text: string;
}

export interface Stage {
  id: StageId;
  label: string;
  number: number;
  optional?: boolean;
  owners: Record<ServiceId, PlatformId>;
  moved: ServiceId[];
  handoffs: Handoff[];
  lead: string;
  text: string;
}

export interface Explanation {
  lead: string;
  text: string;
}

export type Selection =
  | { kind: 'service'; id: ServiceId }
  | { kind: 'handoff'; id: string };

export const VISUAL = {
  title: 'Move services in safe increments',
  description: 'Advance the roadmap to see where Acme owns each service and which live integrations keep work connected.',
  stageLabel: 'Roadmap stage',
  hint: 'Select a service or handoff for detail',
  azure: 'Azure DevOps',
  github: 'GitHub',
  source: 'still active',
  destination: 'destination',
  active: 'active',
  moved: 'moved here',
  optional: 'optional',
  complete: 'cutover complete',
  systemOfRecord: 'System of record',
  noAzureServices: 'No Azure DevOps services remain in this roadmap path.',
  noGithubServices: 'GitHub receives repositories in Stage 1.',
} as const;

export const SERVICES: Service[] = [
  {
    id: 'repositories',
    name: 'Repositories',
    detail: 'checkout · app · docs',
  },
  {
    id: 'cicd',
    name: 'CI / CD',
    detail: 'build, test, deploy',
  },
  {
    id: 'workflows',
    name: 'Packages + security',
    detail: 'artifacts · code analysis',
  },
  {
    id: 'planning',
    name: 'Planning',
    detail: 'work items · backlogs',
  },
];

export const STAGES: Stage[] = [
  {
    id: 'repositories',
    label: 'Repositories',
    number: 1,
    owners: {
      repositories: 'github',
      cicd: 'azure',
      workflows: 'azure',
      planning: 'azure',
    },
    moved: ['repositories'],
    handoffs: [
      {
        id: 'repos-boards',
        label: 'Boards ↔ GitHub',
        sub: 'work-item links',
        services: ['repositories', 'planning'],
        lead: 'Azure Boards stays connected.',
        text: 'Commits, branches, pull requests, and issues on GitHub can link to Azure Boards work items, so planning keeps traceability after code moves.',
      },
      {
        id: 'repos-pipelines',
        label: 'Pipelines → GitHub',
        sub: 'build migrated code',
        services: ['repositories', 'cicd'],
        lead: 'Azure Pipelines can build GitHub code.',
        text: 'Pipelines continue on Azure DevOps while checking out and building the migrated acme-web and acme-data repositories.',
      },
      {
        id: 'repos-artifacts',
        label: 'Artifacts → pipelines',
        sub: 'keep current feeds',
        services: ['cicd', 'workflows'],
        lead: 'Existing package feeds can remain.',
        text: 'Acme keeps artifact storage and security workflows in Azure DevOps while it validates the repository cutover.',
      },
    ],
    lead: 'Repositories move first.',
    text: 'Acme imports its Git repositories and pull requests to GitHub while Azure Boards, Azure Pipelines, and existing package workflows stay in place.',
  },
  {
    id: 'cicd',
    label: 'CI / CD',
    number: 2,
    owners: {
      repositories: 'github',
      cicd: 'github',
      workflows: 'azure',
      planning: 'azure',
    },
    moved: ['cicd'],
    handoffs: [
      {
        id: 'cicd-boards',
        label: 'Boards ↔ GitHub',
        sub: 'trace PRs and runs',
        services: ['repositories', 'planning'],
        lead: 'Planning still spans the boundary.',
        text: 'Azure Boards remains the planning system while commits, pull requests, and related GitHub work stay linked to its work items.',
      },
      {
        id: 'cicd-deploy',
        label: 'Actions → Azure',
        sub: 'deploy existing services',
        services: ['cicd', 'workflows'],
        lead: 'Actions takes over delivery.',
        text: 'Converted workflows can still deploy to services that remain outside GitHub; service connections, secrets, approvals, and environments must be recreated deliberately.',
      },
      {
        id: 'cicd-artifacts',
        label: 'Artifacts → Actions',
        sub: 'temporary package bridge',
        services: ['cicd', 'workflows'],
        lead: 'Packages can follow later.',
        text: 'GitHub Actions may consume existing Azure Artifacts feeds while the team validates publishing, permissions, retention, and consumption on GitHub Packages.',
      },
    ],
    lead: 'CI / CD moves next.',
    text: 'GitHub Actions replaces Azure Pipelines build and deployment workflows while planning and package workflows remain in Azure DevOps.',
  },
  {
    id: 'workflows',
    label: 'Remaining workflows',
    number: 3,
    owners: {
      repositories: 'github',
      cicd: 'github',
      workflows: 'github',
      planning: 'azure',
    },
    moved: ['workflows'],
    handoffs: [
      {
        id: 'workflows-boards',
        label: 'Boards ↔ GitHub',
        sub: 'only standing bridge',
        services: ['repositories', 'cicd', 'planning'],
        lead: 'Azure Boards remains the connected planner.',
        text: 'Teams can continue planning in Azure DevOps and link work items to the repositories, pull requests, and Actions work now owned on GitHub.',
      },
      {
        id: 'workflows-packages',
        label: 'Packages → GitHub',
        sub: 'publish and consume',
        services: ['workflows', 'cicd'],
        lead: 'Package consumers cut over.',
        text: 'Acme updates publish and consume paths for GitHub Packages, validates retention and permissions, and retires obsolete Azure Artifacts dependencies.',
      },
      {
        id: 'workflows-security',
        label: 'Security → code',
        sub: 'findings near repos',
        services: ['repositories', 'workflows'],
        lead: 'Security moves beside the code.',
        text: 'Applicable code-scanning, dependency, secret-scanning, and policy workflows can be established in GitHub without requiring the planning system to move yet.',
      },
    ],
    lead: 'Remaining workflows consolidate.',
    text: 'Applicable package and security workflows move to GitHub while Azure Boards stays as the system of record for planning.',
  },
  {
    id: 'planning',
    label: 'Planning',
    number: 4,
    optional: true,
    owners: {
      repositories: 'github',
      cicd: 'github',
      workflows: 'github',
      planning: 'github',
    },
    moved: ['planning'],
    handoffs: [
      {
        id: 'planning-complete',
        label: 'All-GitHub path',
        sub: 'optional cutover',
        services: ['repositories', 'cicd', 'workflows', 'planning'],
        lead: 'Planning can stay or move.',
        text: 'Teams that are ready can use GitHub Issues and Projects for planning; stopping after Stage 3 is a valid end state.',
      },
    ],
    lead: 'Planning moves only when it helps.',
    text: 'Acme can finish with an all-GitHub workflow by using Issues and Projects, but this final stage is optional and can happen at a different time for each team.',
  },
];

export const SERVICE_EXPLANATIONS: Record<ServiceId, Record<PlatformId, Explanation>> = {
  repositories: {
    azure: {
      lead: 'Repositories remain in Azure DevOps.',
      text: 'This roadmap starts after the repository cutover, so that source state is outside the visual.',
    },
    github: {
      lead: 'GitHub owns Acme’s repositories.',
      text: 'checkout, app, and docs retain their history and review data supported by the importer while integrations keep Azure-based workflows connected.',
    },
  },
  cicd: {
    azure: {
      lead: 'Azure Pipelines owns delivery.',
      text: 'Existing build and release workflows check out the GitHub repositories and keep their current approvals and dependencies until each is ready to convert.',
    },
    github: {
      lead: 'GitHub Actions owns delivery.',
      text: 'Converted workflows rebuild the tested build, deployment, secret, runner, and approval behavior in GitHub rather than assuming a pipeline converts perfectly.',
    },
  },
  workflows: {
    azure: {
      lead: 'Azure DevOps keeps packages and security.',
      text: 'Current feeds and security checks stay available so the repository and delivery cutovers can proceed without moving every engineering workflow at once.',
    },
    github: {
      lead: 'GitHub owns applicable packages and security.',
      text: 'GitHub Packages, repository security features, and policies now sit beside the code, with consumers and findings validated during cutover.',
    },
  },
  planning: {
    azure: {
      lead: 'Azure Boards owns planning.',
      text: 'Work items, backlogs, and their links remain the planning system of record while development and delivery move to GitHub.',
    },
    github: {
      lead: 'Issues and Projects can own planning.',
      text: 'This optional change gives Acme one planning and development surface, after the team validates fields, workflows, history, reporting, and external links.',
    },
  },
};

export function serviceInfo(serviceId: ServiceId, platform: PlatformId): Explanation {
  return SERVICE_EXPLANATIONS[serviceId][platform];
}

export function selectionInfo(stage: Stage, selection: Selection | null): Explanation {
  if (!selection) return { lead: stage.lead, text: stage.text };
  if (selection.kind === 'service') {
    return serviceInfo(selection.id, stage.owners[selection.id]);
  }
  return stage.handoffs.find((handoff) => handoff.id === selection.id) ?? {
    lead: stage.lead,
    text: stage.text,
  };
}
