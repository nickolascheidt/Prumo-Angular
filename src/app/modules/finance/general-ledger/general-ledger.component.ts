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
  PaginatedResponse
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
export class GeneralLedgerComponent implements OnInit, OnDestroy {
  filtersForm!: FormGroup;
  entries: JournalEntryListItem[] = [];
  loading = false;
  total = 0;
  pageIndex = 0;
  pageSize = 25;
  readonly pageSizeOptions = [10, 25, 50];
  readonly displayedColumns = ['date', 'description', 'source', 'totalAmount', 'lineCount', 'actions'];

  readonly sourceModules = [
    { value: '', label: 'All' },
    { value: 'AccountsPayable', label: 'Accounts Payable' },
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
        this.snackBar.open(err?.error?.message || 'Failed to load entries', 'Close', { duration: 5000 });
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
    return this.auth.isMasterAdmin();
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
