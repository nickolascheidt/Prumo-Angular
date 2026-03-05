import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '@core/services';
import { Employee, PaymentPeriod } from '@core/models';

@Component({
  selector: 'app-generate-payment-period-dialog',
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
    MatSelectModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatIconModule
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon class="title-icon">event_note</mat-icon>
      Gerar Período de Pagamento
    </h2>

    <mat-dialog-content>
      <form [formGroup]="form" class="generation-form">
        <mat-card class="info-card">
          <mat-card-content>
            <p class="info-text">
              <strong>Passo 1:</strong> Selecione um funcionário<br>
              <strong>Passo 2:</strong> Escolha o período (data inicial e final)<br>
              <strong>Passo 3:</strong> Clique em "Gerar Período"
            </p>
            <p class="info-note">
              ℹ️ O sistema irá calcular automaticamente o total de horas e valor a ser pago
              com base nos registros de trabalho existing período.
            </p>
          </mat-card-content>
        </mat-card>

        <div class="form-section">
          <mat-form-field appearance="outline">
            <mat-label>Funcionário *</mat-label>
            <mat-select formControlName="employeeId">
              <mat-option *ngFor="let emp of employees" [value]="emp.id">
                {{ emp.fullName }}
              </mat-option>
            </mat-select>
            <mat-error *ngIf="form.get('employeeId')?.hasError('required')">
              Selecione um funcionário
            </mat-error>
          </mat-form-field>
        </div>

        <div class="form-section date-range">
          <mat-form-field appearance="outline">
            <mat-label>Data Inicial *</mat-label>
            <input matInput [matDatepicker]="startPickerRef" formControlName="startDate" readonly>
            <mat-datepicker-toggle matIconSuffix [for]="startPickerRef"></mat-datepicker-toggle>
            <mat-datepicker #startPickerRef></mat-datepicker>
            <mat-error *ngIf="form.get('startDate')?.hasError('required')">
              Selecione a data inicial
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Data Final *</mat-label>
            <input matInput [matDatepicker]="endPickerRef" formControlName="endDate" readonly>
            <mat-datepicker-toggle matIconSuffix [for]="endPickerRef"></mat-datepicker-toggle>
            <mat-datepicker #endPickerRef></mat-datepicker>
            <mat-error *ngIf="form.get('endDate')?.hasError('required')">
              Selecione a data final
            </mat-error>
          </mat-form-field>
        </div>

        <mat-card *ngIf="selectedEmployee" class="employee-info-card">
          <mat-card-header>
            <mat-card-title>Informações do Funcionário</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="info-row">
              <strong>Nome:</strong> {{ selectedEmployee.fullName }}
            </div>
            <div class="info-row">
              <strong>CPF:</strong> {{ selectedEmployee.cpf }}
            </div>
            <div class="info-row">
              <strong>Salário/Hora:</strong> R$ {{ selectedEmployee.hourlyRate | number: '1.2-2' }}
            </div>
            <div class="info-row">
              <strong>Tipo de Contrato:</strong> {{ selectedEmployee.contractType }}
            </div>
          </mat-card-content>
        </mat-card>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()" [disabled]="isGenerating">Cancelar</button>
      <button 
        mat-raised-button 
        color="primary" 
        (click)="onGenerate()"
        [disabled]="!form.valid || isGenerating">
        <mat-icon *ngIf="!isGenerating">check_circle</mat-icon>
        <mat-spinner diameter="20" *ngIf="isGenerating"></mat-spinner>
        {{ isGenerating ? 'Gerando...' : 'Gerar Período' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .title-icon {
      vertical-align: middle;
      margin-right: 8px;
    }

    .generation-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .info-card {
      background-color: #e3f2fd;
      border-left: 4px solid #2196F3;
      margin-bottom: 16px;
    }

    .info-card mat-card-content {
      padding: 12px 16px !important;
    }

    .info-text {
      margin: 0 0 10px 0;
      font-size: 13px;
      color: #333;
      line-height: 1.6;
    }

    .info-note {
      margin: 0;
      font-size: 12px;
      color: #555;
      font-style: italic;
      background-color: rgba(255, 255, 255, 0.5);
      padding: 8px;
      border-radius: 4px;
    }

    .form-section {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .date-range {
      flex-direction: row;
      gap: 16px;
    }

    .date-range mat-form-field {
      flex: 1;
    }

    mat-form-field {
      width: 100%;
    }

    .employee-info-card {
      background-color: #f5f5f5;
      border-left: 4px solid #4CAF50;
      margin-top: 16px;
    }

    .employee-info-card mat-card-header {
      margin-bottom: 12px;
      border-bottom: 1px solid #ddd;
    }

    .employee-info-card mat-card-title {
      font-size: 14px;
      color: #4CAF50;
    }

    .info-row {
      padding: 8px 0;
      font-size: 13px;
      color: #333;
      border-bottom: 1px solid #eee;
    }

    .info-row:last-child {
      border-bottom: none;
    }

    .info-row strong {
      display: inline-block;
      width: 150px;
      color: #666;
    }

    mat-dialog-actions button {
      min-width: 100px;
    }

    mat-spinner {
      display: inline-block;
      margin-right: 8px;
    }
  `]
})
export class GeneratePaymentPeriodDialogComponent implements OnInit {
  form!: FormGroup;
  employees: Employee[] = [];
  selectedEmployee: Employee | null = null;
  isGenerating = false;

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private dialogRef: MatDialogRef<GeneratePaymentPeriodDialogComponent>
  ) {
    this.createForm();
  }

  ngOnInit(): void {
    this.loadEmployees();
    this.setupEmployeeChangeListener();
  }

  private createForm(): void {
    this.form = this.fb.group({
      employeeId: ['', [Validators.required]],
      startDate: [null, [Validators.required]],
      endDate: [null, [Validators.required]]
    }, { validators: this.dateRangeValidator });
  }

  private dateRangeValidator(group: FormGroup): { [key: string]: any } | null {
    const startDate = group.get('startDate')?.value;
    const endDate = group.get('endDate')?.value;

    if (startDate && endDate) {
      if (startDate >= endDate) {
        return { 'invalidDateRange': true };
      }
    }
    return null;
  }

  private loadEmployees(): void {
    console.log('📥 Carregando lista de funcionários para geração de período...');
    this.apiService.getEmployees(false).subscribe({
      next: (data) => {
        console.log('✅ Funcionários carregados:', data.length);
        this.employees = data;
      },
      error: (error) => {
        console.error('❌ Erro ao carregar funcionários:', error);
        alert('Erro ao carregar lista de funcionários. Tente novamente.');
      }
    });
  }

  private setupEmployeeChangeListener(): void {
    this.form.get('employeeId')?.valueChanges.subscribe((employeeId) => {
      if (employeeId) {
        this.selectedEmployee = this.employees.find(e => e.id === employeeId) || null;
        console.log('👤 Funcionário selecionado:', this.selectedEmployee?.fullName);
      } else {
        this.selectedEmployee = null;
      }
    });
  }

  onGenerate(): void {
    if (!this.form.valid) {
      console.warn('⚠️ Formulário inválido');
      return;
    }

    this.isGenerating = true;
    const { employeeId, startDate, endDate } = this.form.value;

    // Converter datas para o formato ISO
    const startDateStr = new Date(startDate).toISOString().split('T')[0];
    const endDateStr = new Date(endDate).toISOString().split('T')[0];

    console.log('📊 Gerando período de pagamento:', {
      employee: this.selectedEmployee?.fullName,
      employeeId,
      startDate: startDateStr,
      endDate: endDateStr
    });

    this.apiService.generatePaymentPeriod(employeeId, startDateStr, endDateStr).subscribe({
      next: (result: PaymentPeriod) => {
        console.log('✅ Período de pagamento gerado com sucesso:', result);
        this.isGenerating = false;
        alert(`Período de pagamento gerado com sucesso!\n\nFuncionário: ${this.selectedEmployee?.fullName}\nPeríodo: ${startDateStr} a ${endDateStr}\nTotal de horas: ${result.totalHours}h\nValor total: R$ ${result.totalAmount}`);
        this.dialogRef.close(result);
      },
      error: (error) => {
        console.error('❌ Erro ao gerar período de pagamento:', error);
        console.error('Detalhes do erro:', {
          status: error.status,
          statusText: error.statusText,
          message: error.message,
          url: error.url,
          error: error.error
        });
        this.isGenerating = false;
        
        let errorMessage = 'Erro ao gerar período de pagamento.';
        if (error.error?.message) {
          errorMessage += '\n\n' + error.error.message;
        }
        if (error.error?.errors) {
          errorMessage += '\n\nDetalhes:\n' + JSON.stringify(error.error.errors);
        }
        
        alert(errorMessage);
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
