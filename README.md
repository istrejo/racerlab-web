# RacerLab Web

Angular web client for RacerLab, a workshop-management platform designed to connect customers, vehicles, service orders, diagnoses, quotations, repairs, technicians, and inventory in one traceable workflow.

> **Project status:** Foundation phase. The authentication flow, protected routing, session restoration, and initial dashboard shell are implemented. Operational modules and the full product UI are under active development.

## Overview

RacerLab Web is the frontend application for the RacerLab platform. It consumes the REST API from [`racerlab-api`](https://github.com/istrejo/racerlab-api) and is designed as an independently deployable Angular application.

The current milestone focuses on building a reliable authentication boundary before expanding into workshop operations.

## Implemented foundation

- Angular standalone application architecture.
- Lazy-loaded login and dashboard routes.
- Functional route guard for protected areas.
- Functional HTTP interceptor for bearer access tokens.
- Access tokens kept in memory instead of browser storage.
- Session restoration through an `HttpOnly` refresh cookie.
- Login, refresh, and logout integration with the RacerLab API.
- Reactive authentication state using Angular Signals.
- Startup session restoration through an application initializer.
- Tailwind CSS setup for the evolving design system.
- Vitest-based unit-test configuration.

## Authentication design

The browser never reads the refresh token directly:

1. The login request sends credentials with `withCredentials: true`.
2. The API returns an access token and sets an `HttpOnly` refresh cookie.
3. The access token is held in an Angular Signal and attached only to RacerLab API requests.
4. On application startup, the client calls the refresh endpoint to restore the session.
5. Protected routes are enabled only when a valid in-memory access token is available.
6. Logout revokes the backend session and clears the frontend authentication state.

This approach reduces persistent token exposure while still supporting session continuity after a reload.

## Current routes

| Route | Access | Status |
|---|---|---|
| `/login` | Public | Implemented |
| `/dashboard` | Authenticated | Initial shell |
| Workshop operational modules | Authenticated and role-scoped | Planned / in progress |

## Architecture

```text
src/app/
├── core/
│   ├── guards/          # Authentication route boundaries
│   ├── interceptors/    # API authorization behavior
│   └── services/        # Session and shared application services
├── features/
│   ├── auth/            # Login experience
│   └── dashboard/       # Protected application shell
├── shared/              # Shared tokens, utilities, and UI building blocks
├── app.config.ts
└── app.routes.ts
```

The project follows modern Angular conventions:

- Standalone components and providers.
- Functional guards and interceptors.
- Lazy route loading.
- Signal-based local state.
- Strict TypeScript configuration.
- Feature-oriented organization.

## Planned product areas

- Workshop onboarding and active-workshop context.
- Customer and vehicle management.
- Service-order intake and status tracking.
- Diagnosis and quotation flows.
- Technician assignment and repair tasks.
- Inventory and stock movements.
- Evidence, comments, and delivery history.
- Role-aware navigation and permissions.

These items represent the product roadmap, not completed functionality.

## Tech stack

| Area | Technology |
|---|---|
| Framework | Angular 22 |
| Language | TypeScript 6 |
| Styling | Tailwind CSS 4 |
| State | Angular Signals |
| Data access | Angular HttpClient, RxJS |
| Routing | Angular Router with lazy loading |
| Testing | Vitest |

## Getting started

### Prerequisites

- Node.js 20+
- npm 11+
- A running RacerLab API instance

### Installation

```bash
git clone https://github.com/istrejo/racerlab-web.git
cd racerlab-web
npm install
```

The development API URL is configured in `src/environments/environment.ts`:

```typescript
export const environment = {
  API_URL: 'http://localhost:3000/api',
};
```

Start the application:

```bash
npm start
```

Open `http://localhost:4200`.

## Useful commands

```bash
npm start       # Run the local development server
npm run build   # Create a production build
npm test        # Run unit tests
npm run watch   # Build continuously in development mode
```

## Related repository

- [RacerLab API](https://github.com/istrejo/racerlab-api) — NestJS API, authentication, RBAC, Prisma schema, and workshop domain foundation.

## Portfolio note

The interface is intentionally simple at this stage. The value of the current milestone is the end-to-end authentication architecture between Angular and NestJS; product screens will be added as the domain modules become available.

## License

This repository is shared for portfolio and evaluation purposes. No permission is granted for production reuse unless explicitly stated otherwise.
