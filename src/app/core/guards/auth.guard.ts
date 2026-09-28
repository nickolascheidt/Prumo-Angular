import { Injectable } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { inject } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    if (this.authService.isAuthenticated()) {
      const requiredRoles = route.data['roles'] as string[];
      if (requiredRoles && !this.authService.hasAnyRole(requiredRoles)) {
        this.router.navigate(['/dashboard']);
        return false;
      }
      return true;
    }

    this.router.navigate(['/auth/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }
}

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    router.navigate(['/auth/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }

  if (!authService.hasTenantSelected()) {
    router.navigate(['/auth/select-tenant'], { queryParams: { returnUrl: state.url } });
    return false;
  }

  const requiredRoles = route.data['roles'] as string[];
  if (requiredRoles && !authService.hasAnyRole(requiredRoles)) {
    router.navigate(['/dashboard']);
    return false;
  }

  // Ensure resource permissions are loaded (in case they expired or weren't loaded)
  if (!authService.getUserResourcePermissions()) {
    authService.loadUserResourcePermissions().subscribe({
      error: (err) => console.error('Failed to load resource permissions:', err)
    });
  }

  return true;
};
