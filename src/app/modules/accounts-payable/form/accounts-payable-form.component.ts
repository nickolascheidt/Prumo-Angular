import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { ApiService, AuthService } from '@core/services';
import {
  CategoryQuickCreateDialogComponent,
  CategoryQuickCreateDialogData
} from '../categories/category-quick-create-dialog.component';
import {
  CategoryManageDialogComponent,
  CategoryManageDialogData
} from '../categories/category-manage-dialog.component';
import {
  AccountsPayableCategory,
  AccountsPayableEntry,
  CreateAccountsPayableEntryRequest,
  PaymentMethod,
  UpdateAccountsPayableEntryRequest
} from '@core/models';

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'Cash', label: 'Cash' },
  { value: 'BankTransfer', label: 'Bank transfer' },
  { value: 'CreditCard', label: 'Credit card' },
  { value: 'DebitCard', label: 'Debit card' },
  { value: 'Pix', label: 'Pix' },
  { value: 'Boleto', label: 'Boleto' },
  { value: 'Other', label: 'Other' }
];

@Component({
  selector: 'app-accounts-payable-form',
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
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDividerModule,
    MatTooltipModule,
    MatDialogModule
  ],
  templateUrl: './accounts-payable-form.component.html',
  styleUrls: ['./accounts-payable-form.component.scss']
})
export class AccountsPayableFormComponent implements OnInit {
  form!: FormGroup;
  categories: AccountsPayableCategory[] = [];
  entry: AccountsPayableEntry | null = null;

  isEdit = false;
  loading = false;
  saving = false;

  readonly paymentMethods = PAYMENT_METHODS;
  private tenantId: string | null = null;

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private auth: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.tenantId = this.auth.getCurrentTenantId();
    if (!this.tenantId) {
      this.snackBar.open('No tenant selected', 'Close', { duration: 5000 });
      this.router.navigate(['/auth/select-tenant']);
      return;
    }

    this.form = this.fb.group({
      description: ['', [Validators.required, Validators.maxLength(200)]],
      amount: [null, [Validators.required, Validators.min(0.01)]],
      dueDate: [new Date(), [Validators.required]],
      categoryId: ['', [Validators.required]],
      supplierName: [''],
      paymentMethod: [null as PaymentMethod | null],
      notes: ['']
    });

