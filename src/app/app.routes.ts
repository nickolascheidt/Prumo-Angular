import { Routes, CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { authGuard, resourceAccessGuard } from './core/guards';
import { PermissionLevel } from './core/models';
import { AuthService } from './core/services';
import { LayoutComponent } from './shared/components/layout/layout.component';
import { LoginComponent } from './modules/auth/login/login.component';
import { TenantSelectionComponent } from './modules/auth/tenant-selection/tenant-selection.component';
import { RegisterComponent } from './modules/auth/register/register.component';
import { CheckEmailComponent } from './modules/auth/check-email/check-email.component';
import { ConfirmEmailComponent } from './modules/auth/confirm-email/confirm-email.component';
import { ForgotPasswordComponent } from './modules/auth/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './modules/auth/reset-password/reset-password.component';
import { AwaitingInvitationComponent } from './modules/auth/awaiting-invitation/awaiting-invitation.component';
import { DashboardComponent } from './modules/dashboard/dashboard.component';
import { DashboardOverviewComponent } from './modules/dashboard/overview/dashboard-overview.component';
import { DashboardAccountingComponent } from './modules/dashboard/accounting/dashboard-accounting.component';
import { DashboardFinanceComponent } from './modules/dashboard/finance/dashboard-finance.component';
import { DashboardHrComponent } from './modules/dashboard/hr/dashboard-hr.component';
import { DashboardAdminComponent } from './modules/dashboard/admin/dashboard-admin.component';
import { RolesComponent } from './modules/admin/roles/roles.component';
import { AccountsPayableListComponent } from './modules/accounts-payable/list/accounts-payable-list.component';
import { AccountsPayableFormComponent } from './modules/accounts-payable/form/accounts-payable-form.component';
import { ChartOfAccountsComponent } from './modules/finance/chart-of-accounts/chart-of-accounts.component';
import { GeneralLedgerComponent } from './modules/finance/general-ledger/general-ledger.component';
import { EmployeesComponent } from './modules/hr/employees/employees.component';
import { WorklogsComponent } from './modules/hr/worklogs/worklogs.component';
import { HrPaymentsComponent } from './modules/hr/payments/payments.component';
import { PaymentPeriodsComponent } from './modules/hr/payment-periods/payment-periods.component';
import { TenantMembersComponent } from './modules/admin/tenant-members/tenant-members.component';

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
      { path: 'register', component: RegisterComponent },
      // Sem guard: são os destinos dos links de e-mail, e quem os abre ainda não tem
      // sessão. O que protege cada um é o token na URL, checado pela API.
      { path: 'check-email', component: CheckEmailComponent },
      { path: 'confirm-email', component: ConfirmEmailComponent },
      { path: 'forgot-password', component: ForgotPasswordComponent },
      { path: 'reset-password', component: ResetPasswordComponent },
      { path: 'awaiting-invitation', component: AwaitingInvitationComponent },
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
            canActivate: [resourceAccessGuard],
            data: { resource: 'Dashboard.Accounting', requiredLevel: PermissionLevel.Read }
          },
          {
            path: 'finance',
            component: DashboardFinanceComponent,
            canActivate: [resourceAccessGuard],
            data: { resource: 'Dashboard.Finance', requiredLevel: PermissionLevel.Read }
          },
          {
            path: 'hr',
            component: DashboardHrComponent,
            canActivate: [resourceAccessGuard],
            data: { resource: 'Dashboard.HR', requiredLevel: PermissionLevel.Read }
          },
          {
            path: 'admin',
            component: DashboardAdminComponent,
            canActivate: [resourceAccessGuard],
            data: { resource: 'Dashboard.Admin', requiredLevel: PermissionLevel.Read }
          }
        ]
      },
      { path: 'accounts-payable', component: AccountsPayableListComponent,
        canActivate: [resourceAccessGuard], data: { resource: 'AccountsPayable.Entries', requiredLevel: PermissionLevel.Read } },
      { path: 'accounts-payable/new', component: AccountsPayableFormComponent,
        canActivate: [resourceAccessGuard], data: { resource: 'AccountsPayable.Entries', requiredLevel: PermissionLevel.Write } },
      { path: 'accounts-payable/:id/edit', component: AccountsPayableFormComponent,
        canActivate: [resourceAccessGuard], data: { resource: 'AccountsPayable.Entries', requiredLevel: PermissionLevel.Write } },
      { path: 'admin/roles', component: RolesComponent,
        canActivate: [resourceAccessGuard], data: { resource: 'Role.Management', requiredLevel: PermissionLevel.Read } },
      // A tela de permissões virou a tela de roles: criar a role e definir o que ela
      // alcança são o mesmo trabalho.
      { path: 'admin/permissions', redirectTo: 'admin/roles', pathMatch: 'full' },
      { path: 'admin/members', component: TenantMembersComponent,
        canActivate: [resourceAccessGuard], data: { resource: 'User.Management', requiredLevel: PermissionLevel.Read } },
      // As duas telas antigas foram fundidas em /admin/members. O redirect existe só
      // para não quebrar link salvo; /admin/tenant era a única rota admin sem guard,
      // e o destino tem.
      { path: 'admin/users-roles', redirectTo: 'admin/members', pathMatch: 'full' },
      { path: 'admin/tenant', redirectTo: 'admin/members', pathMatch: 'full' },
      { path: 'finance/chart-of-accounts', component: ChartOfAccountsComponent,
        canActivate: [resourceAccessGuard], data: { resource: 'ChartOfAccounts.Management', requiredLevel: PermissionLevel.Read } },
      { path: 'finance/general-ledger', component: GeneralLedgerComponent,
        canActivate: [resourceAccessGuard], data: { resource: 'GeneralLedger.Management', requiredLevel: PermissionLevel.Read } },
      { path: 'hr/employees', component: EmployeesComponent,
        canActivate: [resourceAccessGuard], data: { resource: 'HR.Employees', requiredLevel: PermissionLevel.Read } },
      { path: 'hr/worklogs', component: WorklogsComponent,
        canActivate: [resourceAccessGuard], data: { resource: 'HR.WorkLogs', requiredLevel: PermissionLevel.Read } },
      { path: 'hr/payments', component: HrPaymentsComponent,
        canActivate: [resourceAccessGuard], data: { resource: 'HR.Payments', requiredLevel: PermissionLevel.Read } },
      { path: 'hr/periodos', component: PaymentPeriodsComponent,
        canActivate: [resourceAccessGuard], data: { resource: 'HR.PaymentPeriods', requiredLevel: PermissionLevel.Read } }
    ]
  }
];
