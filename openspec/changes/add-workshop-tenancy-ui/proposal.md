# Proposal: Add Workshop Tenancy UI

## Intent

Let owners register/manage invitations, employees accept invitations, and users select or switch workshops without persisted selection tokens.

## Scope

### In Scope
- Contextual auth via `GET /auth/me`, memory-only selection tokens, and an endpoint-aware interceptor.
- Accessible Stitch-aligned screens for `/select-workshop`, `/register-workshop`, and `/accept-invitation`; capture the invitation token once and remove it from history.
- Dashboard workshop switcher and OWNER-only invitation administration.
- Vitest/TestBed and Playwright E2E coverage for tenancy journeys.

### Out of Scope
- Backend business rules, data writes outside typed API clients, or direct Supabase access.
- Persisting active-workshop selection tokens across reloads.
- Employee self-registration; employees join by invitation, then log in normally.

## Capabilities

### New Capabilities
- `workshop-context-auth`: Authenticated workshop context, selection, switching, and routes.
- `workshop-onboarding-ui`: Owner registration and employee invitation acceptance.
- `workshop-invitation-administration-ui`: OWNER-only invitation management interface and feedback states.

### Modified Capabilities
- None; `openspec/specs/` has no existing capability specifications.

## Approach

Extend Angular auth with typed `API_URL` clients and signals for `/auth/me` and workshop context. Keep tokens in memory and route by authentication/context. Use Stitch project `11586395528499572634`, design system `assets/7332bf230dfe43f2ad42846e9d818d1c`, and screens `e3a2805262fe49f0befce35b7af6e428`, `b08a8f8045d7403db4f12ecd4fd7a767`, `d479efebc3394a68be19b94b8958efb9`. Swagger/OpenAPI supplies contract details.

## Affected Areas

| Area | Impact | Description |
|---|---|---|
| `src/app/core/services/auth/` | Modified | Auth and current-user context. |
| `src/app/core/interceptors/auth.interceptor.ts` | Modified | Endpoint-aware bearer attachment. |
| `src/app/app.routes.ts` | Modified | Lazy tenancy and onboarding routes. |
| `src/app/features/auth/` | Modified | Login and onboarding components. |
| `src/app/features/dashboard/` | Modified | Workshop switcher and OWNER entry point. |
| `e2e/` and Playwright config | New | Critical browser journeys. |

## Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| API drift | Medium | Verify Swagger/OpenAPI; do not guess fields. |
| Token leakage or stale context | Medium | Memory-only state, history replacement, interceptor rules, tests. |
| Access-control confusion | Medium | Render invitation administration only for OWNER context and verify redirects/errors in E2E. |

## Rollback Plan

Revert the UI slices and route registrations. This restores login/dashboard; no data migration or persisted selection state needs cleanup.

## Dependencies

- Swagger/OpenAPI exposes approved workshop, invitation, registration, selection, and `GET /auth/me` contracts.
- Playwright tooling is added/configured for this Angular project.
- Delivery is stacked-to-main in autonomous vertical slices of at most 400 authored lines, with tests/docs.

## Success Criteria

- [ ] Owners register a workshop and reach authenticated context.
- [ ] Employees can accept an invitation and subsequently log in normally.
- [ ] Workshop selections stay memory-only; captured invitation tokens leave history.
- [ ] Only OWNER contexts expose invitation administration.
- [ ] Vitest/TestBed and Playwright E2E cover flows.
