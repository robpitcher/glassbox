// Single source of truth for the Copilot access seat model visual.
// Behavior follows GitHub Docs for GitHub Enterprise Cloud ("What's changing with GitHub Enterprise and Copilot billing").

export type ModelId = 'access' | 'business';

export type PersonId = 'mona' | 'kai' | 'ray';

export type GroupId = 'acme-web' | 'enterprise-team';

export type ChipTone = 'ok' | 'warn' | 'plain';

export interface Chip {
  tone: ChipTone;
  text: string;
}

export interface Seat {
  price: string;
  unit: string;
  chips: Chip[];
}

export interface Group {
  id: GroupId;
  kind: 'org' | 'team';
  label: string;
  /** Shown only for organizations; the enterprise team stays unnamed. */
  name?: string;
  note: string;
  /** Category color token. */
  color: string;
  members: PersonId[];
}

export const ENTERPRISE = { name: 'Acme' } as const;

export const PEOPLE: Record<PersonId, { group: GroupId; ghec: boolean }> = {
  mona: { group: 'acme-web', ghec: true },
  kai: { group: 'acme-web', ghec: true },
  ray: { group: 'enterprise-team', ghec: false },
};

export const GROUPS: Group[] = [
  {
    id: 'acme-web',
    kind: 'org',
    label: 'GitHub org',
    name: 'acme-web',
    note: 'Org members use a GHEC license',
    color: 'var(--cc-0)',
    members: ['mona', 'kai'],
  },
  {
    id: 'enterprise-team',
    kind: 'team',
    label: 'Enterprise team',
    note: 'Not in any org, so no GHEC license',
    color: 'var(--cc-3)',
    members: ['ray'],
  },
];

export interface Model {
  label: string;
  pill: string;
  seat: (ghec: boolean) => Seat;
  seatTotal: string;
  /** Share of the same monthly usage covered by included credits, 0–100. */
  includedPct: number;
  usageNote: string;
  scope: string;
  lead: string;
  text: string;
}

const licenseChip = (ghec: boolean): Chip =>
  ghec ? { tone: 'ok', text: 'GHEC license' } : { tone: 'warn', text: 'No GHEC license' };

export const MODELS: Record<ModelId, Model> = {
  access: {
    label: 'Copilot access',
    pill: 'Copilot access',
    seat: (ghec) =>
      ghec
        ? { price: '$0', unit: 'via GHEC license', chips: [licenseChip(true), { tone: 'plain', text: 'No included credits' }] }
        : { price: '$10', unit: 'Copilot Standalone', chips: [licenseChip(false), { tone: 'plain', text: 'No included credits' }] },
    seatTotal: '$10',
    includedPct: 0,
    usageNote: 'metered from the first request',
    scope: 'One model for the whole enterprise: no Business or Enterprise seats in any org.',
    lead: 'Copilot access:',
    text: 'GHEC-licensed users get a $0 seat, others pay $10 for Standalone, and every request is billed against your budget.',
  },
  business: {
    label: 'Business / Enterprise',
    pill: 'Copilot Business',
    seat: (ghec) => ({
      price: '$19',
      unit: 'Copilot Business',
      chips: [licenseChip(ghec), { tone: 'ok', text: '+1,900 credits to pool' }],
    }),
    seatTotal: '$57',
    includedPct: 62,
    usageNote: '5,700 pooled credits first',
    scope: 'One model for the whole enterprise: Business and Enterprise seats can’t mix with Copilot access.',
    lead: 'Copilot Business:',
    text: 'every user pays the same seat price, and each seat adds credits to a shared pool before metered billing starts.',
  },
};

export const BILL = {
  label: 'Monthly bill · illustrative',
  seats: 'Seat charges',
  usage: 'Same AI usage',
  included: 'Covered by pooled credits',
  metered: 'Metered against budget',
} as const;

export function explain(model: ModelId, person: PersonId | null): { lead: string; text: string } {
  const m = MODELS[model];
  if (!person) return { lead: m.lead, text: m.text };
  if (model === 'business') {
    return { lead: person, text: 'pays the Business seat price whether or not they hold a GHEC license.' };
  }
  return PEOPLE[person].ghec
    ? {
        lead: person,
        text: 'is an acme-web member, so they use a GHEC license and an owner-assigned Copilot seat costs $0; usage is metered.',
      }
    : {
        lead: person,
        text: 'gets Copilot through an enterprise team without joining an org, so they have no GHEC license and use Copilot Standalone at $10 per month.',
      };
}
