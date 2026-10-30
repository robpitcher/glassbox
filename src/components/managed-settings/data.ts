// Single source of truth for the Copilot managed settings visuals.
// Behavior follows GitHub Docs: "Configure enterprise managed settings", its reference page,
// and "Copilot policies" (AI controls). Client support follows the docs' supported-keys table.

export interface Explain {
  lead: string;
  text: string;
}

/* 1. Two control planes */

export type RowId = 'where' | 'who' | 'what' | 'covers' | 'enforced';

export interface PlaneRow {
  id: RowId;
  label: string;
  policy: string;
  client: string;
  lead: string;
  text: string;
}

export const PLANES = {
  policy: { title: 'Server-side policy', sub: 'AI controls', color: 'var(--cc-0)' },
  client: { title: 'Client settings', sub: 'managed-settings.json', color: 'var(--cc-1)' },
} as const;

export const ROWS: PlaneRow[] = [
  {
    id: 'where',
    label: 'Where',
    policy: 'Enterprise and organization settings, AI controls tab',
    client: 'A JSON file in a .github-private repository, or pushed to devices',
    lead: 'Two different homes:',
    text: 'policies are settings in AI controls, while client settings are a JSON file that lives in a repository or on each device.',
  },
  {
    id: 'who',
    label: 'Who sets it',
    policy: 'Enterprise owners, organization owners, AI managers',
    client: 'Admins commit the repository copy; IT pushes device copies',
    lead: 'Different hands:',
    text: 'the device copy usually belongs to IT and your device-management process, not to the people who run Copilot policies.',
  },
  {
    id: 'what',
    label: 'Controls',
    policy: 'Which features, agents, and models users can use',
    client: 'How a client behaves: default model, permission rules, plugins, MCP servers, sandbox',
    lead: 'Availability vs behavior:',
    text: 'a policy can turn Copilot CLI off, but a client setting only shapes how Copilot CLI behaves once policy allows it.',
  },
  {
    id: 'covers',
    label: 'Covers',
    policy: 'Users who get Copilot from Acme or its organizations',
    client: 'Repository copy: Acme-licensed users. Device copy: anyone on that device',
    lead: 'Different reach:',
    text: 'device-delivered settings apply whatever the license source, so they also cover people whose Copilot license isn’t from Acme.',
  },
  {
    id: 'enforced',
    label: 'Enforced by',
    policy: 'GitHub, on the surfaces each policy supports',
    client: 'Each client, for the keys it supports',
    lead: 'Coverage varies:',
    text: 'not every policy applies on every surface, and not every client supports every key, so check the docs before you rely on one.',
  },
];

export const PLANES_DEFAULT: Explain = {
  lead: 'Two mechanisms, two jobs:',
  text: 'policy decides whether a feature or model is available, and managed-settings.json sets how supported clients behave inside that.',
};

export function explainRow(id: RowId | null): Explain {
  const row = ROWS.find((r) => r.id === id);
  return row ? { lead: row.lead, text: row.text } : PLANES_DEFAULT;
}

/* 2. Where the file lives */

export type DeliveryId = 'server' | 'mdm' | 'file';

export const CLIENTS = ['Copilot CLI', 'VS Code', 'Copilot app', 'JetBrains', 'Copilot in the cloud'] as const;
export const CLOUD_CLIENT = 'Copilot in the cloud';

export interface Step {
  label: string;
  /** Monospace paths, shown one per line. */
  paths?: string[];
  /** Plain headline when there are no paths. */
  value?: string;
  /** Which clients the step reaches; only on the "Reaches" step. */
  reach?: 'all' | 'local';
  note: string;
  explain: string;
}

export interface Person {
  name: string;
  detail: string;
  covered: boolean;
}

export interface Delivery {
  label: string;
  steps: Step[];
  people: Person[];
  lead: string;
  text: string;
}

export const EXAMPLE = { label: 'Example', json: '{ "model": "auto" }', reaches: 'Reaches' } as const;

const mona = (covered: boolean): Person => ({ name: 'mona', detail: 'Acme license', covered });
const contractor = (covered: boolean): Person => ({ name: 'contractor', detail: 'own license, Acme device', covered });

