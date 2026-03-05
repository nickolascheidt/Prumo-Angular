import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { ApiService } from '@core/services';
import { Employee, WorkLog, CreateWorkLogRequest } from '@core/models';

@Component({
  selector: 'app-worklog-form-dialog',
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
    MatSelectModule
  ],
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'pt-BR' }
  ],
  template: `
    <h2 mat-dialog-title>{{ isEditing ? 'Editar Registro' : 'Registrar Horas Trabalhadas' }}</h2>
    
    <mat-dialog-content>
      <form [formGroup]="form" class="worklog-form">
        
        <!-- Seleção de Funcionário -->
        <div class="form-section">
          <mat-form-field appearance="fill">
            <mat-label>Funcionário *</mat-label>
            <mat-select formControlName="employeeId" (selectionChange)="onEmployeeChange()">
              <mat-option *ngFor="let employee of employees" [value]="employee.id">
                {{ employee.fullName }} - R$ {{ employee.hourlyRate | number: '1.2-2' }}/h
              </mat-option>
            </mat-select>
            <mat-error *ngIf="form.get('employeeId')?.invalid">
              Selecione um funcionário
            </mat-error>
          </mat-form-field>

          <!-- Informações do Funcionário Selecionado -->
          <div class="employee-info" *ngIf="selectedEmployee">
            <div class="info-row">
              <span class="label">Taxa Horária:</span>
              <span class="value">R$ {{ selectedEmployee.hourlyRate | number: '1.2-2' }}</span>
            </div>
            <div class="info-row" *ngIf="calculatedAmount > 0">
              <span class="label">Valor Calculado:</span>
              <span class="value estimated">R$ {{ calculatedAmount | number: '1.2-2' }}</span>
            </div>
          </div>
        </div>

        <!-- Data e Horas -->
        <div class="form-section">
          <mat-form-field appearance="fill">
            <mat-label>Data do Trabalho *</mat-label>
            <input matInput formControlName="workDate" [matDatepicker]="picker">
            <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
            <mat-datepicker #picker></mat-datepicker>
            <mat-error *ngIf="form.get('workDate')?.invalid">
              Data do trabalho é obrigatória
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="fill">
            <mat-label>Horas Trabalhadas *</mat-label>
            <input 
              matInput 
              formControlName="hoursWorked" 
              type="number" 
              step="0.5" 
              placeholder="8.0"
              (input)="calculateAmount()">
            <mat-hint>Use decimais para minutos (ex: 8.5 = 8h30min)</mat-hint>
            <mat-error *ngIf="form.get('hoursWorked')?.hasError('required')">
              Horas trabalhadas é obrigatório
            </mat-error>
            <mat-error *ngIf="form.get('hoursWorked')?.hasError('min')">
              Deve ser maior que 0
            </mat-error>
            <mat-error *ngIf="form.get('hoursWorked')?.hasError('max')">
              Máximo 24 horas por dia
            </mat-error>
          </mat-form-field>
        </div>

        <!-- Observações -->
        <div class="form-section">
          <mat-form-field appearance="fill">
            <mat-label>Observações (opcional)</mat-label>
            <textarea 
              matInput 
              formControlName="notes" 
              rows="3" 
              placeholder="Descreva o trabalho realizado, projeto, etc."></textarea>
            <mat-hint>Ex: Trabalho no projeto X, manutenção sistema Y</mat-hint>
          </mat-form-field>
        </div>

        <!-- Resumo Visual -->
        <div class="summary-box" *ngIf="calculatedAmount > 0">
          <h4>Resumo</h4>
          <div class="summary-item">
            <span>{{ form.get('hoursWorked')?.value }}h</span>
            <span>×</span>
            <span>R$ {{ selectedEmployee?.hourlyRate | number: '1.2-2' }}</span>
            <span>=</span>
            <span class="total">R$ {{ calculatedAmount | number: '1.2-2' }}</span>
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
        {{ isSaving ? 'Salvando...' : (isEditing ? 'Atualizar' : 'Registrar') }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .worklog-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
      min-width: 500px;
    }

    .form-section {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    mat-form-field {
      width: 100%;
    }

    .employee-info {
      background-color: #e3f2fd;
      padding: 16px;
      border-radius: 4px;
      border-left: 4px solid #2e7d32;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      border-bottom: 1px solid #bbdefb;
    }

    .info-row:last-child {
      border-bottom: none;
    }

    .info-row .label {
      font-weight: 500;
      color: #555;
    }

    .info-row .value {
      font-weight: 600;
      color: #1976d2;
    }

    .info-row .value.estimated {
      color: #2e7d32;
      font-size: 18px;
    }

    .summary-box {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px;
      border-radius: 8px;
      margin-top: 10px;
    }

    .summary-box h4 {
      margin: 0 0 12px 0;
      font-size: 14px;
      opacity: 0.9;
    }

    .summary-item {
      display: flex;
      align-items: center;
      justify-content: space-around;
      font-size: 18px;
      font-weight: 600;
    }

    .summary-item .total {
      font-size: 24px;
      font-weight: 700;
    }

    mat-dialog-actions {
      padding: 16px 0;
      margin-top: 20px;
    }
  `]
})
export class WorklogFormDialogComponent implements OnInit {
  form!: FormGroup;
  isEditing = false;
  isSaving = false;

