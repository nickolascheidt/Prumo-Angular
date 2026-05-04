# Dashboard Hub Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert `/dashboard` into a tabbed hub with child routes (Visão Geral, Contabilidade, Financeiro, Administração); move the AP list under Contabilidade; redirect `/accounts-payable` to `/dashboard/contabilidade`.

**Architecture:** The existing `DashboardComponent` becomes the hub shell — a `mat-tab-nav-bar` driving a `<router-outlet>`. Four child-route components sit under `modules/dashboard/`: `overview/` (current welcome content), `accounting/` (wraps `AccountsPayableListComponent`), `finance/` (stub), `admin/` (stub). App routes are restructured with a child-route block; a flat redirect keeps the old AP URL alive. Form routes (`/accounts-payable/new`, `/accounts-payable/:id/edit`) are unchanged.

**Tech Stack:** Angular 18 standalone components, Angular Material `mat-tab-nav-bar` + `mat-tab-nav-panel`, Angular Router child routes.

---

## File Map

| Action | Path | Role |
|--------|------|------|
| Modify | `src/app/modules/dashboard/dashboard.component.ts` | Hub shell — tab nav + router-outlet |
| Modify | `src/app/modules/dashboard/dashboard.component.html` | Hub template |
| Modify | `src/app/modules/dashboard/dashboard.component.scss` | Hub styles (tab bar chrome) |
| Create | `src/app/modules/dashboard/overview/dashboard-overview.component.ts` | Welcome screen (current content) |
| Create | `src/app/modules/dashboard/overview/dashboard-overview.component.html` | Current dashboard HTML |
| Create | `src/app/modules/dashboard/overview/dashboard-overview.component.scss` | Current dashboard SCSS |
| Create | `src/app/modules/dashboard/accounting/dashboard-accounting.component.ts` | Thin wrapper for AccountsPayableListComponent |
| Create | `src/app/modules/dashboard/accounting/dashboard-accounting.component.html` | `<app-accounts-payable-list>` |
| Create | `src/app/modules/dashboard/finance/dashboard-finance.component.ts` | Placeholder stub |
| Create | `src/app/modules/dashboard/finance/dashboard-finance.component.html` | Placeholder HTML |
| Create | `src/app/modules/dashboard/admin/dashboard-admin.component.ts` | Placeholder stub |
| Create | `src/app/modules/dashboard/admin/dashboard-admin.component.html` | Placeholder HTML |
| Modify | `src/app/app.routes.ts` | Restructure dashboard as child routes + redirect |

---

## Task 1: Overview child component (extract current welcome content)

**Files:**
- Create: `src/app/modules/dashboard/overview/dashboard-overview.component.ts`
- Create: `src/app/modules/dashboard/overview/dashboard-overview.component.html`
- Create: `src/app/modules/dashboard/overview/dashboard-overview.component.scss`

- [ ] Create `dashboard-overview.component.ts`:

```typescript
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '@core/services';
import { User } from '@core/models';

@Component({
  selector: 'app-dashboard-overview',
  standalone: true,
  imports: [CommonModule, RouterModule, MatCardModule, MatIconModule, MatButtonModule],
  templateUrl: './dashboard-overview.component.html',
  styleUrls: ['./dashboard-overview.component.scss']
})
export class DashboardOverviewComponent {
  currentUser$: Observable<User | null>;
  constructor(private authService: AuthService) {
    this.currentUser$ = this.authService.currentUser$;
  }
}
```

- [ ] Create `dashboard-overview.component.html` (current dashboard.component.html content verbatim)

- [ ] Create `dashboard-overview.component.scss` (current dashboard.component.scss content verbatim)

- [ ] Commit:
```bash
git add src/app/modules/dashboard/overview/
git commit -m "feat: extract dashboard overview into child component"
```

---

## Task 2: Accounting child component (AP wrapper)

**Files:**
- Create: `src/app/modules/dashboard/accounting/dashboard-accounting.component.ts`
- Create: `src/app/modules/dashboard/accounting/dashboard-accounting.component.html`

- [ ] Create `dashboard-accounting.component.ts`:

```typescript
import { Component } from '@angular/core';
import { AccountsPayableListComponent } from '../../accounts-payable/list/accounts-payable-list.component';

@Component({
  selector: 'app-dashboard-accounting',
  standalone: true,
  imports: [AccountsPayableListComponent],
  templateUrl: './dashboard-accounting.component.html'
})
export class DashboardAccountingComponent {}
```

- [ ] Create `dashboard-accounting.component.html`:

