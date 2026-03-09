import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Employee,
  WorkLog,
  PaymentPeriod,
  Payment,
  Product,
  Customer,
  CreateWorkLogRequest,
  CreatePaymentRequest,
  CreateProductRequest,
  CreateCustomerRequest,
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
  UserRolesResponse
} from '../models';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly apiUrl = 'https://localhost:7145/api';

  constructor(private http: HttpClient) {}

  // Auth Endpoints
  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, credentials);
  }

  register(data: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/register`, data);
  }

  getCurrentUser(): Observable<any> {
    return this.http.get(`${this.apiUrl}/auth/me`);
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

  // Employee Endpoints
  getEmployees(includeInactive: boolean = false): Observable<Employee[]> {
    const params = new HttpParams().set('includeInactive', includeInactive);
    return this.http.get<Employee[]>(`${this.apiUrl}/employees`, { params });
  }

  getEmployeeById(id: string): Observable<Employee> {
    return this.http.get<Employee>(`${this.apiUrl}/employees/${id}`);
  }

  createEmployee(data: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>): Observable<Employee> {
    return this.http.post<Employee>(`${this.apiUrl}/employees`, data);
  }

  updateEmployee(id: string, data: Partial<Employee>): Observable<Employee> {
    return this.http.put<Employee>(`${this.apiUrl}/employees/${id}`, data);
  }

  deleteEmployee(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/employees/${id}`);
  }

  // WorkLog Endpoints
  getWorkLogsByEmployee(employeeId: string, startDate?: string, endDate?: string): Observable<WorkLog[]> {
    let params = new HttpParams();
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);
    return this.http.get<WorkLog[]>(`${this.apiUrl}/worklogs/employee/${employeeId}`, { params });
  }

  getUnassignedWorkLogs(employeeId: string): Observable<WorkLog[]> {
    return this.http.get<WorkLog[]>(`${this.apiUrl}/worklogs/employee/${employeeId}/unassigned`);
  }

  createWorkLog(data: CreateWorkLogRequest): Observable<WorkLog> {
    return this.http.post<WorkLog>(`${this.apiUrl}/worklogs`, data);
  }

  updateWorkLog(id: string, data: Partial<CreateWorkLogRequest>): Observable<WorkLog> {
    return this.http.put<WorkLog>(`${this.apiUrl}/worklogs/${id}`, data);
  }

  deleteWorkLog(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/worklogs/${id}`);
  }

  // Payment Period Endpoints -> Create getAllPeriodsSum 
  getPaymentPeriodsByEmployee(employeeId: string): Observable<PaymentPeriod[]> {
    return this.http.get<PaymentPeriod[]>(`${this.apiUrl}/paymentperiods/employee/${employeeId}`);
  }

  getPaymentPeriodsByStatus(status: number): Observable<PaymentPeriod[]> {
    return this.http.get<PaymentPeriod[]>(`${this.apiUrl}/paymentperiods/status/${status}`);
  }

  getMonthlyHours(): Observable<WorkLog[]> {
    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    const params = new HttpParams()
      .set('startDate', this.formatDateParam(startOfMonth))
      .set('endDate', this.formatDateParam(endOfMonth));

    return this.http.get<WorkLog[]>(`${this.apiUrl}/worklogs`, { params });
  }

  private formatDateParam(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  generatePaymentPeriod(employeeId: string, startDate: string, endDate: string): Observable<PaymentPeriod> {
    const params = new HttpParams()
      .set('employeeId', employeeId)
      .set('startDate', startDate)
      .set('endDate', endDate);
    return this.http.post<PaymentPeriod>(`${this.apiUrl}/paymentperiods/generate`, null, { params });
  }

  updatePaymentPeriodStatus(id: string, status: number): Observable<PaymentPeriod> {
    return this.http.patch<PaymentPeriod>(`${this.apiUrl}/paymentperiods/${id}/status`, status);
  }

  deletePaymentPeriod(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/paymentperiods/${id}`);
  }

  // Payment Endpoints
  getPaymentsByEmployee(employeeId: string): Observable<Payment[]> {
    return this.http.get<Payment[]>(`${this.apiUrl}/payments/employee/${employeeId}`);
  }

  getPaymentsByPeriod(startDate: string, endDate: string): Observable<Payment[]> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);
    return this.http.get<Payment[]>(`${this.apiUrl}/payments/period`, { params });
  }

  getRecentPayments(count: number = 10): Observable<Payment[]> {
    const params = new HttpParams().set('count', count);
    return this.http.get<Payment[]>(`${this.apiUrl}/payments/recent`, { params });
  }

  createPayment(data: CreatePaymentRequest): Observable<Payment> {
    return this.http.post<Payment>(`${this.apiUrl}/payments`, data);
  }

  deletePayment(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/payments/${id}`);
  }

  // Product Endpoints
  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/products`);
  }

  getProductById(id: string): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/products/${id}`);
  }

  createProduct(data: CreateProductRequest): Observable<Product> {
    return this.http.post<Product>(`${this.apiUrl}/products`, data);
  }

  updateProduct(id: string, data: Partial<CreateProductRequest>): Observable<Product> {
    return this.http.put<Product>(`${this.apiUrl}/products/${id}`, data);
  }

  deleteProduct(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/products/${id}`);
  }

  // Customer Endpoints
  getCustomers(): Observable<Customer[]> {
    return this.http.get<Customer[]>(`${this.apiUrl}/customers`);
  }

  getCustomerById(id: string): Observable<Customer> {
    return this.http.get<Customer>(`${this.apiUrl}/customers/${id}`);
  }

  createCustomer(data: CreateCustomerRequest): Observable<Customer> {
    return this.http.post<Customer>(`${this.apiUrl}/customers`, data);
  }

  updateCustomer(id: string, data: Partial<CreateCustomerRequest>): Observable<Customer> {
    return this.http.put<Customer>(`${this.apiUrl}/customers/${id}`, data);
  }

  deleteCustomer(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/customers/${id}`);
  }
}
