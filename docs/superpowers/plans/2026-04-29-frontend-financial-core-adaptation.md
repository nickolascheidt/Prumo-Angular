# Frontend Financial Core Adaptation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all AP/core DTO mismatches between frontend and backend, then build the Chart of Accounts and General Ledger screens for Financial Core Phase 1.

**Architecture:** Two sequential phases — Phase 1 is pure model/service corrections with no new UI; Phase 2 adds a `finance` module with standalone Angular components following existing AP patterns. All new components are standalone, use ReactiveFormsModule + Angular Material, and call the backend via `ApiService`.

**Tech Stack:** Angular 18 standalone, Angular Material 18, ReactiveFormsModule, RxJS, TypeScript 5.5 strict

---

## File Map

### Phase 1 — Modified only

| File | What changes |
|---|---|
| `src/app/core/models/index.ts` | Fix 5 interface/type mismatches (entry fields, bulk shapes, summary, list params, UserResourcePermissions) |
| `src/app/core/services/permission.service.ts` | Switch from `resources[]` array to `resourcePermissions` map |
| `src/app/core/services/api.service.ts` | Add missing filter params to `buildAccountsPayableParams` |
| `src/app/modules/accounts-payable/quick-entry/quick-entry.component.ts` | Fix bulk payload (`entries→lines`) and response field names |
| `src/app/modules/accounts-payable/list/accounts-payable-list.component.html` | Remove `summary.countOverdue` / `summary.totalOverdue` block |

### Phase 2 — New files

```
src/app/modules/finance/
  chart-of-accounts/
    chart-of-accounts.component.ts
    chart-of-accounts.component.html
    chart-of-accounts.component.scss
    account-form/
      account-form.component.ts
      account-form.component.html
  general-ledger/
    general-ledger.component.ts
    general-ledger.component.html
    general-ledger.component.scss
    journal-entry-detail/
      journal-entry-detail.component.ts
      journal-entry-detail.component.html
    journal-entry-form/
      journal-entry-form.component.ts
      journal-entry-form.component.html
    account-statement/
      account-statement.component.ts
      account-statement.component.html
      account-statement.component.scss
```

### Phase 2 — Modified

| File | What changes |
|---|---|
| `src/app/core/models/index.ts` | Add Finance models (Account, Journal, GL settings) |
| `src/app/core/services/api.service.ts` | Add Chart of Accounts + General Ledger API methods |
| `src/app/app.routes.ts` | Add `/finance/chart-of-accounts` and `/finance/general-ledger` routes |
| `src/app/shared/components/layout/layout.component.ts` | Add Finance navigation section with resource-based visibility |
| `src/app/shared/components/layout/layout.component.html` | Render Finance nav links |

---

## Task 1 — Fix `AccountsPayableEntry`, bulk types, summary, and list params in models

**Files:**
- Modify: `src/app/core/models/index.ts:278-366`

- [ ] **Step 1: Replace the AP section of models (lines 278–366)**

Open `src/app/core/models/index.ts`. Replace everything from line 278 (the `AccountsPayableEntry` interface) through the end of the file with the corrected version below.

```typescript
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
```

- [ ] **Step 2: Build to verify no TypeScript errors**

```bash
npx tsc --noEmit
```

