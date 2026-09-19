# Tasks: Complete Quote Workflow UI

## Review Workload Forecast

| Field | Value |
|---|---|
| Estimated changed lines | 650–780 authored lines |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 contract/editor → PR 2 lifecycle/version/order integration |
| Delivery strategy | auto-chain |
| Chain strategy | stacked-to-main |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|---|---|---|---|---|---|
| 1 | OpenAPI-aligned contract plus reusable create/edit draft editor | PR 1 | `npm test -- --watch=false src/app/core/services/quotes/quotes.spec.ts src/app/features/quotes/quote-editor/quote-editor.spec.ts src/app/features/quotes/quote-new/quote-new.spec.ts src/app/features/quotes/quote-edit/quote-edit.spec.ts` | `npm start`; create, fail/retry, and edit a draft | Quote contract/service, editor, edit route, and create refactor |
| 2 | Lifecycle modal, controlled decisions, versioning, and order views | PR 2 | `npm test -- --watch=false src/app/features/quotes/quote-detail/quote-detail.spec.ts src/app/features/quotes/quote-list/quote-list.spec.ts src/app/features/service-orders/service-order-detail/service-order-detail.spec.ts` | `npm start`; run diagnosis → v1 → activate → v2 → approve | Quote policy/detail/list and service-order quote integration |

## Phase 1: Contract and Draft Editor (PR 1)

- [ ] 1.1 RED: Extend `quotes.spec.ts` for version/currency/decision DTO bodies and exact bodyless `createVersion()` route; add `quote-editor.spec.ts` for EUR default, hydration, validation, reactive totals, add/remove, retained input, and duplicate-submit prevention.
- [ ] 1.2 RED: Add `quote-new.spec.ts`, `quote-edit.spec.ts`, and route tests for create/update navigation, draft-only loading, 409/error preservation, cancellation, and the guarded edit route preceding detail.
- [ ] 1.3 GREEN: Extend `quotes.interface.ts` and `QuotesService`; create shared quote metadata/policy and a presentation-only Signal Form `QuoteEditorComponent` with prepared line totals.
- [ ] 1.4 GREEN: Refactor `QuoteNewComponent`, add `QuoteEditComponent`, and wire `layout.routes.ts`; keep API/navigation in containers and currency display in `CurrencyPipe`.
- [ ] 1.5 REFACTOR: Remove duplicated form/policy code and run Unit 1 focused tests before committing its autonomous slice.

## Phase 2: Lifecycle, Versions, and Order Integration (PR 2)

- [ ] 2.1 RED: Expand detail/list/order specs for every status/permission action, newest-first versions, `Cotización vN`, currency, `OTHER` validation, omitted named-method detail, version navigation, and unchanged state after failures.
- [ ] 2.2 RED: Add modal tests for initial/restored focus, Escape, pending dismissal lock, retry, and single mutation submission.
- [ ] 2.3 GREEN: Replace the status dropdown with action-specific `AppModalComponent` flows using computed action state; implement activate/approve/reject/expire/cancel/version and navigate new drafts to edit.
- [ ] 2.4 GREEN: Update quote list/detail and service-order detail to show shared labels/tones, formatted amounts, versions descending, and initial-versus-version actions.
- [ ] 2.5 REFACTOR: Remove derived template calls and run Unit 2 focused tests before committing the dependent slice.

## Phase 3: Verification and Documentation

- [ ] 3.1 Run `npm test -- --watch=false`, `CI=true NG_PERSISTENT_BUILD_CACHE=0 npm run build -- --configuration development --no-progress`, `npx prettier --check .`, and `git diff --check`.
- [ ] 3.2 Run `rg -n '\w+\(' src/app/features/quotes src/app/features/service-orders/service-order-detail -g '*.html'`; confirm matches are event handlers only, then complete manual AXE/WCAG-AA keyboard and full lifecycle harness checks.
- [ ] 3.3 Record exact results in OpenSpec verification evidence and update `../BACKLOG.md` status/test counts; deploy only after the API contract is available.
