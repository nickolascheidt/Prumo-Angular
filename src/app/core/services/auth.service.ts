import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { LoginRequest, AuthResponse, User, UserResourcePermissions, PermissionLevel } from '../models';
import { ApiService } from './api.service';
import { PermissionService } from './permission.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly tokenKey = 'saas_baseplatform_token';
  private readonly userKey = 'saas_baseplatform_user';
  private readonly permissionsKey = 'saas_baseplatform_permissions';
  private readonly resourcePermissionsKey = 'saas_baseplatform_resource_permissions';
  private currentUserSubject = new BehaviorSubject<User | null>(this.getUserFromStorage());
  public currentUser$ = this.currentUserSubject.asObservable();
  private userResourcePermissionsSubject = new BehaviorSubject<UserResourcePermissions | null>(null);
  public userResourcePermissions$ = this.userResourcePermissionsSubject.asObservable();

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
    localStorage.removeItem(this.resourcePermissionsKey);
    this.currentUserSubject.next(null);
    this.userResourcePermissionsSubject.next(null);
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

  /**
   * Get user resource permissions (granular access control)
   */
  getUserResourcePermissions(): UserResourcePermissions | null {
    const stored = localStorage.getItem(this.resourcePermissionsKey);
    return stored ? JSON.parse(stored) : null;
  }

  /**
   * Load user resource permissions from the server
   */
  loadUserResourcePermissions(): Observable<UserResourcePermissions> {
    return this.apiService.getUserResourcePermissions().pipe(
      tap(resourcePerms => this.storeResourcePermissions(resourcePerms))
    );
  }

  /**
   * Check if user can access a specific resource with minimum permission level
   */
  canAccessResource(resourceCode: string, minLevel: PermissionLevel = PermissionLevel.Read): boolean {
    return this.permissionService.userCanAccessResource(resourceCode, minLevel);
  }

  /**
   * Get permission level for a specific resource
   */
  getResourcePermissionLevel(resourceCode: string): PermissionLevel {
    return this.permissionService.getUserResourcePermissionLevel(resourceCode);
  }

  /**
   * Refresh current user data including permissions from server
   */
  refreshCurrentUser(): Observable<any> {
    return this.apiService.getCurrentUserDetails().pipe(
      tap(response => {
        if (response && response.user) {
          const user = response.user;
          localStorage.setItem(this.userKey, JSON.stringify(user));
          if (user.permissions) {
            localStorage.setItem(this.permissionsKey, JSON.stringify(user.permissions));
            this.permissionService.setUserPermissions(user.permissions);
          }
          this.currentUserSubject.next(user);
        }
      })
    );
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

  private storeResourcePermissions(resourcePerms: UserResourcePermissions): void {
    localStorage.setItem(this.resourcePermissionsKey, JSON.stringify(resourcePerms));
    this.userResourcePermissionsSubject.next(resourcePerms);
    this.permissionService.setUserResourcePermissions(resourcePerms);
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
      // Load stored resource permissions
      const resourcePerms = this.getUserResourcePermissions();
      if (resourcePerms) {
        this.userResourcePermissionsSubject.next(resourcePerms);
        this.permissionService.setUserResourcePermissions(resourcePerms);
      }
    }
  }
}
