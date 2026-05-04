# Frontend Financial Core Adaptation — Design Spec

**Date:** 2026-04-29  
**Scope:** Two-phase frontend update: (1) fix DTO gaps against the already-implemented backend, (2) add Chart of Accounts and General Ledger UI  
**Stack:** Angular 18 standalone components, Angular Material, ReactiveFormsModule, RxJS

---

## Context

The backend recently shipped:
- Multi-tenancy + Accounts Payable module (April 26–27) — fully implemented
- Financial Core Phase 1 (Chart of Accounts + General Ledger) — implemented on a feature branch

The frontend has the AP module but contains several DTO mismatches against the real backend responses. A new Finance module (Chart of Accounts + General Ledger) must also be built.

---

## Phase 1 — Fix AP / Core DTO Gaps

All changes are in `src/app/core/models/index.ts`, `src/app/core/services/api.service.ts`, and the components that consume the broken fields.

### 1.1 `AccountsPayableEntry` — missing fields

Backend `EntryDto` includes fields the frontend interface omits:

| Missing field | Type | Notes |
|---|---|---|
| `cancelledAt` | `string \| null` | set when entry is cancelled |
| `cancellationReason` | `string \| null` | reason text from cancel action |
| `isOverdue` | `boolean` | computed by backend (dueDate < today and status = Pending) |

**Fix:** Add these three fields to the `AccountsPayableEntry` interface.  
**Component impact:** `accounts-payable-list` should use `isOverdue` for visual highlighting instead of computing it locally (if it does so today).

### 1.2 Bulk request/response shape mismatch

**Backend request:** `{ lines: BulkEntryLineDto[] }` where each line has `categoryId?: Guid | null` and `categoryName?: string` (backend auto-creates a category when `categoryId` is null and `categoryName` is provided — this is a key UX feature of quick-entry).

**Frontend sends:** `{ entries: CreateAccountsPayableEntryRequest[] }` with `categoryId` required.

**Backend response:** `{ totalLines, successCount, failedCount, results: { index, success, entryId?, errors: string[] }[] }`

**Frontend expects:** `{ created, failed, errors?: { index, message }[] }`

**Fix:**
- Rename `BulkCreateAccountsPayableRequest` → shape becomes `{ lines: BulkEntryLine[] }` with new `BulkEntryLine` interface that makes `categoryId` optional and adds `categoryName?: string`
- Replace `BulkCreateAccountsPayableResponse` with correct shape matching backend
- Update `quick-entry.component.ts` to build the `lines[]` payload and read the new response shape

### 1.3 `AccountsPayableSummary` — phantom fields + wrong category shape

Backend `SummaryResponseDto`:
```
totalPending, totalPaid, totalCancelled
countPending, countPaid, countCancelled
totalsByCategory: { categoryId, categoryName, totalPending, totalPaid, totalCancelled }[]
```

Frontend interface has `totalOverdue`, `countOverdue` (do not exist), and `byCategory` (wrong name, wrong shape).

**Fix:**
- Remove `totalOverdue`, `countOverdue` from `AccountsPayableSummary`
- Rename `byCategory` → `totalsByCategory`; replace `AccountsPayableCategorySummary` with correct fields (drop any non-existent fields, align names)
- Remove any references to `totalOverdue`/`countOverdue` in list/summary components

### 1.4 `AccountsPayableListParams` — missing filter params

Backend `EntryListQueryDto` supports filters the frontend doesn't expose:

| Missing param | Type |
|---|---|
| `supplierName` | `string` |
| `minAmount` | `number` |
| `maxAmount` | `number` |
| `sortBy` | `string` |
| `sortDir` | `'asc' \| 'desc'` |

**Fix:** Add these to `AccountsPayableListParams` and to `buildAccountsPayableParams()` in `ApiService`. No component changes required for params that aren't surfaced in the UI yet — the plumbing just needs to be there.

### 1.5 `UserResourcePermissions` — shape mismatch

Backend `UserPermissionsDto`:
```json
{
  "userId", "email", "fullName", "roles",
  "allowedResources": [{ id, code, name, description, module, frontendRoute, icon, displayOrder, userPermissionLevel }],
  "resourcePermissions": { "resourceCode": permissionLevel }
}
```

Frontend interface has `resources: UserResourcePermission[]` with no `allowedResources`, no `resourcePermissions` map, no `roles`/`fullName`.

**Fix:**
- Replace `UserResourcePermissions` interface with the correct shape
- Add `AllowedResource` interface matching the backend object
- Update `AuthService` and any component reading `resources[]` to use `allowedResources` and `resourcePermissions`
- The `resourcePermissions` map must be stored in `localStorage` under `saas_baseplatform_resource_permissions` (already the right key, just needs the right shape)

---

## Phase 2 — Financial Core Frontend

New module at `src/app/modules/finance/`. Two sub-sections:

### Route structure

```
/finance/chart-of-accounts       → ChartOfAccountsComponent
/finance/general-ledger          → GeneralLedgerComponent
/finance/general-ledger/:id      → JournalEntryDetailComponent (optional, or open in dialog)
```

All routes: `authGuard` + `resourceAccessGuard` with the appropriate resource code and `Read` minimum.

### 2.1 Chart of Accounts

**Component:** `ChartOfAccountsComponent` (list + inline form)

