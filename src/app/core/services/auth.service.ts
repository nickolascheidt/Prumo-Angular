import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { LoginRequest, AuthResponse, User } from '../models';
import { ApiService } from './api.service';
import { PermissionService } from './permission.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly tokenKey = 'biomepampa_token';
  private readonly userKey = 'biomepampa_user';
  private readonly permissionsKey = 'biomepampa_permissions';
  private currentUserSubject = new BehaviorSubject<User | null>(this.getUserFromStorage());
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private apiService: ApiService,
    private permissionService: PermissionService
  ) {
    this.loadStoredUser();
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.apiService.login(credentials).pipe(
      tap(response => this.handleAuthSuccess(response))
    );
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    localStorage.removeItem(this.permissionsKey);
    this.currentUserSubject.next(null);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.getValue();
  }

  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user?.roles.includes(role) ?? false;
  }

  hasAnyRole(roles: string[]): boolean {
    const user = this.getCurrentUser();
    return roles.some(role => user?.roles.includes(role)) ?? false;
  }

  /**
   * Get user permissions
   */
  getPermissions(): string[] {
    const permsJson = localStorage.getItem(this.permissionsKey);
    return permsJson ? JSON.parse(permsJson) : [];
  }

  /**
   * Check if user has a specific permission
   */
  hasPermission(permission: string): boolean {
    return this.permissionService.userHasPermission(permission);
  }

  /**
   * Check if user has any of the provided permissions
   */
  hasAnyPermission(permissions: string[]): boolean {
    return this.permissionService.userHasAnyPermission(permissions);
  }

  /**
   * Check if user has all of the provided permissions
   */
  hasAllPermissions(permissions: string[]): boolean {
    return this.permissionService.userHasAllPermissions(permissions);
  }

  private handleAuthSuccess(response: AuthResponse): void {
    const token = response.token;
    const user = response.user;

    console.log('✅ Login bem-sucedido!');
    console.log('🔑 Token recebido:', token.substring(0, 20) + '...');
    console.log('👤 Usuário:', user.email);

    localStorage.setItem(this.tokenKey, token);
    localStorage.setItem(this.userKey, JSON.stringify(user));

    // Store permissions if available
    if (user.permissions) {
      localStorage.setItem(this.permissionsKey, JSON.stringify(user.permissions));
      this.permissionService.setUserPermissions(user.permissions);
    }

    this.currentUserSubject.next(user);
  }

  private getUserFromStorage(): User | null {
    const userJson = localStorage.getItem(this.userKey);
    return userJson ? JSON.parse(userJson) : null;
  }

  private loadStoredUser(): void {
    const user = this.getUserFromStorage();
    if (user) {
      this.currentUserSubject.next(user);
      // Load stored permissions
      const permissions = this.getPermissions();
      if (permissions.length > 0) {
        this.permissionService.setUserPermissions(permissions);
      }
    }
  }
}