Expected: 0 errors (or only errors in files yet to be fixed — we'll resolve those in later tasks).

---

## Task 2 — Fix `UserResourcePermissions` interface and `PermissionService`

The backend returns `allowedResources[]` + `resourcePermissions` (a code→level map), not a `resources[]` array.

**Files:**
- Modify: `src/app/core/models/index.ts:169-185`
- Modify: `src/app/core/services/permission.service.ts:119-146`

- [ ] **Step 1: Replace the UserResourcePermissions interfaces in models**

In `src/app/core/models/index.ts`, find and replace the block at lines 169–185:

```typescript
// OLD — delete this block:
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
```

Replace with:

```typescript
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
```

- [ ] **Step 2: Fix `PermissionService.userCanAccessResource` to use the map**

In `src/app/core/services/permission.service.ts`, replace the two lookup methods (lines 119–146):

```typescript
// OLD — delete these two methods:
userCanAccessResource(resourceCode: string, minLevel: PermissionLevel = PermissionLevel.Read): boolean {
  const resourcePerms = this.getUserResourcePermissions();
  if (!resourcePerms || !resourcePerms.resources) {
    return false;
  }
  const resource = resourcePerms.resources.find(r => r.resourceCode.toLowerCase() === resourceCode.toLowerCase());
  if (!resource) {
    return false;
  }
  return resource.level >= minLevel;
}

getUserResourcePermissionLevel(resourceCode: string): PermissionLevel {
  const resourcePerms = this.getUserResourcePermissions();
  if (!resourcePerms || !resourcePerms.resources) {
    return PermissionLevel.None;
  }
  const resource = resourcePerms.resources.find(r => r.resourceCode.toLowerCase() === resourceCode.toLowerCase());
  return resource?.level ?? PermissionLevel.None;
}
```

Replace with:

```typescript
userCanAccessResource(resourceCode: string, minLevel: PermissionLevel = PermissionLevel.Read): boolean {
  const resourcePerms = this.getUserResourcePermissions();
  if (!resourcePerms?.resourcePermissions) return false;
  const level = resourcePerms.resourcePermissions[resourceCode] ?? PermissionLevel.None;
  return level >= minLevel;
}

getUserResourcePermissionLevel(resourceCode: string): PermissionLevel {
  const resourcePerms = this.getUserResourcePermissions();
  if (!resourcePerms?.resourcePermissions) return PermissionLevel.None;
  return resourcePerms.resourcePermissions[resourceCode] ?? PermissionLevel.None;
}
```

- [ ] **Step 3: Build to verify**

```bash
npx tsc --noEmit
```

Expected: no new errors introduced by these two files.

- [ ] **Step 4: Commit Phase 1 model + permission service fixes**

```bash
git add src/app/core/models/index.ts src/app/core/services/permission.service.ts
git commit -m "fix: align AP models and UserResourcePermissions with backend DTOs"
```

---

## Task 3 — Fix `ApiService.buildAccountsPayableParams`

**Files:**
- Modify: `src/app/core/services/api.service.ts:375-386`

- [ ] **Step 1: Replace the private `buildAccountsPayableParams` method**

In `src/app/core/services/api.service.ts`, find and replace the `buildAccountsPayableParams` method (currently lines 375–386):

```typescript
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
```

Replace with:

```typescript
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
```

- [ ] **Step 2: Fix the import for `BulkCreateAccountsPayableRequest` (no shape change needed in ApiService — type already used correctly)**

Also update the import list in `api.service.ts` to use the new types. Find the import block at the top of the file that includes `BulkCreateAccountsPayableRequest` and `BulkCreateAccountsPayableResponse` — add `BulkEntryLine` and `BulkEntryResult` to make future usage clear:

```typescript
  BulkCreateAccountsPayableRequest,
  BulkCreateAccountsPayableResponse,
  BulkEntryLine,
  BulkEntryResult,
```

- [ ] **Step 3: Build to verify**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add src/app/core/services/api.service.ts
git commit -m "fix: add missing AP filter params to buildAccountsPayableParams"
```

---

## Task 4 — Fix quick-entry bulk payload and response reading

**Files:**
- Modify: `src/app/modules/accounts-payable/quick-entry/quick-entry.component.ts`

- [ ] **Step 1: Fix the import block**

In `quick-entry.component.ts`, replace the models import:

```typescript
// OLD:
import {
  AccountsPayableCategory,
  AccountsPayableEntry,
  CreateAccountsPayableEntryRequest,
  PaymentMethod
} from '@core/models';
```

```typescript
// NEW:
import {
  AccountsPayableCategory,
  AccountsPayableEntry,
  BulkEntryLine,
  CreateAccountsPayableEntryRequest,
  PaymentMethod
} from '@core/models';
```

- [ ] **Step 2: Fix `parseBulkLine` return type and shape**

Replace the `parseBulkLine` method signature and return (currently returns `{ entry?: CreateAccountsPayableEntryRequest }`):

```typescript
private parseBulkLine(
  line: string,
  fallbackCategoryId: string,
  fallbackPaymentMethod: PaymentMethod | null
): { lineNumber: number; entry?: BulkEntryLine; error?: string } {
  const parts = line.split('|').map(p => p.trim());
  if (parts.length < 3) {
    return { lineNumber: 0, error: 'formato' };
  }

  const [dueDateRaw, description, amountRaw, supplier] = parts;
  const dueDate = this.parseLooseDate(dueDateRaw);
  const amount = Number(String(amountRaw).replace(',', '.'));

  if (!dueDate || !description || !isFinite(amount) || amount <= 0) {
    return { lineNumber: 0, error: 'campos' };
  }

  return {
    lineNumber: 0,
    entry: {
      description,
      amount,
      dueDate,
      categoryId: fallbackCategoryId || null,
      supplierName: supplier || null,
      paymentMethod: fallbackPaymentMethod || null
    }
  };
}
```

- [ ] **Step 3: Fix `submitBulk` — change `entries` → `lines` and fix response fields**

Replace the `submitBulk` method body from the `this.api.bulkCreateAccountsPayableEntries(...)` call through the `next` handler:

```typescript
this.isBulkSaving = true;
this.api
  .bulkCreateAccountsPayableEntries(tenantId, {
    lines: parsed.map(p => p.entry!)
  })
  .subscribe({
    next: resp => {
      const msg = `${resp.successCount} lançamento(s) criado(s)` +
        (resp.failedCount > 0 ? `, ${resp.failedCount} falharam` : '');
      this.snackBar.open(msg, 'Fechar', { duration: 4000 });
      this.bulkForm.patchValue({ lines: '' });
      this.entriesBulkCreated.emit();
    },
    error: err => {
      this.isBulkSaving = false;
      this.snackBar.open(
        err?.error?.message || 'Erro ao processar lote',
        'Fechar',
        { duration: 5000 }
      );
    },
    complete: () => {
      this.isBulkSaving = false;
    }
  });
```

- [ ] **Step 4: Build to verify**

```bash
npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add src/app/modules/accounts-payable/quick-entry/quick-entry.component.ts
git commit -m "fix: align bulk AP payload and response fields with backend"
```

---

## Task 5 — Remove non-existent overdue summary fields from list template

**Files:**
- Modify: `src/app/modules/accounts-payable/list/accounts-payable-list.component.html:37-41`
- Modify: `src/app/modules/accounts-payable/list/accounts-payable-list.component.ts:335-341`

- [ ] **Step 1: Remove the overdue block from the HTML template**

In `accounts-payable-list.component.html`, delete this block (lines 37–41):

```html
    <div class="total-item total-item--overdue" *ngIf="summary.countOverdue">
      <span class="total-item__label">Atrasado</span>
      <span class="total-item__value">{{ summary.totalOverdue | currency:'BRL' }}</span>
      <span class="total-item__count">{{ summary.countOverdue }} lançamento(s)</span>
    </div>
```

- [ ] **Step 2: Switch `isOverdue()` in the component to use the backend field**

The component currently has a local `isOverdue(entry)` helper method. Replace it to use the backend-provided field (the method can remain for backward compat in the template, but delegate to the field):

```typescript
isOverdue(entry: AccountsPayableEntry): boolean {
  return entry.isOverdue;
}
```

- [ ] **Step 3: Build and lint to verify no remaining references to removed fields**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit Phase 1 complete**

```bash
git add src/app/modules/accounts-payable/list/accounts-payable-list.component.html \
        src/app/modules/accounts-payable/list/accounts-payable-list.component.ts
git commit -m "fix: remove non-existent overdue summary fields, use backend isOverdue"
```

---

## Task 6 — Add Finance models and API methods

**Files:**
- Modify: `src/app/core/models/index.ts` (append Finance section)
- Modify: `src/app/core/services/api.service.ts` (append Finance methods)

- [ ] **Step 1: Append Finance models to `src/app/core/models/index.ts`**

Add at the end of the file:

```typescript
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
```

- [ ] **Step 2: Append Finance API methods to `src/app/core/services/api.service.ts`**

Add the following import additions to the top import from `'../models'` (add alongside existing model imports):

```typescript
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
  PaginatedResponse,
```

Then append at the end of the `ApiService` class (before the closing `}`):

```typescript
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
```

- [ ] **Step 3: Build to verify**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/core/models/index.ts src/app/core/services/api.service.ts
git commit -m "feat: add Finance models and Chart of Accounts + General Ledger API methods"
```

---

## Task 7 — Chart of Accounts component (list + GL settings)

**Files:**
- Create: `src/app/modules/finance/chart-of-accounts/chart-of-accounts.component.ts`
- Create: `src/app/modules/finance/chart-of-accounts/chart-of-accounts.component.html`
- Create: `src/app/modules/finance/chart-of-accounts/chart-of-accounts.component.scss`

- [ ] **Step 1: Create directory**

```bash
mkdir -p src/app/modules/finance/chart-of-accounts/account-form
```

- [ ] **Step 2: Create `chart-of-accounts.component.ts`**

