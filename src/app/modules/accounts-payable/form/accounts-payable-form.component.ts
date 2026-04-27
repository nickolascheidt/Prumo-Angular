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

import { ApiService, AuthService } from '@core/services';
import {
  AccountsPayableCategory,
  AccountsPayableEntry,
  CreateAccountsPayableEntryRequest,
  PaymentMethod,
  UpdateAccountsPayableEntryRequest
} from '@core/models';

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
    MatTooltipModule
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
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.tenantId = this.auth.getCurrentTenantId();
    if (!this.tenantId) {
      this.snackBar.open('Nenhum tenant selecionado', 'Fechar', { duration: 5000 });
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
          err?.error?.message || 'Erro ao carregar categorias',
          'Fechar',
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
          err?.error?.message || 'Erro ao carregar lançamento',
          'Fechar',
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
            this.snackBar.open('Lançamento atualizado', 'Fechar', { duration: 3000 });
            this.router.navigate(['/accounts-payable']);
          },
          error: err => {
            this.saving = false;
            this.snackBar.open(
              err?.error?.message || 'Erro ao atualizar',
              'Fechar',
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
          this.snackBar.open('Lançamento criado', 'Fechar', { duration: 3000 });
          this.router.navigate(['/accounts-payable']);
        },
        error: err => {
          this.saving = false;
          this.snackBar.open(
            err?.error?.message || 'Erro ao criar lançamento',
            'Fechar',
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
    this.api
      .markAccountsPayableEntryPaid(this.tenantId, this.entry.id, {
        paidAt: new Date().toISOString(),
        paymentMethod: method
      })
      .subscribe({
        next: updated => {
          this.entry = updated;
          this.snackBar.open('Marcado como pago', 'Fechar', { duration: 2500 });
        },
        error: err =>
          this.snackBar.open(
            err?.error?.message || 'Erro ao marcar como pago',
            'Fechar',
            { duration: 5000 }
          )
      });
  }

  cancelEntry(): void {
    if (!this.tenantId || !this.entry) return;
    if (!confirm('Cancelar este lançamento?')) return;
    this.api.cancelAccountsPayableEntry(this.tenantId, this.entry.id, {}).subscribe({
      next: updated => {
        this.entry = updated;
        this.snackBar.open('Lançamento cancelado', 'Fechar', { duration: 2500 });
      },
      error: err =>
        this.snackBar.open(
          err?.error?.message || 'Erro ao cancelar',
          'Fechar',
          { duration: 5000 }
        )
    });
  }

  back(): void {
    this.router.navigate(['/accounts-payable']);
  }

  private toIsoDate(value: Date | string): string {
    const d = value instanceof Date ? value : new Date(value);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
}
