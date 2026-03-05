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
import { ApiService } from '@core/services';
import { Employee, ContractType, PaymentMethod } from '@core/models';

@Component({
  selector: 'app-employee-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSlideToggleModule,
    MatSelectModule
  ],
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'pt-BR' }
  ],
  template: `
    <h2 mat-dialog-title>{{ isEditing ? 'Editar Funcionário' : 'Novo Funcionário' }}</h2>
    
    <mat-dialog-content>
      <form [formGroup]="form" class="employee-form">
        <div class="form-section">
          <mat-form-field appearance="fill">
            <mat-label>Nome Completo *</mat-label>
            <input matInput formControlName="fullName" placeholder="João Silva">
            <mat-error *ngIf="form.get('fullName')?.invalid">
              Nome é obrigatório
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="fill">
            <mat-label>CPF *</mat-label>
            <input matInput formControlName="cpf" placeholder="000.000.000-00">
            <mat-error *ngIf="form.get('cpf')?.invalid">
              CPF é obrigatório
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="fill">
            <mat-label>Email *</mat-label>
            <input matInput formControlName="email" type="email" placeholder="joao@example.com">
            <mat-error *ngIf="form.get('email')?.invalid">
              Email válido é obrigatório
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="fill">
            <mat-label>Telefone</mat-label>
            <input matInput formControlName="phone" placeholder="(11) 99999-9999">
          </mat-form-field>
        </div>

        <div class="form-section">
          <mat-form-field appearance="fill">
            <mat-label>Data de Admissão *</mat-label>
            <input matInput formControlName="hireDate" [matDatepicker]="picker">
            <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
            <mat-datepicker #picker></mat-datepicker>
            <mat-error *ngIf="form.get('hireDate')?.invalid">
              Data de admissão é obrigatória
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="fill">
            <mat-label>Tipo de Contrato *</mat-label>
            <mat-select formControlName="contractType">
              <mat-option [value]="contractTypes.CLT">CLT</mat-option>
              <mat-option [value]="contractTypes.Frio">Frio</mat-option>
              <mat-option [value]="contractTypes.Temporario">Temporário</mat-option>
            </mat-select>
            <mat-error *ngIf="form.get('contractType')?.invalid">
              Tipo de contrato é obrigatório
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="fill">
            <mat-label>Taxa Horária (R$) *</mat-label>
            <input matInput formControlName="hourlyRate" type="number" step="0.01" placeholder="50.00">
            <mat-error *ngIf="form.get('hourlyRate')?.invalid">
              Taxa horária é obrigatória
            </mat-error>
          </mat-form-field>
        </div>

        <div class="form-section">
          <mat-form-field appearance="fill">
            <mat-label>Forma de Pagamento Preferida *</mat-label>
            <mat-select formControlName="preferredPaymentMethod">
              <mat-option [value]="paymentMethods.TransferenciaBancaria">Transferência Bancária</mat-option>
              <mat-option [value]="paymentMethods.Pix">PIX</mat-option>
              <mat-option [value]="paymentMethods.Cheque">Cheque</mat-option>
              <mat-option [value]="paymentMethods.Dinheiro">Dinheiro</mat-option>
            </mat-select>
            <mat-error *ngIf="form.get('preferredPaymentMethod')?.invalid">
              Forma de pagamento é obrigatória
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="fill" *ngIf="form.get('preferredPaymentMethod')?.value === paymentMethods.Pix">
            <mat-label>Chave PIX</mat-label>
            <input matInput formControlName="pixKey" placeholder="seu@email.com ou CPF">
          </mat-form-field>

          <mat-form-field appearance="fill" 
            *ngIf="form.get('preferredPaymentMethod')?.value === paymentMethods.TransferenciaBancaria">
            <mat-label>Nome do Banco</mat-label>
            <input matInput formControlName="bankName" placeholder="bradesco">
          </mat-form-field>

          <mat-form-field appearance="fill"
            *ngIf="form.get('preferredPaymentMethod')?.value === paymentMethods.TransferenciaBancaria">
            <mat-label>Agência</mat-label>
            <input matInput formControlName="bankAgency" placeholder="0001">
          </mat-form-field>

          <mat-form-field appearance="fill"
            *ngIf="form.get('preferredPaymentMethod')?.value === paymentMethods.TransferenciaBancaria">
            <mat-label>Número da Conta</mat-label>
            <input matInput formControlName="bankAccountNumber" placeholder="123456-7">
          </mat-form-field>
        </div>

        <div class="form-section">
          <div class="toggle-container">
            <mat-slide-toggle formControlName="isActive">
              Ativo
            </mat-slide-toggle>
          </div>

          <div class="toggle-container">
            <mat-slide-toggle formControlName="hasSignedContract">
              Contrato Assinado
            </mat-slide-toggle>
          </div>
        </div>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancelar</button>
      <button 
        mat-raised-button 
        color="primary" 
        (click)="onSave()"
        [disabled]="!form.valid || isSaving">
        {{ isSaving ? 'Salvando...' : 'Salvar' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .employee-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .form-section {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    mat-form-field {
      width: 100%;
    }

    .toggle-container {
      padding: 12px 0;
      border-bottom: 1px solid #e0e0e0;
    }

    mat-dialog-actions {
      padding: 16px 0;
      margin-top: 20px;
    }
  `]
})
export class EmployeeFormDialogComponent implements OnInit {
  form!: FormGroup;
  isEditing = false;
  isSaving = false;

  contractTypes = ContractType;
  paymentMethods = PaymentMethod;

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    public dialogRef: MatDialogRef<EmployeeFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Employee | null
  ) {
    this.createForm();
  }

  ngOnInit(): void {
    if (this.data) {
      this.isEditing = true;
      this.form.patchValue(this.data);
    }
  }

  private createForm(): void {
    this.form = this.fb.group({
      fullName: ['', [Validators.required]],
      cpf: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      hireDate: ['', [Validators.required]],
      contractType: [ContractType.CLT, [Validators.required]],
      hourlyRate: [0, [Validators.required, Validators.min(0)]],
      isActive: [true],
      preferredPaymentMethod: [PaymentMethod.TransferenciaBancaria, [Validators.required]],
      pixKey: [''],
      bankName: [''],
      bankAgency: [''],
      bankAccountNumber: [''],
      hasSignedContract: [false]
    });
  }

  onSave(): void {
    if (!this.form.valid) return;

    this.isSaving = true;
    const employee = this.form.value;

    const request$ = this.isEditing
      ? this.apiService.updateEmployee(this.data!.id, employee)
      : this.apiService.createEmployee(employee);

    request$.subscribe({
      next: (result) => {
        this.isSaving = false;
        this.dialogRef.close(result);
      },
      error: (error) => {
        this.isSaving = false;
        console.error('Erro ao salvar funcionário:', error);
        alert('Erro ao salvar funcionário. Tente novamente.');
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
