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
