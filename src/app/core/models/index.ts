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
  code: string;                    // Ex: "employees", "worklogs", "payments"
  name: string;
  description?: string;
  module: string;                  // Ex: "HR", "Finance", "Admin"
  frontendRoute?: string;           // Ex: "/admin/employees"
  icon?: string;                    // Material icon name
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
  level: PermissionLevel;           // Read, Write, Full
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

// Employee Models
export interface Employee {
  id: string;
  fullName: string;
  cpf: string;
  phone: string;
  email: string;
  hireDate: string;
  terminationDate?: string;
  isActive: boolean;
  contractType: ContractType;
  hourlyRate: number;
  preferredPaymentMethod: PaymentMethod;
  pixKey?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankAgency?: string;
  hasSignedContract: boolean;
  contractSignedDate?: string;
  applicationUserId?: string;
  createdAt: string;
  updatedAt?: string;
}

export enum ContractType {
  CLT = 1,
  Temporary = 2,
  Daily = 3
}

export enum PaymentMethod {
  Cash = 1,
  Pix = 2,
  BankTransfer = 3
}

// Employee Summary Models
export interface EmployeeSummary {
  id: string;
  fullName: string;
  cpf: string;
  isActive: boolean;
  contractType: ContractType;
  hourlyRate: number;
}

// WorkLog Models
export interface WorkLog {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  clockIn: string;
  clockOut: string;
  hoursWorked: number;
  notes?: string;
  paymentPeriodId?: string | null;
  createdAt: string;
}

export interface UnassignedWorkLog extends WorkLog {
  paymentPeriodId: null;
}

export interface CreateWorkLogRequest {
  employeeId: string;
  date: string;
  clockIn: string;
  clockOut: string;
  notes?: string;
}

// PaymentPeriod Models
export interface PaymentPeriod {
  id: string;
  employeeId: string;
  employeeName: string;
  startDate: string;
  endDate: string;
  totalHours: number;
  totalAmount: number;
  status: PaymentStatus;
  payment?: Payment;
  workLogs: WorkLog[];
  createdAt: string;
}

export enum PaymentStatus {
  Pendente = 1,
  Pago = 2,
  Cancelado = 3
}

// Payment Models
export interface Payment {
  id: string;
  employeeId: string;
  employeeName: string;
  paymentPeriodId: string;
  paymentDate: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentProof?: string;
  status: PaymentStatus;
  notes?: string;
  paidByUserId: string;
  paidByUserName: string;
  createdAt: string;
}

export interface RecentPayment {
  id: string;
  employeeId: string;
  employeeName: string;
  amount: number;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
}

export interface CreatePaymentRequest {
  employeeId: string;
  paymentPeriodId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  notes?: string;
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
