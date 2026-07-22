# Design: Add Workshop Tenancy UI

## Technical Approach

Deliver a contract-independent browser-test foundation and Stitch traceability first: pin Node, install Playwright/AXE, prove deterministic local content, and document approved screen IDs without tenancy journeys. State, adapters, guards, routes, behaviors, and journeys remain blocked until exact OpenAPI operations, DTOs, and security publish.

After publication, keep tenancy behind typed `API_URL` adapters and one `AuthService` signal. Lazy routes use state/role guards; components never store credentials or call `HttpClient`. OpenAPI is the wire authority: unavailable operations stay disabled, never guessed.

```text
login/register/select -> validate full DTO -> AuthService.set(one state)
switch                -> preserve old state -> atomic valid replacement
reload                -> cookie refresh -> current context -> route
```

## Architecture Decisions

| Decision              | Choice and rationale                                                                                                                                                                                                                                                                                                                                                                                                            |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| First deliverable     | PR 1 contains Node/Playwright/AXE configuration, deterministic `page.setContent` smoke coverage, and `docs/tenancy-ui.md`. It is buildable and reversible before OpenAPI publication; no API mock or journey implies an unpublished contract.                                                                                                                                                                                   |
| State                 | `signal<AuthState>` has `loading`, `anonymous`, `authenticatedWithoutContext`, `authenticated`, and `error`. Context is computed only from `authenticated`; exhaustive switches prevent partial state.                                                                                                                                                                                                                          |
| Restricted selection  | `authenticatedWithoutContext` owns the memory-only pre-auth token. `RESTRICTED_SELECTION_OPERATIONS` may contain one verified exchange constant. Success atomically replaces it with scoped access/context; failure keeps it. Reload discards it, then refresh/context resolution restores context or routes to login.                                                                                                          |
| Credential registries | Adapters export immutable `{method,pathTemplate,security}` metadata from published OpenAPI. The interceptor requires exact normalized `API_URL` origin/base, method, and template matches; no prefix/fallback. Public, disabled, asset, and third-party calls receive no credential.                                                                                                                                            |
| Switch rollback       | Preserve auth state with separate `switchPending`; reject concurrent switches. Only a complete valid response replaces state. Failure retains it; reload resolves server context after ambiguous cookie rotation.                                                                                                                                                                                                               |
| Invitation credential | `/accept-invitation#token=...` captures the fragment value once into private runtime memory, then calls `history.replaceState(history.state, '', '/accept-invitation')` before application render, API, analytics, or third-party work. It never enters a path, query, request target, referrer, history, or log. Missing/reloaded credentials show recovery. Success clears memory and routes to login without authentication. |
| Stitch                | `docs/tenancy-ui.md` maps project `11586395528499572634`, system `assets/7332bf230dfe43f2ad42846e9d818d1c`, desktop `e3a2805262fe49f0befce35b7af6e428`, mobile `b08a8f8045d7403db4f12ecd4fd7a767`, and switcher `d479efebc3394a68be19b94b8958efb9` to routes, responsive behavior, assets, and accessibility deviations.                                                                                                        |

```ts
type AuthState =
  | { kind: 'loading' | 'anonymous' }
  | { kind: 'authenticatedWithoutContext'; restrictedToken: string; choices: WorkshopChoice[] }
  | { kind: 'authenticated'; accessToken: string; user: User; context: WorkshopContext }
  | { kind: 'error'; recovery: 'login' | 'retryContext'; message: string };
```

## Routes and Components

Lazy boundaries are `/register-workshop` (typed atomic form), `/accept-invitation` (fragment captured and history sanitized before rendering live status), `/select-workshop` (state guard/keyboard choice), `/dashboard` (context guard/focus-restoring switcher), and `/dashboard/invitations` (OWNER guard, direct denial, accessible administration states).

## File Changes

| Area                                                                             | Action                                                                                                              |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `.nvmrc`, `package.json`, lockfile, `playwright.config.ts`, `e2e/harness-smoke*` | PR 1: Node `24.18.0`, Playwright/AXE, `npm run e2e`, and contract-free smoke.                                       |
| `docs/tenancy-ui.md`                                                             | PR 1: Stitch/accessibility traceability using existing IDs.                                                         |
| `src/app/core/{models,services,guards,interceptors}/**`                          | Post-contract adapters, registries, state, guards, and tests.                                                       |
| `src/app/features/{auth,workshops,dashboard}/**`, `src/app/app.routes.ts`        | Post-contract lazy screens, switcher, administration, and tests.                                                    |
| `e2e/**`                                                                         | Final slices: contract-dependent onboarding, context, switch, role, invitation, keyboard, reload, and AXE journeys. |

## Testing Strategy

Strict TDD applies per slice: RED, GREEN, REFACTOR. PR 1 runs `npm run e2e -- e2e/harness-smoke.spec.ts --project=chromium` red, then green without tenancy traffic, plus `npm test` and `npm run build`. Vitest/TestBed later proves state, exact credential matching, rollback, guards, forms, focus/live regions, fragment capture, and history sanitization before any work starts. Final Playwright slices assert published traffic, no fragment/query/path/referrer leakage, and AXE results.

## Threat Matrix

Browser routing applies: RED cases cover guards, fragment capture and sanitized history before work, reload recovery, direct-route denial, and no credential leakage. Executable-path classification, Git selection, commit/push state, and PR automation are N/A.

## Delivery and Rollback

Auto-chain stacked-to-main with no size exceptions. Exact authored-line forecasts: PR 1 foundation/docs 330; PR 2 state/registries/guards 340; PR 3 registration 300; PR 4 acceptance 280; PR 5 selection 330; PR 6 switching 350; PR 7 OWNER/invitations 360; PR 8 onboarding journeys 330; PR 9 context/admin journeys 350 (total 2,970). Each reverts only its surface. Split above a 360 forecast or before actual additions plus deletions reach the hard 400 cap. PRs 2–9 remain blocked until exact backend OpenAPI operations/security publish.

## Open Questions

- [ ] Which exact OpenAPI operations, DTOs, and security schemes will publish the approved tenancy intents?
