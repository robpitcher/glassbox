export type ModeId = 'completions' | 'chat' | 'agent';
export type Supply = 'auto' | 'configured' | 'manual';
export type SourceId = 'open-file' | 'selection' | 'workspace' | 'instructions' | 'issue' | 'tools';
export type OutputKind = 'suggestion' | 'answer' | 'action';

export interface ContextSource {
  id: SourceId;
  label: string;
  short: string;
  scope: string;
  x: number;
  y: number;
}

export interface ModeSource {
  id: SourceId;
  supply: Supply;
}

export interface Mode {
  id: ModeId;
  label: string;
  title: string;
  initiator: 'person' | 'agent';
  sources: ModeSource[];
  outputs: OutputKind[];
  caption: string;
  reviewer: string;
}

export const SOURCES_NODES: ContextSource[] = [
  { id: 'open-file', label: 'Open file', short: 'Open file', scope: 'Current file and nearby open context.', x: 34, y: 70 },
  { id: 'selection', label: 'Selection', short: 'Selection', scope: 'Highlighted code or cursor area.', x: 34, y: 116 },
  { id: 'workspace', label: 'Workspace', short: 'Workspace', scope: 'Files Copilot can search or that you attach.', x: 34, y: 162 },
  { id: 'instructions', label: 'Instructions', short: 'Instructions', scope: 'Repository or path-specific guidance.', x: 34, y: 208 },
  { id: 'issue', label: 'Issue', short: 'Issue', scope: 'A GitHub issue or task description.', x: 34, y: 254 },
  { id: 'tools', label: 'Tools / MCP', short: 'Tools / MCP', scope: 'Enabled tools, MCP servers, or extensions.', x: 34, y: 300 },
];

export const MODES: Mode[] = [
  {
    id: 'completions',
    label: 'Completions',
    title: 'Inline suggestions stay close to what you are editing.',
    initiator: 'person',
    sources: [
      { id: 'open-file', supply: 'auto' },
      { id: 'selection', supply: 'auto' },
    ],
    outputs: ['suggestion'],
    caption: 'Completions use nearby editor context to offer ghost text or next edits that you choose to accept.',
    reviewer: 'Person accepts',
  },
  {
    id: 'chat',
    label: 'Chat',
    title: 'Chat answers with the context you open, attach, or configure.',
    initiator: 'person',
    sources: [
      { id: 'open-file', supply: 'auto' },
      { id: 'selection', supply: 'auto' },
      { id: 'workspace', supply: 'manual' },
      { id: 'instructions', supply: 'configured' },
      { id: 'issue', supply: 'manual' },
    ],
    outputs: ['answer', 'suggestion'],
    caption: 'Chat can explain or draft changes, but you still apply the answer or suggestion unless you switch into an agent workflow.',
    reviewer: 'Person applies',
  },
  {
    id: 'agent',
    label: 'Agent',
    title: 'Agents can turn granted context into tool-backed changes.',
    initiator: 'agent',
    sources: [
      { id: 'workspace', supply: 'auto' },
      { id: 'instructions', supply: 'auto' },
      { id: 'issue', supply: 'manual' },
      { id: 'tools', supply: 'configured' },
    ],
    outputs: ['action'],
    caption: 'Agent mode and cloud agent can edit, run tools, and prepare a branch or pull request for human review.',
    reviewer: 'Person reviews',
  },
];

export const SUPPLY_LABELS: Record<Supply, string> = {
  auto: 'Auto',
  configured: 'Configured',
  manual: 'You attach',
};

export const OUTPUT_LABELS: Record<OutputKind, string> = {
  suggestion: 'Suggestion',
  answer: 'Answer',
  action: 'Action',
};

export const SOURCES = [
  { title: 'About GitHub Copilot', url: 'https://docs.github.com/en/copilot/get-started/about-github-copilot' },
  { title: 'GitHub Copilot code suggestions in your IDE', url: 'https://docs.github.com/en/copilot/concepts/completions/code-suggestions' },
  { title: 'About GitHub Copilot Chat', url: 'https://docs.github.com/en/copilot/concepts/chat' },
  { title: 'Quickstart for using GitHub Copilot in your IDE', url: 'https://docs.github.com/en/copilot/get-started/quickstart-for-using-github-copilot-in-your-ide' },
  { title: 'About GitHub Copilot cloud agent', url: 'https://docs.github.com/en/copilot/concepts/agents/cloud-agent/about-cloud-agent' },
  { title: 'Adding repository custom instructions for GitHub Copilot', url: 'https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/add-custom-instructions/add-repository-instructions' },
  { title: 'Using the GitHub MCP Server in your IDE', url: 'https://docs.github.com/en/copilot/how-tos/copilot-in-your-ide/copilot-for-common-tasks/use-the-github-mcp-server' },
  { title: 'Content exclusion for GitHub Copilot', url: 'https://docs.github.com/en/copilot/concepts/security-governance-and-network-settings/content-exclusion' },
];
