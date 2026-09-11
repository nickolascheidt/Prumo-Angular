# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start          # Dev server at http://localhost:4200
npm run build      # Development build
npm run build:prod # Production build (optimized, hashed)
npm test           # Run Karma/Jasmine tests
npm run lint       # Lint checks
```

To run a single spec file, use the Angular CLI directly:
```bash
npx ng test --include='src/app/path/to/component.spec.ts'
```

## Tech Stack

- **Angular 18** with standalone components (no NgModules for features)
- **Angular Material 18** — tema M2 próprio em `src/styles/_prumo-theme.scss` (identidade
  Prumo, direção "Azul de Prumo"); Primary `#1b5c86`, Accent `#0f9b8e`, Warn `#b3402f`.
  Não é mais um prebuilt: as rampas 50–900 são geradas e ancoradas nos tokens do handoff.
- **TypeScript 5.5** with strict mode
- **ReactiveFormsModule** (FormBuilder) for all forms
- **RxJS BehaviorSubjects** in services for state (no NgRx)

## Architecture

```
src/app/
├── core/
│   ├── guards/          # authGuard, permissionGuard, resourceAccessGuard
│   ├── interceptors/    # JwtInterceptor — adds Bearer token to all requests
│   ├── services/        # AuthService, ApiService, PermissionService
│   └── models/          # All TypeScript interfaces and enums
├── modules/
│   ├── auth/            # LoginComponent
│   ├── dashboard/       # Welcome screen (current user info + admin shortcut)
│   └── admin/           # Role management, user/permission/resource assignment
└── shared/
    └── components/layout/ # LayoutComponent (sidenav + toolbar)
```

## Key Patterns

**Backend** lives at `C:\Users\Nickolas\source\repos\SaaSBasePlatform` (sibling repo, .NET 10 / ASP.NET Core / EF Core). The full API contract is documented in `SYSTEM_OVERVIEW.md` at the root of this repo — consult it before adding or changing any HTTP call. For source-of-truth behavior, read controllers under `Prumo.Api/Controllers`.

