import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { ApiService, AuthService } from '@core/services';
import { Employee, GeneratePaymentPeriodRequest, PaymentPeriodSummary } from '@core/models';

@Component({
  selector: 'app-generate-payment-period-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatButtonModule, MatDatepickerModule, MatNativeDateModule,
    MatSelectModule, MatProgressSpinnerModule, MatIconModule
  ],
  providers: [{ provide: MAT_DATE_LOCALE, useValue: 'pt-BR' }],
  template: `
    <h2 mat-dialog-title>
      <mat-icon style="vertical-align:middle;margin-right:8px">event_note</mat-icon>
      Gerar Período de Pagamento
    </h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="gen-form">
        <p class="hint">Selecione o funcionário e o período. O sistema irá agrupar os registros de horas não atribuídos.</p>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Funcionário *</mat-label>
          <mat-select formControlName="employeeId" (selectionChange)="onEmployeeChange()">
            <mat-option *ngFor="let e of employees" [value]="e.id">{{ e.fullName }}</mat-option>
          </mat-select>
          <mat-error>Selecione um funcionário</mat-error>
        </mat-form-field>
        <div class="date-row">
          <mat-form-field appearance="outline">
            <mat-label>Data Inicial *</mat-label>
            <input matInput [matDatepicker]="startPicker" formControlName="startDate" readonly>
            <mat-datepicker-toggle matIconSuffix [for]="startPicker"></mat-datepicker-toggle>
            <mat-datepicker #startPicker></mat-datepicker>
            <mat-error>Data inicial é obrigatória</mat-error>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Data Final *</mat-label>
            <input matInput [matDatepicker]="endPicker" formControlName="endDate" readonly>
            <mat-datepicker-toggle matIconSuffix [for]="endPicker"></mat-datepicker-toggle>
            <mat-datepicker #endPicker></mat-datepicker>
            <mat-error>Data final é obrigatória</mat-error>
          </mat-form-field>
        </div>
        <div class="employee-summary" *ngIf="selectedEmployee">
          <div><strong>{{ selectedEmployee.fullName }}</strong></div>
          <div>CPF: {{ selectedEmployee.cpf }}</div>
          <div>Taxa: R$ {{ selectedEmployee.hourlyRate | number:'1.2-2' }}/h</div>
        </div>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()" [disabled]="isGenerating">Cancelar</button>
      <button mat-raised-button color="primary" (click)="onGenerate()"
        [disabled]="form.invalid || isGenerating || form.hasError('dateRange')">
        <mat-spinner diameter="18" *ngIf="isGenerating" style="display:inline-block;margin-right:6px"></mat-spinner>
        {{ isGenerating ? 'Gerando...' : 'Gerar Período' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .gen-form { display: flex; flex-direction: column; gap: 14px; min-width: 480px; }
    .full-width { width: 100%; }
    .date-row { display: flex; gap: 16px; }
    .date-row mat-form-field { flex: 1; }
    .hint { margin: 0; color: var(--color-text-muted); font-size: 13px; }
    .employee-summary {
      background: var(--color-surface-alt); border-left: 4px solid var(--color-primary);
      padding: 12px 16px; border-radius: 4px; font-size: 13px; display: flex; flex-direction: column; gap: 4px;
    }
  `]
})
export class GeneratePaymentPeriodDialogComponent implements OnInit {
  form!: FormGroup;
  employees: Employee[] = [];
  selectedEmployee: Employee | null = null;
  isGenerating = false;

  private tenantId: string | null = null;

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private auth: AuthService,
    private dialogRef: MatDialogRef<GeneratePaymentPeriodDialogComponent>
  ) {}

  ngOnInit(): void {
    this.tenantId = this.auth.getCurrentTenantId();
    this.form = this.fb.group({
      employeeId: ['', Validators.required],
      startDate: [null, Validators.required],
      endDate: [null, Validators.required]
    }, { validators: (g) => {
      const s = g.get('startDate')?.value, e = g.get('endDate')?.value;
      return (s && e && new Date(s) >= new Date(e)) ? { dateRange: true } : null;
    }});
    if (this.tenantId) {
      this.api.getEmployees(this.tenantId).subscribe({ next: d => this.employees = d });
    }
  }

  onEmployeeChange(): void {
    const id = this.form.get('employeeId')?.value;
    this.selectedEmployee = this.employees.find(e => e.id === id) ?? null;
  }

  onGenerate(): void {
    if (this.form.invalid || !this.tenantId) return;
    this.isGenerating = true;
    const v = this.form.value;
    const req: GeneratePaymentPeriodRequest = {
      employeeId: v.employeeId,
      startDate: new Date(v.startDate).toISOString().split('T')[0],
      endDate: new Date(v.endDate).toISOString().split('T')[0]
    };
    this.api.generatePaymentPeriod(this.tenantId, req).subscribe({
      next: (result: PaymentPeriodSummary) => {
        this.isGenerating = false;
        alert(`Período gerado!\n${this.selectedEmployee?.fullName}\n${result.totalHours}h — R$ ${result.totalAmount}`);
        this.dialogRef.close(result);
      },
      error: (err) => { this.isGenerating = false; alert(err.error?.message ?? 'Erro ao gerar período.'); }
    });
  }

  onCancel(): void { this.dialogRef.close(); }
}