export const DELIVERY: Record<DeliveryId, Delivery> = {
  server: {
    label: 'Repo',
    steps: [
      {
        label: 'Lives in',
        paths: ['.github-private'],
        note: 'A repo in the organization chosen in AI controls.',
        explain: 'the file is copilot/managed-settings.json in the .github-private repository of the organization you select in AI controls, such as acme-web; GitHub recommends internal visibility and admin-only edits.',
      },
      {
        label: 'Deployed by',
        value: 'A commit to the default branch',
        note: 'Check it with the validator in AI controls.',
        explain: 'admins and AI managers commit changes, and the Copilot settings validation tool on the Agents tab checks the file.',
      },
      {
        label: 'Reaches',
        reach: 'all',
        note: 'Every supported client, cloud included.',
        explain: 'this is the only method that also reaches Copilot in the cloud, because the settings follow the signed-in account rather than a device.',
      },
      {
        label: 'Applies to',
        value: 'Acme-licensed users',
        note: 'Enterprise teams can get overrides.',
        explain: 'only users who get Copilot from Acme or one of its organizations; mark a key overridable to give an enterprise team its own value.',
      },
      {
        label: 'Picks up changes',
        value: 'Within about an hour',
        note: 'Restart or sign in again to refresh now.',
        explain: 'clients refresh within about an hour; restarting the client or signing in again picks up changes right away.',
      },
    ],
    people: [mona(true), contractor(false)],
    lead: 'Server-managed:',
    text: 'reviewable in git and reaches every supported client, but only for users whose Copilot license comes from Acme.',
  },
  mdm: {
    label: 'MDM',
    steps: [
      {
        label: 'Lives in',
        paths: ['HKLM\\SOFTWARE\\Policies\\GitHubCopilot', 'com.github.copilot'],
        note: 'Windows registry or macOS managed preferences. No Linux.',
        explain: 'Windows reads string values under the GitHubCopilot policies key, and macOS reads managed preferences for the com.github.copilot domain; Linux isn’t supported.',
      },
      {
        label: 'Deployed by',
        value: 'Your MDM platform',
        note: 'For example Intune, Jamf, or Group Policy.',
        explain: 'IT pushes each key as a string value with a dot-separated name, using the same tools that already manage your devices.',
      },
      {
        label: 'Reaches',
        reach: 'local',
        note: 'Local clients on that device only.',
        explain: 'settings are read from the device, so they reach local clients but never Copilot in the cloud.',
      },
      {
        label: 'Applies to',
        value: 'Anyone on the device',
        note: 'Whatever the license source.',
        explain: 'device settings apply however the person signs in, including people whose Copilot license isn’t from Acme.',
      },
      {
        label: 'Picks up changes',
        value: 'About hourly, no restart',
        note: 'Or force a check in VS Code.',
        explain: 'clients check about every hour without a restart; in VS Code, the Developer: Sync Account Policy command checks now.',
      },
    ],
    people: [mona(true), contractor(true)],
    lead: 'MDM:',
    text: 'the highest-precedence method; IT pushes the same keys as OS policy, and they apply to everyone on the device.',
  },
  file: {
    label: 'File',
    steps: [
      {
        label: 'Lives in',
        paths: ['%ProgramFiles%\\GitHubCopilot\\', '/etc/github-copilot/'],
        note: 'On macOS: /Library/Application Support/GitHubCopilot/.',
        explain: 'a managed-settings.json file at a fixed path on each operating system, including Linux.',
      },
      {
        label: 'Deployed by',
        value: 'Config management or an image',
        note: 'Works in containers and Codespaces.',
        explain: 'tools such as Chef, Puppet, or Ansible place the file, or you bake it into a container or Codespaces image.',
      },
      {
        label: 'Reaches',
        reach: 'local',
        note: 'Local clients on that device only.',
        explain: 'like MDM, a file on the device reaches local clients but not Copilot in the cloud.',
      },
      {
        label: 'Applies to',
        value: 'Anyone on the device',
        note: 'Whatever the license source.',
        explain: 'the file applies however the person signs in; devices without the file aren’t covered.',
      },
      {
        label: 'Picks up changes',
        value: 'On client restart',
        note: 'CLI on macOS and Linux needs a root-owned file.',
        explain: 'clients load the file when they start; Copilot CLI on macOS and Linux ignores it unless it’s root-owned, not group- or world-writable, and not a symlink.',
      },
    ],
    people: [mona(true), contractor(true)],
    lead: 'File-based:',
    text: 'the lowest-precedence managed method, but it also works on Linux and in containers and Codespaces.',
  },
};

export const DELIVERY_ORDER: DeliveryId[] = ['server', 'mdm', 'file'];

export function explainStep(delivery: DeliveryId, step: number | null): Explain {
  const d = DELIVERY[delivery];
  if (step === null) return { lead: d.lead, text: d.text };
  return { lead: `${d.steps[step].label}:`, text: d.steps[step].explain };
}

/* 3. What wins */

export type KeyId = 'model' | 'computerUse' | 'deny';

