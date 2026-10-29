# Foundations of GitHub Copilot Administration — Presenter Runbook

**Audience:** GitHub enterprise and organization administrators
**Length:** 60 minutes (50 minutes of content, with 10 minutes protected for Q&A)
**Format:** Demo-led, with brief visual aids for abstract concepts
**Documentation checked:** 2026-10-29. GitHub product behavior and labels can change; recheck linked docs before each delivery.

> **Presenter note:** Replace the `<placeholders>` with details for the demo environment. Do not make live policy or budget changes in production. Keep the approved outline and protect the final 10 minutes for questions.

## Workshop at a glance

### Learning outcomes

By the end of the session, attendees can:

1. Explain where Copilot controls live and how enterprise and organization policy decisions interact.
2. Find the main Copilot policies for access, features, models, and agents.
3. Describe what `managed-settings.json` controls, how it differs from GitHub AI controls, and how to verify its effect.
4. Explain AI credits, the purpose of budget layers, and where to inspect usage.
5. Apply a short administrative checklist to a new Copilot rollout.

### Storyline

Use one scenario throughout: **“Your company is rolling Copilot out to a new engineering group. You need to establish guardrails, standardize client behavior, and keep spend predictable.”**

### Timing

| Time | Segment | Mode |
|---|---|---|
| 0:00–0:05 | 1. Admin mental model | Visual + framing |
| 0:05–0:20 | 2. AI controls and governance | Live demo |
| 0:20–0:33 | 3. Client configuration with `managed-settings.json` | Prepared file + client demo |
| 0:33–0:47 | 4. Budgets and administrative considerations | Visual + live demo |
| 0:47–0:50 | 5. Recap and rollout checklist | Presenter-led |
| 0:50–1:00 | Q&A | Protected |

**If you run long:** trim Segment 2’s agent/MCP walkthrough, then use the prepared before/after evidence for Segment 3. Do not take time from Q&A.

## Pre-session checklist

### Access and environment

- [ ] Demo GitHub Enterprise Cloud enterprise: `<enterprise slug>`.
- [ ] Demo organization(s): `<organization slug(s)>`; note which settings are enterprise-controlled and which are delegated.
- [ ] Confirm the presenter has the required enterprise-owner or AI-controls permissions, organization-owner access where needed, and billing access for the planned demos.
- [ ] Copilot plan and seat source for the demo user: `<Copilot Business / Copilot Enterprise / other eligible plan>`; confirm the user is licensed through the intended enterprise or organization.
- [ ] Test user signed in to a supported client. Record client, version, operating system, and account used: `<details>`.
- [ ] A non-production budget can be created and removed safely. Do not use a production billing entity.
- [ ] Populate the demo usage view in advance; usage data may not be available immediately.

### Prepare the demo

- [ ] Prepare the `managed-settings.json` example in Segment 3 and a client state that visibly demonstrates the setting before and after.
- [ ] For server-managed settings, confirm the enterprise’s selected source organization and `.github-private` repository. Do not switch a live enterprise’s source organization just for a demo.
- [ ] If using a local file or MDM, prepare a demo device and verify its policy location for that operating system.
- [ ] Record the original value of every policy or budget you will change; prepare the exact reset action.
- [ ] Capture fallback screenshots of the enterprise controls, client behavior, and populated AI usage page.
- [ ] Open browser tabs in this order: hierarchy visual → enterprise AI controls → organization policies → managed settings reference/file → client → billing visual → AI usage/budgets → audit log.
- [ ] Increase browser zoom to 125–150%; silence notifications and close personal tabs.
- [ ] Fill in environment notes before presenting:

| Detail | Presenter value |
|---|---|
| Enterprise | `<enterprise slug>` |
| Source organization and private repository | `<org> / .github-private` or `<not applicable>` |
| Target organization/team | `<org/team>` |
| Demo user and seat source | `<test account> / <enterprise or org>` |
| Client, version, and OS | `<client> / <version> / <OS>` |
| Budget scope and cleanup owner | `<scope> / <name>` |

