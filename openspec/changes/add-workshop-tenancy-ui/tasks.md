# Tasks: Workshop Tenancy UI

## Review Workload Forecast

| Field    | Value                                      |
| -------- | ------------------------------------------ |
| Forecast | 2,970 authored lines; High risk            |
| Split    | PR 1 → PR 9; <=360 each; 400 hard cap      |
| Strategy | auto-chain; stacked-to-main; no exceptions |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

### Suggested Work Units

| PR/lines | Deliverable / dependency                  | Test; runtime; rollback                      |
| -------- | ----------------------------------------- | -------------------------------------------- |
| 1/330    | Playwright/AXE/Node + Stitch; independent | `npm test`; harness smoke; tooling/doc       |
| 2/340    | State/registries/guards; contract         | `npm test`; N/A—TestBed; core                |
| 3/300    | Registration; PR 2                        | `npm test`; API route; registration          |
| 4/280    | Acceptance; PR 2                          | `npm test`; API route; acceptance            |
| 5/330    | Selection; PR 2                           | `npm test`; API route; selection             |
| 6/350    | Switch; PR 2                              | `npm test`; API switch; switcher             |
| 7/360    | OWNER invitations; PR 2                   | `npm test`; API admin; guard/admin           |
| 8/330    | Onboarding E2E; PRs 3–4                   | `npm test`; onboarding; onboarding E2E       |
| 9/350    | Context/admin E2E; PRs 5–7                | `npm test`; context/admin; context/admin E2E |

Harness: `npm run e2e -- e2e/harness-smoke.spec.ts --project=chromium`; every PR runs `npm run build`.

> PR 1 is applyable without tenancy journeys. PRs 2–9 are BLOCKED pending published OpenAPI operations, DTOs, and security.

## Phase 1: Independent E2E foundation and Stitch

- [ ] 1.1 RED deterministic `page.setContent` navigation/AXE smoke; record the failing command.
- [ ] 1.2 GREEN/REFACTOR `.nvmrc`, Node `24.18.0`, lockfile, config/script, and contract-free smoke.
- [ ] 1.3 Document Stitch IDs, responsive behavior, routes, and accessibility in `docs/tenancy-ui.md`.

## Phase 2: Context boundary (blocked)

- [ ] 2.1 RED state/reload/guards, origin-method-template matching, and no credentials on public/third-party/disabled traffic.
- [ ] 2.2 GREEN/REFACTOR published adapters/constants, memory-only state, interceptor, guards/routes, and no fallback credentials.

## Phase 3: Registration (blocked)

- [ ] 3.1 RED→GREEN→REFACTOR form focus/live validation, atomic auth, rollback, typed client, and `/register-workshop`.

## Phase 4: Acceptance (blocked)

- [ ] 4.1 RED: fragment-only capture once; replace history before render, API, analytics, or third-party work; assert no path/query/request/referrer/log leakage.
- [ ] 4.2 GREEN→REFACTOR memory, recovery, clearing, login success, and `/accept-invitation` client.

## Phase 5: Selection (blocked)

- [ ] 5.1 RED→GREEN→REFACTOR keyboard choice, restricted exchange, failure retention, guard/client, and `/select-workshop`.

## Phase 6: Switching (blocked)

- [ ] 6.1 RED→GREEN→REFACTOR focus restoration, concurrency rejection, atomic success, rollback, and reload resolution.

## Phase 7: OWNER invitations (blocked)

- [ ] 7.1 RED→GREEN→REFACTOR role/direct denial, accessible shell, typed operations, refresh, and announcements.

## Phase 8: Contract onboarding journeys (blocked)

- [ ] 8.1 RED→GREEN owner registration and fragment-only acceptance traffic; assert history removal before work, no automatic login, keyboard, and AXE against contracts.

## Phase 9: Contract context/admin journeys (blocked)

- [ ] 9.1 RED→GREEN selection, switch/reload, role denial, invitations, keyboard, and AXE against published contracts.

## Work-unit evidence

- [ ] Record RED/GREEN/REFACTOR, results, lines, base, runtime/N/A, and rollback before advancing.
- [ ] Split above 360 forecast or before 400 lines; keep tests/docs together; no commits, pushes, PRs, or exceptions.