export const LAYERS = ['MDM', 'Server-managed', 'File-based', 'User settings'] as const;

export type Outcome = 'wins' | 'applies' | 'overridden' | 'unset';

export interface LayerValue {
  value: string | null;
  /** Render as code (a JSON value) or plain words. */
  code: boolean;
  outcome: Outcome;
  explain: string;
}

export interface KeyCase {
  label: string;
  key: string;
  clients: string;
  gate: { title: string; text: string };
  layers: LayerValue[];
  tag: { text: string; tone: 'ok' | 'bad' };
  result: string;
  resultCode: boolean;
  lead: string;
  text: string;
}

const unset = (explain: string): LayerValue => ({ value: null, code: false, outcome: 'unset', explain });

export const OUTCOME_LABEL: Record<Outcome, string> = {
  wins: 'Wins',
  applies: 'Applies',
  overridden: 'Overridden',
  unset: 'Not set',
};

export const STACK_LABELS = {
  policy: 'Server-side policy',
  clients: 'Supported in',
  result: 'Result',
} as const;

export const KEYS: Record<KeyId, KeyCase> = {
  model: {
    label: 'model',
    key: 'model',
    clients: 'All clients except JetBrains',
    gate: { title: 'Model policies', text: 'Only models enabled in AI controls can be used, whatever the default says.' },
    layers: [
      unset('MDM doesn’t set a default model in this example, so the next source down decides.'),
      {
        value: '"auto"',
        code: true,
        outcome: 'wins',
        explain: 'the highest source that sets model, so new conversations start on auto, which picks from the models Acme allows.',
      },
      unset('no file on this device sets model.'),
      {
        value: 'a model mona picked',
        code: false,
        outcome: 'overridden',
        explain: 'mona’s own default loses to the managed value, but she can still switch models inside each conversation.',
      },
    ],
    tag: { text: 'Default only', tone: 'ok' },
    result: 'New conversations start on auto. mona can still pick another allowed model per conversation.',
    resultCode: false,
    lead: 'model sets a default, not a lock:',
    text: 'the managed value beats the user’s setting, but users can still choose another allowed model in each conversation.',
  },
  computerUse: {
    label: 'computerUse',
    key: 'features.computerUse',
    clients: 'Copilot CLI and the Copilot app',
    gate: { title: 'Client policies', text: 'If a policy turns the client off, this key never comes into play.' },
    layers: [
      unset('MDM doesn’t set this key in this example.'),
      {
        value: 'false',
        code: true,
        outcome: 'wins',
        explain: 'the highest source that sets the key, and false can’t be overridden locally.',
      },
      unset('no file on this device sets this key.'),
      {
        value: 'true',
        code: true,
        outcome: 'overridden',
        explain: 'mona turned computer use on locally, but the managed false wins.',
      },
    ],
    tag: { text: 'Locked off', tone: 'bad' },
    result: 'Computer use stays off in Copilot CLI and the Copilot app. A local setting can’t turn it back on.',
    resultCode: false,
    lead: 'features.computerUse can lock:',
    text: 'set to false, it keeps computer use off in Copilot CLI and the Copilot app, whatever the user’s local setting says.',
  },
  deny: {
    label: 'deny',
    key: 'permissions.deny',
    clients: 'CLI, VS Code, the app, and the cloud sandbox',
    gate: { title: 'Agent policies', text: 'Policy decides whether agents are available; deny rules limit what they may do.' },
    layers: [
      { value: 'Shell(rm -rf *)', code: true, outcome: 'applies', explain: 'the MDM deny rule stays in force alongside the others.' },
      { value: 'Read(~/.ssh/**)', code: true, outcome: 'applies', explain: 'the server-managed rule is added, not replaced.' },
      { value: 'Edit(//etc/**)', code: true, outcome: 'applies', explain: 'even the lowest managed method still adds its rule.' },
      unset('mona hasn’t added deny rules in this example.'),
    ],
    tag: { text: 'Combined', tone: 'ok' },
    result: 'Shell(rm -rf *) + Read(~/.ssh/**) + Edit(//etc/**)',
    resultCode: true,
    lead: 'permissions.deny combines:',
    text: 'permission rules and sandbox settings combine in the most restrictive direction across delivery methods, instead of the top method winning.',
  },
};

export const KEY_ORDER: KeyId[] = ['model', 'computerUse', 'deny'];

export function explainLayer(key: KeyId, layer: number | null): Explain {
  const k = KEYS[key];
  if (layer === null) return { lead: k.lead, text: k.text };
  return { lead: `${LAYERS[layer]}:`, text: k.layers[layer].explain };
}