## Segment 1 — Admin mental model (0:00–0:05)

**Key point:** Choose the level that owns each decision before changing a setting.

**🖼️ Visual:** Enterprise hierarchy — show the existing [account and enterprise hierarchy page](../src/content/topics/github/account-enterprise-hierarchy.mdx). Keep the explanation to enterprise → organizations → teams and repositories → people.

### Demo / presenter path

1. Open the hierarchy visual and point to the enterprise and its organizations.
2. Switch to the admin view only if it is already open; do not spend this segment navigating.
3. Introduce the control planes that the next sections will demonstrate.

### Talking points

- An enterprise owns organizations; organizations own repositories and teams; users are members, not children.
- Enterprise owners can set Copilot policies for the enterprise or delegate policy decisions to organizations where the policy supports delegation.
- A user’s Copilot policies generally follow the enterprise or organization that provides their Copilot license. If a user has licenses from multiple organizations or enterprises, policy-conflict rules can apply; do not reduce this to “enterprise always wins.”
- **GitHub AI controls** govern the availability of Copilot features, agents, and models on supported surfaces.
- **Enterprise-managed settings** standardize supported client behavior. They are a separate control plane, not a replacement for AI controls.
- The rule for the rest of the hour: *first decide who owns the decision, then decide the value.*

### Likely question

**Does the enterprise setting always win?** Enterprise policy can be enforced or delegated. For multiple licenses, organization policies may combine using the least- or most-restrictive rule depending on the policy. Check the policy-conflict reference for the exact policy.

**Fallback:** Show the static hierarchy page and use the policy-conflict source in the appendix.
**Transition:** “Let’s start where most governance decisions begin — the enterprise’s AI controls.”

## Segment 2 — AI controls and governance (0:05–0:20)

**Key point:** Apply non-negotiable guardrails centrally; delegate only the decisions the organization is ready to own.

**🖼️ Visual:** Policy precedence — briefly return to the hierarchy visual to show enterprise and organization as distinct decision points. Avoid implying one universal conflict rule.

### Demo click path

1. Open the demo enterprise on GitHub.com and select **AI controls**.
2. In the sidebar, select **Copilot**. Under **Features & clients**, select **Configure features & clients**.
3. Show one representative feature/client policy and its available policy states. Use **Agents** and **MCP** from the AI controls sidebar only if those policies are in scope for the demo.
4. Open model policies from the AI controls page. Show one example of a model explicitly configured versus one that follows the default availability policy, if the demo tenant has both.
5. Open the organization’s settings and show one delegated setting. Verify the organization page and exact control state in the demo tenant before presenting; a policy set by the enterprise is not necessarily editable by the organization.
6. Open the enterprise **Settings** tab, then **Audit log**. Search `action:copilot` to find Copilot plan and policy activity.

### Talking points

- Enterprise administrators can set a policy or let organizations decide when that state is available. An organization cannot override an enterprise-enforced decision.
- For a user with licenses from multiple organizations, the least restrictive setting generally applies, with exceptions for sensitive policies. Policies across multiple enterprises generally use the most restrictive setting, also with exceptions.
- Default-availability policies affect unconfigured generally available features and models. They are separate from explicitly configuring each feature/model.
- Choose a small set of demonstrable controls: one surface or feature, one model, and—if relevant—an agent or MCP control. Do not tour every toggle.
- Copilot audit logs record Copilot plan changes such as policy changes and seat changes, plus agent activity on GitHub.com. They do **not** contain users’ local prompts or local client session data.
- Enterprise audit logs retain 180 days; streaming to a SIEM is the route for longer retention and alerting.

### Likely questions

