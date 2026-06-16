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
- **Angular Material 18** — deeppurple-amber theme; Primary `#673ab7`, Accent `#f5576c`, Warn `#ff6f00`
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

**Backend** lives at `C:\Users\Nickolas\source\repos\SaaSBasePlatform` (sibling repo, .NET 10 / ASP.NET Core / EF Core). The full API contract is documented in `SYSTEM_OVERVIEW.md` at the root of this repo — consult it before adding or changing any HTTP call. For source-of-truth behavior, read controllers under `SaaS_BasePlatform.Api/Controllers`.

**API calls** all go through `ApiService` (`core/services/api.service.ts`). The base URL comes from `environment.apiUrl`: `http://localhost:5201/api` in dev (`src/environments/environment.ts`) and the relative `/api` in production (`src/environments/environment.prod.ts`, swapped in via the `production` build's `fileReplacements`). In production the SPA is served by nginx, which proxies `/api` to the API container, so requests stay same-origin.

**Login → bootstrap sequence** the frontend must follow:
1. `POST /api/auth/login` → store JWT
2. `GET /api/auth/me` → roles + module-level permissions
3. `GET /api/resources/my-permissions` → UI resources with `PermissionLevel` per resource; this drives menu visibility and button enable/disable

**Backend errors** use the envelope `{ "message": "..." }`. Watch for `429` from rate limits (`public` policy = 10/min on login/register; `authenticated` = 100/60s). JWT clock skew is zero, so `401` can mean a token that expired seconds ago.

**Auth** uses JWT tokens stored in `localStorage` under the keys:
- `saas_baseplatform_token`
- `saas_baseplatform_user`
- `saas_baseplatform_permissions`
- `saas_baseplatform_resource_permissions`

**Permissions** follow a dual system:
1. **Module permissions** — dot-notation strings (e.g., `"employees.view"`, supports `*` wildcard) checked via `PermissionService.userHasPermission()`
2. **Resource permissions** — `PermissionLevel`: None/Read/Write/Full checked via `userCanAccessResource()`, `userCanReadResource()`, etc.

The backend permission *catalog* still lists modules (`employees`, `worklogs`, `payments`, `products`, `customers`, `stock`) but the corresponding domain controllers do not exist yet — this frontend is a base platform with only auth/permissions/resources implemented end-to-end. New domain features need both a backend controller and a frontend module.

**Route protection**: All routes except `/auth/login` require `authGuard`. Admin routes additionally require the `'Administrador'` role via `route.data['roles']`. For resource-level gating, use `resourceAccessGuard` with `data: { resource: 'code', requiredLevel: PermissionLevel.Read }`.

**Component pattern**: All feature components are standalone. Forms open in Material dialogs. Data is loaded in `ngOnInit()` with a loading spinner. Use `.subscribe()` for HTTP calls — not async pipe.

**New feature module checklist**: Create a standalone component under `modules/`, add the route to `app.routes.ts` with the appropriate guard and `data` (roles/permissions), add navigation link in `LayoutComponent` with role visibility.
