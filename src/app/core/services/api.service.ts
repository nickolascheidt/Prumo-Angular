import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
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
  UpdateAccountsPayableCategoryRequest,
  AccountsPayableEntry,
  CreateAccountsPayableEntryRequest,
  UpdateAccountsPayableEntryRequest,
  MarkAccountsPayablePaidRequest,
  CancelAccountsPayableRequest,
  BulkCreateAccountsPayableRequest,
  BulkCreateAccountsPayableResponse,
  AccountsPayableListParams,
  AccountsPayableSummary,
  PaginatedResponse,
  Account,
  CreateAccountRequest,
  UpdateAccountRequest,
  TenantGlSettings,
  UpdateTenantGlSettingsRequest,
  JournalEntryDto,
  JournalEntryListItem,
  JournalEntryQuery,
  CreateJournalEntryRequest,
  AccountStatementDto,
  Employee,
  CreateEmployeeRequest,
  UpdateEmployeeRequest,
  WorkLog,
  CreateWorkLogRequest,
  UpdateWorkLogRequest,
  PaymentPeriodSummary,
  GeneratePaymentPeriodRequest,
  HrPayment,
  CreateHrPaymentRequest,
  UserLookupResult,
  UpdateMemberRoleRequest,
  CreateTenantUserRequest
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

  createTenantUser(tenantId: string, data: CreateTenantUserRequest): Observable<TenantMember> {
    return this.http.post<TenantMember>(`${this.apiUrl}/tenants/${encodeURIComponent(tenantId)}/users`, data);
  }

  removeTenantMember(tenantId: string, userId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/tenants/${encodeURIComponent(tenantId)}/members/${encodeURIComponent(userId)}`
    );
  }

  lookupUserByEmail(email: string): Observable<UserLookupResult | null> {
    return this.http.get<UserLookupResult>(
      `${this.apiUrl}/auth/users/lookup?email=${encodeURIComponent(email)}`
    ).pipe(catchError(() => of(null)));
  }

  updateMemberRole(tenantId: string, userId: string, request: UpdateMemberRoleRequest): Observable<void> {
    return this.http.put<void>(
      `${this.apiUrl}/tenants/${encodeURIComponent(tenantId)}/members/${encodeURIComponent(userId)}/role`,
      request
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

  updateAccountsPayableCategory(
    tenantId: string,
    id: string,
    payload: UpdateAccountsPayableCategoryRequest
  ): Observable<AccountsPayableCategory> {
    return this.http.put<AccountsPayableCategory>(
      `${this.accountsPayableUrl(tenantId)}/categories/${encodeURIComponent(id)}`,
      payload
    );
  }

  deleteAccountsPayableCategory(tenantId: string, id: string): Observable<void> {
    return this.http.delete<void>(
      `${this.accountsPayableUrl(tenantId)}/categories/${encodeURIComponent(id)}`
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
    if (filters.supplierName?.trim()) params = params.set('supplierName', filters.supplierName.trim());
    if (filters.paymentMethod) params = params.set('paymentMethod', filters.paymentMethod);
    if (filters.search?.trim()) params = params.set('search', filters.search.trim());
    if (filters.minAmount != null) params = params.set('minAmount', String(filters.minAmount));
    if (filters.maxAmount != null) params = params.set('maxAmount', String(filters.maxAmount));
    if (filters.sortBy) params = params.set('sortBy', filters.sortBy);
    if (filters.sortDir) params = params.set('sortDir', filters.sortDir);
    if (filters.page != null) params = params.set('page', String(filters.page));
    if (filters.pageSize != null) params = params.set('pageSize', String(filters.pageSize));
    return params;
  }

  // Chart of Accounts (tenant-scoped)
  private chartOfAccountsUrl(tenantId: string): string {
    return `${this.apiUrl}/tenants/${encodeURIComponent(tenantId)}/chart-of-accounts`;
  }

  getChartOfAccounts(tenantId: string, includeInactive = false): Observable<Account[]> {
    const params = new HttpParams().set('includeInactive', String(includeInactive));
    return this.http.get<Account[]>(this.chartOfAccountsUrl(tenantId), { params });
  }

  getAccountById(tenantId: string, accountId: string): Observable<Account> {
    return this.http.get<Account>(`${this.chartOfAccountsUrl(tenantId)}/${encodeURIComponent(accountId)}`);
  }

  createAccount(tenantId: string, payload: CreateAccountRequest): Observable<Account> {
    return this.http.post<Account>(this.chartOfAccountsUrl(tenantId), payload);
  }

  updateAccount(tenantId: string, accountId: string, payload: UpdateAccountRequest): Observable<Account> {
    return this.http.put<Account>(`${this.chartOfAccountsUrl(tenantId)}/${encodeURIComponent(accountId)}`, payload);
  }

  deactivateAccount(tenantId: string, accountId: string): Observable<void> {
    return this.http.delete<void>(`${this.chartOfAccountsUrl(tenantId)}/${encodeURIComponent(accountId)}`);
  }

  // General Ledger (tenant-scoped)
  private generalLedgerUrl(tenantId: string): string {
    return `${this.apiUrl}/tenants/${encodeURIComponent(tenantId)}/general-ledger`;
  }

  listJournalEntries(tenantId: string, query: JournalEntryQuery = {}): Observable<PaginatedResponse<JournalEntryListItem>> {
    let params = new HttpParams();
    if (query.from) params = params.set('from', query.from);
    if (query.to) params = params.set('to', query.to);
    if (query.sourceModule) params = params.set('sourceModule', query.sourceModule);
    if (query.page != null) params = params.set('page', String(query.page));
    if (query.pageSize != null) params = params.set('pageSize', String(query.pageSize));
    return this.http.get<PaginatedResponse<JournalEntryListItem>>(`${this.generalLedgerUrl(tenantId)}/entries`, { params });
  }

  getJournalEntry(tenantId: string, entryId: string): Observable<JournalEntryDto> {
    return this.http.get<JournalEntryDto>(`${this.generalLedgerUrl(tenantId)}/entries/${encodeURIComponent(entryId)}`);
  }

  createJournalEntry(tenantId: string, payload: CreateJournalEntryRequest): Observable<JournalEntryDto> {
    return this.http.post<JournalEntryDto>(`${this.generalLedgerUrl(tenantId)}/entries`, payload);
  }

  getAccountStatement(tenantId: string, accountId: string, from?: string, to?: string, page = 1, pageSize = 50): Observable<AccountStatementDto> {
    let params = new HttpParams().set('page', String(page)).set('pageSize', String(pageSize));
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    return this.http.get<AccountStatementDto>(`${this.generalLedgerUrl(tenantId)}/accounts/${encodeURIComponent(accountId)}/statement`, { params });
  }

  getGlSettings(tenantId: string): Observable<TenantGlSettings> {
    return this.http.get<TenantGlSettings>(`${this.generalLedgerUrl(tenantId)}/settings`);
  }

  updateGlSettings(tenantId: string, payload: UpdateTenantGlSettingsRequest): Observable<TenantGlSettings> {
    return this.http.put<TenantGlSettings>(`${this.generalLedgerUrl(tenantId)}/settings`, payload);
  }

  // ─── HR Module ────────────────────────────────────────────────────────────

  private hrUrl(tenantId: string): string {
    return `${this.apiUrl}/tenants/${encodeURIComponent(tenantId)}`;
  }

  // Employees
  getEmployees(tenantId: string, includeInactive = false): Observable<Employee[]> {
    let params = new HttpParams();
    if (includeInactive) params = params.set('includeInactive', 'true');
    return this.http.get<Employee[]>(`${this.hrUrl(tenantId)}/employees`, { params });
  }

  getEmployee(tenantId: string, id: string): Observable<Employee> {
    return this.http.get<Employee>(`${this.hrUrl(tenantId)}/employees/${encodeURIComponent(id)}`);
  }

  createEmployee(tenantId: string, data: CreateEmployeeRequest): Observable<Employee> {
    return this.http.post<Employee>(`${this.hrUrl(tenantId)}/employees`, data);
  }

  updateEmployee(tenantId: string, id: string, data: UpdateEmployeeRequest): Observable<Employee> {
    return this.http.put<Employee>(`${this.hrUrl(tenantId)}/employees/${encodeURIComponent(id)}`, data);
  }

  deactivateEmployee(tenantId: string, id: string): Observable<void> {
    return this.http.delete<void>(`${this.hrUrl(tenantId)}/employees/${encodeURIComponent(id)}`);
  }

  // WorkLogs
  getWorkLogs(tenantId: string, employeeId: string, from?: string, to?: string, onlyUnassigned = false): Observable<WorkLog[]> {
    let params: any = {};
    if (from) params['from'] = from;
    if (to) params['to'] = to;
    if (onlyUnassigned) params['onlyUnassigned'] = 'true';
    return this.http.get<WorkLog[]>(
      `${this.hrUrl(tenantId)}/employees/${encodeURIComponent(employeeId)}/worklogs`,
      { params }
    );
  }

  createWorkLog(tenantId: string, data: CreateWorkLogRequest): Observable<WorkLog> {
    return this.http.post<WorkLog>(
      `${this.hrUrl(tenantId)}/employees/${encodeURIComponent(data.employeeId)}/worklogs`,
      data
    );
  }

  updateWorkLog(tenantId: string, employeeId: string, id: string, data: UpdateWorkLogRequest): Observable<WorkLog> {
    return this.http.put<WorkLog>(
      `${this.hrUrl(tenantId)}/employees/${encodeURIComponent(employeeId)}/worklogs/${encodeURIComponent(id)}`,
      data
    );
  }

  deleteWorkLog(tenantId: string, employeeId: string, id: string): Observable<void> {
    return this.http.delete<void>(
      `${this.hrUrl(tenantId)}/employees/${encodeURIComponent(employeeId)}/worklogs/${encodeURIComponent(id)}`
    );
  }

  // Payment Periods
  getPaymentPeriods(tenantId: string, employeeId: string): Observable<PaymentPeriodSummary[]> {
    return this.http.get<PaymentPeriodSummary[]>(
      `${this.hrUrl(tenantId)}/employees/${encodeURIComponent(employeeId)}/payment-periods`
    );
  }

  getAllPaymentPeriods(tenantId: string): Observable<PaymentPeriodSummary[]> {
    return this.http.get<PaymentPeriodSummary[]>(
      `${this.hrUrl(tenantId)}/payment-periods`
    );
  }

  generatePaymentPeriod(tenantId: string, data: GeneratePaymentPeriodRequest): Observable<PaymentPeriodSummary> {
    return this.http.post<PaymentPeriodSummary>(
      `${this.hrUrl(tenantId)}/employees/${encodeURIComponent(data.employeeId)}/payment-periods/generate`,
      data
    );
  }

  deletePaymentPeriod(tenantId: string, employeeId: string, id: string): Observable<void> {
    return this.http.delete<void>(
      `${this.hrUrl(tenantId)}/employees/${encodeURIComponent(employeeId)}/payment-periods/${encodeURIComponent(id)}`
    );
  }

  // HR Payments
  getRecentHrPayments(tenantId: string, count = 50): Observable<HrPayment[]> {
    return this.http.get<HrPayment[]>(`${this.hrUrl(tenantId)}/payments/recent`, { params: { count: String(count) } });
  }

  getHrPaymentsByEmployee(tenantId: string, employeeId: string): Observable<HrPayment[]> {
    return this.http.get<HrPayment[]>(
      `${this.hrUrl(tenantId)}/payments/employee/${encodeURIComponent(employeeId)}`
    );
  }

  createHrPayment(tenantId: string, data: CreateHrPaymentRequest): Observable<HrPayment> {
    return this.http.post<HrPayment>(`${this.hrUrl(tenantId)}/payments`, data);
  }

  deleteHrPayment(tenantId: string, id: string): Observable<void> {
    return this.http.delete<void>(`${this.hrUrl(tenantId)}/payments/${encodeURIComponent(id)}`);
  }
}
