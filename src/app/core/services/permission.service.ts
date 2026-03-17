import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import {
  PermissionItem,
  RolePermissionsResponse,
  GrantPermissionRequest,
  PermissionAuditLog
} from '../models';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class PermissionService {
  private userPermissionsSubject = new BehaviorSubject<string[]>([]);
  public userPermissions$ = this.userPermissionsSubject.asObservable();

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
}
