import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService, AuthService } from '@core/services';
import { Employee, ContractType, HrPaymentMethod, CreateEmployeeRequest, UpdateEmployeeRequest } from '@core/models';

@Component({
  selector: 'app-employee-form-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatButtonModule, MatDatepickerModule, MatNativeDateModule,
    MatSlideToggleModule, MatSelectModule, MatProgressSpinnerModule
  ],
  providers: [{ provide: MAT_DATE_LOCALE, useValue: 'pt-BR' }],
  template: `
    <h2 mat-dialog-title>{{ isEditing ? 'Editar Funcionário' : 'Novo Funcionário' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="employee-form">
        <div class="form-row">
          <mat-form-field appearance="outline">
            <mat-label>Nome Completo *</mat-label>
            <input matInput formControlName="fullName">
            <mat-error *ngIf="form.get('fullName')?.invalid">Nome é obrigatório</mat-error>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>CPF *</mat-label>
            <input matInput formControlName="cpf" placeholder="000.000.000-00" [readonly]="isEditing">
            <mat-error *ngIf="form.get('cpf')?.invalid">CPF é obrigatório</mat-error>
          </mat-form-field>
        </div>
        <div class="form-row">
          <mat-form-field appearance="outline">
            <mat-label>Email</mat-label>
            <input matInput formControlName="email" type="email">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Telefone</mat-label>
            <input matInput formControlName="phone" placeholder="(11) 99999-9999">
          </mat-form-field>
        </div>
        <div class="form-row">
          <mat-form-field appearance="outline">
            <mat-label>Data de Admissão *</mat-label>
            <input matInput formControlName="hireDate" [matDatepicker]="picker">
            <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
            <mat-datepicker #picker></mat-datepicker>
            <mat-error *ngIf="form.get('hireDate')?.invalid">Data de admissão é obrigatória</mat-error>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Tipo de Contrato *</mat-label>
            <mat-select formControlName="contractType">
              <mat-option [value]="ContractType.CLT">CLT</mat-option>
              <mat-option [value]="ContractType.Temporary">Temporário</mat-option>
              <mat-option [value]="ContractType.Daily">Diária</mat-option>
            </mat-select>
          </mat-form-field>
        </div>
        <div class="form-row">
          <mat-form-field appearance="outline">
            <mat-label>Taxa Horária (R$) *</mat-label>
            <input matInput formControlName="hourlyRate" type="number" step="0.01">
            <mat-error *ngIf="form.get('hourlyRate')?.invalid">Taxa horária deve ser maior que zero</mat-error>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Forma de Pagamento *</mat-label>
            <mat-select formControlName="preferredPaymentMethod">
              <mat-option [value]="HrPaymentMethod.BankTransfer">Transferência Bancária</mat-option>
              <mat-option [value]="HrPaymentMethod.Pix">PIX</mat-option>
              <mat-option [value]="HrPaymentMethod.Cash">Dinheiro</mat-option>
              <mat-option [value]="HrPaymentMethod.Check">Cheque</mat-option>
            </mat-select>
          </mat-form-field>
        </div>
        <div *ngIf="form.get('preferredPaymentMethod')?.value === HrPaymentMethod.Pix">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Chave PIX</mat-label>
            <input matInput formControlName="pixKey">
          </mat-form-field>
        </div>
        <div class="form-row" *ngIf="form.get('preferredPaymentMethod')?.value === HrPaymentMethod.BankTransfer">
          <mat-form-field appearance="outline">
            <mat-label>Banco</mat-label>
            <input matInput formControlName="bankName">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Agência</mat-label>
            <input matInput formControlName="bankAgency">
          </mat-form-field>
        </div>
        <div *ngIf="form.get('preferredPaymentMethod')?.value === HrPaymentMethod.BankTransfer">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Conta</mat-label>
            <input matInput formControlName="bankAccountNumber">
          </mat-form-field>
        </div>
        <div class="toggles">
          <mat-slide-toggle formControlName="hasSignedContract">Contrato Assinado</mat-slide-toggle>
          <mat-slide-toggle *ngIf="isEditing" formControlName="isActive">Ativo</mat-slide-toggle>
        </div>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancelar</button>
      <button mat-raised-button color="primary" (click)="onSave()" [disabled]="form.invalid || isSaving">
        {{ isSaving ? 'Salvando...' : 'Salvar' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .employee-form { display: flex; flex-direction: column; gap: 12px; min-width: 520px; }
    .form-row { display: flex; gap: 16px; }
    .form-row mat-form-field { flex: 1; }
    .full-width { width: 100%; }
    .toggles { display: flex; gap: 24px; padding: 8px 0; }
  `]
})
export class EmployeeFormDialogComponent implements OnInit {
  form!: FormGroup;
  isEditing = false;
  isSaving = false;
  ContractType = ContractType;
  HrPaymentMethod = HrPaymentMethod;

