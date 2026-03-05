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
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '@core/services';
import { Employee, PaymentPeriod, PaymentMethod, CreatePaymentRequest } from '@core/models';

@Component({
  selector: 'app-payment-form-dialog',
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
    MatIconModule
  ],
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'pt-BR' }
  ],
  template: `
    <h2 mat-dialog-title>Novo Pagamento</h2>
    
    <mat-dialog-content>
      <form [formGroup]="form" class="payment-form">
        
        <!-- Seleção de Funcionário -->
        <div class="form-section">
          <mat-form-field appearance="fill">
            <mat-label>Funcionário *</mat-label>
            <mat-select formControlName="employeeId" (selectionChange)="onEmployeeChange()">
              <mat-option *ngFor="let employee of employees" [value]="employee.id">
                {{ employee.fullName }}
              </mat-option>
            </mat-select>
            <mat-error *ngIf="form.get('employeeId')?.invalid">
              Selecione um funcionário
            </mat-error>
          </mat-form-field>

          <!-- Loading dos períodos -->
          <div *ngIf="loadingPeriods" class="loading-container">
            <mat-spinner diameter="30"></mat-spinner>
            <p>Carregando períodos...</p>
          </div>

          <!-- Seleção de Período de Pagamento -->
          <mat-form-field appearance="fill" *ngIf="!loadingPeriods && paymentPeriods.length > 0">
            <mat-label>Período de Pagamento *</mat-label>
            <mat-select formControlName="paymentPeriodId" (selectionChange)="onPeriodChange()">
              <mat-option *ngFor="let period of paymentPeriods" [value]="period.id">
                {{ period.startDate | date: 'dd/MM/yyyy' }} a {{ period.endDate | date: 'dd/MM/yyyy' }} 
                - R$ {{ period.totalAmount | number: '1.2-2' }}
                ({{ getStatusLabel(period.status) }})
              </mat-option>
            </mat-select>
            <mat-error *ngIf="form.get('paymentPeriodId')?.invalid">
              Selecione um período
            </mat-error>
          </mat-form-field>

          <!-- Mensagem se não houver períodos -->
          <div *ngIf="!loadingPeriods && form.get('employeeId')?.value && paymentPeriods.length === 0" class="no-periods">
            <mat-icon>info</mat-icon>
            <h4>Nenhum período de pagamento disponível</h4>
            <p>Para registrar um pagamento, é necessário primeiro:</p>
            <ol>
              <li>Registrar as horas trabalhadas do funcionário</li>
              <li>Gerar um período de pagamento com essas horas</li>
              <li>Então poderá efetuar o pagamento aqui</li>
            </ol>
            <p class="hint">Verifique se as horas já foram registradas em "Horas Trabalhadas".</p>
          </div>
        </div>

        <!-- Informações do Período Selecionado -->
        <div class="period-info" *ngIf="selectedPeriod">
          <h3>Detalhes do Período</h3>
          <div class="info-row">
            <span class="label">Horas Trabalhadas:</span>
            <span class="value">{{ selectedPeriod.totalHours }}h</span>
          </div>
          <div class="info-row">
            <span class="label">Valor Total:</span>
            <span class="value">R$ {{ selectedPeriod.totalAmount | number: '1.2-2' }}</span>
          </div>
        </div>

        <!-- Dados do Pagamento -->
        <div class="form-section">
          <mat-form-field appearance="fill">
            <mat-label>Data de Pagamento *</mat-label>
            <input matInput formControlName="paymentDate" [matDatepicker]="picker">
            <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
            <mat-datepicker #picker></mat-datepicker>
            <mat-error *ngIf="form.get('paymentDate')?.invalid">
              Data de pagamento é obrigatória
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="fill">
            <mat-label>Método de Pagamento *</mat-label>
            <mat-select formControlName="paymentMethod">
              <mat-option [value]="paymentMethods.Dinheiro">Dinheiro</mat-option>
              <mat-option [value]="paymentMethods.Pix">PIX</mat-option>
              <mat-option [value]="paymentMethods.TransferenciaBancaria">Transferência Bancária</mat-option>
              <mat-option [value]="paymentMethods.Cheque">Cheque</mat-option>
            </mat-select>
            <mat-error *ngIf="form.get('paymentMethod')?.invalid">
              Selecione o método de pagamento
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="fill">
            <mat-label>Comprovante (opcional)</mat-label>
            <input matInput formControlName="paymentProof" placeholder="Link ou número do comprovante">
          </mat-form-field>

          <mat-form-field appearance="fill">
            <mat-label>Observações (opcional)</mat-label>
            <textarea matInput formControlName="notes" rows="3" placeholder="Observações sobre o pagamento"></textarea>
          </mat-form-field>
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
        {{ isSaving ? 'Salvando...' : 'Registrar Pagamento' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .payment-form {
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

    .no-periods {
      padding: 30px;
      display: flex;
      flex-direction: column;
      align-items: center;
      background-color: #fff3cd;
      border: 2px solid #ffc107;
      border-radius: 8px;
      margin: 10px 0;
    }

    .no-periods mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #ff9800;
      margin-bottom: 10px;
    }

    .no-periods h4 {
      color: #333;
      margin: 10px 0;
    }

    .no-periods ol {
      text-align: left;
      display: inline-block;
      margin: 15px 0;
    }

    .no-periods li {
      margin: 8px 0;
      color: #555;
    }

    .no-periods .hint {
      font-style: italic;
      color: #666;
      margin-top: 15px;
      font-size: 13px;
    }

    .period-info {
      background-color: #e8f5e9;
      padding: 16px;
      border-radius: 4px;
      border-left: 4px solid #2e7d32;
      margin: 10px 0;
    }

    .period-info h3 {
      margin: 0 0 12px 0;
      font-size: 14px;
      font-weight: 600;
      color: #2e7d32;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      border-bottom: 1px solid #c8e6c9;
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
      color: #2e7d32;
    }

    mat-dialog-actions {
      padding: 16px 0;
      margin-top: 20px;
    }
  `]
})
export class PaymentFormDialogComponent implements OnInit {
  form!: FormGroup;
  isSaving = false;
  loadingPeriods = false;

