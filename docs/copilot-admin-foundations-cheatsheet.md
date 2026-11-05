# Copilot Admin Foundations: cheat sheet

**Scenario:** A new engineering group is getting Copilot. Set guardrails, standardize clients, and keep spend predictable.
**Main rule:** First decide who owns the decision, then decide the value.
**Protect Q&A:** At 0:50, stop. If you're running long, cut agents/MCP first.

## Numbers to remember

| | |
|---|---|
| AI credits per seat each month | Business **1,900** · Enterprise **3,900** · 1 credit = **$0.01** |
| Free of AI credits | Inline completions and next edit suggestions |
| Audit log retention | **180 days** (stream it for longer) |
| Server-managed refresh | Within about **1 hour** (restart or re-sign-in refreshes now) |
| Settings precedence | **MDM → server-managed → file → user** |

---

## 1 · Mental model (0:00–0:05)

*Show: hierarchy page*

- Enterprise → orgs → teams and repos. People are members, not children.
- Policies follow the **license source**.
- There are two control planes: **AI controls** decide what's available, and **managed settings** decide how clients behave.
- Enterprise doesn't always win; it can enforce or delegate.

## 2 · AI controls (0:05–0:20)

*Show: AI controls → Copilot → features, then models, then org delegation, then audit log (`action:copilot`)*

- Enforce or delegate, and an org can't override an enforced setting.
- Enterprise-assigned users have their own policy setting.
- When licenses conflict: multiple orgs use the **least** restrictive setting, and multiple enterprises use the **most** restrictive. Both have exceptions.
- Default availability is not the same as explicit configuration.
- Mention public-code matching and content exclusion, but content exclusion is not access control.
- The audit log records policy, seat, and agent changes, **not prompts**.
- Watch who holds **Manage enterprise AI controls**.

## 3 · `managed-settings.json` (0:20–0:33)

*Show: the `.github-private` files, then team vs non-team before and after*

- It controls client behavior: model default, permissions, plugins, MCP, sandbox, and telemetry.
- **Not every client supports every key.** Check the support matrix.
- There are three delivery methods: server-managed, MDM (Windows and macOS), and a local file.
- Team overrides work only with **server-managed** delivery, and only for keys marked `overridable`.
- Restrictive keys (`permissions.*`, `sandbox`) combine toward stricter. A `disable` on bypass can't be relaxed.
- `model` sets a **default, not an allowlist**.
- Server-managed settings need an enterprise or org license. Device delivery applies regardless of license.

## 4 · Budgets (0:33–0:47)

*Show: billing page, Usage → AI usage, the AI credits paid usage policy, then the budget page*

- Keep three things separate: **seats**, the **included credit pool**, and **metered spend**.
- The pool is per billing entity, resets monthly, and doesn't roll over.
- Paid usage is **on by default**, so turn it off to block overage.
- A **user budget** is always a hard stop. A **spending limit** stops usage only if "Stop usage" is checked.
- A cost-center budget doesn't cap use of the included pool.
- An enterprise budget doesn't cap seat fees.
- Cadence: seat review, named owners, cost centers before rollout, and a monthly usage review.

## 5 · Recap (0:47–0:50)

1. Decide what's enforced and what's delegated.
2. Set explicit features, models, and agents.
3. Pick a managed-settings delivery method and pilot it.
4. Set budgets before rollout.
5. Assign owners and cost centers.
6. Review on a schedule.

---

## Quick answers

- **Prompts in the audit log?** No.
- **Raise one user's limit?** Give that user an individual budget. It can expire.
- **Does an enterprise budget cap the bill?** It caps metered use, not seat fees.
- **Do completions stop at a $0 budget?** No.
- **Can an org enable what the enterprise disabled?** Not if the enterprise enforced it.
- **What do we do first?** Inventory plans, license sources, owners, and clients, then pilot one group.

**Seed questions:** What would you enforce first? Who owns the cost? Server-managed, MDM, or file?
