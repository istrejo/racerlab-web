# Proposal: Complete Quote Workflow UI

## Intent

Enable workshop staff to draft, activate, approve, reject, expire, cancel, and version quotes without leaving the service-order flow or losing entered data.

## Scope

### In Scope
- Reusable create/edit editor for manual lines, absolute discount and tax, ISO currency, and reactive totals.
- Contextual status and version actions using the shared accessible modal, controlled approval methods, and `OTHER` detail.
- Version, currency, status, and amounts across quote and service-order views.
- Loading, empty, conflict, retry, permission, and pending states without full-page reloads.

### Out of Scope
- Inventory product selection, reservation, or consumption.
- Partial approval, PDF generation, public approval links, or post-approval versions.
- Backend rules, migrations, or direct Supabase access.

## Capabilities

### New Capabilities
- `quote-workflow-ui`: Accessible quote drafting, lifecycle actions, versions, and service-order integration.

### Modified Capabilities
- None; `openspec/specs/` has no existing quote capability.

## Approach

Extend typed models and the `API_URL` service from backend OpenAPI. Share a presentation editor between create and edit routes. Centralize labels, tones, transitions, item types, approval methods, and currency formatting. Derive actions and totals through signals/computed state or pure pipes; templates only delegate events. Duplicate through the version endpoint and route to the new draft. Use the existing modal for accessible lifecycle actions and pending errors.

## Affected Areas

| Area | Impact | Description |
|---|---|---|
| `src/app/core/` | Modified | Contract types and API client. |
| `src/app/features/quotes/` | Modified | Editor, routes, actions, formatting, tests. |
| `src/app/features/service-orders/` | Modified | Version summaries and contextual actions. |

## Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| API drift | Medium | Use approved OpenAPI and service contract tests. |
| Draft loss or duplicate mutation | Medium | Preserve state, disable pending actions, surface errors. |
| Wrong status/role actions | Medium | Centralize policy and test states and permissions. |

## Rollback Plan

Revert stacked web slices in reverse order to restore current routes and quote views. No persisted frontend data needs cleanup.

## Dependencies

- API `complete-quote-workflow`: versioning, `currencyCode`, `SUPERSEDED`, controlled methods, `approvalMethodDetail`, and duplicate-version endpoint.
- Stacked-to-main slices capped at 400 authored changed lines with focused tests.

## Success Criteria

- [ ] Authorized staff create/edit drafts without reloads or input loss.
- [ ] Lifecycle actions and versions update visible state correctly.
- [ ] Version, currency, totals, and Spanish statuses remain consistent across views.
- [ ] Dialogs manage keyboard/focus and prevent duplicate submissions.
- [ ] Focused/full Vitest, development build, formatting, and WCAG/AXE checks pass.
