# Fitness module (frontend)

The platform core is domain-agnostic. Fitness is one capability module
(`ModuleRegistry` on the backend, `CompanyModule` per tenant). A future
Medical / Legal / Beauty module slots in the same way.

## What belongs to fitness

**Feature areas** (currently under `features/owner/`, pending a physical move
into this folder):

- `activities/` — activity catalogue
- `calendar/` — session scheduling
- `bookings/` — class bookings
- `contracts/` — memberships & contract types
- `coach/` + `layout/coach-shell/` — the coach experience

**Models / services**: `activity`, `session`, `booking`, `contract`,
`contract-type`, `recurring-schedule`, `attendance`, `coach`.

## How it's gated (already in place)

| Layer | Mechanism |
|---|---|
| Navigation | `core/configuration/navigation.ts` items tagged `module: "fitness"`; `NavigationService` drops them when the module is off |
| Routes | `moduleGuard("fitness")` on the fitness routes in `app.routes.ts` |
| Templates | `*hasModule="'fitness'"` (e.g. the dashboard's fitness KPIs) |
| API | backend `require_module!(:fitness)` on the fitness controllers |

## Pending

The feature folders above still physically live under `features/owner/`.
Moving them here is mechanical (imports + lazy-route paths) but touches many
files, so it's deferred until it can be done as its own focused change — the
gating above already gives the functional isolation.