```typescript
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApiService, AuthService } from '@core/services';
import {
  Account,
  AccountType,
  TenantGlSettings,
  UpdateTenantGlSettingsRequest,
  PermissionLevel
} from '@core/models';
import { AccountFormComponent, AccountFormData } from './account-form/account-form.component';

@Component({
  selector: 'app-chart-of-accounts',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    MatSelectModule,
    MatFormFieldModule,
    MatSlideToggleModule,
    MatTooltipModule,
    FormsModule
  ],
  templateUrl: './chart-of-accounts.component.html',
  styleUrls: ['./chart-of-accounts.component.scss']
})
export class ChartOfAccountsComponent implements OnInit {
  accounts: Account[] = [];
  glSettings: TenantGlSettings | null = null;
  glSettingsForm!: FormGroup;
  loading = false;
  savingSettings = false;
  includeInactive = false;

  readonly displayedColumns = ['code', 'name', 'type', 'kind', 'active', 'actions'];

  readonly accountTypeLabels: Record<AccountType, string> = {
    [AccountType.Asset]: 'Ativo',
    [AccountType.Liability]: 'Passivo',
    [AccountType.Equity]: 'Patrimônio Líquido',
    [AccountType.Revenue]: 'Receita',
    [AccountType.Expense]: 'Despesa'
  };

  private tenantId: string | null = null;

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.tenantId = this.auth.getCurrentTenantId();
    if (!this.tenantId) return;

    this.glSettingsForm = this.fb.group({
      defaultCashAccountId: [null],
      defaultAccountsPayableAccountId: [null]
    });

    this.loadAll();
  }

  loadAll(): void {
    if (!this.tenantId) return;
    this.loading = true;
    this.api.getChartOfAccounts(this.tenantId, this.includeInactive).subscribe({
      next: accounts => {
        this.accounts = accounts;
        this.loading = false;
      },
      error: err => {
        this.loading = false;
        this.snackBar.open(err?.error?.message || 'Erro ao carregar plano de contas', 'Fechar', { duration: 5000 });
      }
    });

    this.api.getGlSettings(this.tenantId).subscribe({
      next: settings => {
        this.glSettings = settings;
        this.glSettingsForm.patchValue({
          defaultCashAccountId: settings.defaultCashAccountId,
          defaultAccountsPayableAccountId: settings.defaultAccountsPayableAccountId
        });
      },
      error: () => {}
    });
  }

  indentLevel(code: string): number {
    return (code.split('.').length - 1) * 16;
  }

  get canManage(): boolean {
    return this.auth.canAccessResource('ChartOfAccounts.Management', PermissionLevel.Full);
  }

  get analyticAccounts(): Account[] {
    return this.accounts.filter(a => a.isAnalytic && a.isActive);
  }

  openCreate(): void {
    const ref = this.dialog.open(AccountFormComponent, {
      width: '500px',
      data: {
        tenantId: this.tenantId!,
        accounts: this.accounts,
        account: null
      } as AccountFormData
    });
    ref.afterClosed().subscribe(saved => { if (saved) this.loadAll(); });
  }

  openEdit(account: Account): void {
    const ref = this.dialog.open(AccountFormComponent, {
      width: '500px',
      data: {
        tenantId: this.tenantId!,
        accounts: this.accounts,
        account
      } as AccountFormData
    });
    ref.afterClosed().subscribe(saved => { if (saved) this.loadAll(); });
  }

  deactivate(account: Account): void {
    if (!this.tenantId) return;
    if (!confirm(`Desativar a conta "${account.code} – ${account.name}"?`)) return;
    this.api.deactivateAccount(this.tenantId, account.id).subscribe({
      next: () => {
        this.snackBar.open('Conta desativada', 'Fechar', { duration: 2500 });
        this.loadAll();
      },
      error: err => this.snackBar.open(err?.error?.message || 'Erro ao desativar', 'Fechar', { duration: 5000 })
    });
  }

  saveGlSettings(): void {
    if (!this.tenantId || this.glSettingsForm.invalid) return;
    this.savingSettings = true;
    const payload: UpdateTenantGlSettingsRequest = this.glSettingsForm.value;
    this.api.updateGlSettings(this.tenantId, payload).subscribe({
      next: settings => {
        this.glSettings = settings;
        this.snackBar.open('Configurações salvas', 'Fechar', { duration: 2500 });
        this.savingSettings = false;
      },
      error: err => {
        this.savingSettings = false;
        this.snackBar.open(err?.error?.message || 'Erro ao salvar configurações', 'Fechar', { duration: 5000 });
      }
    });
  }
}
```

- [ ] **Step 3: Create `chart-of-accounts.component.html`**

```html
<div class="chart-of-accounts">
  <section class="page-header">
    <div class="page-header__icon"><mat-icon>account_tree</mat-icon></div>
    <div class="page-header__text">
      <h1>Plano de Contas</h1>
      <p>Estrutura de contas contábeis do tenant.</p>
    </div>
    <span class="spacer"></span>
    <mat-slide-toggle [(ngModel)]="includeInactive" (change)="loadAll()" style="margin-right:16px">
      Incluir inativas
    </mat-slide-toggle>
    <button mat-flat-button color="primary" *ngIf="canManage" (click)="openCreate()">
      <mat-icon>add</mat-icon> Nova Conta
    </button>
  </section>

  <mat-card>
    <mat-progress-spinner *ngIf="loading" mode="indeterminate" diameter="40" style="margin:24px auto"></mat-progress-spinner>

    <table mat-table [dataSource]="accounts" *ngIf="!loading">
      <ng-container matColumnDef="code">
        <th mat-header-cell *matHeaderCellDef>Código</th>
        <td mat-cell *matCellDef="let a" [style.paddingLeft.px]="indentLevel(a.code)">
          <strong>{{ a.code }}</strong>
        </td>
      </ng-container>

      <ng-container matColumnDef="name">
        <th mat-header-cell *matHeaderCellDef>Nome</th>
        <td mat-cell *matCellDef="let a">{{ a.name }}</td>
      </ng-container>

      <ng-container matColumnDef="type">
        <th mat-header-cell *matHeaderCellDef>Tipo</th>
        <td mat-cell *matCellDef="let a">
          <mat-chip-set><mat-chip>{{ accountTypeLabels[a.type] }}</mat-chip></mat-chip-set>
        </td>
      </ng-container>

      <ng-container matColumnDef="kind">
        <th mat-header-cell *matHeaderCellDef>Natureza</th>
        <td mat-cell *matCellDef="let a">{{ a.isAnalytic ? 'Analítica' : 'Sintética' }}</td>
      </ng-container>

      <ng-container matColumnDef="active">
        <th mat-header-cell *matHeaderCellDef>Ativa</th>
        <td mat-cell *matCellDef="let a">
          <mat-icon [style.color]="a.isActive ? '#4caf50' : '#bdbdbd'">
            {{ a.isActive ? 'check_circle' : 'cancel' }}
          </mat-icon>
        </td>
      </ng-container>

      <ng-container matColumnDef="actions">
        <th mat-header-cell *matHeaderCellDef></th>
        <td mat-cell *matCellDef="let a">
          <button mat-icon-button *ngIf="canManage" (click)="openEdit(a)" matTooltip="Editar">
            <mat-icon>edit</mat-icon>
          </button>
          <button mat-icon-button *ngIf="canManage && a.isActive" (click)="deactivate(a)" matTooltip="Desativar">
            <mat-icon>block</mat-icon>
          </button>
        </td>
      </ng-container>

      <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
      <tr mat-row *matRowDef="let row; columns: displayedColumns;"
          [class.inactive-row]="!row.isActive"></tr>
    </table>
  </mat-card>

  <!-- GL Settings -->
  <mat-card class="gl-settings-card" *ngIf="glSettings !== null">
    <mat-card-header>
      <mat-card-title>Configurações do Razão Geral</mat-card-title>
      <mat-card-subtitle>Contas padrão usadas no lançamento automático</mat-card-subtitle>
    </mat-card-header>
    <mat-card-content>
      <form [formGroup]="glSettingsForm" class="gl-settings-form">
        <mat-form-field appearance="outline">
          <mat-label>Conta de Caixa/Banco padrão</mat-label>
          <mat-select formControlName="defaultCashAccountId">
            <mat-option [value]="null">— nenhuma —</mat-option>
            <mat-option *ngFor="let a of analyticAccounts" [value]="a.id">
              {{ a.code }} – {{ a.name }}
            </mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Conta de Contas a Pagar padrão</mat-label>
          <mat-select formControlName="defaultAccountsPayableAccountId">
            <mat-option [value]="null">— nenhuma —</mat-option>
            <mat-option *ngFor="let a of analyticAccounts" [value]="a.id">
              {{ a.code }} – {{ a.name }}
            </mat-option>
          </mat-select>
        </mat-form-field>
      </form>
    </mat-card-content>
    <mat-card-actions *ngIf="canManage">
      <button mat-flat-button color="primary" (click)="saveGlSettings()" [disabled]="savingSettings">
        <mat-spinner *ngIf="savingSettings" diameter="18"></mat-spinner>
        Salvar
      </button>
    </mat-card-actions>
  </mat-card>
</div>
```

