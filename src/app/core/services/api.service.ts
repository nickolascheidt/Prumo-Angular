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
  PermissionLevel,
  Tenant,
  TenantMembership,
  TenantMember,
  CreateTenantRequest,
  AddTenantMemberRequest,
  SelectTenantRequest,
  ApiKey,
  CreateApiKeyRequest,
  CreateApiKeyResponse,
  AccountsPayableCategory,
  CreateAccountsPayableCategoryRequest,
  AccountsPayableEntry,
  CreateAccountsPayableEntryRequest,
  UpdateAccountsPayableEntryRequest,
  MarkAccountsPayablePaidRequest,
  CancelAccountsPayableRequest,
  BulkCreateAccountsPayableRequest,
  BulkCreateAccountsPayableResponse,
  AccountsPayableListParams,
  AccountsPayableSummary,
  PaginatedResponse
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

  // Tenant Endpoints
  createTenant(data: CreateTenantRequest): Observable<Tenant> {
    return this.http.post<Tenant>(`${this.apiUrl}/tenants`, data);
  }

  getMyTenantMemberships(): Observable<TenantMembership[]> {
    return this.http.get<TenantMembership[]>(`${this.apiUrl}/tenants/me`);
  }

  getTenantById(tenantId: string): Observable<Tenant> {
    return this.http.get<Tenant>(`${this.apiUrl}/tenants/${encodeURIComponent(tenantId)}`);
  }

  selectTenant(data: SelectTenantRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/tenants/select`, data);
  }

  getTenantMembers(tenantId: string): Observable<TenantMember[]> {
    return this.http.get<TenantMember[]>(`${this.apiUrl}/tenants/${encodeURIComponent(tenantId)}/members`);
  }

  addTenantMember(tenantId: string, data: AddTenantMemberRequest): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/tenants/${encodeURIComponent(tenantId)}/members`, data);
  }

  removeTenantMember(tenantId: string, userId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/tenants/${encodeURIComponent(tenantId)}/members/${encodeURIComponent(userId)}`
    );
  }

  // API Keys Endpoints (tenant-scoped)
  listApiKeys(tenantId: string): Observable<ApiKey[]> {
    return this.http.get<ApiKey[]>(`${this.apiUrl}/tenants/${encodeURIComponent(tenantId)}/api-keys`);
  }

  createApiKey(tenantId: string, data: CreateApiKeyRequest): Observable<CreateApiKeyResponse> {
    return this.http.post<CreateApiKeyResponse>(
      `${this.apiUrl}/tenants/${encodeURIComponent(tenantId)}/api-keys`,
      data
    );
  }

  revokeApiKey(tenantId: string, apiKeyId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/tenants/${encodeURIComponent(tenantId)}/api-keys/${encodeURIComponent(apiKeyId)}`
    );
  }

  // Accounts Payable Endpoints (tenant-scoped)
  private accountsPayableUrl(tenantId: string): string {
    return `${this.apiUrl}/tenants/${encodeURIComponent(tenantId)}/accounts-payable`;
  }

  getAccountsPayableCategories(tenantId: string): Observable<AccountsPayableCategory[]> {
    return this.http.get<AccountsPayableCategory[]>(`${this.accountsPayableUrl(tenantId)}/categories`);
  }

  createAccountsPayableCategory(
    tenantId: string,
    payload: CreateAccountsPayableCategoryRequest
  ): Observable<AccountsPayableCategory> {
    return this.http.post<AccountsPayableCategory>(
      `${this.accountsPayableUrl(tenantId)}/categories`,
      payload
    );
  }

  listAccountsPayableEntries(
    tenantId: string,
    params: AccountsPayableListParams = {}
  ): Observable<PaginatedResponse<AccountsPayableEntry>> {
    return this.http.get<PaginatedResponse<AccountsPayableEntry>>(
      `${this.accountsPayableUrl(tenantId)}/entries`,
      { params: this.buildAccountsPayableParams(params) }
    );
  }

  getAccountsPayableEntryById(tenantId: string, id: string): Observable<AccountsPayableEntry> {
    return this.http.get<AccountsPayableEntry>(
      `${this.accountsPayableUrl(tenantId)}/entries/${encodeURIComponent(id)}`
    );
  }

  createAccountsPayableEntry(
    tenantId: string,
    payload: CreateAccountsPayableEntryRequest
  ): Observable<AccountsPayableEntry> {
    return this.http.post<AccountsPayableEntry>(
      `${this.accountsPayableUrl(tenantId)}/entries`,
      payload
    );
  }

  updateAccountsPayableEntry(
    tenantId: string,
    id: string,
    payload: UpdateAccountsPayableEntryRequest
  ): Observable<AccountsPayableEntry> {
    return this.http.put<AccountsPayableEntry>(
      `${this.accountsPayableUrl(tenantId)}/entries/${encodeURIComponent(id)}`,
      payload
    );
  }

  markAccountsPayableEntryPaid(
    tenantId: string,
    id: string,
    payload: MarkAccountsPayablePaidRequest
  ): Observable<AccountsPayableEntry> {
    return this.http.post<AccountsPayableEntry>(
      `${this.accountsPayableUrl(tenantId)}/entries/${encodeURIComponent(id)}/mark-paid`,
      payload
    );
  }

  cancelAccountsPayableEntry(
    tenantId: string,
    id: string,
    payload: CancelAccountsPayableRequest
  ): Observable<AccountsPayableEntry> {
    return this.http.post<AccountsPayableEntry>(
      `${this.accountsPayableUrl(tenantId)}/entries/${encodeURIComponent(id)}/cancel`,
      payload
    );
  }

  bulkCreateAccountsPayableEntries(
    tenantId: string,
    payload: BulkCreateAccountsPayableRequest
  ): Observable<BulkCreateAccountsPayableResponse> {
    return this.http.post<BulkCreateAccountsPayableResponse>(
      `${this.accountsPayableUrl(tenantId)}/entries/bulk`,
      payload
    );
  }

  getAccountsPayableSummary(
    tenantId: string,
    from?: string,
    to?: string,
    otherFilters: Omit<AccountsPayableListParams, 'from' | 'to' | 'page' | 'pageSize'> = {}
  ): Observable<AccountsPayableSummary> {
    const params = this.buildAccountsPayableParams({ ...otherFilters, from, to });
    return this.http.get<AccountsPayableSummary>(
      `${this.accountsPayableUrl(tenantId)}/summary`,
      { params }
    );
  }

  exportAccountsPayableCsv(
    tenantId: string,
    filters: AccountsPayableListParams = {}
  ): Observable<Blob> {
    return this.http.get(`${this.accountsPayableUrl(tenantId)}/export/csv`, {
      params: this.buildAccountsPayableParams(filters),
      responseType: 'blob' as const
    });
  }

  private buildAccountsPayableParams(filters: AccountsPayableListParams): HttpParams {
    let params = new HttpParams();
    if (filters.from) params = params.set('from', filters.from);
    if (filters.to) params = params.set('to', filters.to);
    if (filters.status) params = params.set('status', filters.status);
    if (filters.categoryId) params = params.set('categoryId', filters.categoryId);
    if (filters.paymentMethod) params = params.set('paymentMethod', filters.paymentMethod);
    if (filters.search?.trim()) params = params.set('search', filters.search.trim());
    if (filters.page != null) params = params.set('page', String(filters.page));
    if (filters.pageSize != null) params = params.set('pageSize', String(filters.pageSize));
    return params;
  }
}