**Features:**
- Flat list rendered with visual indentation based on account code hierarchy (e.g. `1.1.1` indented two levels)
- Columns: Code, Name, Type (chip), Analytic/Synthetic badge, Active toggle (Admin/Owner only)
- Create/Edit: Material dialog with fields Code, Name, Type (select), IsAnalytic (toggle), Parent (select from existing synthetic accounts)
- Deactivate: confirmation snackbar, only allowed if account has no journal lines (backend enforces, frontend shows the error message from `{ message }` envelope)
- **GL Settings panel:** card below the list showing current default Cash and AP accounts, editable dropdowns (Admin/Owner only, `PUT /settings`)

**API methods needed in `ApiService`:**
```
getChartOfAccounts(tenantId, includeInactive?)  → GET /chart-of-accounts
getAccountById(tenantId, id)                    → GET /chart-of-accounts/{id}
createAccount(tenantId, dto)                    → POST /chart-of-accounts
updateAccount(tenantId, id, dto)                → PUT /chart-of-accounts/{id}
deactivateAccount(tenantId, id)                 → DELETE /chart-of-accounts/{id}
getGlSettings(tenantId)                         → GET /general-ledger/settings
updateGlSettings(tenantId, dto)                 → PUT /general-ledger/settings
```

**Models needed:**
```ts
AccountType enum: Asset=1, Liability=2, Equity=3, Revenue=4, Expense=5
JournalEntryType enum: Debit=1, Credit=2
Account interface: id, tenantId, code, name, type, typeName, isAnalytic, parentId, isActive, createdAt, updatedAt?
CreateAccountRequest: code, name, type, isAnalytic, parentId?
UpdateAccountRequest: code, name, type, isAnalytic, parentId?, isActive
TenantGlSettings: tenantId, defaultCashAccountId?, defaultCashAccountCode?, defaultAccountsPayableAccountId?, defaultAccountsPayableAccountCode?
UpdateTenantGlSettingsRequest: defaultCashAccountId?, defaultAccountsPayableAccountId?
```

**Auth gating:** resource code `ChartOfAccounts.Management`; mutations require `Full` level (Owner/Admin).

### 2.2 General Ledger

**Components:**
- `GeneralLedgerComponent` — entry list with filters
- `JournalEntryFormComponent` — dialog for creating manual entries (Admin/Owner)
- `AccountStatementComponent` — account statement view (embedded or separate route)

**Features:**

*Entry list:*
- Filters: date range (From/To), Source Module (AP / Manual), search
- Columns: Date, Description, Source, Total Amount, Lines count
- Click → opens detail dialog showing debit/credit lines table

*Journal entry detail dialog:*
- Shows header fields + lines table (Account Code | Account Name | Debit | Credit)
- Footer shows balanced totals

*Manual entry form (dialog, Admin/Owner):*
- Date, Description fields
- Dynamic lines: add/remove lines, each with Account (autocomplete from chart), Entry Type (Debit/Credit), Amount
- Client-side balance validation before submit: `SUM(debits) === SUM(credits)`, show error if unbalanced

*Account statement:*
- Select account (dropdown from chart), optional date range
- Table: Date | Description | Source | Debit | Credit | Running Balance
- Shows opening balance, closing balance

**API methods needed in `ApiService`:**
```
listJournalEntries(tenantId, query)             → GET /general-ledger/entries
getJournalEntry(tenantId, id)                   → GET /general-ledger/entries/{id}
createJournalEntry(tenantId, dto)               → POST /general-ledger/entries
getAccountStatement(tenantId, accountId, q)     → GET /general-ledger/accounts/{accountId}/statement
```

**Models needed:**
```ts
JournalLineDto: id, accountId, accountCode, accountName, entryType, amount
JournalEntryDto: id, tenantId, date, description, sourceModule?, sourceDocumentId?, createdByUserId, createdAt, lines
JournalEntryListItem: id, date, description, sourceModule?, totalAmount, lineCount, createdAt
JournalEntryQuery: from?, to?, sourceModule?, page, pageSize
CreateJournalLineDto: accountId, entryType, amount
CreateJournalEntryRequest: date, description, lines (min 2)
AccountStatementLine: journalEntryId, date, description, entryType, amount, runningBalance
AccountStatementDto: accountId, accountCode, accountName, from?, to?, openingBalance, lines, closingBalance
```

**Auth gating:** resource code `GeneralLedger.Management`; manual entry creation requires `Full`.

### 2.3 Layout / Navigation

Add "Finance" section to the sidenav in `LayoutComponent` with two child links:
- "Plano de Contas" → `/finance/chart-of-accounts` (visible if user has `ChartOfAccounts.Management` ≥ Read)
- "Razão Geral" → `/finance/general-ledger` (visible if user has `GeneralLedger.Management` ≥ Read)

---

## What is NOT in scope

- Journal entry reversal
- Fiscal period locking / closing
- Trial Balance, P&L reports (Phase 2)
- AR module, Cash Flow module (Phase 2)
- Cost centers, multi-currency

---

## File Inventory

### Phase 1 — modified files only
- `src/app/core/models/index.ts`
- `src/app/core/services/api.service.ts`
- `src/app/core/services/auth.service.ts`
- `src/app/modules/accounts-payable/list/accounts-payable-list.component.ts`
- `src/app/modules/accounts-payable/quick-entry/quick-entry.component.ts`

### Phase 2 — new files
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

### Phase 2 — modified files
- `src/app/app.routes.ts` — add `/finance/*` routes
- `src/app/core/models/index.ts` — add Finance models
- `src/app/core/services/api.service.ts` — add Finance API methods
- `src/app/shared/components/layout/layout.component.ts` — add Finance nav links
- `src/app/shared/components/layout/layout.component.html` — Finance sidenav section