- [ ] **Step 4: Create `chart-of-accounts.component.scss`**

```scss
.chart-of-accounts {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 16px;

  &__icon mat-icon { font-size: 32px; height: 32px; width: 32px; }
  &__text h1 { margin: 0; font-size: 1.5rem; }
  &__text p { margin: 0; color: rgba(0,0,0,0.54); }
}

.spacer { flex: 1; }

.inactive-row { opacity: 0.45; }

.gl-settings-card {
  .gl-settings-form {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
    padding-top: 8px;

    mat-form-field { flex: 1; min-width: 280px; }
  }
}
```

- [ ] **Step 5: Build to verify**

```bash
npx tsc --noEmit
```

- [ ] **Step 6: Commit**

```bash
git add src/app/modules/finance/chart-of-accounts/
git commit -m "feat: add Chart of Accounts list + GL settings component"
```

---

## Task 8 — Account form dialog

**Files:**
- Create: `src/app/modules/finance/chart-of-accounts/account-form/account-form.component.ts`
- Create: `src/app/modules/finance/chart-of-accounts/account-form/account-form.component.html`

- [ ] **Step 1: Create `account-form.component.ts`**

```typescript
import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ApiService } from '@core/services';
import { Account, AccountType, CreateAccountRequest, UpdateAccountRequest } from '@core/models';

export interface AccountFormData {
  tenantId: string;
  accounts: Account[];
  account: Account | null;
}

@Component({
  selector: 'app-account-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './account-form.component.html'
})
export class AccountFormComponent implements OnInit {
  form!: FormGroup;
  saving = false;
  readonly isEdit: boolean;

  readonly accountTypes = [
    { value: AccountType.Asset, label: 'Ativo' },
    { value: AccountType.Liability, label: 'Passivo' },
    { value: AccountType.Equity, label: 'Patrimônio Líquido' },
    { value: AccountType.Revenue, label: 'Receita' },
    { value: AccountType.Expense, label: 'Despesa' }
  ];

  get syntheticAccounts(): Account[] {
    return this.data.accounts.filter(a => !a.isAnalytic && a.isActive && a.id !== this.data.account?.id);
  }

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<AccountFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AccountFormData
  ) {
    this.isEdit = !!data.account;
  }

  ngOnInit(): void {
    const a = this.data.account;
    this.form = this.fb.group({
      code: [a?.code ?? '', [Validators.required, Validators.maxLength(20)]],
      name: [a?.name ?? '', [Validators.required, Validators.maxLength(200)]],
      type: [a?.type ?? AccountType.Expense, Validators.required],
      isAnalytic: [a?.isAnalytic ?? true],
      parentId: [a?.parentId ?? null],
      isActive: [a?.isActive ?? true]
    });
  }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true;
    const v = this.form.value;

    if (this.isEdit) {
      const payload: UpdateAccountRequest = {
        code: v.code,
        name: v.name,
        type: v.type,
        isAnalytic: v.isAnalytic,
        parentId: v.parentId || null,
        isActive: v.isActive
      };
      this.api.updateAccount(this.data.tenantId, this.data.account!.id, payload).subscribe({
        next: () => { this.saving = false; this.dialogRef.close(true); },
        error: err => { this.saving = false; this.snackBar.open(err?.error?.message || 'Erro ao salvar', 'Fechar', { duration: 5000 }); }
      });
    } else {
      const payload: CreateAccountRequest = {
        code: v.code,
        name: v.name,
        type: v.type,
        isAnalytic: v.isAnalytic,
        parentId: v.parentId || null
      };
      this.api.createAccount(this.data.tenantId, payload).subscribe({
        next: () => { this.saving = false; this.dialogRef.close(true); },
        error: err => { this.saving = false; this.snackBar.open(err?.error?.message || 'Erro ao criar conta', 'Fechar', { duration: 5000 }); }
      });
    }
  }
}
```

- [ ] **Step 2: Create `account-form.component.html`**

```html
<h2 mat-dialog-title>{{ isEdit ? 'Editar Conta' : 'Nova Conta' }}</h2>

<mat-dialog-content>
  <form [formGroup]="form" class="account-form">
    <mat-form-field appearance="outline" style="width:100%">
      <mat-label>Código</mat-label>
      <input matInput formControlName="code" placeholder="Ex: 1.1.3">
      <mat-error *ngIf="form.get('code')?.hasError('required')">Código obrigatório</mat-error>
    </mat-form-field>

    <mat-form-field appearance="outline" style="width:100%">
      <mat-label>Nome</mat-label>
      <input matInput formControlName="name">
      <mat-error *ngIf="form.get('name')?.hasError('required')">Nome obrigatório</mat-error>
    </mat-form-field>

    <mat-form-field appearance="outline" style="width:100%">
      <mat-label>Tipo</mat-label>
      <mat-select formControlName="type">
        <mat-option *ngFor="let t of accountTypes" [value]="t.value">{{ t.label }}</mat-option>
      </mat-select>
    </mat-form-field>

    <mat-form-field appearance="outline" style="width:100%">
      <mat-label>Conta Pai (opcional)</mat-label>
      <mat-select formControlName="parentId">
        <mat-option [value]="null">— Nenhuma (raiz) —</mat-option>
        <mat-option *ngFor="let a of syntheticAccounts" [value]="a.id">
          {{ a.code }} – {{ a.name }}
        </mat-option>
      </mat-select>
    </mat-form-field>

    <div style="display:flex; gap:24px; padding:8px 0">
      <mat-slide-toggle formControlName="isAnalytic">Conta Analítica</mat-slide-toggle>
      <mat-slide-toggle formControlName="isActive" *ngIf="isEdit">Ativa</mat-slide-toggle>
    </div>
  </form>
</mat-dialog-content>

<mat-dialog-actions align="end">
  <button mat-button mat-dialog-close>Cancelar</button>
  <button mat-flat-button color="primary" (click)="save()" [disabled]="saving">
    <mat-spinner *ngIf="saving" diameter="18" style="display:inline-block;margin-right:8px"></mat-spinner>
    Salvar
  </button>
</mat-dialog-actions>
```

- [ ] **Step 3: Build to verify**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add src/app/modules/finance/chart-of-accounts/account-form/
git commit -m "feat: add Account create/edit dialog"
```

---

## Task 9 — General Ledger list component

**Files:**
- Create: `src/app/modules/finance/general-ledger/general-ledger.component.ts`
- Create: `src/app/modules/finance/general-ledger/general-ledger.component.html`
- Create: `src/app/modules/finance/general-ledger/general-ledger.component.scss`

- [ ] **Step 1: Create directory**

```bash
mkdir -p src/app/modules/finance/general-ledger/journal-entry-detail
mkdir -p src/app/modules/finance/general-ledger/journal-entry-form
mkdir -p src/app/modules/finance/general-ledger/account-statement
```

- [ ] **Step 2: Create `general-ledger.component.ts`**

```typescript
import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { debounceTime, Subject, takeUntil } from 'rxjs';
import { ApiService, AuthService } from '@core/services';
import {
  JournalEntryListItem,
  JournalEntryQuery,
  PaginatedResponse,
  PermissionLevel
} from '@core/models';
import { JournalEntryDetailComponent } from './journal-entry-detail/journal-entry-detail.component';
import { JournalEntryFormComponent } from './journal-entry-form/journal-entry-form.component';
import { AccountStatementComponent } from './account-statement/account-statement.component';

