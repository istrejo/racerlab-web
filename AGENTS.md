# RacerLab Web AI Instructions

Build the Angular frontend for RacerLab, a private workshop operations system. Keep changes practical, typed, accessible, and aligned with the NestJS OpenAPI contract.

## Product Boundary

- This repo owns only the Angular web application.
- Do not implement business rules that belong in the backend. Reflect backend state, validate user input for UX, and call the REST API.
- Do not connect directly to Supabase for business operations, database reads/writes, inventory changes, order updates, quotes, or evidence writes.
- Consume the NestJS REST API through typed services configured around `API_URL`.
- Align request/response models, enums, and errors with OpenAPI/Swagger from the backend.
- Treat Swagger/OpenAPI as the source of truth for API contracts.

## Stack

- Angular 22+
- TypeScript with strict type checking
- Standalone components
- Signal Forms (`@angular/forms/signals`) for new forms when practical
- Reactive Forms when Signal Forms are not suitable
- Signals for local state
- Angular Router with lazy feature routes
- Functional HTTP interceptors
- Route guards for authenticated and role-restricted screens
- Tailwind CSS for styling
- PrimeNG or custom UI components only when they improve delivery and accessibility

## Feature Boundaries

Organize user-facing work under feature boundaries that match the product and API:

- `dashboard`: operational metrics, open orders, low stock, pending quotes, active technicians.
- `customers`: customer search, create/edit, vehicles, order and quote history.
- `vehicles`: vehicle records, customer association, service history.
- `service-orders`: creation, detail, status transitions, technician assignment, history, evidences.
- `quotes`: quote creation, items, totals, approval/rejection display flows.
- `inventory`: products, categories, stock, movements, reservations, low-stock alerts.
- `technicians`: technician workload, assigned orders, repair task views.
- `reports`: basic operational, order, inventory, and quote reports.
- `settings`: users, roles, application configuration, future admin screens.

Use `src/app/core` for cross-cutting infrastructure, `src/app/shared` for reusable UI primitives, and `src/app/features` for product areas.

### Structure And Service Responsibilities

- Give every guard under a `guards` directory its own named subdirectory. Keep each guard and its focused tests together, for example `guards/auth/auth-guard.ts` and `guards/auth/auth-guard.spec.ts`.
- Keep module-level types and interfaces in that module's `model` directory. Do not declare reusable API, domain, or service-contract types inside components, guards, interceptors, or service implementation files.
- Keep service classes focused on one responsibility. Orchestration services such as `AuthService` must delegate access-token parsing and state to a token service, and session restoration, refresh coordination, profile state, logout, and cross-tab synchronization to a session service.
- Preserve a small facade when many components depend on a service contract; move implementation details behind focused services instead of spreading session logic across consumers.

## Angular Rules

- Always use standalone components over NgModules.
- Do not set `standalone: true` inside Angular decorators. It is the default in Angular v20+.
- Do not set `changeDetection: ChangeDetectionStrategy.OnPush` explicitly. `OnPush` is the default in Angular v22+.
- Use `input()` and `output()` functions instead of decorators.
- Use `computed()` for derived state.
- Use signals for local component state.
- Do not use `mutate` on signals; use `update` or `set`.
- Prefer inline templates for small components.
- Keep components small and focused on one responsibility.
- Use `inject()` instead of constructor injection.
- Prefer the `@Service` decorator over `@Injectable({ providedIn: 'root' })` for new singleton services in Angular v22+.
- Use `providedIn: 'root'` for singleton services.
- Do not use `@HostBinding` or `@HostListener`; put host bindings in the `host` object.
- Use `NgOptimizedImage` for static images. It does not work for inline base64 images.

## Forms And State

- Prefer Signal Forms for new form-heavy screens such as service orders, quotes, inventory, customers, and vehicles.
- Use Reactive Forms when Signal Forms do not fit an integration or existing pattern.
- Do not use Template-driven Forms for product workflows.
- Keep state transformations pure and predictable.
- Keep server state in services or feature-level facades, not scattered across components.

## Templates And Styling

- Use native control flow (`@if`, `@for`, `@switch`) instead of `*ngIf`, `*ngFor`, or `*ngSwitch`.
- Keep templates simple; move complex logic to TypeScript.
- Use the async pipe for observables.
- Do not assume globals like `new Date()` are available in templates.
- Do not use `ngClass`; use `class` bindings.
- Do not use `ngStyle`; use `style` bindings.
- When using external templates or styles, use paths relative to the component TS file.
- Use Tailwind utilities consistently. Extract reusable UI only when repetition is real.

## API Integration

- Centralize API access in services under `core/services` or feature-specific services.
- Read the base URL from environment configuration as `API_URL`.
- Use interceptors for Authorization headers, request metadata, and centralized error handling.
- Use guards for authenticated screens and role-based access.
- Model enums such as `ServiceOrderStatus`, `QuoteStatus`, `InventoryMovementType`, `UserRole`, `RepairTaskStatus`, and `ProductUnit` from OpenAPI, not hand-written guesses.
- Do not duplicate backend validation as business truth. Add frontend validation only for fast user feedback.

## Accessibility Requirements

- It must pass all AXE checks.
- It must follow WCAG AA minimums, including focus management, color contrast, labels, keyboard navigation, and ARIA attributes.
- Use semantic HTML before ARIA.
- Preserve visible focus indicators.
- Ensure tables, forms, dialogs, menus, and status changes are usable with keyboard and screen readers.

## Testing And Verification

- Use existing project commands only; do not install packages unless explicitly asked.
- Prefer focused tests for critical components, forms, HTTP services, guards, and interceptors.
- For docs-only or instruction-only changes, tests may be skipped with a clear note.
- Available scripts include `npm start`, `npm run build`, and `npm test`.
