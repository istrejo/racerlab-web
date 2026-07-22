# Workshop Context Auth Specification

## Purpose

Provide typed, authenticated workshop context and safe context-aware navigation.

## Requirements

### Requirement: Contextual authentication and routing

The frontend MUST obtain the signed-in user and available workshop context from the OpenAPI-defined `GET /auth/me` contract. It MUST expose typed loading, authenticated-with-context, authenticated-without-context, and error states; it MUST route each state only to its applicable screen. Contract fields, enums, and errors SHALL follow published OpenAPI; unavailable backend operations are frontend-facing dependencies, not substituted rules.

#### Scenario: Login resolves an existing workshop context

- GIVEN a login succeeds and `GET /auth/me` returns a selected workshop
- WHEN the context is loaded
- THEN the user reaches the contextual dashboard
- AND the typed context reflects the API response

#### Scenario: Login requires workshop selection

- GIVEN `GET /auth/me` returns an authenticated user without selected context
- WHEN the context is loaded
- THEN the user is routed to `/select-workshop`
- AND protected contextual routes are unavailable

### Requirement: Memory-only workshop selection and switching

The frontend MUST use the OpenAPI-defined selection or switch operation and retain a restricted pre-auth selection token only in runtime memory for its selection exchange. On success, it MUST use the returned scoped access token and selected context for contextual requests. It MUST NOT write either token to browser persistence, URL parameters, logs, or history. Token refresh SHALL remain cookie-based; a reload SHALL resolve context anew through the API.

#### Scenario: User switches workshop

- GIVEN an authenticated user can select another workshop
- WHEN the switch operation succeeds
- THEN subsequent contextual requests use the returned scoped access token and selected context
- AND the dashboard reflects the new context
- AND the selection token is not reused for contextual requests

#### Scenario: Browser reload clears local selection state

- GIVEN pre-auth selection state exists only in runtime memory
- WHEN the browser reloads
- THEN no persisted selection token is recovered
- AND cookie-based refresh and `GET /auth/me` resolve context again

### Requirement: Endpoint-aware authorization

The HTTP interceptor MUST attach the scoped access bearer only to OpenAPI-authorized protected API endpoints and only when available. It MUST attach a restricted selection token only to its published pre-auth selection exchange when required. It MUST NOT attach either token to public, authentication, invitation-capture, asset, or third-party requests.

#### Scenario: Protected contextual API request

- GIVEN an authorized API request and active in-memory context
- WHEN the interceptor processes the request
- THEN it sends the scoped access bearer required by the contract

#### Scenario: Pre-auth selection exchange

- GIVEN a published selection exchange requires a restricted selection token
- WHEN the interceptor processes that exchange request
- THEN it sends only the contract-required restricted token
- AND it does not treat that token as a contextual bearer

#### Scenario: Public or third-party request

- GIVEN a request is outside the authorized protected API endpoints
- WHEN the interceptor processes the request
- THEN it sends no bearer or selection token

### Requirement: Context journey acceptance coverage

The project MUST provide focused Vitest/TestBed coverage and Playwright E2E coverage for login-to-context, selection, switching, reload, and unauthorized-route behavior using contract-aligned test fixtures or backend environments.

#### Scenario: Context journey regression

- GIVEN the tenancy browser test suite runs against its configured API contract
- WHEN a user logs in, selects, switches, and reloads
- THEN the expected routes and context states are asserted
