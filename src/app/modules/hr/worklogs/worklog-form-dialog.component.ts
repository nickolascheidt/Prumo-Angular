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
import { ApiService, AuthService } from '@core/services';
import { Employee, WorkLog, CreateWorkLogRequest, UpdateWorkLogRequest } from '@core/models';

@Component({
  selector: 'app-worklog-form-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatButtonModule, MatDatepickerModule, MatNativeDateModule,
    MatSelectModule, MatProgressSpinnerModule
  ],
  providers: [{ provide: MAT_DATE_LOCALE, useValue: 'en-US' }],
  template: `
    <h2 mat-dialog-title>{{ isEditing ? 'Edit work log' : 'Log hours worked' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="worklog-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Employee *</mat-label>
          <mat-select formControlName="employeeId" (selectionChange)="onEmployeeChange()">
            <mat-option *ngFor="let e of employees" [value]="e.id">
              {{ e.fullName }} — R$ {{ e.hourlyRate | number:'1.2-2' }}/h
            </mat-option>
          </mat-select>
          <mat-error>Select an employee</mat-error>
        </mat-form-field>

        <div class="info-box" *ngIf="selectedEmployee">
          <span>Hourly rate: <strong>R$ {{ selectedEmployee.hourlyRate | number:'1.2-2' }}</strong></span>
          <span *ngIf="calculatedAmount > 0">Estimated amount: <strong class="amount">R$ {{ calculatedAmount | number:'1.2-2' }}</strong></span>
        </div>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Date *</mat-label>
          <input matInput formControlName="workDate" [matDatepicker]="picker">
          <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
          <mat-datepicker #picker></mat-datepicker>
          <mat-error>Date is required</mat-error>
        </mat-form-field>

        <div class="form-row">
          <mat-form-field appearance="outline">
            <mat-label>Clock in *</mat-label>
            <input matInput formControlName="clockIn" type="time">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Clock out *</mat-label>
            <input matInput formControlName="clockOut" type="time">
          </mat-form-field>
        </div>

        <div class="summary-box" *ngIf="calculatedAmount > 0">
          <span>{{ form.get('clockIn')?.value }} → {{ form.get('clockOut')?.value }}</span>
          <span>×</span>
          <span>R$ {{ selectedEmployee?.hourlyRate | number:'1.2-2' }}/h</span>
          <span>=</span>
          <span class="total">R$ {{ calculatedAmount | number:'1.2-2' }}</span>
        </div>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Notes</mat-label>
          <textarea matInput formControlName="notes" rows="2"></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button mat-raised-button color="primary" (click)="onSave()" [disabled]="form.invalid || isSaving">
        {{ isSaving ? 'Saving...' : (isEditing ? 'Update' : 'Log') }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .worklog-form { display: flex; flex-direction: column; gap: 14px; min-width: 480px; }
    .full-width { width: 100%; }
    .form-row { display: flex; gap: 16px; }
    .form-row mat-form-field { flex: 1; }
    .info-box {
      display: flex; justify-content: space-between; padding: 10px 14px;
      background: var(--color-info-light); border-radius: 6px; font-size: 14px;
    }
    .amount { color: var(--color-success); }
    .summary-box {
      display: flex; align-items: center; justify-content: space-around;
      background: var(--color-primary);
      color: white; padding: 14px; border-radius: 8px; font-weight: 600;
    }
    .total { font-size: 20px; }
  `]
})
export class WorklogFormDialogComponent implements OnInit {
  form!: FormGroup;
  isEditing = false;
  isSaving = false;
  employees: Employee[] = [];
  selectedEmployee: Employee | null = null;
  calculatedAmount = 0;

  private tenantId: string | null = null;

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private auth: AuthService,
    public dialogRef: MatDialogRef<WorklogFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: WorkLog | null
  ) {}

  ngOnInit(): void {
    this.tenantId = this.auth.getCurrentTenantId();
    this.isEditing = !!this.data;

    this.form = this.fb.group({
      employeeId: [this.data?.employeeId ?? '', Validators.required],
      workDate: [this.data ? new Date(this.data.workDate) : new Date(), Validators.required],
      clockIn: ['08:00', Validators.required],
      clockOut: ['17:00', Validators.required],
      notes: [this.data?.notes ?? '']
    });

    this.form.get('clockIn')?.valueChanges.subscribe(() => this.calculateAmount());
    this.form.get('clockOut')?.valueChanges.subscribe(() => this.calculateAmount());

    if (this.tenantId) {
      this.api.getEmployees(this.tenantId).subscribe({
        next: (data) => {
          this.employees = data;
          if (this.data) {
            this.selectedEmployee = data.find(e => e.id === this.data!.employeeId) ?? null;
            this.calculateAmount();
          }
        }
      });
    }
  }

  onEmployeeChange(): void {
    const id = this.form.get('employeeId')?.value;
    this.selectedEmployee = this.employees.find(e => e.id === id) ?? null;
    this.calculateAmount();
  }

  calculateAmount(): void {
    const clockIn = this.form.get('clockIn')?.value as string;
    const clockOut = this.form.get('clockOut')?.value as string;
    if (!clockIn || !clockOut || !this.selectedEmployee) { this.calculatedAmount = 0; return; }
    const [inH, inM] = clockIn.split(':').map(Number);
    const [outH, outM] = clockOut.split(':').map(Number);
    const hours = ((outH * 60 + outM) - (inH * 60 + inM)) / 60;
    this.calculatedAmount = hours > 0 ? Math.round(hours * this.selectedEmployee.hourlyRate * 100) / 100 : 0;
  }

  private getHoursWorked(): number {
    const clockIn = this.form.get('clockIn')?.value as string;
    const clockOut = this.form.get('clockOut')?.value as string;
    const [inH, inM] = clockIn.split(':').map(Number);
    const [outH, outM] = clockOut.split(':').map(Number);
    return ((outH * 60 + outM) - (inH * 60 + inM)) / 60;
  }

  onSave(): void {
    if (this.form.invalid || !this.tenantId || !this.selectedEmployee) return;
    const hoursWorked = this.getHoursWorked();
    if (hoursWorked <= 0) { alert('Clock out must be after clock in.'); return; }
    this.isSaving = true;
    const v = this.form.value;
    const workDate = new Date(v.workDate).toISOString().split('T')[0];

    if (this.isEditing) {
      const req: UpdateWorkLogRequest = { workDate, hoursWorked, notes: v.notes || null };
      this.api.updateWorkLog(this.tenantId, this.data!.employeeId, this.data!.id, req).subscribe({
        next: (r) => { this.isSaving = false; this.dialogRef.close(r); },
        error: (err) => { this.isSaving = false; alert(err.error?.message ?? 'Failed to update.'); }
      });
    } else {
      const req: CreateWorkLogRequest = { employeeId: v.employeeId, workDate, hoursWorked, notes: v.notes || null };
      this.api.createWorkLog(this.tenantId, req).subscribe({
        next: (r) => { this.isSaving = false; this.dialogRef.close(r); },
        error: (err) => { this.isSaving = false; alert(err.error?.message ?? 'Failed to log the hours.'); }
      });
    }
  }

  onCancel(): void { this.dialogRef.close(); }
}