```html
<app-accounts-payable-list></app-accounts-payable-list>
```

- [ ] Commit:
```bash
git add src/app/modules/dashboard/accounting/
git commit -m "feat: add accounting dashboard wrapping AP list"
```

---

## Task 3: Finance and Admin placeholder stubs

**Files:**
- Create: `src/app/modules/dashboard/finance/dashboard-finance.component.ts`
- Create: `src/app/modules/dashboard/finance/dashboard-finance.component.html`
- Create: `src/app/modules/dashboard/admin/dashboard-admin.component.ts`
- Create: `src/app/modules/dashboard/admin/dashboard-admin.component.html`

- [ ] Create `dashboard-finance.component.ts`:

```typescript
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-dashboard-finance',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './dashboard-finance.component.html'
})
export class DashboardFinanceComponent {}
```

- [ ] Create `dashboard-finance.component.html`:

```html
<div class="dash-placeholder">
  <mat-icon>bar_chart</mat-icon>
  <h2>Financeiro</h2>
  <p>Dashboards financeiros em breve.</p>
</div>
```

- [ ] Create `dashboard-admin.component.ts`:

```typescript
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-dashboard-admin',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './dashboard-admin.component.html'
})
export class DashboardAdminComponent {}
```

- [ ] Create `dashboard-admin.component.html`:

```html
<div class="dash-placeholder">
  <mat-icon>admin_panel_settings</mat-icon>
  <h2>Administração</h2>
  <p>Dashboards administrativos em breve.</p>
</div>
```

- [ ] Commit:
```bash
git add src/app/modules/dashboard/finance/ src/app/modules/dashboard/admin/
git commit -m "feat: add finance and admin dashboard stubs"
```

---

## Task 4: Convert DashboardComponent into the hub shell

**Files:**
- Modify: `src/app/modules/dashboard/dashboard.component.ts`
- Modify: `src/app/modules/dashboard/dashboard.component.html`
- Modify: `src/app/modules/dashboard/dashboard.component.scss`

- [ ] Replace `dashboard.component.ts`:

```typescript
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { Observable } from 'rxjs';
import { AuthService } from '@core/services';
import { User } from '@core/models';

interface DashTab {
  label: string;
  route: string;
  roles?: string[];
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, MatTabsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {
  currentUser$: Observable<User | null>;

  readonly tabs: DashTab[] = [
    { label: 'Visão Geral', route: 'overview' },
    { label: 'Contabilidade', route: 'contabilidade', roles: ['Administrador', 'Funcionario'] },
    { label: 'Financeiro', route: 'financeiro' },
    { label: 'Administração', route: 'admin', roles: ['Administrador'] }
  ];

  constructor(private authService: AuthService) {
    this.currentUser$ = this.authService.currentUser$;
  }

  hasAccess(tab: DashTab, user: User | null): boolean {
    if (!tab.roles?.length) return true;
    const userRoles = user?.roles ?? [];
    return tab.roles.some(r => userRoles.includes(r));
  }
}
```

- [ ] Replace `dashboard.component.html`:

```html
<div class="dash-hub" *ngIf="currentUser$ | async as user">
  <nav mat-tab-nav-bar [tabPanel]="tabPanel" color="primary" class="dash-hub__nav">
    <ng-container *ngFor="let tab of tabs">
      <a
        *ngIf="hasAccess(tab, user)"
        mat-tab-link
        [routerLink]="tab.route"
        routerLinkActive
        #rla="routerLinkActive"
        [active]="rla.isActive"
      >{{ tab.label }}</a>
    </ng-container>
  </nav>
  <mat-tab-nav-panel #tabPanel class="dash-hub__panel">
    <router-outlet></router-outlet>
  </mat-tab-nav-panel>
</div>
```

- [ ] Replace `dashboard.component.scss`:

```scss
.dash-hub {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.dash-hub__nav {
  border-bottom: 1px solid var(--color-border);
  background: #fff;
  flex-shrink: 0;
}

.dash-hub__panel {
  flex: 1;
  overflow: auto;
}

/* Shared placeholder style used by stub dashboards */
:host ::ng-deep .dash-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 80px 24px;
  color: var(--color-text-muted);
  text-align: center;

  mat-icon { font-size: 48px; width: 48px; height: 48px; opacity: 0.4; }
  h2 { margin: 0; font-size: 20px; font-weight: 600; }
  p { margin: 0; font-size: 14px; }
}
```