**API calls** all go through `ApiService` (`core/services/api.service.ts`). The base URL comes from `environment.apiUrl`: `http://localhost:5201/api` in dev (`src/environments/environment.ts`) and the relative `/api` in production (`src/environments/environment.prod.ts`, swapped in via the `production` build's `fileReplacements`). In production the SPA is served by nginx, which proxies `/api` to the API container, so requests stay same-origin.

**Login → bootstrap sequence** the frontend must follow:
1. `POST /api/auth/login` → store JWT
2. `GET /api/auth/me` → roles (its `permissions` array is empty since item 3B)
3. `GET /api/resources/my-permissions` → UI resources with `PermissionLevel` per resource; this drives menu visibility and button enable/disable

**Backend errors** use the envelope `{ "message": "..." }`. Watch for `429` from rate limits (`public` policy = 10/min on login/register; `authenticated` = 100/60s). JWT clock skew is zero, so `401` can mean a token that expired seconds ago.

**Auth** uses JWT tokens stored in `localStorage` under the keys:
- `prumo_token`
- `prumo_user`
- `prumo_resource_permissions`
- `prumo_tenant_id`
- `prumo_permissions` — leftover from the system retired in item 3B; arrives empty now

**Permissions**: there is one system, **resource permissions** — `PermissionLevel`
(None/Read/Write/Full) per resource code, checked with `userCanAccessResource()`. It drives
menu visibility, route guards, and matches what the API enforces.

The old dual system is gone. Dot-notation strings (`employees.view`) and everything that
read them were retired in backlog item 3B, on both sides: they gated nothing, and no
component ever called `hasPermission()`.

> **Enums cross the wire as strings.** `PermissionLevel` arrives as `"Read"`, `TenantRole`
> as `"Owner"`. Comparing the raw value against the numeric enum is always false, and the
> failure is silent — controls just stop rendering. This has bitten four times. Normalize
> at the boundary with `toPermissionLevel` / `toTenantRole` from `core/models`; never
> compare a payload value to an enum member directly.

> **Testing authorization with the master admin proves nothing.** `admin@SBP.com` bypasses
> every check twice over — global `Administrador` role and Owner of each tenant. Use a
> Member with a limited role.

**Auth routes are public by design.** Besides `/auth/login`, the item 8 screens
(`register`, `check-email`, `confirm-email`, `forgot-password`, `reset-password`,
`awaiting-invitation`) have no guard: they are the destinations of email links, opened by
people who have no session yet. What protects `confirm-email` and `reset-password` is the
single-use token in the URL, checked by the API.

The shared frame (background, orbs, card, brand) is `AuthShellComponent`; form styles come
from the `_auth-forms.scss` partial. Six screens copying the same SCSS would guarantee one
gets left behind.

**Login has one branch that is not an error.** A 403 carrying
`code: 'email_not_confirmed'` means the password was right and the address was never
confirmed — route to `/auth/check-email`, never show it as a credential failure. And zero
memberships routes to `/auth/awaiting-invitation`: the account is fine, nobody has added it
to a company yet.

**Route protection**: All other routes require `authGuard`. Resource-level
gating uses `resourceAccessGuard` with
`data: { resource: 'code', requiredLevel: PermissionLevel.Read }` — this is the normal way,
and every admin route uses it.

Each dashboard tab has its **own** resource (`Dashboard.HR`, `Dashboard.Accounting`, …)
rather than borrowing the module's, so the panel and the module screen can be granted
independently. The tab list in `DashboardComponent` and the route guard are two separate
gates on the same thing — **change both**, or a tab shows up and the route then refuses it.

**Component pattern**: All feature components are standalone. Forms open in Material dialogs. Data is loaded in `ngOnInit()` with a loading spinner. Use `.subscribe()` for HTTP calls — not async pipe.

**New feature module checklist**: create a standalone component under `modules/`; add the
route to `app.routes.ts` with `resourceAccessGuard` and its `data`; add the nav entry in
`LayoutComponent` with the matching `resourceCode`; and declare the resource in the
backend's `TenantBootstrapSeeder` — without that last step the screen is invisible to
everyone, because the resource it gates on does not exist.

**Styling Angular Material internals**: `mat-button` and `mat-list-item` nest their content
in wrappers of their own (`.mdc-button__label`, `.mdc-list-item__primary-text`) that
component styles cannot reach — `display: flex` on the host does not reach the children.
Three layouts broke this way. Prefer plain markup with `matMenuTriggerFor` over fighting
the wrapper; use `::ng-deep`, scoped tightly, only when the Material component is genuinely
needed.

> **`::ng-deep` in `src/styles.scss` is dead code, not a no-op.** Angular only strips that
> pseudo-selector from *component* styles. In the global sheet it ships verbatim, and the
> browser drops the whole rule as an unknown pseudo-element — verified in Chrome: of
> `::ng-deep .a {} .b {}` only `.b` survives parsing. Eight Material overrides sat there
> never applying until the Prumo rebrand. Global styles have no encapsulation to pierce:
> write the plain selector.

> **Material's MDC class names are not the directive names.** `mat-flat-button` emits
> `.mat-mdc-unelevated-button` and `mat-stroked-button` emits `.mat-mdc-outlined-button` —
> there is no `.mat-mdc-stroked-button`, and an override list naming it silently covers
> nothing. Target `.mat-mdc-button-base` (excluding `.mat-mdc-icon-button`, `.mat-mdc-fab`
> and `.mat-mdc-mini-fab`, which must stay round) instead of enumerating variants.

**Icons come from the classic Material Icons font**, not Material Symbols. Names added in
the Symbols era (`event_upcoming`, `calendar_month`, …) are not ligatures there: they do
not collapse into a glyph, they render letter by letter and overflow the box. Check a name
exists before using it.
