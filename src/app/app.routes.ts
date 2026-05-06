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
import { AccountsPayableListComponent } from './modules/accounts-payable/list/accounts-payable-list.component';
import { AccountsPayableFormComponent } from './modules/accounts-payable/form/accounts-payable-form.component';
import { ChartOfAccountsComponent } from './modules/finance/chart-of-accounts/chart-of-accounts.component';
import { GeneralLedgerComponent } from './modules/finance/general-ledger/general-ledger.component';
import { EmployeesComponent } from './modules/hr/employees/employees.component';
import { WorklogsComponent } from './modules/hr/worklogs/worklogs.component';
import { HrPaymentsComponent } from './modules/hr/payments/payments.component';

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
            path: 'accounting',
            component: DashboardAccountingComponent,
            data: { roles: ['Administrador', 'Funcionario'] }
          },
          { path: 'finance', component: DashboardFinanceComponent },
          {
            path: 'admin',
            component: DashboardAdminComponent,
            data: { roles: ['Administrador'] }
          }
        ]
      },
      {
        path: 'accounts-payable',
        component: AccountsPayableListComponent,
        data: { roles: ['Administrador', 'Funcionario'] }
      },
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
      { path: 'finance/general-ledger', component: GeneralLedgerComponent },
      { path: 'hr/employees', component: EmployeesComponent },
      { path: 'hr/worklogs', component: WorklogsComponent },
      { path: 'hr/payments', component: HrPaymentsComponent }
    ]
  }
];