- **Can an organization turn on a feature the enterprise disabled?** Not when the enterprise has enforced the setting. If enterprise policy delegates the decision, organization policy and the relevant conflict rule determine access.
- **Does the audit log let us read prompts?** No. It records administrative changes and agent activity on GitHub.com, not local Copilot session prompts.
- **Should all new models and features be disabled by default?** That is a governance choice. Review the default-availability policy and explicitly restrict only what the organization needs to restrict.

**Fallback:** Use the pre-captured AI controls and audit log images. For policy conflict examples, use the policy-conflict documentation rather than inferring behavior from one user’s setup.
**Transition:** “Policies define what is available. Next, let’s standardize supported behavior inside Copilot clients.”

## Segment 3 — Client configuration with `managed-settings.json` (0:20–0:33)

**Key point:** GitHub policies and enterprise-managed client settings solve different problems; use the right mechanism for each requirement.

**🖼️ Visual:** Server policy vs. client settings — use the separately prepared visual aid; no new visual component is part of this runbook.

### Talking points (≈4 min)

- `managed-settings.json` is an enterprise-managed settings schema for supported Copilot clients. Supported clients include Copilot CLI, VS Code, the GitHub Copilot app, Copilot in the cloud, and JetBrains IDEs, but **not every client supports every key**. Check the key-by-client support matrix before rollout.
- Use it for supported client behavior such as default model, permission controls, approved plugins/marketplaces, MCP server restrictions, sandbox configuration, or telemetry. The available keys and their client coverage change; do not treat this list as universal.
- Server-managed settings live at `copilot/managed-settings.json` in the selected organization’s `.github-private` repository. They apply to users licensed through the enterprise or one of its organizations.
- File-based locations are:

| OS | `managed-settings.json` location |
|---|---|
| macOS | `/Library/Application Support/GitHubCopilot/managed-settings.json` |
| Windows | `%ProgramFiles%\GitHubCopilot\managed-settings.json` |
| Linux | `/etc/github-copilot/managed-settings.json` |

- Native MDM is supported on Windows and macOS: Windows uses string values under `HKEY_LOCAL_MACHINE\SOFTWARE\Policies\GitHubCopilot`; macOS uses forced managed preferences in the `com.github.copilot` domain. Native MDM is not supported on Linux.
- When sources overlap, precedence is MDM → server-managed → file-based → user-level settings. `sandbox` and `permissions.deny`, `permissions.ask`, and `permissions.allow` compose in the most restrictive direction across sources.
- Server-managed updates apply automatically within about an hour; restarting or signing in again triggers an immediate refresh. File-based settings are loaded when supported clients restart. MDM policies are checked periodically; VS Code also has **Developer: Sync Account Policy** for testing.
- Server-managed settings require the Copilot license to come from the enterprise or one of its organizations. MDM and file-based settings apply to the local client regardless of where the user’s Copilot license comes from.

### Demo flow (≈7 min): prepared before/after, not a fleet rollout

1. Open the prepared JSON file and explain the sample setting.
2. For server-managed delivery, show the selected source repository and `copilot/managed-settings.json`; for device delivery, show the prepared location or a screenshot.
3. In the client, show the before/after behavior for the selected supported key.
4. Explain how the source precedence and refresh behavior affect the demo. Do not deploy to or modify a live fleet.

**Sample file:** This is the documented minimal example for making `auto` the default model for new conversations. Before using it, check the key’s current coverage for the specific demo client.

```json
{
  "model": "auto"
}
```

### Likely questions

- **What if a user changes their local setting?** A managed value takes precedence over user-level settings for supported keys, subject to the source-precedence rules.
- **Does this apply to personal or unlicensed users?** Server-managed settings apply to users whose Copilot license is issued by the enterprise or one of its organizations. Device-delivered settings are local and can apply regardless of the account’s license source.
- **Can I use the same JSON for every client?** The schema is shared, but key support is client-specific. Verify the reference matrix and required client versions before rollout.

**Fallback:** Show the prepared before/after screenshots and the linked key-support matrix. Do not troubleshoot a fleet deployment during the workshop.
**Transition:** “Now that we’ve covered guardrails and client behavior, let’s make the cost controls understandable.”

