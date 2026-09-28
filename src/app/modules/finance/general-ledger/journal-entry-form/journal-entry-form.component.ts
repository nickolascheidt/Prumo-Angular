import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  FormArray,
  Validators
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
    { value: JournalEntryType.Debit, label: 'Debit' },
    { value: JournalEntryType.Credit, label: 'Credit' }
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
      this.snackBar.open('The entry is not balanced (debits ≠ credits)', 'Close', { duration: 5000 });
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
      error: err => { this.saving = false; this.snackBar.open(err?.error?.message || 'Failed to save', 'Close', { duration: 5000 }); }
    });
  }
}
