# Prumo ERP — Frontend

Angular 18 SPA for Prumo — a multi-tenant ERP with accounts payable, financial core (Chart of Accounts + General Ledger), role-based access control, and tenant management.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Angular 18 (standalone components) |
| UI Library | Angular Material 18 (tema Prumo próprio, M2) |
| Language | TypeScript 5.5 (strict mode) |
| Forms | ReactiveFormsModule / FormBuilder |
| State | RxJS BehaviorSubjects (no NgRx) |
| HTTP | Angular `HttpClient` + `JwtInterceptor` |
| Testing | Karma + Jasmine |

## Prerequisites

- [Node.js 20+](https://nodejs.org/)
- Backend API running at `http://localhost:5201` ([Prumo](https://github.com/nickolascheidt/Prumo))

## Getting Started

```bash
npm install
npm start        # dev server at http://localhost:4200
```

## Commands

```bash
npm start          # Dev server at http://localhost:4200
npm run build      # Development build
npm run build:prod # Production build (optimized, hashed assets)
npm test           # Run Karma/Jasmine tests
npm run lint       # Lint checks

# Run a single spec file
npx ng test --include='src/app/path/to/component.spec.ts'
```

## Project Structure

```
src/app/
├── core/
│   ├── guards/          # authGuard, permissionGuard, resourceAccessGuard
│   ├── interceptors/    # JwtInterceptor — adds Bearer token to all requests
│   ├── services/        # AuthService, ApiService, PermissionService
│   └── models/          # TypeScript interfaces and enums
├── modules/
│   ├── auth/            # LoginComponent, TenantSelectionComponent
│   ├── dashboard/       # Welcome screen
│   ├── admin/           # Permissions, user/role assignment, tenant management
│   ├── accounts-payable/ # AP entries and categories (list + form)
│   └── finance/         # Chart of Accounts, General Ledger
└── shared/
    └── components/layout/ # LayoutComponent (sidenav + toolbar)
```

## Modules & Routes

| Route | Component | Access |
|---|---|---|
| `/auth/login` | LoginComponent | Public |
| `/auth/select-tenant` | TenantSelectionComponent | Authenticated |
| `/dashboard` | DashboardComponent | All authenticated users |
| `/accounts-payable` | AccountsPayableListComponent | Administrador, Funcionario |
| `/accounts-payable/new` | AccountsPayableFormComponent | Administrador, Funcionario |
| `/accounts-payable/:id/edit` | AccountsPayableFormComponent | Administrador, Funcionario |
| `/finance/chart-of-accounts` | ChartOfAccountsComponent | Administrador |
| `/finance/general-ledger` | GeneralLedgerComponent | Administrador |
| `/admin/permissions` | PermissionsManagementComponent | Administrador |
| `/admin/users-roles` | UsersRolesManagementComponent | Administrador |
| `/admin/tenant` | TenantManagementComponent | All authenticated users |

## Authentication & Permissions

**Login bootstrap sequence:**
1. `POST /api/auth/login` → store JWT in `localStorage`
2. `GET /api/auth/me` → roles + module-level permissions
3. `GET /api/resources/my-permissions` → resource-level access (drives button visibility)

**localStorage keys:**
- `prumo_token`
- `prumo_user`
- `prumo_permissions`
- `prumo_resource_permissions`

**Dual permission system:**

| Type | Check method | Used for |
|---|---|---|
| Module permissions | `PermissionService.userHasPermission('employees.view')` | Feature-level access |
| Resource permissions | `userCanAccessResource(code, PermissionLevel.Read)` | Button/action visibility |

## API Configuration

The base URL is hardcoded in `ApiService`:
```
http://localhost:5201/api
```

All HTTP calls go through `ApiService` (`core/services/api.service.ts`). The `JwtInterceptor` automatically attaches the Bearer token to every outgoing request.

Backend errors use the envelope `{ "message": "..." }`.

## Component Conventions

- All feature components are **standalone** (no NgModules)
- Forms open in **Material dialogs**
- Data loaded in `ngOnInit()` with a loading spinner
- HTTP calls use `.subscribe()` — not the async pipe

## Adding a New Feature

1. Create a standalone component under `modules/`
2. Add the route to `app.routes.ts` with the appropriate guard and `data` (roles/permissions)
3. Add navigation entry in `LayoutComponent.menuSections` with role visibility
4. Add any new API methods to `ApiService`
5. Add TypeScript models to `core/models/index.ts`

## Related Repository

Backend: [Prumo](https://github.com/nickolascheidt/Prumo) — .NET 10 / ASP.NET Core API.
