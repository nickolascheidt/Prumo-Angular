// Auth Models
export interface LoginRequest {
  email: string;
  password: string;
  tenantSlug?: string;
}

export interface AuthResponse {
  token: string;
  expiresAt: string;
  user: User;
  tenantId?: string | null;
}

export interface SelectTenantRequest {
  tenantId: string;
}

// Multi-tenancy Models
export enum TenantRole {
  Member = 0,
  Admin = 1,
  Owner = 2
}

export enum ApiKeyType {
  Anon = 0,
  Service = 1
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  ownerUserId: string;
  createdAt: string;
}

export interface CreateTenantRequest {
  name: string;
  slug: string;
}

export interface TenantMembership {
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  role: TenantRole;
  joinedAt: string;
}

export interface TenantMember {
  userId: string;
  email: string;
  fullName?: string;
  role: TenantRole;
  joinedAt: string;
}

export interface AddTenantMemberRequest {
  userId: string;
  role: TenantRole;
}

export interface ApiKey {
  id: string;
  name: string;
  type: ApiKeyType;
  prefix: string;
  createdAt: string;
  expiresAt?: string | null;
  revokedAt?: string | null;
  lastUsedAt?: string | null;
}

export interface CreateApiKeyRequest {
  name: string;
  type: ApiKeyType;
  expiresAt?: string | null;
}

export interface CreateApiKeyResponse {
  id: string;
  name: string;
  type: ApiKeyType;
  key: string;
  prefix: string;
  expiresAt?: string | null;
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  roles: string[];
  permissions?: string[];
  createdAt: string;
  lastLoginAt?: string;
}

// Permission Models
export interface PermissionItem {
  id: string;
  name: string;
  description?: string;
}

export interface RolePermissionsResponse {
  roleName: string;
  permissions: PermissionItem[];
}

export interface GrantPermissionRequest {
  permissionName: string;
  reason?: string;
}

export interface PermissionActionResponse {
  message: string;
}

export interface PermissionAuditLog {
  id: string;
  roleName: string;
  permissionName: string;
  action: 'GRANTED' | 'REVOKED';
  performedByUserEmail: string;
  performedAt: string;
  reason?: string;
}

export type PermissionCatalog = Record<string, Record<string, string>>;

// Resource & Resource Permission Models (Granular Access Control)
export enum PermissionLevel {
  None = 0,
  Read = 1,
  Write = 2,
  Full = 3
}

export interface Resource {
  id: string;
  code: string;
  name: string;
  description?: string;
  module: string;
  frontendRoute?: string;
  icon?: string;
  displayOrder: number;
  createdAt: string;
  updatedAt?: string;
}

export interface ResourcePermission {
  resourceId: string;
  roleId: string;
  roleName: string;
  resourceCode: string;
  resourceName: string;
  level: PermissionLevel;
  createdAt: string;
  updatedAt?: string;
  createdByUserEmail?: string;
}

export interface AllowedResource {
  id: string;
  code: string;
  name: string;
  description?: string;
  module: string;
  frontendRoute?: string;
  icon?: string;
  displayOrder: number;
  userPermissionLevel: PermissionLevel;
}

export interface UserResourcePermissions {
  userId: string;
  email: string;
  fullName: string;
  roles: string[];
  allowedResources: AllowedResource[];
  resourcePermissions: Record<string, PermissionLevel>;
}

export interface AssignResourcePermissionRequest {
  roleId: string;
  resourceId: string;
  level: PermissionLevel;
}

export interface CreateResourceRequest {
  code: string;
  name: string;
  description?: string;
  module: string;
  frontendRoute?: string;
  icon?: string;
  displayOrder: number;
}

export interface UpdateResourceRequest {
  name?: string;
  description?: string;
  module?: string;
  frontendRoute?: string;
  icon?: string;
  displayOrder?: number;
}

// Role Management Models
export interface AppUserSummary {
  id: string;
  email: string;
  fullName: string;
  roles: string[];
  createdAt?: string;
  lastLoginAt?: string;
}

export interface AssignUserRoleRequest {
  roleName: string;
  email: string;
}

export interface UserRolesResponse {
  userId: string;
  email: string;
  fullName: string;
  roles: string[];
}

