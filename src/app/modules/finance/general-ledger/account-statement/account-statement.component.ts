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
        this.snackBar.open(err?.error?.message || 'Failed to load the statement', 'Close', { duration: 5000 });
      }
    });
  }

  private toIso(d: Date | string): string {
    const dt = d instanceof Date ? d : new Date(d);
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
  }
}