@Component({
  selector: 'app-general-ledger',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    MatChipsModule
  ],
  templateUrl: './general-ledger.component.html',
  styleUrls: ['./general-ledger.component.scss']
})
export class GeneralLedgerComponent implements OnInit {
  filtersForm!: FormGroup;
  entries: JournalEntryListItem[] = [];
  loading = false;
  total = 0;
  pageIndex = 0;
  pageSize = 25;
  readonly pageSizeOptions = [10, 25, 50];
  readonly displayedColumns = ['date', 'description', 'source', 'totalAmount', 'lineCount', 'actions'];

  readonly sourceModules = [
    { value: '', label: 'Todos' },
    { value: 'AccountsPayable', label: 'Contas a Pagar' },
    { value: 'Manual', label: 'Manual' }
  ];

  private tenantId: string | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.tenantId = this.auth.getCurrentTenantId();
    if (!this.tenantId) return;

    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    this.filtersForm = this.fb.group({
      from: [firstDay],
      to: [lastDay],
      sourceModule: ['']
    });

    this.load();

    this.filtersForm.valueChanges.pipe(debounceTime(300), takeUntil(this.destroy$)).subscribe(() => {
      this.pageIndex = 0;
      this.load();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  load(): void {
    if (!this.tenantId) return;
    this.loading = true;
    const v = this.filtersForm.value;
    const query: JournalEntryQuery = {
      from: v.from ? this.toIso(v.from) : undefined,
      to: v.to ? this.toIso(v.to) : undefined,
      sourceModule: v.sourceModule || undefined,
      page: this.pageIndex + 1,
      pageSize: this.pageSize
    };
    this.api.listJournalEntries(this.tenantId, query).subscribe({
      next: (resp: PaginatedResponse<JournalEntryListItem>) => {
        this.entries = resp.items;
        this.total = resp.total;
        this.loading = false;
      },
      error: err => {
        this.loading = false;
        this.snackBar.open(err?.error?.message || 'Erro ao carregar lançamentos', 'Fechar', { duration: 5000 });
      }
    });
  }

  onPage(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.load();
  }

  openDetail(entry: JournalEntryListItem): void {
    this.dialog.open(JournalEntryDetailComponent, {
      width: '700px',
      data: { tenantId: this.tenantId!, entryId: entry.id }
    });
  }

  openCreate(): void {
    const ref = this.dialog.open(JournalEntryFormComponent, {
      width: '700px',
      data: { tenantId: this.tenantId! }
    });
    ref.afterClosed().subscribe(saved => { if (saved) this.load(); });
  }

  openStatement(): void {
    this.dialog.open(AccountStatementComponent, {
      width: '800px',
      data: { tenantId: this.tenantId! }
    });
  }

  get canCreate(): boolean {
    return this.auth.canAccessResource('GeneralLedger.Management', PermissionLevel.Full);
  }

  private toIso(d: Date | string): string {
    const dt = d instanceof Date ? d : new Date(d);
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
  }

  sourceLabel(module: string | null | undefined): string {
    if (!module) return '—';
    return this.sourceModules.find(s => s.value === module)?.label ?? module;
  }
}
```

- [ ] **Step 3: Create `general-ledger.component.html`**

```html
<div class="general-ledger">
  <section class="page-header">
    <div class="page-header__icon"><mat-icon>menu_book</mat-icon></div>
    <div class="page-header__text">
      <h1>Razão Geral</h1>
      <p>Lançamentos contábeis e extrato por conta.</p>
    </div>
    <span class="spacer"></span>
    <button mat-stroked-button (click)="openStatement()">
      <mat-icon>receipt_long</mat-icon> Extrato por Conta
    </button>
    <button mat-flat-button color="primary" *ngIf="canCreate" (click)="openCreate()">
      <mat-icon>add</mat-icon> Lançamento Manual
    </button>
  </section>

  <mat-card class="filters-card">
    <form [formGroup]="filtersForm" class="filters">
      <mat-form-field appearance="outline">
        <mat-label>De</mat-label>
        <input matInput [matDatepicker]="fromPicker" formControlName="from">
        <mat-datepicker-toggle matIconSuffix [for]="fromPicker"></mat-datepicker-toggle>
        <mat-datepicker #fromPicker></mat-datepicker>
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>Até</mat-label>
        <input matInput [matDatepicker]="toPicker" formControlName="to">
        <mat-datepicker-toggle matIconSuffix [for]="toPicker"></mat-datepicker-toggle>
        <mat-datepicker #toPicker></mat-datepicker>
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>Módulo</mat-label>
        <mat-select formControlName="sourceModule">
          <mat-option *ngFor="let s of sourceModules" [value]="s.value">{{ s.label }}</mat-option>
        </mat-select>
      </mat-form-field>
    </form>
  </mat-card>

  <mat-card>
    <mat-progress-spinner *ngIf="loading" mode="indeterminate" diameter="40" style="margin:24px auto"></mat-progress-spinner>

    <table mat-table [dataSource]="entries" *ngIf="!loading">
      <ng-container matColumnDef="date">
        <th mat-header-cell *matHeaderCellDef>Data</th>
        <td mat-cell *matCellDef="let e">{{ e.date | date:'dd/MM/yyyy' }}</td>
      </ng-container>
      <ng-container matColumnDef="description">
        <th mat-header-cell *matHeaderCellDef>Descrição</th>
        <td mat-cell *matCellDef="let e">{{ e.description }}</td>
      </ng-container>
      <ng-container matColumnDef="source">
        <th mat-header-cell *matHeaderCellDef>Origem</th>
        <td mat-cell *matCellDef="let e">
          <mat-chip-set><mat-chip>{{ sourceLabel(e.sourceModule) }}</mat-chip></mat-chip-set>
        </td>
      </ng-container>
      <ng-container matColumnDef="totalAmount">
        <th mat-header-cell *matHeaderCellDef>Total</th>
        <td mat-cell *matCellDef="let e">{{ e.totalAmount | currency:'BRL' }}</td>
      </ng-container>
      <ng-container matColumnDef="lineCount">
        <th mat-header-cell *matHeaderCellDef>Linhas</th>
        <td mat-cell *matCellDef="let e">{{ e.lineCount }}</td>
      </ng-container>
      <ng-container matColumnDef="actions">
        <th mat-header-cell *matHeaderCellDef></th>
        <td mat-cell *matCellDef="let e">
          <button mat-icon-button (click)="openDetail(e)"><mat-icon>visibility</mat-icon></button>
        </td>
      </ng-container>
      <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
      <tr mat-row *matRowDef="let row; columns: displayedColumns;" style="cursor:pointer" (click)="openDetail(row)"></tr>
    </table>

    <mat-paginator
      [length]="total"
      [pageSize]="pageSize"
      [pageSizeOptions]="pageSizeOptions"
      [pageIndex]="pageIndex"
      (page)="onPage($event)">
    </mat-paginator>
  </mat-card>
</div>
```

- [ ] **Step 4: Create `general-ledger.component.scss`**

```scss
.general-ledger {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 16px;
  &__icon mat-icon { font-size: 32px; height: 32px; width: 32px; }
  &__text h1 { margin: 0; font-size: 1.5rem; }
  &__text p { margin: 0; color: rgba(0,0,0,0.54); }
}

.spacer { flex: 1; }

.filters-card .filters {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  padding: 8px;
  mat-form-field { min-width: 160px; }
}
```

- [ ] **Step 5: Build to verify**

```bash
npx tsc --noEmit
```

- [ ] **Step 6: Commit**

```bash
git add src/app/modules/finance/general-ledger/general-ledger.component.*
git commit -m "feat: add General Ledger list component"
```

---

## Task 10 — Journal entry detail dialog

**Files:**
- Create: `src/app/modules/finance/general-ledger/journal-entry-detail/journal-entry-detail.component.ts`
- Create: `src/app/modules/finance/general-ledger/journal-entry-detail/journal-entry-detail.component.html`

- [ ] **Step 1: Create `journal-entry-detail.component.ts`**

```typescript
import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { ApiService } from '@core/services';
import { JournalEntryDto, JournalEntryType } from '@core/models';

export interface JournalEntryDetailData {
  tenantId: string;
  entryId: string;
}

@Component({
  selector: 'app-journal-entry-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatTableModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatChipsModule
  ],
  templateUrl: './journal-entry-detail.component.html'
})
export class JournalEntryDetailComponent implements OnInit {
  entry: JournalEntryDto | null = null;
  loading = true;
  readonly displayedColumns = ['account', 'debit', 'credit'];
  readonly JournalEntryType = JournalEntryType;

