// Single source of truth for the Copilot policy scope visual.
// Behavior follows GitHub Docs for GitHub.com / GitHub Enterprise Cloud:
// copilot/concepts/enterprise/policies and copilot/reference/enterprise-administrators/policy-conflicts.

export type EnterpriseState = 'orgs' | 'on' | 'off';
export type PolicyId = 'cli' | 'code';
export type OrgId = 'acme-web' | 'acme-data';
export type PersonId = 'mona' | 'kai' | 'ray';
/** Who decided a person's result. */
export type Decider = 'enterprise' | OrgId | 'assigned';

export const ENTERPRISE = { name: 'Acme' } as const;
export const ORGS: OrgId[] = ['acme-web', 'acme-data'];

export interface Policy {
  label: string;
  /** Words for the permissive and restrictive values of this policy. */
  on: string;
  off: string;
  /** Rule that applies when a person's licensing organizations disagree. */
  rule: 'least' | 'most';
  ruleLabel: string;
}

export const POLICIES: Record<PolicyId, Policy> = {
  cli: { label: 'Copilot CLI', on: 'Enabled', off: 'Disabled', rule: 'least', ruleLabel: 'least restrictive org wins' },
  code: {
    label: 'Suggestions matching public code',
    on: 'Allowed',
    off: 'Blocked',
    rule: 'most',
    ruleLabel: 'most restrictive org wins',
  },
};

export const POLICY_SHORT: Record<PolicyId, string> = { cli: 'Copilot CLI', code: 'Public code matches' };

export const enterpriseOptions = (policy: PolicyId) =>
  [
    { id: 'orgs' as const, label: 'Let organizations decide' },
    { id: 'on' as const, label: POLICIES[policy].on },
    { id: 'off' as const, label: POLICIES[policy].off },
  ] satisfies { id: EnterpriseState; label: string }[];

/** Example organization choices: true is the permissive value. */
export const ORG_SETTING: Record<OrgId, boolean> = { 'acme-web': true, 'acme-data': false };

/** Example value of the "Policies for enterprise-assigned users" setting. */
export const ASSIGNED_SETTING = false;

export interface Person {
  id: PersonId;
  /** Where the Copilot license comes from. */
  licensedBy: OrgId[] | 'enterprise';
  source: string;
}

export const PEOPLE: Person[] = [
  { id: 'mona', licensedBy: ['acme-web'], source: 'Licensed by acme-web' },
  { id: 'kai', licensedBy: ['acme-web', 'acme-data'], source: 'Licensed by acme-web and acme-data' },
  { id: 'ray', licensedBy: 'enterprise', source: 'Licensed by Acme through an enterprise team' },
];

export const person = (id: PersonId) => PEOPLE.find((p) => p.id === id)!;
export const valueLabel = (policy: PolicyId, on: boolean) => (on ? POLICIES[policy].on : POLICIES[policy].off);

export interface Resolution {
  on: boolean;
  by: Decider[];
}

export function resolve(state: EnterpriseState, policy: PolicyId, id: PersonId): Resolution {
  if (state !== 'orgs') return { on: state === 'on', by: ['enterprise'] };
  const p = person(id);
  if (p.licensedBy === 'enterprise') return { on: ASSIGNED_SETTING, by: ['assigned'] };
  const values = p.licensedBy.map((o) => ORG_SETTING[o]);
  const on = POLICIES[policy].rule === 'least' ? values.some(Boolean) : values.every(Boolean);
  return { on, by: [...p.licensedBy] };
}

export const BOX_NOTES = {
  orgDelegated: 'Org owner’s choice',
  orgLocked: 'Ignored: Acme enforces',
  assigned: 'Policies for enterprise-assigned users',
} as const;

export interface Explanation {
  lead: string;
  text: string;
  note?: string;
}

export function explain(state: EnterpriseState, policy: PolicyId, sel: PersonId | null): Explanation {
  const pol = POLICIES[policy];
  if (!sel) {
    if (state === 'orgs') {
      return {
        lead: `${ENTERPRISE.name} lets organizations decide.`,
        text: 'Each organization sets its own value, and people follow the organization that licenses them.',
      };
    }
    const v = valueLabel(policy, state === 'on');
    return {
      lead: `${ENTERPRISE.name} enforces ${v}.`,
      text: `Every licensed user gets ${v}, and organizations can’t change it.`,
    };
  }

  const r = resolve(state, policy, sel);
  const lead = `${sel} gets ${valueLabel(policy, r.on)}.`;
  if (state !== 'orgs') {
    return { lead, text: `${ENTERPRISE.name} enforces the policy, so organization settings never apply.` };
  }
  const p = person(sel);
  if (p.licensedBy === 'enterprise') {
    return {
      lead,
      text: `His license comes straight from ${ENTERPRISE.name}, so “Let organizations decide” doesn’t reach him; the policies for enterprise-assigned users setting decides instead.`,
    };
  }
  if (p.licensedBy.length === 1) {
    return { lead, text: `${p.licensedBy[0]} is her only license source, so its setting applies.` };
  }
  return {
    lead,
    text: `Both organizations license ${sel} and they disagree, so for ${pol.label} the ${pol.rule} restrictive setting applies.`,
    note:
      pol.rule === 'least'
        ? 'Most Copilot policies use the least restrictive organization.'
        : 'A few sensitive policies, such as public code matches and the Copilot Metrics API, use the most restrictive organization.',
  };
}