## Segment 4 — Budgets and administrative considerations (0:33–0:47)

**Key point:** Separate seat assignment, included AI credits, and metered spend; use budgets that match the limit you intend to enforce.

**🖼️ Visual:** Budget hierarchy — show the existing [Copilot usage-based billing page](../src/content/topics/github/copilot-usage-billing.mdx) to distinguish seats, pooled credits, and budget layers. Explain that exact pool boundaries depend on the billing entity/plan.

### Demo / click path

1. Open the enterprise’s **Billing & Licensing** settings, then **Usage**. Under metered usage, show **AI usage**. The query `product:copilot` can filter metered usage. Use a pre-populated demo period.
2. Show the AI credits policy in enterprise **AI controls**. **AI credits paid usage** controls whether usage beyond included credits can continue as paid usage; confirm the policy state in this tenant.
3. Open the prepared budget page: `<preflight the current enterprise budget-management path and permission in this tenant>`. Show the intended budget scope and whether **Stop usage when budget limit is reached** is selected. If safe, create the preplanned demo budget and remove it afterward.
4. Show the prepared cost center or organization attribution in AI usage, if available. Do not create a cost center live unless it was prepared and is safe to remove.

### What to explain (≈4 min)

- Copilot Business includes 1,900 AI credits per license per month; Copilot Enterprise includes 3,900 per license per month. Each AI credit is $0.01 USD. Confirm plan and current values in the linked billing docs before the session.
- For Business and Enterprise, included credits are pooled at the billing entity level and reset monthly; they do not roll over. Usage beyond the pool is separately metered when paid usage is allowed.
- Inline code completions and next edit suggestions do not consume AI credits.
- Budget layers have different jobs:

| Control | What it limits | Enforcement detail |
|---|---|---|
| User-level budget | One user’s total AI-credit consumption, including included-pool use | Always a hard stop |
| Cost-center user-level budget | Each member’s individual consumption within that cost center | Overrides the universal user budget for those members |
| Cost-center / enterprise spending limit | Metered charges for a group or the enterprise | Applies after the shared included pool is exhausted; enable **Stop usage when budget limit is reached** to block further metered usage |
| Organization budget | Metered charges attributable to users whose seats are billed to that organization | May overlap other controls; understand the billed organization and avoid unexpected blocks |

- A cost-center budget does not cap that group’s draw from the included pool. Cost-center included-usage controls are a separate mechanism.
- Without the stop option, a spending limit is an alert/notification threshold, not a hard cap. User-level budgets always stop usage when the user reaches the limit.
- Cost centers help map spend to groups; they do not replace enterprise-wide budget ownership or a review process.

### Administrative cadence (≈3 min)

- **Seat management:** agree who may assign seats; periodically review inactive seats and the correct billing organization.
- **Ownership:** assign named owners for AI policies, managed settings, client support, and billing.
- **Attribution:** establish cost centers and budget owners before broad rollout.
- **Review cadence:** review AI-credit usage and budgets monthly; revisit models, features, seat activity, and policy drift on a schedule suited to the organization.
- **Communication:** tell users what happens when they reach a budget and how to request a temporary exception.

### Likely questions

- **What happens when a budget is reached?** A user-level budget always blocks that user’s AI-credit-consuming features. A spending limit blocks metered use only when its stop option is enabled. The included pool, applicable budget, and policy state determine the outcome.
- **Do completions consume AI credits?** No. Inline completions and next edit suggestions remain available even if a user’s AI-credit budget is exhausted.
- **Does a cost-center budget limit the included pool?** No. A cost-center spending budget limits metered charges after the shared pool is exhausted; included-usage controls are separate.

**Fallback:** Use the billing visual and a screenshot of a populated AI usage page. Explain the budget distinction using the table above rather than creating a live budget.
**Transition:** “Let’s finish the planned content with a short checklist, then keep the remaining ten minutes for your questions.”