  constructor(
    private api: ApiService,
    private dialogRef: MatDialogRef<JournalEntryDetailComponent>,
    @Inject(MAT_DIALOG_DATA) public data: JournalEntryDetailData
  ) {}

  ngOnInit(): void {
    this.api.getJournalEntry(this.data.tenantId, this.data.entryId).subscribe({
      next: entry => { this.entry = entry; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  get totalDebit(): number {
    return this.entry?.lines.filter(l => l.entryType === JournalEntryType.Debit).reduce((s, l) => s + l.amount, 0) ?? 0;
  }

  get totalCredit(): number {
    return this.entry?.lines.filter(l => l.entryType === JournalEntryType.Credit).reduce((s, l) => s + l.amount, 0) ?? 0;
  }
}
```

- [ ] **Step 2: Create `journal-entry-detail.component.html`**

```html
<h2 mat-dialog-title>Lançamento Contábil</h2>

<mat-dialog-content>
  <mat-progress-spinner *ngIf="loading" mode="indeterminate" diameter="40" style="margin:24px auto"></mat-progress-spinner>

  <div *ngIf="entry && !loading">
    <p><strong>Data:</strong> {{ entry.date | date:'dd/MM/yyyy' }}</p>
    <p><strong>Descrição:</strong> {{ entry.description }}</p>
    <p *ngIf="entry.sourceModule"><strong>Origem:</strong> {{ entry.sourceModule }}</p>

    <table mat-table [dataSource]="entry.lines" style="width:100%">
      <ng-container matColumnDef="account">
        <th mat-header-cell *matHeaderCellDef>Conta</th>
        <td mat-cell *matCellDef="let l">{{ l.accountCode }} – {{ l.accountName }}</td>
        <td mat-footer-cell *matFooterCellDef><strong>Total</strong></td>
      </ng-container>
      <ng-container matColumnDef="debit">
        <th mat-header-cell *matHeaderCellDef style="text-align:right">Débito</th>
        <td mat-cell *matCellDef="let l" style="text-align:right">
          {{ l.entryType === JournalEntryType.Debit ? (l.amount | currency:'BRL') : '' }}
        </td>
        <td mat-footer-cell *matFooterCellDef style="text-align:right"><strong>{{ totalDebit | currency:'BRL' }}</strong></td>
      </ng-container>
      <ng-container matColumnDef="credit">
        <th mat-header-cell *matHeaderCellDef style="text-align:right">Crédito</th>
        <td mat-cell *matCellDef="let l" style="text-align:right">
          {{ l.entryType === JournalEntryType.Credit ? (l.amount | currency:'BRL') : '' }}
        </td>
        <td mat-footer-cell *matFooterCellDef style="text-align:right"><strong>{{ totalCredit | currency:'BRL' }}</strong></td>
      </ng-container>

      <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
      <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
      <tr mat-footer-row *matFooterRowDef="displayedColumns"></tr>
    </table>
  </div>
</mat-dialog-content>

<mat-dialog-actions align="end">
  <button mat-button mat-dialog-close>Fechar</button>
</mat-dialog-actions>
```

- [ ] **Step 3: Build and commit**

```bash
npx tsc --noEmit
git add src/app/modules/finance/general-ledger/journal-entry-detail/
git commit -m "feat: add journal entry detail dialog"
```

---

## Task 11 — Manual journal entry form dialog

**Files:**
- Create: `src/app/modules/finance/general-ledger/journal-entry-form/journal-entry-form.component.ts`
- Create: `src/app/modules/finance/general-ledger/journal-entry-form/journal-entry-form.component.html`

- [ ] **Step 1: Create `journal-entry-form.component.ts`**

```typescript
import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  FormArray,
  Validators,
  AbstractControl
} from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ApiService } from '@core/services';
import {
  Account,
  AccountType,
  JournalEntryType,
  CreateJournalEntryRequest,
  CreateJournalLineDto
} from '@core/models';

export interface JournalEntryFormData {
  tenantId: string;
}

@Component({
  selector: 'app-journal-entry-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './journal-entry-form.component.html'
})
export class JournalEntryFormComponent implements OnInit {
  form!: FormGroup;
  accounts: Account[] = [];
  saving = false;

  readonly entryTypes = [
    { value: JournalEntryType.Debit, label: 'Débito' },
    { value: JournalEntryType.Credit, label: 'Crédito' }
  ];

  get lines(): FormArray {
    return this.form.get('lines') as FormArray;
  }

  get totalDebit(): number {
    return this.lines.controls
      .filter(c => c.get('entryType')?.value === JournalEntryType.Debit)
      .reduce((s, c) => s + (Number(c.get('amount')?.value) || 0), 0);
  }

  get totalCredit(): number {
    return this.lines.controls
      .filter(c => c.get('entryType')?.value === JournalEntryType.Credit)
      .reduce((s, c) => s + (Number(c.get('amount')?.value) || 0), 0);
  }

  get isBalanced(): boolean {
    return Math.abs(this.totalDebit - this.totalCredit) < 0.001;
  }

  get analyticAccounts(): Account[] {
    return this.accounts.filter(a => a.isAnalytic && a.isActive);
  }

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<JournalEntryFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: JournalEntryFormData
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      date: [new Date(), Validators.required],
      description: ['', [Validators.required, Validators.maxLength(500)]],
      lines: this.fb.array([this.createLine(), this.createLine()])
    });

    this.api.getChartOfAccounts(this.data.tenantId, false).subscribe({
      next: accounts => (this.accounts = accounts),
      error: () => {}
    });
  }

  createLine(): FormGroup {
    return this.fb.group({
      accountId: ['', Validators.required],
      entryType: [JournalEntryType.Debit, Validators.required],
      amount: [null, [Validators.required, Validators.min(0.01)]]
    });
  }

  addLine(): void {
    this.lines.push(this.createLine());
  }