// API Response Models
export interface ApiResponse<T> {
  data?: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

// Accounts Payable Models
export type AccountsPayableStatus = 'Pending' | 'Paid' | 'Cancelled';

export type PaymentMethod =
  | 'Cash'
  | 'BankTransfer'
  | 'CreditCard'
  | 'DebitCard'
  | 'Pix'
  | 'Boleto'
  | 'Other';

export interface AccountsPayableCategory {
  id: string;
  tenantId: string;
  name: string;
  color?: string | null;
  description?: string | null;
  isActive?: boolean;
  createdAt: string;
  updatedAt?: string | null;
}

export interface CreateAccountsPayableCategoryRequest {
  name: string;
  color?: string | null;
  description?: string | null;
}

export interface UpdateAccountsPayableCategoryRequest {
  name: string;
  color?: string | null;
  description?: string | null;
  isActive: boolean;
}

export interface AccountsPayableEntry {
  id: string;
  tenantId: string;
  description: string;
  amount: number;
  dueDate: string;
  categoryId: string;
  categoryName?: string | null;
  supplierName?: string | null;
  paymentMethod?: PaymentMethod | null;
  status: AccountsPayableStatus;
  paidAt?: string | null;
  notes?: string | null;
  cancelledAt?: string | null;
  cancellationReason?: string | null;
  isOverdue: boolean;
  createdAt: string;
  updatedAt?: string | null;
}

export interface CreateAccountsPayableEntryRequest {
  description: string;
  amount: number;
  dueDate: string;
  categoryId: string;
  supplierName?: string | null;
  paymentMethod?: PaymentMethod | null;
  notes?: string | null;
}

export interface UpdateAccountsPayableEntryRequest {
  description?: string;
  amount?: number;
  dueDate?: string;
  categoryId?: string;
  supplierName?: string | null;
  paymentMethod?: PaymentMethod | null;
  notes?: string | null;
}

export interface MarkAccountsPayablePaidRequest {
  paidAt: string;
  paymentMethod: PaymentMethod;
}

export interface CancelAccountsPayableRequest {
  reason: string;
}

// Bulk entry: categoryId is optional — provide categoryName to auto-create
export interface BulkEntryLine {
  description: string;
  amount: number;
  dueDate: string;
  categoryId?: string | null;
  categoryName?: string | null;
  paymentMethod?: PaymentMethod | null;
  supplierName?: string | null;
  notes?: string | null;
}

export interface BulkCreateAccountsPayableRequest {
  lines: BulkEntryLine[];
}

export interface BulkEntryResult {
  index: number;
  success: boolean;
  entryId?: string | null;
  errors: string[];
}

export interface BulkCreateAccountsPayableResponse {
  totalLines: number;
  successCount: number;
  failedCount: number;
  results: BulkEntryResult[];
}

export interface AccountsPayableListParams {
  from?: string;
  to?: string;
  status?: AccountsPayableStatus;
  categoryId?: string;
  supplierName?: string;
  paymentMethod?: PaymentMethod;
  search?: string;
  minAmount?: number;
  maxAmount?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface AccountsPayableSummary {
  from?: string | null;
  to?: string | null;
  totalPending: number;
  totalPaid: number;
  totalCancelled: number;
  countPending: number;
  countPaid: number;
  countCancelled: number;
  totalsByCategory: AccountsPayableCategoryTotal[];
}

export interface AccountsPayableCategoryTotal {
  categoryId: string;
  categoryName: string;
  totalPending: number;
  totalPaid: number;
  totalCancelled: number;
}

// ─── Finance: Chart of Accounts ────────────────────────────────────────────

export enum AccountType {
  Asset = 1,
  Liability = 2,
  Equity = 3,
  Revenue = 4,
  Expense = 5
}

export enum JournalEntryType {
  Debit = 1,
  Credit = 2
}

export interface Account {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  type: AccountType;
  typeName: string;
  isAnalytic: boolean;
  parentId?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string | null;
}

export interface CreateAccountRequest {
  code: string;
  name: string;
  type: AccountType;
  isAnalytic: boolean;
  parentId?: string | null;
}

export interface UpdateAccountRequest {
  code: string;
  name: string;
  type: AccountType;
  isAnalytic: boolean;
  parentId?: string | null;
  isActive: boolean;
}

export interface TenantGlSettings {
  tenantId: string;
  defaultCashAccountId?: string | null;
  defaultCashAccountCode?: string | null;
  defaultAccountsPayableAccountId?: string | null;
  defaultAccountsPayableAccountCode?: string | null;
}

export interface UpdateTenantGlSettingsRequest {
  defaultCashAccountId?: string | null;
  defaultAccountsPayableAccountId?: string | null;
}

// ─── Finance: General Ledger ────────────────────────────────────────────────

export interface JournalLineDto {
  id: string;
  accountId: string;
  accountCode: string;
  accountName: string;
  entryType: JournalEntryType;
  amount: number;
}

export interface JournalEntryDto {
  id: string;
  tenantId: string;
  date: string;
  description: string;
  sourceModule?: string | null;
  sourceDocumentId?: string | null;
  createdByUserId: string;
  createdAt: string;
  lines: JournalLineDto[];
}

export interface JournalEntryListItem {
  id: string;
  date: string;
  description: string;
  sourceModule?: string | null;
  totalAmount: number;
  lineCount: number;
  createdAt: string;
}

export interface JournalEntryQuery {
  from?: string;
  to?: string;
  sourceModule?: string;
  page?: number;
  pageSize?: number;
}

export interface CreateJournalLineDto {
  accountId: string;
  entryType: JournalEntryType;
  amount: number;
}

export interface CreateJournalEntryRequest {
  date: string;
  description: string;
  lines: CreateJournalLineDto[];
}

export interface AccountStatementLine {
  journalEntryId: string;
  date: string;
  description: string;
  entryType: JournalEntryType;
  amount: number;
  runningBalance: number;
}

export interface AccountStatementDto {
  accountId: string;
  accountCode: string;
  accountName: string;
  from?: string | null;
  to?: string | null;
  openingBalance: number;
  lines: AccountStatementLine[];
  closingBalance: number;
}