## Segment 5 — Recap and rollout checklist (0:47–0:50)

**Key point:** Treat Copilot administration as a managed rollout with named owners, tested controls, and a review cadence.

### Presenter checklist

1. Decide which policy decisions are enterprise-owned and which can be delegated.
2. Set explicit policies for required features, models, and agent surfaces; review default availability.
3. Select the client-managed-settings deployment method and pilot the keys on supported clients.
4. Set budgets before rollout; distinguish user hard stops from metered-spend limits.
5. Assign seats and establish cost-center attribution and control owners.
6. Review policy changes, AI-credit usage, budgets, and seat activity on a defined cadence.

### Likely question

**What should we do first?** Inventory the plan, license source, current policy owners, supported clients, and intended spend limits; pilot one group before expanding.

**Fallback:** Read the six actions from the checklist.
**Transition:** “That’s the planned content. Let’s use the remaining ten minutes for your questions.”

## Q&A (0:50–1:00)

Protect these ten minutes. Seed discussion only if needed:

- “Which policy would you enforce first, and which would you delegate?”
- “Who owns the cost of Copilot in your organization?”
- “Would server-managed settings, MDM, or a local file best fit your client fleet?”
- “What data would you review monthly to decide whether the rollout is working?”

For unresolved questions, record the question, an owner, and a follow-up date: `<capture location>`.

## Q&A bank

**Does an enterprise policy always override organization policy?**

An enterprise can enforce a setting or delegate to organizations. For users with multiple licenses, most policies follow the least-restrictive organization rule, with documented exceptions; across multiple enterprises, the most restrictive rule usually applies, also with exceptions. Check the policy-conflict reference for the specific feature.

**Can administrators use audit logs to inspect local prompts?**

No. Enterprise Copilot audit logs show plan changes such as policies and licenses, plus agent activity on GitHub.com. They do not include local client session prompts. Audit log history is retained for 180 days; streaming can support longer retention.

**Will a managed settings file control every Copilot client and every key?**

No. Supported clients do not all support every setting. Check the official key-by-client matrix and client-version requirements for the exact configuration.

**What happens if server-managed settings cannot be fetched?**

Behavior depends on the client and whether a cached response exists. In Copilot CLI, if the server request fails and no cached response is available, server-managed policy is unavailable for that session. For restrictions that must remain available without a server response, consider device-delivered controls and validate the specific client behavior.

**Do Copilot seats and AI credits mean the same thing?**

No. A seat is a license assigned to a user. Business and Enterprise seats contribute included AI credits to a shared pool at the billing-entity level. Metered use and budgets are separate from the per-seat license charge.

**What is the difference between a user budget and an enterprise spending limit?**

A user-level budget caps one person’s total AI-credit consumption and always hard-stops that user. An enterprise spending limit controls metered charges after the included pool is exhausted; it only blocks usage if **Stop usage when budget limit is reached** is enabled.

**Do inline completions stop when the AI-credit budget is exhausted?**

No. Inline code completions and next edit suggestions do not consume AI credits and remain available at a zero-dollar user budget or enforced spending limit.

**How do we allocate spend to a team or business unit?**

Use cost centers for group attribution and cost controls; confirm how members are assigned and which billing entity/organization is charged. Review the organization and cost-center columns in usage reports against the actual license source.

## Demo fallbacks

| Risk | Fallback |
|---|---|
| Login, SSO, or network failure | Use the captured screenshot sequence for the affected segment. |
| Policy propagation delay | Show the saved setting and the prepared client result; explain expected refresh timing. |
| Managed settings do not appear in the client | Show the JSON, deployment source, support matrix, and before/after screenshots. |
| Billing data is empty or delayed | Use the billing visual and a screenshot of a populated AI usage page. |
| Budget permissions or UI differ | Do not improvise or create a different budget; use the prepared screenshot and mark the page path for follow-up. |
| Time pressure | Skip optional agent/MCP detail; preserve the protected Q&A block. |