  removeLine(index: number): void {
    if (this.lines.length > 2) this.lines.removeAt(index);
  }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    if (!this.isBalanced) {
      this.snackBar.open('O lançamento não está balanceado (débitos ≠ créditos)', 'Fechar', { duration: 5000 });
      return;
    }
    this.saving = true;
    const v = this.form.value;
    const d = v.date instanceof Date ? v.date : new Date(v.date);
    const payload: CreateJournalEntryRequest = {
      date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
      description: v.description,
      lines: v.lines.map((l: any): CreateJournalLineDto => ({
        accountId: l.accountId,
        entryType: l.entryType,
        amount: Number(l.amount)
      }))
    };
    this.api.createJournalEntry(this.data.tenantId, payload).subscribe({
      next: () => { this.saving = false; this.dialogRef.close(true); },
      error: err => { this.saving = false; this.snackBar.open(err?.error?.message || 'Erro ao salvar', 'Fechar', { duration: 5000 }); }
    });
  }
}
```

- [ ] **Step 2: Create `journal-entry-form.component.html`**

```html
<h2 mat-dialog-title>Lançamento Manual</h2>

<mat-dialog-content>
  <form [formGroup]="form">
    <div style="display:flex; gap:16px; flex-wrap:wrap">
      <mat-form-field appearance="outline">
        <mat-label>Data</mat-label>
        <input matInput [matDatepicker]="datePicker" formControlName="date">
        <mat-datepicker-toggle matIconSuffix [for]="datePicker"></mat-datepicker-toggle>
        <mat-datepicker #datePicker></mat-datepicker>
      </mat-form-field>
      <mat-form-field appearance="outline" style="flex:1">
        <mat-label>Descrição</mat-label>
        <input matInput formControlName="description">
        <mat-error *ngIf="form.get('description')?.hasError('required')">Obrigatório</mat-error>
      </mat-form-field>
    </div>

    <div formArrayName="lines">
      <div *ngFor="let line of lines.controls; let i = index" [formGroupName]="i"
           style="display:flex; gap:12px; align-items:flex-start; margin-bottom:8px">

        <mat-form-field appearance="outline" style="flex:2">
          <mat-label>Conta</mat-label>
          <mat-select formControlName="accountId">
            <mat-option *ngFor="let a of analyticAccounts" [value]="a.id">
              {{ a.code }} – {{ a.name }}
            </mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" style="flex:1">
          <mat-label>Tipo</mat-label>
          <mat-select formControlName="entryType">
            <mat-option *ngFor="let t of entryTypes" [value]="t.value">{{ t.label }}</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" style="flex:1">
          <mat-label>Valor</mat-label>
          <input matInput type="number" min="0.01" step="0.01" formControlName="amount">
        </mat-form-field>

        <button mat-icon-button type="button" (click)="removeLine(i)" [disabled]="lines.length <= 2"
                style="margin-top:8px">
          <mat-icon>delete</mat-icon>
        </button>
      </div>
    </div>

    <button mat-stroked-button type="button" (click)="addLine()">
      <mat-icon>add</mat-icon> Adicionar linha
    </button>

    <div style="margin-top:16px; display:flex; gap:32px">
      <span>Débitos: <strong>{{ totalDebit | currency:'BRL' }}</strong></span>
      <span>Créditos: <strong>{{ totalCredit | currency:'BRL' }}</strong></span>
      <span [style.color]="isBalanced ? '#4caf50' : '#f44336'">
        <mat-icon style="vertical-align:middle; font-size:18px">
          {{ isBalanced ? 'check_circle' : 'error' }}
        </mat-icon>
        {{ isBalanced ? 'Balanceado' : 'Desbalanceado' }}
      </span>
    </div>
  </form>
</mat-dialog-content>

<mat-dialog-actions align="end">
  <button mat-button mat-dialog-close>Cancelar</button>
  <button mat-flat-button color="primary" (click)="save()" [disabled]="saving || !isBalanced">
    <mat-spinner *ngIf="saving" diameter="18" style="display:inline-block;margin-right:8px"></mat-spinner>
    Salvar
  </button>
</mat-dialog-actions>
```

- [ ] **Step 3: Build and commit**

```bash
npx tsc --noEmit
git add src/app/modules/finance/general-ledger/journal-entry-form/
git commit -m "feat: add manual journal entry form dialog with balance validation"
```

---

## Task 12 — Account statement dialog

**Files:**
- Create: `src/app/modules/finance/general-ledger/account-statement/account-statement.component.ts`
- Create: `src/app/modules/finance/general-ledger/account-statement/account-statement.component.html`
- Create: `src/app/modules/finance/general-ledger/account-statement/account-statement.component.scss`

- [ ] **Step 1: Create `account-statement.component.ts`**

```typescript
import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '@core/services';
import { Account, AccountStatementDto, JournalEntryType } from '@core/models';

export interface AccountStatementDialogData {
  tenantId: string;
}

@Component({
  selector: 'app-account-statement',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatIconModule
  ],
  templateUrl: './account-statement.component.html',
  styleUrls: ['./account-statement.component.scss']
})
export class AccountStatementComponent implements OnInit {
  filtersForm!: FormGroup;
  accounts: Account[] = [];
  statement: AccountStatementDto | null = null;
  loading = false;
  readonly displayedColumns = ['date', 'description', 'debit', 'credit', 'balance'];
  readonly JournalEntryType = JournalEntryType;

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<AccountStatementComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AccountStatementDialogData
  ) {}

  ngOnInit(): void {
    const today = new Date();
    this.filtersForm = this.fb.group({
      accountId: ['', Validators.required],
      from: [new Date(today.getFullYear(), today.getMonth(), 1)],
      to: [new Date(today.getFullYear(), today.getMonth() + 1, 0)]
    });

    this.api.getChartOfAccounts(this.data.tenantId, false).subscribe({
      next: accounts => (this.accounts = accounts.filter(a => a.isAnalytic)),
      error: () => {}
    });
  }

  load(): void {
    if (this.filtersForm.invalid) { this.filtersForm.markAllAsTouched(); return; }
    const v = this.filtersForm.value;
    this.loading = true;
    this.api.getAccountStatement(
      this.data.tenantId,
      v.accountId,
      v.from ? this.toIso(v.from) : undefined,
      v.to ? this.toIso(v.to) : undefined
    ).subscribe({
      next: stmt => { this.statement = stmt; this.loading = false; },
      error: err => {
        this.loading = false;
        this.snackBar.open(err?.error?.message || 'Erro ao carregar extrato', 'Fechar', { duration: 5000 });
      }
    });
  }

  private toIso(d: Date | string): string {
    const dt = d instanceof Date ? d : new Date(d);
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
  }
}
```

- [ ] **Step 2: Create `account-statement.component.html`**

```html
<h2 mat-dialog-title>Extrato por Conta</h2>

