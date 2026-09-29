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

/**
 * The API serializes TenantRole as a string ("Owner"), while the enum here is numeric.
 * Treating the string as a number already broke three screens: the position became
 * "Unknown" in the member list, the management controls disappeared, and tenant
 * selection showed "2" instead of "Owner".
 *
 * An unrecognized value becomes Member — the least privilege.
 */
export function toTenantRole(value: TenantRole | string | null | undefined): TenantRole {
  if (typeof value === 'number') {
    return value >= TenantRole.Member && value <= TenantRole.Owner ? value : TenantRole.Member;
  }
  const parsed = typeof value === 'string'
    ? TenantRole[value as keyof typeof TenantRole]
    : undefined;
  return typeof parsed === 'number' ? parsed : TenantRole.Member;
}

const TENANT_ROLE_LABELS: Record<TenantRole, string> = {
  [TenantRole.Member]: 'Member',
  [TenantRole.Admin]: 'Admin',
  [TenantRole.Owner]: 'Owner'
};

/** Position label, accepting both the number and the string the API sends. */
export function tenantRoleLabel(value: TenantRole | string | null | undefined): string {
  return TENANT_ROLE_LABELS[toTenantRole(value)];
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
  /** Administrative position in the tenant. */
  role: TenantRole;
  joinedAt: string;
  /** Feature roles granted in this tenant — the "module keys". */
  roles: string[];
  /** Global Identity role. Not a feature role, and not revoked from this screen. */
  isMasterAdmin: boolean;
}

export interface AddTenantMemberRequest {
  userId: string;
  role: TenantRole;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  phoneNumber?: string | null;
}

/** Sign-up answers 202 and returns no token: confirming the e-mail comes before signing in. */
export interface RegistrationResult {
  userId: string;
  email: string;
}

export interface InviteMemberRequest {
  email: string;
  role: TenantRole;
}

export interface InviteMemberResult {
  /** True when the e-mail already had an account and the person became a member right away. */
  joinedImmediately: boolean;
  userId: string | null;
  email: string;
}

export interface TenantInvitation {
  id: string;
  email: string;
  role: TenantRole;
  createdAt: string;
}

export interface TenantMemberRoles {
  userId: string;
  roles: string[];
}