  employees: Employee[] = [];
  selectedEmployee: Employee | null = null;
  calculatedAmount = 0;

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    public dialogRef: MatDialogRef<WorklogFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: WorkLog | null
  ) {
    this.createForm();
  }

  ngOnInit(): void {
    this.loadEmployees();
    
    if (this.data) {
      this.isEditing = true;
      this.form.patchValue({
        employeeId: this.data.employeeId,
        workDate: new Date(this.data.workDate),
        hoursWorked: this.data.hoursWorked,
        notes: this.data.notes
      });
    }
  }

  private createForm(): void {
    this.form = this.fb.group({
      employeeId: ['', [Validators.required]],
      workDate: [new Date(), [Validators.required]],
      hoursWorked: [0, [Validators.required, Validators.min(0.5), Validators.max(24)]],
      notes: ['']
    });

    // Recalcula ao mudar horas
    this.form.get('hoursWorked')?.valueChanges.subscribe(() => {
      this.calculateAmount();
    });
  }

  private loadEmployees(): void {
    this.apiService.getEmployees(false).subscribe({
      next: (data) => {
        this.employees = data;
        // Se está editando, seleciona o funcionário
        if (this.isEditing && this.data) {
          this.selectedEmployee = this.employees.find(e => e.id === this.data!.employeeId) || null;
          this.calculateAmount();
        }
      },
      error: (error) => {
        console.error('Erro ao carregar funcionários:', error);
        alert('Erro ao carregar funcionários');
      }
    });
  }

  onEmployeeChange(): void {
    const employeeId = this.form.get('employeeId')?.value;
    this.selectedEmployee = this.employees.find(e => e.id === employeeId) || null;
    this.calculateAmount();
  }

  calculateAmount(): void {
    const hours = this.form.get('hoursWorked')?.value || 0;
    const rate = this.selectedEmployee?.hourlyRate || 0;
    this.calculatedAmount = hours * rate;
  }

  onSave(): void {
    if (!this.form.valid) {
      console.warn('⚠️ Formulário inválido:', this.form.errors);
      return;
    }

    this.isSaving = true;
    const worklogData: CreateWorkLogRequest = {
      employeeId: this.form.value.employeeId,
      workDate: this.form.value.workDate.toISOString(),
      hoursWorked: this.form.value.hoursWorked,
      notes: this.form.value.notes || undefined
    };

    console.log('💾 Salvando worklog:', {
      action: this.isEditing ? 'UPDATE' : 'CREATE',
      data: worklogData,
      employee: this.selectedEmployee?.fullName,
      calculatedAmount: this.calculatedAmount
    });

    const request$ = this.isEditing
      ? this.apiService.updateWorkLog(this.data!.id, worklogData)
      : this.apiService.createWorkLog(worklogData);

    request$.subscribe({
      next: (result) => {
        console.log('✅ Worklog salvo com sucesso:', result);
        this.isSaving = false;
        this.dialogRef.close(result);
      },
      error: (error) => {
        console.error('❌ Erro ao salvar registro:', error);
        console.error('Detalhes do erro:', {
          status: error.status,
          statusText: error.statusText,
          message: error.message,
          url: error.url,
          error: error.error
        });
        this.isSaving = false;
        alert(`Erro ao salvar registro de horas: ${error.error?.message || error.message || 'Erro desconhecido'}`);
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
