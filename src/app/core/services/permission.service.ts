import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import {
  PermissionItem,
  RolePermissionsResponse,
  GrantPermissionRequest,
  PermissionAuditLog,
  UserResourcePermissions,
  PermissionLevel
} from '../models';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class PermissionService {
  private userPermissionsSubject = new BehaviorSubject<string[]>([]);
  public userPermissions$ = this.userPermissionsSubject.asObservable();
  
  private userResourcePermissionsSubject = new BehaviorSubject<UserResourcePermissions | null>(null);
  public userResourcePermissions$ = this.userResourcePermissionsSubject.asObservable();

  constructor(private apiService: ApiService) {}

  /**
   * Get all available permissions in the system
   */
  getAllPermissions(): Observable<PermissionItem[]> {
    return this.apiService.getPermissions();
  }

  /**
   * Get permissions for a specific role
   */
  getPermissionsByRole(roleName: string): Observable<RolePermissionsResponse> {
    return this.apiService.getRolePermissions(roleName);
  }

  /**
   * Grant a permission to a role
   */
  grantPermissionToRole(roleName: string, request: GrantPermissionRequest): Observable<any> {
    return this.apiService.grantPermissionToRole(roleName, request);
  }

  /**
   * Revoke a permission from a role
   */
  revokePermissionFromRole(roleName: string, permissionName: string, reason?: string): Observable<any> {
    return this.apiService.revokePermissionFromRole(roleName, permissionName, reason);
  }

  /**
   * Get permission audit log
   */
  getPermissionAudit(top?: number): Observable<PermissionAuditLog[]> {
    return this.apiService.getPermissionAudit(undefined, top || 100);
  }

  /**
   * Set current user permissions
   */
  setUserPermissions(permissions: string[]): void {
    this.userPermissionsSubject.next(permissions);
  }

  /**
   * Get current user permissions
   */
  getUserPermissions(): string[] {
    return this.userPermissionsSubject.getValue();
  }

  /**
   * Check if user has a specific permission
   */
  userHasPermission(permission: string): boolean {
    const permissions = this.getUserPermissions();
    return permissions && permissions.includes(permission);
  }

  /**
   * Check if user has any of the provided permissions
   */
  userHasAnyPermission(permissions: string[]): boolean {
    const userPermissions = this.getUserPermissions();
    return permissions && permissions.some(p => userPermissions && userPermissions.includes(p));
  }

  /**
   * Check if user has all of the provided permissions
   */
  userHasAllPermissions(permissions: string[]): boolean {
    const userPermissions = this.getUserPermissions();
    return permissions && permissions.every(p => userPermissions && userPermissions.includes(p));
  }

  /**
   * Set user resource permissions
   */
  setUserResourcePermissions(resourcePerms: UserResourcePermissions): void {
    this.userResourcePermissionsSubject.next(resourcePerms);
  }

  /**
   * Get user resource permissions
   */
  getUserResourcePermissions(): UserResourcePermissions | null {
    return this.userResourcePermissionsSubject.getValue();
  }

  /**
   * Check if user can access a specific resource with minimum permission level
   * @param resourceCode The resource code to check (e.g., "employees", "worklogs")
   * @param minLevel Minimum permission level required (default: Read)
   * @returns true if user has at least the required permission level
   */
  userCanAccessResource(resourceCode: string, minLevel: PermissionLevel = PermissionLevel.Read): boolean {
    const resourcePerms = this.getUserResourcePermissions();
    if (!resourcePerms || !resourcePerms.resources) {
      return false;
    }

    const resource = resourcePerms.resources.find(r => r.resourceCode.toLowerCase() === resourceCode.toLowerCase());
    if (!resource) {
      return false;
    }

    return resource.level >= minLevel;
  }

  /**
   * Get the permission level for a specific resource
   * @param resourceCode The resource code to check
   * @returns The permission level (None if not found)
   */
  getUserResourcePermissionLevel(resourceCode: string): PermissionLevel {
    const resourcePerms = this.getUserResourcePermissions();
    if (!resourcePerms || !resourcePerms.resources) {
      return PermissionLevel.None;
    }

    const resource = resourcePerms.resources.find(r => r.resourceCode.toLowerCase() === resourceCode.toLowerCase());
    return resource?.level ?? PermissionLevel.None;
  }

  /**
   * Check if user has Read access to a resource
   */
  userCanReadResource(resourceCode: string): boolean {
    return this.userCanAccessResource(resourceCode, PermissionLevel.Read);
  }

  /**
   * Check if user has Write access to a resource
   */
  userCanWriteResource(resourceCode: string): boolean {
    return this.userCanAccessResource(resourceCode, PermissionLevel.Write);
  }

  /**
   * Check if user has Full access to a resource
   */
  userCanFullAccessResource(resourceCode: string): boolean {
    return this.userCanAccessResource(resourceCode, PermissionLevel.Full);
  }

  /**
   * Get all resources the user has access to
   */
  getUserAccessibleResources(): UserResourcePermissions | null {
    return this.getUserResourcePermissions();
  }
}