<mat-dialog-content class="statement-content">
  <form [formGroup]="filtersForm" class="filters">
    <mat-form-field appearance="outline" style="flex:2">
      <mat-label>Conta</mat-label>
      <mat-select formControlName="accountId">
        <mat-option *ngFor="let a of accounts" [value]="a.id">{{ a.code }} – {{ a.name }}</mat-option>
      </mat-select>
    </mat-form-field>
    <mat-form-field appearance="outline">
      <mat-label>De</mat-label>
      <input matInput [matDatepicker]="fromPicker" formControlName="from">
      <mat-datepicker-toggle matIconSuffix [for]="fromPicker"></mat-datepicker-toggle>
      <mat-datepicker #fromPicker></mat-datepicker>
    </mat-form-field>
    <mat-form-field appearance="outline">
      <mat-label>Até</mat-label>
      <input matInput [matDatepicker]="toPicker" formControlName="to">
      <mat-datepicker-toggle matIconSuffix [for]="toPicker"></mat-datepicker-toggle>
      <mat-datepicker #toPicker></mat-datepicker>
    </mat-form-field>
    <button mat-flat-button color="primary" type="button" (click)="load()">
      <mat-icon>search</mat-icon> Consultar
    </button>
  </form>

  <mat-progress-spinner *ngIf="loading" mode="indeterminate" diameter="40" style="margin:24px auto"></mat-progress-spinner>

  <div *ngIf="statement && !loading">
    <div class="balance-row">
      <span>Saldo inicial: <strong>{{ statement.openingBalance | currency:'BRL' }}</strong></span>
      <span>Saldo final: <strong>{{ statement.closingBalance | currency:'BRL' }}</strong></span>
    </div>

    <table mat-table [dataSource]="statement.lines" style="width:100%">
      <ng-container matColumnDef="date">
        <th mat-header-cell *matHeaderCellDef>Data</th>
        <td mat-cell *matCellDef="let l">{{ l.date | date:'dd/MM/yyyy' }}</td>
      </ng-container>
      <ng-container matColumnDef="description">
        <th mat-header-cell *matHeaderCellDef>Descrição</th>
        <td mat-cell *matCellDef="let l">{{ l.description }}</td>
      </ng-container>
      <ng-container matColumnDef="debit">
        <th mat-header-cell *matHeaderCellDef style="text-align:right">Débito</th>
        <td mat-cell *matCellDef="let l" style="text-align:right">
          {{ l.entryType === JournalEntryType.Debit ? (l.amount | currency:'BRL') : '' }}
        </td>
      </ng-container>
      <ng-container matColumnDef="credit">
        <th mat-header-cell *matHeaderCellDef style="text-align:right">Crédito</th>
        <td mat-cell *matCellDef="let l" style="text-align:right">
          {{ l.entryType === JournalEntryType.Credit ? (l.amount | currency:'BRL') : '' }}
        </td>
      </ng-container>
      <ng-container matColumnDef="balance">
        <th mat-header-cell *matHeaderCellDef style="text-align:right">Saldo</th>
        <td mat-cell *matCellDef="let l" style="text-align:right">{{ l.runningBalance | currency:'BRL' }}</td>
      </ng-container>
      <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
      <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
    </table>

    <p *ngIf="statement.lines.length === 0" style="text-align:center;padding:24px;color:rgba(0,0,0,0.54)">
      Nenhum lançamento no período.
    </p>
  </div>
</mat-dialog-content>

<mat-dialog-actions align="end">
  <button mat-button mat-dialog-close>Fechar</button>
</mat-dialog-actions>
```

- [ ] **Step 3: Create `account-statement.component.scss`**

```scss
.statement-content {
  min-width: 600px;
}

.filters {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  flex-wrap: wrap;
  margin-bottom: 16px;
  button { margin-top: 4px; }
}

.balance-row {
  display: flex;
  gap: 32px;
  margin: 8px 0 16px;
  font-size: 0.95rem;
}
```

- [ ] **Step 4: Build and commit**

```bash
npx tsc --noEmit
git add src/app/modules/finance/general-ledger/account-statement/
git commit -m "feat: add account statement dialog"
```

---

## Task 13 — Wire routes and navigation

**Files:**
- Modify: `src/app/app.routes.ts`
- Modify: `src/app/shared/components/layout/layout.component.ts`
- Modify: `src/app/shared/components/layout/layout.component.html`

- [ ] **Step 1: Add Finance routes to `app.routes.ts`**

Add two imports at the top of `app.routes.ts`:

```typescript
import { ChartOfAccountsComponent } from './modules/finance/chart-of-accounts/chart-of-accounts.component';
import { GeneralLedgerComponent } from './modules/finance/general-ledger/general-ledger.component';
```

Inside the authenticated children array (after the `accounts-payable/:id/edit` route), add:

```typescript
{
  path: 'finance/chart-of-accounts',
  component: ChartOfAccountsComponent
},
{
  path: 'finance/general-ledger',
  component: GeneralLedgerComponent
},
```

- [ ] **Step 2: Add Finance nav section to `layout.component.ts`**

In `layout.component.ts`, add a new section to the `menuSections` array (after `'Menu Principal'`):

```typescript
{
  title: 'Financeiro',
  items: [
    {
      label: 'Plano de Contas',
      icon: 'account_tree',
      route: '/finance/chart-of-accounts',
      resourceCode: 'ChartOfAccounts.Management'
    },
    {
      label: 'Razão Geral',
      icon: 'menu_book',
      route: '/finance/general-ledger',
      resourceCode: 'GeneralLedger.Management'
    }
  ]
},
```

Also add `resourceCode?: string` to the `NavigationItem` interface:

```typescript
interface NavigationItem {
  label: string;
  icon: string;
  route: string;
  roles?: string[];
  resourceCode?: string;
}
```

And update the `hasAccess` method to check resource codes as well:

```typescript
hasAccess(item: NavigationItem, user: User | null): boolean {
  if (item.resourceCode) {
    return this.authService.canAccessResource(item.resourceCode);
  }
  if (!item.roles?.length) return true;
  const userRoles = user?.roles ?? [];
  return item.roles.some(role => userRoles.includes(role));
}
```

Update `hasVisibleItems` to pass the full item:

```typescript
hasVisibleItems(section: NavigationSection, user: User | null): boolean {
  return section.items.some(item => this.hasAccess(item, user));
}
```

- [ ] **Step 3: Update `layout.component.html` to pass item instead of item.roles**

Find the existing `*ngIf` on the nav list items and update to pass the full item. Look for:

```html
*ngIf="hasAccess(item.roles, user)"
```

Replace with:

```html
*ngIf="hasAccess(item, user)"
```

Similarly update:

```html
*ngIf="hasVisibleItems(section, user)"
```

This one doesn't change but verify it's present and correct.

- [ ] **Step 4: Build to verify the whole app compiles**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/app.routes.ts \
        src/app/shared/components/layout/layout.component.ts \
        src/app/shared/components/layout/layout.component.html
git commit -m "feat: wire Finance module routes and sidenav navigation"
```

---

## Task 14 — Final build verification

- [ ] **Step 1: Run full TypeScript check**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 2: Run linter**

```bash
npm run lint
```

Expected: no errors (warnings OK).

- [ ] **Step 3: Start the dev server and manually verify**

```bash
npm start
```

Open `http://localhost:4200`. Log in with a tenant-scoped user and verify:

- Accounts Payable list loads without console errors
- Bulk quick-entry submits successfully (check network tab: payload should have `lines[]`)
- Summary card no longer shows "Atrasado" section (removed overdue block)
- Finance section appears in the sidenav if the user has `ChartOfAccounts.Management` or `GeneralLedger.Management` resource permission
- `/finance/chart-of-accounts` loads and shows the seeded account tree
- Creating / editing an account opens the dialog and saves
- GL Settings panel shows and allows updating default accounts (Admin/Owner)
- `/finance/general-ledger` loads the journal entries list
- Clicking a row opens the detail dialog with debit/credit lines
- "Lançamento Manual" button opens the form; balance indicator updates as you type; submit blocked when unbalanced
- "Extrato por Conta" opens the statement dialog; selecting an analytic account + date range loads the statement with running balance

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "chore: final verification pass — financial core adaptation complete"
```
