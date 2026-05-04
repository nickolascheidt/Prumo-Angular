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
  UpdateTenantGlSettingsRequest
} from '@core/models';
import { AccountFormComponent, AccountFormData } from './account-form/account-form.component';

@Component({
  selector: 'app-chart-of-accounts',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
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
    MatTooltipModule
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
    return this.auth.hasRole('Administrador');
  }

  get analyticAccounts(): Account[] {
    return this.accounts.filter(a => a.isAnalytic && a.isActive);
  }

  openCreate(): void {
    const ref = this.dialog.open(AccountFormComponent, {
      width: '500px',
      data: { tenantId: this.tenantId!, accounts: this.accounts, account: null } as AccountFormData
    });
    ref.afterClosed().subscribe(saved => { if (saved) this.loadAll(); });
  }

  openEdit(account: Account): void {
    const ref = this.dialog.open(AccountFormComponent, {
      width: '500px',
      data: { tenantId: this.tenantId!, accounts: this.accounts, account } as AccountFormData
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
