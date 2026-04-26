import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  LoginRequest,
  AuthResponse,
  PermissionItem,
  RolePermissionsResponse,
  GrantPermissionRequest,
  PermissionActionResponse,
  PermissionAuditLog,
  PermissionCatalog,
  AppUserSummary,
  AssignUserRoleRequest,
  UserRolesResponse,
  Resource,
  ResourcePermission,
  UserResourcePermissions,
  AssignResourcePermissionRequest,
  CreateResourceRequest,
  UpdateResourceRequest,
  PermissionLevel
} from '../models';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly apiUrl = 'http://localhost:5201/api';

  constructor(private http: HttpClient) {}

  // Auth Endpoints
  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, credentials);
  }

  register(data: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/register`, data);
  }

  registerAdmin(data: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/register/admin`, data);
  }

  getCurrentUser(): Observable<any> {
    return this.http.get(`${this.apiUrl}/auth/me`);
  }

  changePassword(currentPassword: string, newPassword: string): Observable<PermissionActionResponse> {
    return this.http.post<PermissionActionResponse>(`${this.apiUrl}/auth/change-password`, {
      currentPassword,
      newPassword
    });
  }

  getUsers(): Observable<AppUserSummary[]> {
    return this.http.get<AppUserSummary[]>(`${this.apiUrl}/auth/users`);
  }

  getUserRoles(userId: string): Observable<UserRolesResponse> {
    return this.http.get<UserRolesResponse>(`${this.apiUrl}/auth/users/${encodeURIComponent(userId)}/roles`);
  }

  assignRoleToUser(userId: string, data: AssignUserRoleRequest): Observable<PermissionActionResponse> {
    return this.http.post<PermissionActionResponse>(`${this.apiUrl}/auth/users/${encodeURIComponent(userId)}/roles`, data);
  }

  removeRoleFromUser(userId: string, roleName: string): Observable<PermissionActionResponse> {
    return this.http.delete<PermissionActionResponse>(`${this.apiUrl}/auth/users/${encodeURIComponent(userId)}/roles/${encodeURIComponent(roleName)}`);
  }

  deleteUser(userId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/auth/users/${encodeURIComponent(userId)}`);
  }

  // Permission Endpoints
  getPermissions(): Observable<PermissionItem[]> {
    return this.http.get<PermissionItem[]>(`${this.apiUrl}/permissions`);
  }

  getPermissionCatalog(): Observable<PermissionCatalog> {
    return this.http.get<PermissionCatalog>(`${this.apiUrl}/permissions/catalog`);
  }

  getRolePermissions(roleName: string): Observable<RolePermissionsResponse> {
    return this.http.get<RolePermissionsResponse>(`${this.apiUrl}/permissions/roles/${encodeURIComponent(roleName)}`);
  }

  grantPermissionToRole(roleName: string, data: GrantPermissionRequest): Observable<PermissionActionResponse> {
    return this.http.post<PermissionActionResponse>(`${this.apiUrl}/permissions/roles/${encodeURIComponent(roleName)}/grant`, data);
  }

  revokePermissionFromRole(roleName: string, permissionName: string, reason?: string): Observable<PermissionActionResponse> {
    let params = new HttpParams();
    if (reason?.trim()) {
      params = params.set('reason', reason.trim());
    }

    return this.http.delete<PermissionActionResponse>(
      `${this.apiUrl}/permissions/roles/${encodeURIComponent(roleName)}/revoke/${encodeURIComponent(permissionName)}`,
      { params }
    );
  }

  getPermissionAudit(roleName?: string, take: number = 100): Observable<PermissionAuditLog[]> {
    let params = new HttpParams().set('take', take);
    if (roleName?.trim()) {
      params = params.set('roleName', roleName.trim());
    }

    return this.http.get<PermissionAuditLog[]>(`${this.apiUrl}/permissions/audit`, { params });
  }

  // Resource Endpoints
  getResources(): Observable<Resource[]> {
    return this.http.get<Resource[]>(`${this.apiUrl}/resources`);
  }

  getResourceById(id: string): Observable<Resource> {
    return this.http.get<Resource>(`${this.apiUrl}/resources/${id}`);
  }

  createResource(data: CreateResourceRequest): Observable<Resource> {
    return this.http.post<Resource>(`${this.apiUrl}/resources`, data);
  }

  updateResource(id: string, data: UpdateResourceRequest): Observable<Resource> {
    return this.http.put<Resource>(`${this.apiUrl}/resources/${id}`, data);
  }

  deleteResource(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/resources/${id}`);
  }

  // Resource Permission Endpoints
  getUserResourcePermissions(): Observable<UserResourcePermissions> {
    return this.http.get<UserResourcePermissions>(`${this.apiUrl}/resources/my-permissions`);
  }

  checkResourceAccess(resourceCode: string, minimumLevel: PermissionLevel = PermissionLevel.Read): Observable<{
    resourceCode: string;
    hasAccess: boolean;
    userLevel: string;
    minimumLevel: string;
    canRead: boolean;
    canWrite: boolean;
    hasFull: boolean;
  }> {
    const params = new HttpParams().set('minimumLevel', minimumLevel);
    return this.http.get<any>(
      `${this.apiUrl}/resources/check-access/${encodeURIComponent(resourceCode)}`,
      { params }
    );
  }

  getUserResourcePermissionsByUserId(userId: string): Observable<UserResourcePermissions> {
    return this.http.get<UserResourcePermissions>(`${this.apiUrl}/resources/user/${encodeURIComponent(userId)}`);
  }

  getRoleResourcePermissions(roleId: string): Observable<ResourcePermission[]> {
    return this.http.get<ResourcePermission[]>(`${this.apiUrl}/resources/role/${encodeURIComponent(roleId)}`);
  }

  assignResourcePermission(data: AssignResourcePermissionRequest): Observable<PermissionActionResponse> {
    return this.http.post<PermissionActionResponse>(`${this.apiUrl}/resources/assign`, data);
  }

  removeResourcePermission(roleId: string, resourceId: string): Observable<void> {
    const params = new HttpParams()
      .set('roleId', roleId)
      .set('resourceId', resourceId);
    return this.http.delete<void>(`${this.apiUrl}/resources/remove`, { params });
  }
}
