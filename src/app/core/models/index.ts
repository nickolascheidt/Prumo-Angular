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

export interface UserResourcePermissions {
  userId: string;
  email: string;
  resources: UserResourcePermission[];
}

export interface UserResourcePermission {
  resourceCode: string;
  resourceName: string;
  level: PermissionLevel;
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

export interface BulkCreateAccountsPayableRequest {
  entries: CreateAccountsPayableEntryRequest[];
}

export interface BulkCreateAccountsPayableResponse {
  created: number;
  failed: number;
  errors?: { index: number; message: string }[];
}

export interface AccountsPayableListParams {
  from?: string;
  to?: string;
  status?: AccountsPayableStatus;
  categoryId?: string;
  paymentMethod?: PaymentMethod;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface AccountsPayableSummary {
  from?: string | null;
  to?: string | null;
  totalPending: number;
  totalPaid: number;
  totalCancelled: number;
  totalOverdue: number;
  countPending: number;
  countPaid: number;
  countCancelled: number;
  countOverdue: number;
  byCategory?: AccountsPayableCategorySummary[];
}

export interface AccountsPayableCategorySummary {
  categoryId: string;
  categoryName: string;
  totalPending: number;
  totalPaid: number;
  totalCancelled: number;
  count: number;
}