  employees: Employee[] = [];
  paymentPeriods: PaymentPeriod[] = [];
  selectedPeriod: PaymentPeriod | null = null;

  paymentMethods = PaymentMethod;

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    public dialogRef: MatDialogRef<PaymentFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.createForm();
  }

  ngOnInit(): void {
    this.loadEmployees();
  }

  private createForm(): void {
    this.form = this.fb.group({
      employeeId: ['', [Validators.required]],
      paymentPeriodId: ['', [Validators.required]],
      paymentDate: [new Date(), [Validators.required]],
      paymentMethod: [PaymentMethod.Pix, [Validators.required]],
      paymentProof: [''],
      notes: ['']
    });
  }

  private loadEmployees(): void {
    this.apiService.getEmployees(false).subscribe({
      next: (data) => {
        this.employees = data;
      },
      error: (error) => {
        console.error('Erro ao carregar funcionários:', error);
        alert('Erro ao carregar funcionários');
      }
    });
  }

  onEmployeeChange(): void {
    const employeeId = this.form.get('employeeId')?.value;
    if (employeeId) {
      this.loadPaymentPeriods(employeeId);
    }
    // Limpa período selecionado
    this.form.patchValue({ paymentPeriodId: '' });
    this.selectedPeriod = null;
  }

  private loadPaymentPeriods(employeeId: string): void {
    this.loadingPeriods = true;
    this.paymentPeriods = [];
    
    console.log('🔍 Buscando períodos de pagamento para funcionário:', employeeId);
    
    // Carrega períodos de pagamento do funcionário
    this.apiService.getPaymentPeriodsByEmployee(employeeId).subscribe({
      next: (data) => {
        console.log('📊 Períodos recebidos da API:', data);
        
        // Filtra apenas períodos pendentes ou aprovados (não pagos)
        // Status: 1 = Pending, 2 = Approved, 3 = Paid, 4 = Cancelled
        this.paymentPeriods = data.filter(p => p.status === 1 || p.status === 2);
        
        console.log('✅ Períodos disponíveis para pagamento:', this.paymentPeriods);
        
        this.loadingPeriods = false;
        
        if (this.paymentPeriods.length === 0) {
          console.warn('⚠️ Nenhum período disponível. Pode ser necessário gerar um período de pagamento primeiro.');
        }
      },
      error: (error) => {
        console.error('❌ Erro ao carregar períodos:', error);
        console.error('Detalhes do erro:', {
          status: error.status,
          statusText: error.statusText,
          message: error.message,
          url: error.url
        });
        this.loadingPeriods = false;
        alert('Erro ao carregar períodos de pagamento. Verifique o console para mais detalhes.');
      }
    });
  }

  onPeriodChange(): void {
    const periodId = this.form.get('paymentPeriodId')?.value;
    this.selectedPeriod = this.paymentPeriods.find(p => p.id === periodId) || null;
  }

  getStatusLabel(status: number): string {
    const labels: {[key: number]: string} = {
      1: 'Pendente',
      2: 'Aprovado',
      3: 'Pago',
      4: 'Cancelado'
    };
    return labels[status] || 'Desconhecido';
  }

  onSave(): void {
    if (!this.form.valid) return;

    this.isSaving = true;
    const paymentData: CreatePaymentRequest = {
      paymentPeriodId: this.form.value.paymentPeriodId,
      paymentDate: this.form.value.paymentDate.toISOString(),
      paymentMethod: this.form.value.paymentMethod,
      paymentProof: this.form.value.paymentProof || undefined,
      notes: this.form.value.notes || undefined
    };

    this.apiService.createPayment(paymentData).subscribe({
      next: (result) => {
        this.isSaving = false;
        this.dialogRef.close(result);
      },
      error: (error) => {
        this.isSaving = false;
        console.error('Erro ao registrar pagamento:', error);
        alert('Erro ao registrar pagamento. Verifique os dados e tente novamente.');
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