export interface AssignFeatureRoleRequest {
  roleName: string;
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

/**
 * The API serializes enums as strings (JsonStringEnumConverter), so permission
 * levels arrive as "Full"/"Read"/… while this enum is numeric. Comparing the raw
 * value against a numeric level is always false, so every payload must be
 * normalized before it reaches the access checks.
 */
export function toPermissionLevel(value: unknown): PermissionLevel {
  if (typeof value === 'number') {
    return value >= PermissionLevel.None && value <= PermissionLevel.Full
      ? value
      : PermissionLevel.None;
  }
  if (typeof value === 'string') {
    const parsed = PermissionLevel[value as keyof typeof PermissionLevel];
    if (typeof parsed === 'number') return parsed;
    // Numeric levels can still arrive as strings (e.g. rehydrated from storage).
    const numeric = Number(value);
    if (Number.isInteger(numeric)) return toPermissionLevel(numeric);
  }
  return PermissionLevel.None;
}

/** Returns a copy of the payload with every permission level as a numeric enum. */
export function normalizeUserResourcePermissions(
  perms: UserResourcePermissions
): UserResourcePermissions {
  return {
    ...perms,
    allowedResources: (perms.allowedResources ?? []).map(r => ({
      ...r,
      userPermissionLevel: toPermissionLevel(r.userPermissionLevel)
    })),
    resourcePermissions: Object.fromEntries(
      Object.entries(perms.resourcePermissions ?? {}).map(
        ([code, level]) => [code, toPermissionLevel(level)]
      )
    )
  };
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

/**
 * A role managed on the Roles screen: the system's canonical ones and the ones the tenant created.
 *
 * Not to be confused with the `TenantRole` enum, which is the administrative **position**
 * (Owner/Admin/Member). This is the "module key" — the set of access rights.
 */
export interface ManagedRole {
  id: string;
  name: string;
  description?: string;
  /** System role: cannot be deleted or have its name reused. */
  isCanonical: boolean;
  /** How many members of this tenant carry the role. */
  memberCount: number;
}

export interface CreateTenantRoleRequest {
  name: string;
  description?: string;
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
  /** Global Identity role — explains the 0 count for whoever runs everything. */
  isMasterAdmin?: boolean;
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
  defaultExpenseAccountId?: string | null;
  defaultExpenseAccountCode?: string | null;
}

export interface UpdateTenantGlSettingsRequest {
  defaultCashAccountId?: string | null;
  defaultAccountsPayableAccountId?: string | null;
  defaultExpenseAccountId?: string | null;
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

// ─── HR Module ───────────────────────────────────────────────────────────────

export enum ContractType {
  CLT = 1,
  Temporary = 2,
  Daily = 3
}

export enum HrPaymentMethod {
  Cash = 1,
  Pix = 2,
  BankTransfer = 3,
  Check = 4
}

export enum HrPaymentStatus {
  Pending = 1,
  Paid = 2,
  Cancelled = 3,
  Overdue = 4
}

export interface Employee {
  id: string;
  tenantId: string;
  fullName: string;
  cpf: string;
  phone?: string | null;
  email?: string | null;
  hireDate: string;
  terminationDate?: string | null;
  isActive: boolean;
  contractType: ContractType;
  contractTypeName: string;
  hourlyRate: number;
  preferredPaymentMethod: HrPaymentMethod;
  preferredPaymentMethodName: string;
  pixKey?: string | null;
  bankName?: string | null;
  bankAccountNumber?: string | null;
  bankAgency?: string | null;
  hasSignedContract: boolean;
  contractSignedDate?: string | null;
  applicationUserId?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

export interface CreateEmployeeRequest {
  fullName: string;
  cpf: string;
  phone?: string | null;
  email?: string | null;
  hireDate: string;
  contractType: ContractType;
  hourlyRate: number;
  preferredPaymentMethod: HrPaymentMethod;
  pixKey?: string | null;
  bankName?: string | null;
  bankAccountNumber?: string | null;
  bankAgency?: string | null;
  hasSignedContract: boolean;
  applicationUserId?: string | null;
}

export interface UpdateEmployeeRequest {
  fullName: string;
  phone?: string | null;
  email?: string | null;
  isActive: boolean;
  contractType: ContractType;
  hourlyRate: number;
  preferredPaymentMethod: HrPaymentMethod;
  pixKey?: string | null;
  bankName?: string | null;
  bankAccountNumber?: string | null;
  bankAgency?: string | null;
  hasSignedContract: boolean;
  terminationDate?: string | null;
}

export interface WorkLog {
  id: string;
  employeeId: string;
  employeeName: string;
  workDate: string;
  hoursWorked: number;
  hourlyRateAtTime: number;
  totalAmount: number;
  notes?: string | null;
  paymentPeriodId?: string | null;
  createdAt: string;
}

export interface CreateWorkLogRequest {
  employeeId: string;
  workDate: string;
  hoursWorked: number;
  notes?: string | null;
}

export interface UpdateWorkLogRequest {
  workDate: string;
  hoursWorked: number;
  notes?: string | null;
}

export interface PaymentPeriodSummary {
  id: string;
  employeeId: string;
  employeeName: string;
  startDate: string;
  endDate: string;
  totalHours: number;
  totalAmount: number;
  status: HrPaymentStatus;
  statusName: string;
  createdAt: string;
}

export interface GeneratePaymentPeriodRequest {
  employeeId: string;
  startDate: string;
  endDate: string;
}

export interface HrPayment {
  id: string;
  employeeId: string;
  employeeName: string;
  paymentPeriodId: string;
  paymentDate: string;
  amount: number;
  paymentMethod: HrPaymentMethod;
  paymentMethodName: string;
  paymentProof?: string | null;
  notes?: string | null;
  paidByUserId: string;
  paidByUserName: string;
  createdAt: string;
}

export interface CreateHrPaymentRequest {
  paymentPeriodId: string;
  paymentDate: string;
  paymentMethod: HrPaymentMethod;
  paymentProof?: string | null;
  notes?: string | null;
}

export interface UpdateMemberRoleRequest {
  role: number;
}