    this.loadCategories();

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit = true;
      this.loadEntry(id);
    }
  }

  loadCategories(): void {
    if (!this.tenantId) return;
    this.api.getAccountsPayableCategories(this.tenantId).subscribe({
      next: cats => (this.categories = cats),
      error: err =>
        this.snackBar.open(
          err?.error?.message || 'Failed to load categories',
          'Close',
          { duration: 5000 }
        )
    });
  }

  loadEntry(id: string): void {
    if (!this.tenantId) return;
    this.loading = true;
    this.api.getAccountsPayableEntryById(this.tenantId, id).subscribe({
      next: entry => {
        this.entry = entry;
        this.form.patchValue({
          description: entry.description,
          amount: entry.amount,
          dueDate: new Date(entry.dueDate),
          categoryId: entry.categoryId,
          supplierName: entry.supplierName ?? '',
          paymentMethod: entry.paymentMethod ?? null,
          notes: entry.notes ?? ''
        });
      },
      error: err => {
        this.snackBar.open(
          err?.error?.message || 'Failed to load the entry',
          'Close',
          { duration: 5000 }
        );
        this.router.navigate(['/accounts-payable']);
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  save(): void {
    if (this.form.invalid || !this.tenantId) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving = true;
    const raw = this.form.value;

    if (this.isEdit && this.entry) {
      const payload: UpdateAccountsPayableEntryRequest = {
        description: raw.description,
        amount: Number(raw.amount),
        dueDate: this.toIsoDate(raw.dueDate),
        categoryId: raw.categoryId,
        supplierName: raw.supplierName || null,
        paymentMethod: raw.paymentMethod || null,
        notes: raw.notes || null
      };
      this.api
        .updateAccountsPayableEntry(this.tenantId, this.entry.id, payload)
        .subscribe({
          next: updated => {
            this.entry = updated;
            this.snackBar.open('Entry updated', 'Close', { duration: 3000 });
            this.router.navigate(['/accounts-payable']);
          },
          error: err => {
            this.saving = false;
            this.snackBar.open(
              err?.error?.message || 'Failed to update',
              'Close',
              { duration: 5000 }
            );
          },
          complete: () => {
            this.saving = false;
          }
        });
    } else {
      const payload: CreateAccountsPayableEntryRequest = {
        description: raw.description,
        amount: Number(raw.amount),
        dueDate: this.toIsoDate(raw.dueDate),
        categoryId: raw.categoryId,
        supplierName: raw.supplierName || null,
        paymentMethod: raw.paymentMethod || null,
        notes: raw.notes || null
      };
      this.api.createAccountsPayableEntry(this.tenantId, payload).subscribe({
        next: () => {
          this.snackBar.open('Entry created', 'Close', { duration: 3000 });
          this.router.navigate(['/accounts-payable']);
        },
        error: err => {
          this.saving = false;
          this.snackBar.open(
            err?.error?.message || 'Failed to create the entry',
            'Close',
            { duration: 5000 }
          );
        },
        complete: () => {
          this.saving = false;
        }
      });
    }
  }

  markPaid(): void {
    if (!this.tenantId || !this.entry) return;
    const method = this.form.get('paymentMethod')?.value as PaymentMethod | null;
    if (!method) {
      this.snackBar.open(
        'Select the payment method before marking as paid',
        'Close',
        { duration: 5000 }
      );
      return;
    }

    this.api
      .markAccountsPayableEntryPaid(this.tenantId, this.entry.id, {
        paidAt: new Date().toISOString(),
        paymentMethod: method
      })
      .subscribe({
        next: updated => {
          this.entry = updated;
          this.snackBar.open('Marked as paid', 'Close', { duration: 2500 });
        },
        error: err =>
          this.snackBar.open(
            err?.error?.message || 'Failed to mark as paid',
            'Close',
            { duration: 5000 }
          )
      });
  }

  cancelEntry(): void {
    if (!this.tenantId || !this.entry) return;
    const reasonInput = prompt('Enter the cancellation reason:');
    if (reasonInput === null) return;
    const reason = reasonInput.trim();
    if (!reason) {
      this.snackBar.open('Enter the cancellation reason', 'Close', { duration: 4000 });
      return;
    }

    this.api.cancelAccountsPayableEntry(this.tenantId, this.entry.id, { reason }).subscribe({
      next: updated => {
        this.entry = updated;
        this.snackBar.open('Entry cancelled', 'Close', { duration: 2500 });
      },
      error: err =>
        this.snackBar.open(
          err?.error?.message || 'Failed to cancel',
          'Close',
          { duration: 5000 }
        )
    });
  }

  back(): void {
    this.router.navigate(['/accounts-payable']);
  }

  openQuickCreateCategory(): void {
    if (!this.tenantId) return;
    const ref = this.dialog.open(CategoryQuickCreateDialogComponent, {
      data: { tenantId: this.tenantId } as CategoryQuickCreateDialogData,
      width: '420px'
    });
    ref.afterClosed().subscribe(created => {
      if (!created) return;
      this.categories = [...this.categories, created];
      this.form.patchValue({ categoryId: created.id });
    });
  }

  openManageCategories(): void {
    if (!this.tenantId) return;
    const ref = this.dialog.open(CategoryManageDialogComponent, {
      data: { tenantId: this.tenantId } as CategoryManageDialogData,
      width: '600px'
    });
    ref.afterClosed().subscribe(changed => {
      if (changed) this.loadCategories();
    });
  }

  private toIsoDate(value: Date | string): string {
    const d = value instanceof Date ? value : new Date(value);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
}
