# Workshop Onboarding UI Specification

## Purpose

Let owners create a workshop and invited employees join it through accessible, contract-aligned flows.

## Requirements

### Requirement: Owner workshop registration

The registration screen MUST submit only the OpenAPI-defined owner-and-workshop registration request through a typed API client. After a successful response, it MUST establish authenticated workshop context immediately using the contract-defined credentials and/or context response; it MUST NOT invent a separate login step or business validation.

#### Scenario: Owner registers a workshop

- GIVEN a prospective owner completes valid contract-defined fields
- WHEN registration succeeds
- THEN the owner is authenticated immediately
- AND reaches the contextual dashboard or contract-required selection route

#### Scenario: Registration is rejected

- GIVEN the API returns a contract-defined validation or business error
- WHEN registration completes
- THEN the form presents an accessible actionable error
- AND no unauthorised local context is created

### Requirement: Invitation acceptance without automatic login

The invitation screen MUST receive the invitation token only in the URL fragment, capture it once, and replace the fragment-bearing history entry before rendering application content or starting API, analytics, or third-party work. The token MUST NOT appear in the path, query string, HTTP request target, referrer, logs, or browser history after capture, and it MUST be submitted only through the OpenAPI-defined acceptance operation. A successful acceptance MUST NOT automatically authenticate the employee; the employee SHALL use the normal login flow afterward.

#### Scenario: Employee accepts a valid invitation

- GIVEN an invitation URL contains a valid invitation token in its fragment
- WHEN the acceptance screen opens
- THEN the fragment is removed from the visible URL and browser history before other application work
- AND the token is never sent in the initial request target or a referrer
- AND successful acceptance directs the employee to normal login

#### Scenario: Invitation is invalid or expired

- GIVEN the acceptance API returns a contract-defined rejection
- WHEN the employee submits the invitation
- THEN the screen announces an accessible recovery message
- AND it does not authenticate the employee

### Requirement: Accessible Stitch-aligned onboarding states

The `/register-workshop` and `/accept-invitation` screens MUST preserve the approved Stitch visual hierarchy while meeting WCAG AA and AXE requirements. They MUST provide semantic labels, keyboard operation, visible focus, announced loading and result states, and focus management after errors or navigation.

#### Scenario: Keyboard form recovery

- GIVEN a keyboard user submits invalid onboarding input
- WHEN the error state is shown
- THEN focus moves to or remains at the actionable error target
- AND fields, status, and recovery actions are screen-reader available

### Requirement: Onboarding browser acceptance coverage

The project MUST provide focused Vitest/TestBed coverage and Playwright E2E coverage for immediate owner authentication, invitation URL token removal, and invitation acceptance without automatic login.

#### Scenario: Onboarding journey regression

- GIVEN the configured E2E environment supports the required OpenAPI operations
- WHEN owner registration and invitation acceptance journeys run
- THEN their required auth, history, and route outcomes are asserted
