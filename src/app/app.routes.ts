import { Routes } from '@angular/router';
import { authGuard } from './core/guards';
import { LayoutComponent } from './shared/components/layout/layout.component';
import { LoginComponent } from './modules/auth/login/login.component';
import { DashboardComponent } from './modules/dashboard/dashboard.component';
import { AdminPanelComponent } from './modules/admin/admin-panel.component';
import { PermissionsManagementComponent } from './modules/admin/permissions-management.component';
import { UsersRolesManagementComponent } from './modules/admin/users-roles-management.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        component: LoginComponent
      }
    ]
  },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        component: DashboardComponent
      },
      {
        path: 'admin',
        component: AdminPanelComponent,
        data: { roles: ['Administrador'] }
      },
      {
        path: 'admin/permissions',
        component: PermissionsManagementComponent,
        data: { roles: ['Administrador'] }
      },
      {
        path: 'admin/users-roles',
        component: UsersRolesManagementComponent,
        data: { roles: ['Administrador'] }
      }
    ]
  }
];
