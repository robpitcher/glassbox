// Single source of truth for the Copilot request lifecycle visual.
// Behavior follows GitHub Docs: Copilot policies, model access, managed settings, and usage-based billing budgets.
// Gates 1–4 are a conceptual order; only the budget checks have a documented sequence.

export type GateId = 'seat' | 'client' | 'policy' | 'model' | 'budget';

export type ScenarioId = 'served' | 'client' | 'policy' | 'model' | 'budget';

/** Where a gate is enforced: on GitHub, or by the Copilot client on the device. */
export type Enforcer = 'github' | 'client';

export interface Gate {
  id: GateId;
  name: string;
  sub: string;
  owners: string[];
  enforcer: Enforcer;
  lead: string;
  text: string;
}

export interface Scenario {
  id: ScenarioId;
  label: string;
  who: 'mona' | 'kai' | 'ray';
  ask: string;
  /** Gate that stops the request; null when it's served. */
  stop: GateId | null;
  outcome: string;
  lead: string;
  text: string;
}

export const GATES: Gate[] = [
  {
    id: 'seat',
    name: 'Seat',
    sub: 'Who licenses the user',
    owners: ['Enterprise', 'Org'],
    enforcer: 'github',
    lead: 'Seat:',
    text: 'the enterprise or organization that grants the Copilot license decides whose policies apply to the user.',
  },
  {
    id: 'client',
    name: 'Client settings',
    sub: 'managed-settings.json',
    owners: ['Enterprise', 'Device admin'],
    enforcer: 'client',
    lead: 'Client settings:',
    text: 'if deployed, managed settings make supported clients enforce rules such as MCP allowlists, tool permissions, and sandboxing.',
  },
  {
    id: 'policy',
    name: 'Feature policy',
    sub: 'Enabled, disabled, or delegated',
    owners: ['Enterprise', 'Org'],
    enforcer: 'github',
    lead: 'Feature policy:',
    text: 'the enterprise enables or disables each feature, or lets organizations decide.',
  },
  {
    id: 'model',
    name: 'Model access',
    sub: 'Model policies',
    owners: ['Enterprise', 'Org'],
    enforcer: 'github',
    lead: 'Model access:',
    text: 'each model is enabled, disabled, or follows the default availability policy; preview models start disabled.',
  },
  {
    id: 'budget',
    name: 'Credits and budgets',
    sub: 'Pool, paid usage, budgets if set',
    owners: ['Enterprise', 'Org', 'Billing manager'],
    enforcer: 'github',
    lead: 'Credits and budgets:',
    text: 'AI-credit usage draws on the included pool, then paid usage, unless a user-level budget or a hard spending limit stops it.',
  },
];

export const SCENARIOS: Scenario[] = [
  {
    id: 'served',
    label: 'Served',
    who: 'mona',
    ask: 'Chat in VS Code, enabled model',
    stop: null,
    outcome: 'Served',
    lead: 'Served:',
    text: 'mona’s seat comes from acme-web, Chat and the model are enabled, and the pool still has AI credits, so the request runs.',
  },
  {
    id: 'client',
    label: 'Client',
    who: 'mona',
    ask: 'Agent starts an unlisted MCP server',
    stop: 'client',
    outcome: 'Blocked on the device',
    lead: 'Blocked by client settings:',
    text: 'the server isn’t in allowedMcpServers, so the client refuses to start it.',
  },
  {
    id: 'policy',
    label: 'Policy',
    who: 'kai',
    ask: 'Copilot CLI',
    stop: 'policy',
    outcome: 'Feature disabled',
    lead: 'Blocked by feature policy:',
    text: 'the enterprise let organizations decide, and acme-web, which licenses kai, disabled Copilot CLI.',
  },
  {
    id: 'model',
    label: 'Model',
    who: 'kai',
    ask: 'Chat with a preview model',
    stop: 'model',
    outcome: 'Model not offered',
    lead: 'Blocked by model access:',
    text: 'preview models stay disabled until an owner enables them, so kai can’t pick it.',
  },
  {
    id: 'budget',
    label: 'Budget',
    who: 'ray',
    ask: 'Chat after his budget runs out',
    stop: 'budget',
    outcome: 'Blocked until reset',
    lead: 'Blocked by a user-level budget:',
    text: 'ray spent his user-level budget, which always stops usage; inline completions still work because they use no AI credits.',
  },
];

export const LEGEND: Record<Enforcer, string> = {
  github: 'Enforced by GitHub',
  client: 'Enforced by the client',
};

export const LABELS = {
  request: 'Request',
  hint: 'Select a gate for detail',
  gate: 'Gate',
  setBy: 'Set by',
  passed: 'passed',
  stopped: 'stopped the request',
  notReached: 'not reached',
} as const;

export function stopIndex(s: Scenario): number {
  return s.stop ? GATES.findIndex((g) => g.id === s.stop) : GATES.length;
}
