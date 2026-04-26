// Auth Models
export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  expiresAt: string;
  user: User;
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
