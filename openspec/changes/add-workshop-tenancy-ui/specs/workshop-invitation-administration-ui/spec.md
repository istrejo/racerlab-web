# Workshop Invitation Administration UI Specification

## Purpose

Allow workshop owners to administer invitations without exposing that capability to other contexts.

## Requirements

### Requirement: OWNER-only invitation administration

The dashboard MUST expose invitation administration only when the current typed workshop context has the OpenAPI-defined `OWNER` role. Non-OWNER users MUST NOT see the entry point and MUST be redirected or denied safely when navigating to its route. The frontend SHALL rely on backend authorization as the final authority.

#### Scenario: Owner opens invitation administration

- GIVEN the current workshop context has role `OWNER`
- WHEN the owner opens the dashboard switcher or settings entry point
- THEN invitation administration is visible and reachable

#### Scenario: Non-owner attempts access

- GIVEN the current workshop context is not `OWNER`
- WHEN the user opens or navigates directly to invitation administration
- THEN the entry point is absent and the route is safely denied or redirected

### Requirement: Contract-aligned invitation management states

The interface MUST use typed API clients for the OpenAPI-defined invitation operations, responses, enums, and errors. It MUST show distinguishable loading, empty, success, validation, authorization, and recoverable failure states without duplicating backend business rules. Operations not yet published in OpenAPI are contract dependencies and MUST NOT be inferred.

#### Scenario: Owner completes an available invitation operation

- GIVEN an owner submits an OpenAPI-defined invitation operation
- WHEN the API confirms success
- THEN the interface announces success and refreshes the contract-backed state

#### Scenario: Invitation operation fails

- GIVEN the API returns a validation, authorization, or recoverable error
- WHEN the operation completes
- THEN the interface retains actionable context and announces the outcome
- AND it does not claim a state change that the API did not confirm

### Requirement: Accessible Stitch-aligned administration

The invitation interface and dashboard workshop switcher MUST follow the approved Stitch design language while meeting WCAG AA and AXE checks. Controls, dialogs, menus, feedback, and role-gated changes MUST be semantic, labelled, keyboard-operable, visibly focused, and announced to assistive technology.

#### Scenario: Assistive-technology feedback

- GIVEN an owner uses a keyboard or screen reader to manage invitations
- WHEN loading, success, error, or role-gated states change
- THEN the changed state is perceivable and actionable without pointer-only interaction

### Requirement: Invitation administration browser acceptance coverage

The project MUST provide focused Vitest/TestBed coverage and Playwright E2E coverage proving OWNER visibility and successful contract-backed feedback, plus non-OWNER UI and direct-route denial.

#### Scenario: Role boundary regression

- GIVEN the configured E2E environment supplies OWNER and non-OWNER contexts
- WHEN both users exercise invitation-administration navigation
- THEN only the OWNER can access and operate the interface
