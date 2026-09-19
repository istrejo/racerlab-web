# Quote Workflow UI Specification

## Purpose

Define quote editing, lifecycle, versions, and service-order integration governed by OpenAPI.

## Requirements

### Requirement: Reusable manual quote editor

The system MUST use one editor for creation and `DRAFT` editing. It MUST support manual lines, ISO currency defaulting to `EUR`, absolute discounts and taxes, and reactive line, subtotal, and total values. Contracts MUST follow OpenAPI.

#### Scenario: Create in euros

- GIVEN an authorized user starts a quote
- WHEN the editor opens
- THEN currency MUST default to `EUR`
- AND changing lines, discount, or tax MUST update totals immediately

#### Scenario: Edit a draft

- GIVEN an authorized user opens a `DRAFT`
- WHEN it loads
- THEN its lines, currency, discount, and tax MUST populate the editor

### Requirement: Contextual lifecycle actions

The system MUST offer: edit, activate, and cancel for `DRAFT`; approve, reject, expire, cancel, and version for `ACTIVE`; version for `REJECTED`, `EXPIRED`, `CANCELLED`, and `SUPERSEDED`; and no mutation for `APPROVED`. Mutation actions MUST require quote-write permission.

#### Scenario: Authorized actions

- GIVEN a writer views a quote
- WHEN its status renders
- THEN only that status's defined actions MUST appear

#### Scenario: Read-only user

- GIVEN a user has read but not write permission
- WHEN a quote renders
- THEN no mutation action MUST appear

### Requirement: Quote version presentation

Lists, details, and service-order views MUST show `Cotización vN`, currency, and formatted amounts. Versions MUST be newest first. Successful duplication MUST open the new `DRAFT` editor.

#### Scenario: Ordered versions

- GIVEN an order has multiple versions
- WHEN they render
- THEN every version MUST show its number
- AND the highest number MUST appear first

#### Scenario: Duplicate a version

- GIVEN a writer versions an eligible quote
- WHEN OpenAPI returns the new draft
- THEN its edit flow MUST open

### Requirement: Controlled decisions

Approval and rejection MUST require an OpenAPI-defined method. `OTHER` MUST require non-blank detail; other methods MUST omit detail.

#### Scenario: Other method

- GIVEN a writer selects `OTHER`
- WHEN detail is blank
- THEN approval or rejection MUST remain unavailable

#### Scenario: Named method

- GIVEN a writer selects a method other than `OTHER`
- WHEN submitting the decision
- THEN no method detail MUST be sent

### Requirement: Accessible lifecycle modal

Lifecycle decisions MUST use the shared modal with an accessible name, initial focus, keyboard operation, Escape cancellation, restored opener focus, and locked submission and dismissal while pending.

#### Scenario: Keyboard cancellation

- GIVEN the modal is open and idle
- WHEN Escape is pressed
- THEN it MUST close without mutation
- AND focus MUST return to its opener

#### Scenario: Pending decision

- GIVEN a lifecycle request is pending
- WHEN submission or dismissal is attempted again
- THEN no duplicate request MUST occur
- AND the modal MUST remain open

### Requirement: Non-destructive request states

Creation, editing, lifecycle changes, versioning, and retry MUST avoid full-page reloads. Failures MUST preserve inputs and quote context, show an actionable error, and permit retry.

#### Scenario: Save fails

- GIVEN the editor contains unsaved values
- WHEN saving fails
- THEN all values MUST remain
- AND retry MUST not require re-entry

#### Scenario: Lifecycle change fails

- GIVEN the modal contains a valid decision
- WHEN its request fails
- THEN the prior visible status MUST remain
- AND the modal MUST allow retry

### Requirement: Declarative templates

Templates MUST use prepared state, computed values, or pure pipes for totals, labels, formatting, permissions, and action visibility. They MUST NOT call methods to derive display state, but MAY delegate user events to handlers.

#### Scenario: Render derived state

- GIVEN quote state changes
- WHEN a quote template renders
- THEN derived display values MUST come from reactive state or pure pipes
- AND methods MUST be referenced only as event handlers
