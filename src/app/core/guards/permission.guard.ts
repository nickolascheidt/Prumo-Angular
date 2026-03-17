import { Injectable, inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { PermissionService } from '../services/permission.service';

@Injectable({
  providedIn: 'root'
})
export class PermissionGuard {
  constructor(private permissionService: PermissionService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const requiredPermissions = route.data['permissions'] as string[];
    
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const requireAll = route.data['requireAll'] as boolean | undefined;

    if (requireAll) {
      if (this.permissionService.userHasAllPermissions(requiredPermissions)) {
        return true;
      }
    } else {
      if (this.permissionService.userHasAnyPermission(requiredPermissions)) {
        return true;
      }
    }

    this.router.navigate(['/dashboard']);
    return false;
  }
}

export const permissionGuard: CanActivateFn = (route, state) => {
  const permissionService = inject(PermissionService);
  const router = inject(Router);

  const requiredPermissions = route.data['permissions'] as string[];
  
  if (!requiredPermissions || requiredPermissions.length === 0) {
    return true;
  }

  const requireAll = route.data['requireAll'] as boolean | undefined;

  if (requireAll) {
    if (permissionService.userHasAllPermissions(requiredPermissions)) {
      return true;
    }
  } else {
    if (permissionService.userHasAnyPermission(requiredPermissions)) {
      return true;
    }
  }

  router.navigate(['/dashboard']);
  return false;
};
