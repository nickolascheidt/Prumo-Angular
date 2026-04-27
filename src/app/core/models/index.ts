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