- [ ] Commit:
```bash
git add src/app/modules/dashboard/dashboard.component.ts \
        src/app/modules/dashboard/dashboard.component.html \
        src/app/modules/dashboard/dashboard.component.scss
git commit -m "feat: convert DashboardComponent into tabbed hub shell"
```

---

## Task 5: Restructure app routes

**Files:**
- Modify: `src/app/app.routes.ts`

- [ ] Replace the `app.routes.ts` content with child routes for dashboard and redirect for AP:

```typescript
import { Routes, CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { authGuard } from './core/guards';
import { AuthService } from './core/services';
import { LayoutComponent } from './shared/components/layout/layout.component';
import { LoginComponent } from './modules/auth/login/login.component';
import { TenantSelectionComponent } from './modules/auth/tenant-selection/tenant-selection.component';
import { DashboardComponent } from './modules/dashboard/dashboard.component';
import { DashboardOverviewComponent } from './modules/dashboard/overview/dashboard-overview.component';
import { DashboardAccountingComponent } from './modules/dashboard/accounting/dashboard-accounting.component';
import { DashboardFinanceComponent } from './modules/dashboard/finance/dashboard-finance.component';
import { DashboardAdminComponent } from './modules/dashboard/admin/dashboard-admin.component';
import { PermissionsManagementComponent } from './modules/admin/permissions-management.component';
import { UsersRolesManagementComponent } from './modules/admin/users-roles-management.component';
import { TenantManagementComponent } from './modules/admin/tenant-management.component';
import { AccountsPayableFormComponent } from './modules/accounts-payable/form/accounts-payable-form.component';
import { ChartOfAccountsComponent } from './modules/finance/chart-of-accounts/chart-of-accounts.component';
import { GeneralLedgerComponent } from './modules/finance/general-ledger/general-ledger.component';

const tenantSelectionGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isAuthenticated()) {
    router.navigate(['/auth/login']);
    return false;
  }
  return true;
};

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'auth',
    children: [
      { path: 'login', component: LoginComponent },
      { path: 'select-tenant', component: TenantSelectionComponent, canActivate: [tenantSelectionGuard] }
    ]
  },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        component: DashboardComponent,
        children: [
          { path: '', redirectTo: 'overview', pathMatch: 'full' },
          { path: 'overview', component: DashboardOverviewComponent },
          {
            path: 'contabilidade',
            component: DashboardAccountingComponent,
            data: { roles: ['Administrador', 'Funcionario'] }
          },
          { path: 'financeiro', component: DashboardFinanceComponent },
          {
            path: 'admin',
            component: DashboardAdminComponent,
            data: { roles: ['Administrador'] }
          }
        ]
      },
      // Redirect old AP list URL → accounting dashboard
      { path: 'accounts-payable', redirectTo: '/dashboard/contabilidade', pathMatch: 'full' },
      // AP form routes stay as standalone pages
      {
        path: 'accounts-payable/new',
        component: AccountsPayableFormComponent,
        data: { roles: ['Administrador', 'Funcionario'] }
      },
      {
        path: 'accounts-payable/:id/edit',
        component: AccountsPayableFormComponent,
        data: { roles: ['Administrador', 'Funcionario'] }
      },
      { path: 'admin/permissions', component: PermissionsManagementComponent, data: { roles: ['Administrador'] } },
      { path: 'admin/users-roles', component: UsersRolesManagementComponent, data: { roles: ['Administrador'] } },
      { path: 'admin/tenant', component: TenantManagementComponent },
      { path: 'finance/chart-of-accounts', component: ChartOfAccountsComponent },
      { path: 'finance/general-ledger', component: GeneralLedgerComponent }
    ]
  }
];
```

- [ ] Commit:
```bash
git add src/app/app.routes.ts
git commit -m "feat: restructure dashboard routes as hub with child routes, redirect /accounts-payable"
```

---

## Task 6: Build verification

- [ ] Run build and confirm zero errors:
```bash
npm run build 2>&1 | tail -20
```
Expected: `Build at: ... - Hash: ...` with no error lines.

- [ ] Manual smoke-test checklist:
  - Navigate to `/dashboard` → redirects to `/dashboard/overview`, shows welcome screen
  - Click "Contabilidade" tab → shows AP list with filters and summary KPIs
  - Click "Financeiro" tab → shows placeholder message
  - Click "Administração" tab (as Administrador) → shows placeholder message
  - Navigate to `/accounts-payable` → redirects to `/dashboard/contabilidade`
  - Navigate to `/accounts-payable/new` → opens AP form (unchanged)
  - AP "Novo Lançamento" button still navigates to `/accounts-payable/new`
