import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject, forkJoin } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';

import { ApiService, AuthService } from '@core/services';
import {
  AccountsPayableCategory,
  AccountsPayableEntry,
  AccountsPayableListParams,
  AccountsPayableStatus,
  AccountsPayableSummary,
  PaymentMethod
} from '@core/models';
import { AccountsPayableQuickEntryComponent } from '../quick-entry/quick-entry.component';

const STATUSES: { value: AccountsPayableStatus; label: string }[] = [
  { value: 'Pending', label: 'Pendente' },
  { value: 'Paid', label: 'Pago' },
  { value: 'Cancelled', label: 'Cancelado' }
];

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'Cash', label: 'Dinheiro' },
  { value: 'BankTransfer', label: 'Transferência' },
  { value: 'CreditCard', label: 'Cartão de Crédito' },
  { value: 'DebitCard', label: 'Cartão de Débito' },
  { value: 'Pix', label: 'Pix' },
  { value: 'Boleto', label: 'Boleto' },
  { value: 'Other', label: 'Outro' }
];

@Component({
  selector: 'app-accounts-payable-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTableModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatMenuModule,
    MatChipsModule,
    MatTooltipModule,
    MatDividerModule,
    AccountsPayableQuickEntryComponent
  ],
  templateUrl: './accounts-payable-list.component.html',
  styleUrls: ['./accounts-payable-list.component.scss']
})
export class AccountsPayableListComponent implements OnInit, OnDestroy {
  filtersForm!: FormGroup;
  entries: AccountsPayableEntry[] = [];
  categories: AccountsPayableCategory[] = [];
  summary: AccountsPayableSummary | null = null;

  loadingEntries = false;
  loadingSummary = false;
  exporting = false;

  total = 0;
  pageIndex = 0;
  pageSize = 25;
  readonly pageSizeOptions = [10, 25, 50, 100];

  readonly displayedColumns: string[] = [
    'dueDate',
    'description',
    'category',
    'supplierName',
    'amount',
    'status',
    'paidAt',
    'paymentMethod',
    'actions'
  ];

  readonly statuses = STATUSES;
  readonly paymentMethods = PAYMENT_METHODS;

  private tenantId: string | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private auth: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.tenantId = this.auth.getCurrentTenantId();
    if (!this.tenantId) {
      this.snackBar.open('Nenhum tenant selecionado', 'Fechar', { duration: 5000 });
      this.router.navigate(['/auth/select-tenant']);
      return;
    }

    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    this.filtersForm = this.fb.group({
      from: [firstDay],
      to: [lastDay],
      status: [null as AccountsPayableStatus | null],
      categoryId: [null as string | null],
      paymentMethod: [null as PaymentMethod | null],
      search: ['']
    });

    this.loadCategories();
    this.reload();

    this.filtersForm.valueChanges
      .pipe(debounceTime(300), takeUntil(this.destroy$))
      .subscribe(() => {
        this.pageIndex = 0;
        this.reload();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadCategories(): void {
    if (!this.tenantId) return;
    this.api.getAccountsPayableCategories(this.tenantId).subscribe({
      next: cats => (this.categories = cats),
      error: err =>
        this.snackBar.open(
          err?.error?.message || 'Erro ao carregar categorias',
          'Fechar',
          { duration: 5000 }
        )
    });
  }

  reload(): void {
    if (!this.tenantId) return;
    const filters = this.buildFilters();

    this.loadingEntries = true;
    this.loadingSummary = true;

    forkJoin({
      list: this.api.listAccountsPayableEntries(this.tenantId, {
        ...filters,
        page: this.pageIndex + 1,
        pageSize: this.pageSize
      }),
      summary: this.api.getAccountsPayableSummary(
        this.tenantId,
        filters.from,
        filters.to,
        {
          status: filters.status,
          categoryId: filters.categoryId,
          paymentMethod: filters.paymentMethod,
          search: filters.search
        }
      )
    }).subscribe({
      next: ({ list, summary }) => {
        this.entries = list.items;
        this.total = list.total;
        this.summary = summary;
      },
      error: err => {
        this.snackBar.open(
          err?.error?.message || 'Erro ao carregar lançamentos',
          'Fechar',
          { duration: 5000 }
        );
      },
      complete: () => {
        this.loadingEntries = false;
        this.loadingSummary = false;
      }
    });
  }

  onPage(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.reload();
  }

  clearFilters(): void {
    this.filtersForm.reset({
      from: null,
      to: null,
      status: null,
      categoryId: null,
      paymentMethod: null,
      search: ''
    });
  }

  goToNew(): void {
    this.router.navigate(['/accounts-payable/new']);
  }

  edit(entry: AccountsPayableEntry): void {
    this.router.navigate(['/accounts-payable', entry.id, 'edit']);
  }

  markPaid(entry: AccountsPayableEntry): void {
    if (!this.tenantId) return;
    this.api
      .markAccountsPayableEntryPaid(this.tenantId, entry.id, {
        paidAt: new Date().toISOString(),
        paymentMethod: entry.paymentMethod || null
      })
      .subscribe({
        next: () => {
          this.snackBar.open('Marcado como pago', 'Fechar', { duration: 2500 });
          this.reload();
        },
        error: err =>
          this.snackBar.open(
            err?.error?.message || 'Erro ao marcar como pago',
            'Fechar',
            { duration: 5000 }
          )
      });
  }

  cancel(entry: AccountsPayableEntry): void {
    if (!this.tenantId) return;
    if (!confirm(`Cancelar "${entry.description}"?`)) return;
    this.api.cancelAccountsPayableEntry(this.tenantId, entry.id, {}).subscribe({
      next: () => {
        this.snackBar.open('Lançamento cancelado', 'Fechar', { duration: 2500 });
        this.reload();
      },
      error: err =>
        this.snackBar.open(
          err?.error?.message || 'Erro ao cancelar',
          'Fechar',
          { duration: 5000 }
        )
    });
  }

  exportCsv(): void {
    if (!this.tenantId) return;
    this.exporting = true;
    const filters = this.buildFilters();
    this.api.exportAccountsPayableCsv(this.tenantId, filters).subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const today = new Date();
        const stamp = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        link.href = url;
        link.download = `accounts-payable-${stamp}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      },
      error: err => {
        this.snackBar.open(
          err?.error?.message || 'Erro ao exportar CSV',
          'Fechar',
          { duration: 5000 }
        );
      },
      complete: () => {
        this.exporting = false;
      }
    });
  }

  isOverdue(entry: AccountsPayableEntry): boolean {
    if (entry.status !== 'Pending') return false;
    const due = new Date(entry.dueDate);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return due < now;
  }

  statusLabel(status: AccountsPayableStatus): string {
    return this.statuses.find(s => s.value === status)?.label ?? status;
  }

  paymentMethodLabel(method: PaymentMethod | null | undefined): string {
    if (!method) return '—';
    return this.paymentMethods.find(m => m.value === method)?.label ?? method;
  }

  onEntryCreated(): void {
    this.reload();
  }

  private buildFilters(): AccountsPayableListParams {
    const v = this.filtersForm.value;
    return {
      from: v.from ? this.toIsoDate(v.from) : undefined,
      to: v.to ? this.toIsoDate(v.to) : undefined,
      status: v.status || undefined,
      categoryId: v.categoryId || undefined,
      paymentMethod: v.paymentMethod || undefined,
      search: v.search?.trim() || undefined
    };
  }

  private toIsoDate(value: Date | string): string {
    const d = value instanceof Date ? value : new Date(value);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
}
