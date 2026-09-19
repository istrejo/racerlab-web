# Design: Complete Quote Workflow UI

## Technical Approach

Extend the OpenAPI-backed quote types and client, then split route orchestration from presentation. A standalone `QuoteEditorComponent` owns Signal Form state and calculations; create/edit route containers own loading, API mutation, errors, and navigation. Quote detail and service-order detail derive contextual actions through computed signals and execute them through `AppModalComponent`. Existing lazy routes, guards, core/shared/features boundaries, and URL hierarchy remain intact.

## Architecture Decisions

| Decision | Alternatives | Rationale |
|---|---|---|
| Presentation editor with `initialValue`, `pending`, `error` inputs and `submitted`/`cancelled` outputs | Duplicate create/edit pages; editor calls API | One Signal Form schema and money calculation path preserves entered state because the component stays mounted after request failure. |
| Add guarded `.../quotes/:quoteId/edit` before the detail route | Modal editing; query-mode detail page | A dedicated lazy route supports direct links and clean read/write guard separation while preserving the current navigation model. |
| Central quote metadata/policy plus computed view models | Status branches and helper calls in templates | Keeps labels, tones, item types, approval methods, action visibility, ordered versions, and line totals consistent; templates only read state or delegate events. |
| Angular `CurrencyPipe` for display; numeric rounding helpers only in TypeScript | Raw numbers; component formatting methods | The pipe is pure, locale-aware, and accepts each quote's ISO code without executable template methods. |
| One action-specific shared modal | Generic status dropdown; bespoke dialogs | Direct actions prevent illegal choices and inherit focus restoration, Escape handling, accessible naming, and busy dismissal locking. |

## Data Flow

```text
route params -> create/edit container -> QuotesService -> OpenAPI
                         |                    |
                         v                    v
                 QuoteEditorComponent <- response/error

Quote detail/order detail -> computed actions -> AppModal -> mutation
                                                    |
                                      returned Quote / edit route
```

The edit container fetches the quote, rejects non-`DRAFT` state into a read-only error/link state, and renders the editor only after data arrives. Editor hydration occurs once per quote identity, avoiding asynchronous input updates overwriting user edits. Create success opens detail; update success returns to detail; version success navigates to the new draft edit route. Service-order quotes are sorted by descending `version` in a computed signal.

## File Changes

| File/area | Action | Description |
|---|---|---|
| `core/models/quotes.interface.ts`, `core/services/quotes/quotes.ts` | Modify | Add `SUPERSEDED`, version/lineage/currency/decision fields, controlled method types, currency inputs, and `createVersion()`. |
| `features/quotes/quote-editor/*`, `quote-edit/*` | Create | Reusable Signal Form editor and guarded edit container with focused tests. |
| Existing quote list/new/detail and shared quote metadata utility | Modify/create | Reuse editor, computed actions, shared labels/tones, pure currency display, modal lifecycle/version flow. |
| `layout/layout.routes.ts`, service-order detail | Modify | Add edit route and present newest-first versions plus initial/version actions. |

## Interfaces / Contracts

`QuoteStatus` gains `SUPERSEDED`; `QuoteApprovalMethod` is `WHATSAPP | PHONE | IN_PERSON | EMAIL | OTHER`. `Quote` gains `version`, `sourceQuoteId`, `currencyCode`, and `approvalMethodDetail`; summaries expose version and currency. `QuoteInput` gains `currencyCode`; lifecycle input uses the controlled method plus optional detail. `QuotesService.createVersion(orderId, quoteId)` posts to `/service-orders/:orderId/quotes/:quoteId/versions`.

## Testing Strategy

| Layer | Coverage |
|---|---|
| Unit | RED-first tests for editor hydration, validation, reactive totals, ISO currency, add/remove lines, retained input, and no duplicate submit. |
| Component/service | Exact request bodies/routes; create/edit/version navigation; all status/permission action matrices; `OTHER` validation; modal Escape/focus/busy/error retry; newest-first order integration and formatted currency. |
| Regression | Full Vitest suite, development build, Prettier, template scan for derived method calls, and manual AXE/WCAG-AA keyboard pass. |

## Threat Matrix

Routing changes are client-side Angular route declarations only.

| Boundary | Applicability |
|---|---|
| Documentation-like paths | N/A — no executable classification. |
| Git repository selection | N/A — no Git execution. |
| Commit state | N/A — no index handling. |
| Push state | N/A — no push automation. |
| PR commands | N/A — no PR command construction. |

## Migration / Rollout

No frontend data migration or feature flag is required. Deliver stacked slices: contracts/service/editor, then lifecycle/version/order integration. Deploy only after the API change is available; rollback web slices in reverse order. Existing read/detail URLs remain compatible.

## Open Questions

None.