  private tenantId: string | null = null;

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private auth: AuthService,
    public dialogRef: MatDialogRef<EmployeeFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Employee | null
  ) {}

  ngOnInit(): void {
    this.tenantId = this.auth.getCurrentTenantId();
    this.isEditing = !!this.data;
    this.form = this.fb.group({
      fullName: [this.data?.fullName ?? '', Validators.required],
      cpf: [{ value: this.data?.cpf ?? '', disabled: this.isEditing }, Validators.required],
      email: [this.data?.email ?? ''],
      phone: [this.data?.phone ?? ''],
      hireDate: [this.data ? new Date(this.data.hireDate) : new Date(), Validators.required],
      contractType: [this.data?.contractType ?? ContractType.CLT, Validators.required],
      hourlyRate: [this.data?.hourlyRate ?? 0, [Validators.required, Validators.min(0.01)]],
      preferredPaymentMethod: [this.data?.preferredPaymentMethod ?? HrPaymentMethod.BankTransfer, Validators.required],
      pixKey: [this.data?.pixKey ?? ''],
      bankName: [this.data?.bankName ?? ''],
      bankAgency: [this.data?.bankAgency ?? ''],
      bankAccountNumber: [this.data?.bankAccountNumber ?? ''],
      hasSignedContract: [this.data?.hasSignedContract ?? false],
      isActive: [this.data?.isActive ?? true]
    });
  }

  onSave(): void {
    if (this.form.invalid || !this.tenantId) return;
    this.isSaving = true;
    const v = this.form.getRawValue();

    if (this.isEditing) {
      const req: UpdateEmployeeRequest = {
        fullName: v.fullName,
        email: v.email || null,
        phone: v.phone || null,
        isActive: v.isActive,
        contractType: v.contractType,
        hourlyRate: v.hourlyRate,
        preferredPaymentMethod: v.preferredPaymentMethod,
        pixKey: v.pixKey || null,
        bankName: v.bankName || null,
        bankAgency: v.bankAgency || null,
        bankAccountNumber: v.bankAccountNumber || null,
        hasSignedContract: v.hasSignedContract,
        terminationDate: null
      };
      this.api.updateEmployee(this.tenantId, this.data!.id, req).subscribe({
        next: (result) => { this.isSaving = false; this.dialogRef.close(result); },
        error: () => { this.isSaving = false; alert('Erro ao atualizar funcionário.'); }
      });
    } else {
      const req: CreateEmployeeRequest = {
        fullName: v.fullName,
        cpf: v.cpf,
        email: v.email || null,
        phone: v.phone || null,
        hireDate: new Date(v.hireDate).toISOString(),
        contractType: v.contractType,
        hourlyRate: v.hourlyRate,
        preferredPaymentMethod: v.preferredPaymentMethod,
        pixKey: v.pixKey || null,
        bankName: v.bankName || null,
        bankAgency: v.bankAgency || null,
        bankAccountNumber: v.bankAccountNumber || null,
        hasSignedContract: v.hasSignedContract,
        applicationUserId: null
      };
      this.api.createEmployee(this.tenantId, req).subscribe({
        next: (result) => { this.isSaving = false; this.dialogRef.close(result); },
        error: () => { this.isSaving = false; alert('Erro ao criar funcionário. Verifique se o CPF já está cadastrado.'); }
      });
    }
  }

  onCancel(): void { this.dialogRef.close(); }
}
