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
