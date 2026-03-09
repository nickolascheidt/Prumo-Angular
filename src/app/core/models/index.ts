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
  Frio = 2,
  Temporario = 3,
  Estagiario = 4
}

export enum PaymentMethod {
  Dinheiro = 1,
  Pix = 2,
  TransferenciaBancaria = 3,
  Cheque = 4
}

// WorkLog Models
export interface WorkLog {
  id: string;
  employeeId: string;
  employeeName: string;
  workDate: string;
  hoursWorked: number;
  hourlyRateAtTime: number;
  totalAmount: number;
  notes?: string;
  paymentPeriodId?: string;
  createdAt: string;
}

export interface CreateWorkLogRequest {
  employeeId: string;
  workDate: string;
  hoursWorked: number;
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
  Cancelado = 3,
  Atrasado = 4
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
  notes?: string;
  paidByUserId: string;
  paidByUserName: string;
  createdAt: string;
}

export interface CreatePaymentRequest {
  paymentPeriodId: string;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  paymentProof?: string;
  notes?: string;
}

// Product Models
export interface Product {
  id: string;
  name: string;
  description?: string;
  sku: string;
  category: string;
  unit: string;
  unitPrice: number;
  minimumStock: number;
  isActive: boolean;
  createdAt: string;
}

export interface CreateProductRequest {
  name: string;
  description?: string;
  sku: string;
  category: string;
  unit: string;
  unitPrice: number;
  minimumStock: number;
}

// Customer Models
export interface Customer {
  id: string;
  name: string;
  document: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  isActive: boolean;
  createdAt: string;
}

export interface CreateCustomerRequest {
  name: string;
  document: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
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