## Post-session reset

- [ ] Restore each changed enterprise and organization policy to its recorded original value.
- [ ] Revert the demo commit or remove the test settings from the selected source repository; verify that the intended managed-settings file is restored.
- [ ] Remove demo budgets and cost-center test data that were created for the session.
- [ ] Confirm that production policies and billing controls were not changed.
- [ ] Sign out test users and clear presenter notes from shared screens.
- [ ] Assign owners and dates to unanswered questions.

## Appendix: documentation and visual aids

Recheck these official sources before delivery. The most useful client detail is the current supported-keys-by-client table; do not substitute a remembered list.

### Copilot governance

- [GitHub Copilot policies for enterprises and organizations](https://docs.github.com/en/copilot/concepts/enterprise/policies)
- [Managing policies and features for GitHub Copilot in your enterprise](https://docs.github.com/en/copilot/how-tos/administer-copilot/manage-for-enterprise/manage-enterprise-policies)
- [Feature availability when GitHub Copilot policies conflict in organizations](https://docs.github.com/en/copilot/reference/enterprise-administrators/policy-conflicts)
- [About default availability of Copilot features and models](https://docs.github.com/en/copilot/concepts/enterprise/default-availability)
- [Reviewing audit logs for GitHub Copilot](https://docs.github.com/en/copilot/how-tos/administer-copilot/manage-for-enterprise/review-audit-logs)

### Enterprise-managed client settings

- [Getting started with enterprise-managed settings](https://docs.github.com/en/copilot/how-tos/administer-copilot/manage-for-enterprise/use-managed-settings/get-started)
- [Choosing how to deploy enterprise-managed settings to users](https://docs.github.com/en/copilot/how-tos/administer-copilot/manage-for-enterprise/use-managed-settings/deploy-managed-settings)
- [Enterprise managed settings: supported keys and client coverage](https://docs.github.com/en/copilot/reference/enterprise-administrators/enterprise-managed-settings)
- [Changelog: Enterprise-managed settings GA](https://github.blog/changelog/2026-07-01-enterprise-managed-settings-json-is-generally-available/)
- [Changelog: MDM and file-based managed settings](https://github.blog/changelog/2026-07-08-deploy-managed-copilot-settings-via-mdm-in-vs-code-and-cli/)
- [Changelog: Managed settings for Copilot app and cloud agent](https://github.blog/changelog/2026-07-27-enterprise-managed-settings-now-apply-to-the-github-copilot-app/)

### Billing, budgets, and usage

- [GitHub Copilot seats and billing cycles for organizations and enterprises](https://docs.github.com/en/copilot/concepts/billing-and-usage/organizations-and-enterprises/seats-and-billing-cycles)
- [Usage-based billing for organizations and enterprises](https://docs.github.com/en/copilot/concepts/billing-and-usage/organizations-and-enterprises/billing)
- [Budgets for usage-based billing](https://docs.github.com/en/copilot/concepts/billing-and-usage/organizations-and-enterprises/budgets)
- [Getting started with budget controls](https://docs.github.com/en/copilot/tutorials/budgets/getting-started-with-budget-controls)
- [Managing your company's spending on GitHub Copilot](https://docs.github.com/en/copilot/how-tos/manage-and-track-spending/manage-company-spending)
- [Monitoring your GitHub AI Credits usage](https://docs.github.com/en/copilot/how-tos/manage-and-track-spending/monitor-ai-usage)

### Visual aids in this repository

- [GitHub enterprise hierarchy](../src/content/topics/github/account-enterprise-hierarchy.mdx) — use in Segment 1 and briefly in Segment 2 for the enterprise/organization decision boundary.
- [Copilot usage-based billing](../src/content/topics/github/copilot-usage-billing.mdx) — use in Segment 4 to illustrate seats, AI credits, and budget layers. Explain the billing-entity boundary and the difference between included-pool controls and metered-spend limits.
