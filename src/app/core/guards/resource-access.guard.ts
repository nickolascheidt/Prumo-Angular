import { Injectable, inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { PermissionService } from '../services/permission.service';
import { PermissionLevel } from '../models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ResourceAccessGuard {
  constructor(
    private authService: AuthService,
    private permissionService: PermissionService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    // First check if user is authenticated
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/auth/login'], { queryParams: { returnUrl: state.url } });
      return false;
    }

    // Get resource code and required level from route data
    const resourceCode = route.data['resource'] as string;
    const requiredLevel = (route.data['requiredLevel'] as PermissionLevel) ?? PermissionLevel.Read;

    // If no resource is specified, allow access (fallback to auth guard)
    if (!resourceCode) {
      return true;
    }

    // Check if user has required access level for the resource
    if (this.permissionService.userCanAccessResource(resourceCode, requiredLevel)) {
      return true;
    }

    // Access denied - redirect to dashboard.
    // O aviso é diagnóstico de desenvolvimento: em produção ele só contaria a
    // estranhos o que existe e o que faz falta para alcançar.
    if (!environment.production) {
      console.warn(
        `Acesso negado ao recurso: ${resourceCode} (nível exigido: ${requiredLevel})`
      );
    }
    this.router.navigate(['/dashboard']);
    return false;
  }
}

/**
 * Functional guard to protect routes based on resource access with permission level
 *
 * Usage in routes:
 * {
 *   path: 'reports',
 *   component: ReportsComponent,
 *   canActivate: [resourceAccessGuard],
 *   data: {
 *     resource: 'reports',
 *     requiredLevel: PermissionLevel.Read  // or Write, Full
 *   }
 * }
 */
export const resourceAccessGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const permissionService = inject(PermissionService);
  const router = inject(Router);

  // First check if user is authenticated
  if (!authService.isAuthenticated()) {
    router.navigate(['/auth/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }

  // Get resource code and required level from route data
  const resourceCode = route.data['resource'] as string;
  const requiredLevel = (route.data['requiredLevel'] as PermissionLevel) ?? PermissionLevel.Read;

  // If no resource is specified, allow access (fallback to auth guard)
  if (!resourceCode) {
    return true;
  }

  // Check if user has required access level for the resource
  if (permissionService.userCanAccessResource(resourceCode, requiredLevel)) {
    return true;
  }

  // Access denied - redirect to dashboard. Ver a nota no guard de classe acima.
  if (!environment.production) {
    console.warn(
      `Acesso negado ao recurso: ${resourceCode} (nível exigido: ${requiredLevel})`
    );
  }
  router.navigate(['/dashboard']);
  return false;
};
