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
import { Employee, PaymentPeriodSummary, HrPaymentMethod, HrPaymentStatus, CreateHrPaymentRequest } from '@core/models';
import { toDateOnly } from '@core/utils/date-only';

@Component({
  selector: 'app-payment-form-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatButtonModule, MatDatepickerModule, MatNativeDateModule,
    MatSelectModule, MatProgressSpinnerModule, MatIconModule
  ],
  providers: [{ provide: MAT_DATE_LOCALE, useValue: 'en-US' }],
  template: `
    <h2 mat-dialog-title>Record payment</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="payment-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Employee *</mat-label>
          <mat-select formControlName="employeeId" (selectionChange)="onEmployeeChange()">
            <mat-option *ngFor="let e of employees" [value]="e.id">{{ e.fullName }}</mat-option>
          </mat-select>
          <mat-error>Select an employee</mat-error>
        </mat-form-field>

        <div *ngIf="loadingPeriods" class="loading-row">
          <mat-spinner diameter="24"></mat-spinner>
          <span>Loading periods...</span>
        </div>

        <mat-form-field appearance="outline" class="full-width"
          *ngIf="!loadingPeriods && pendingPeriods.length > 0">
          <mat-label>Payment period *</mat-label>
          <mat-select formControlName="paymentPeriodId" (selectionChange)="onPeriodChange()">
            <mat-option *ngFor="let p of pendingPeriods" [value]="p.id">
              {{ p.startDate | date:'mediumDate':'UTC' }} → {{ p.endDate | date:'mediumDate':'UTC' }}
              — R$ {{ p.totalAmount | number:'1.2-2' }}
            </mat-option>
          </mat-select>
          <mat-error>Select a period</mat-error>
        </mat-form-field>

        <div class="no-periods" *ngIf="!loadingPeriods && form.get('employeeId')?.value && pendingPeriods.length === 0">
          <mat-icon>info</mat-icon>
          <p>No pending period. Log hours and generate a period first.</p>
        </div>

        <div class="period-info" *ngIf="selectedPeriod">
          <span>{{ selectedPeriod.totalHours }}h worked</span>
          <span class="amount">R$ {{ selectedPeriod.totalAmount | number:'1.2-2' }}</span>
        </div>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Payment date *</mat-label>
          <input matInput formControlName="paymentDate" [matDatepicker]="picker">
          <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
          <mat-datepicker #picker></mat-datepicker>
          <mat-error>Payment date is required</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Payment method *</mat-label>
          <mat-select formControlName="paymentMethod">
            <mat-option [value]="HrPaymentMethod.Pix">PIX</mat-option>
            <mat-option [value]="HrPaymentMethod.BankTransfer">Bank transfer</mat-option>
            <mat-option [value]="HrPaymentMethod.Cash">Cash</mat-option>
            <mat-option [value]="HrPaymentMethod.Check">Check</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Notes</mat-label>
          <textarea matInput formControlName="notes" rows="2"></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button mat-raised-button color="primary" (click)="onSave()"
        [disabled]="form.invalid || isSaving || pendingPeriods.length === 0">
        {{ isSaving ? 'Recording...' : 'Record payment' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .payment-form { display: flex; flex-direction: column; gap: 14px; min-width: 480px; }
    .full-width { width: 100%; }
    .loading-row { display: flex; align-items: center; gap: 10px; color: var(--color-text-muted); font-size: 13px; }
    .no-periods {
      display: flex; align-items: center; gap: 10px; padding: 16px;
      background: var(--color-warn-light); border: 1px solid var(--color-warn); border-radius: 6px; color: var(--color-text-muted);
    }
    .period-info {
      display: flex; justify-content: space-between; padding: 10px 16px;
      background: var(--color-success-light); border-left: 4px solid var(--color-success); border-radius: 4px;
    }
    .amount { font-weight: 700; color: var(--color-success); font-size: 16px; }
  `]
})
export class PaymentFormDialogComponent implements OnInit {
  form!: FormGroup;
  isSaving = false;
  loadingPeriods = false;
  employees: Employee[] = [];
  pendingPeriods: PaymentPeriodSummary[] = [];
  selectedPeriod: PaymentPeriodSummary | null = null;
  HrPaymentMethod = HrPaymentMethod;

  private tenantId: string | null = null;

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private auth: AuthService,
    private dialogRef: MatDialogRef<PaymentFormDialogComponent>
  ) {}

  ngOnInit(): void {
    this.tenantId = this.auth.getCurrentTenantId();
    this.form = this.fb.group({
      employeeId: ['', Validators.required],
      paymentPeriodId: ['', Validators.required],
      paymentDate: [new Date(), Validators.required],
      paymentMethod: [HrPaymentMethod.Pix, Validators.required],
      notes: ['']
    });
    if (this.tenantId) {
      this.api.getEmployees(this.tenantId).subscribe({ next: d => this.employees = d });
    }
  }

  onEmployeeChange(): void {
    const id = this.form.get('employeeId')?.value;
    if (!id || !this.tenantId) return;
    this.loadingPeriods = true;
    this.pendingPeriods = [];
    this.selectedPeriod = null;
    this.form.get('paymentPeriodId')?.reset('');
    this.api.getPaymentPeriods(this.tenantId, id).subscribe({
      next: (periods) => {
        this.pendingPeriods = periods.filter(p => p.status === HrPaymentStatus.Pending);
        this.loadingPeriods = false;
      },
      error: () => { this.loadingPeriods = false; }
    });
  }

  onPeriodChange(): void {
    const id = this.form.get('paymentPeriodId')?.value;
    this.selectedPeriod = this.pendingPeriods.find(p => p.id === id) ?? null;
  }

  onSave(): void {
    if (this.form.invalid || !this.tenantId) return;
    this.isSaving = true;
    const v = this.form.value;
    const req: CreateHrPaymentRequest = {
      paymentPeriodId: v.paymentPeriodId,
      paymentDate: toDateOnly(v.paymentDate),
      paymentMethod: v.paymentMethod,
      notes: v.notes || null
    };
    this.api.createHrPayment(this.tenantId, req).subscribe({
      next: (r) => { this.isSaving = false; this.dialogRef.close(r); },
      error: (err) => { this.isSaving = false; alert(err.error?.message ?? 'Failed to record the payment.'); }
    });
  }

  onCancel(): void { this.dialogRef.close(); }
}
