import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService, AuthService } from '@core/services';
import { PaymentPeriodSummary, HrPaymentStatus } from '@core/models';

@Component({
  selector: 'app-payment-periods',
  standalone: true,
  imports: [
    CommonModule, MatTableModule, MatCardModule, MatChipsModule,
    MatIconModule, MatProgressSpinnerModule, CurrencyPipe, DatePipe, DecimalPipe
  ],
  styles: [`
    .page-container { padding: 24px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .page-header h1 { margin: 0; }
    .subtitle { color: var(--color-text-muted); font-size: 14px; margin-top: 4px; }
    .full-table { width: 100%; }
    .spinner-wrap { display: flex; justify-content: center; padding: 48px; }
    .no-data { color: var(--color-text-subtle); text-align: center; padding: 32px; }
  `],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1>Payment Periods</h1>
          <p class="subtitle">Every period generated for employees</p>
        </div>
      </div>

      <mat-card>
        <mat-card-content>
          @if (isLoading) {
            <div class="spinner-wrap">
              <mat-spinner diameter="48"></mat-spinner>
            </div>
          }
          @if (!isLoading && periods.length === 0) {
            <p class="no-data">No periods generated.</p>
          }
          @if (!isLoading && periods.length > 0) {
            <table mat-table [dataSource]="periods" class="full-table">

              <ng-container matColumnDef="employeeName">
                <th mat-header-cell *matHeaderCellDef>Employee</th>
                <td mat-cell *matCellDef="let p">{{ p.employeeName }}</td>
              </ng-container>

              <ng-container matColumnDef="period">
                <th mat-header-cell *matHeaderCellDef>Period</th>
                <td mat-cell *matCellDef="let p">
                  {{ p.startDate | date:'mediumDate':'UTC' }} – {{ p.endDate | date:'mediumDate':'UTC' }}
                </td>
              </ng-container>

              <ng-container matColumnDef="totalHours">
                <th mat-header-cell *matHeaderCellDef>Hours</th>
                <td mat-cell *matCellDef="let p">{{ p.totalHours | number:'1.1-1' }}h</td>
              </ng-container>

              <ng-container matColumnDef="totalAmount">
                <th mat-header-cell *matHeaderCellDef>Total</th>
                <td mat-cell *matCellDef="let p">{{ p.totalAmount | currency:'BRL':'symbol':'1.2-2' }}</td>
              </ng-container>

              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Status</th>
                <td mat-cell *matCellDef="let p">
                  <mat-chip [color]="statusColor(p.status)" highlighted>{{ p.statusName }}</mat-chip>
                </td>
              </ng-container>

              <ng-container matColumnDef="createdAt">
                <th mat-header-cell *matHeaderCellDef>Created</th>
                <td mat-cell *matCellDef="let p">{{ p.createdAt | date:'mediumDate' }}</td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            </table>
          }
        </mat-card-content>
      </mat-card>
    </div>
  `
})
export class PaymentPeriodsComponent implements OnInit {
  periods: PaymentPeriodSummary[] = [];
  isLoading = false;

  readonly displayedColumns = ['employeeName', 'period', 'totalHours', 'totalAmount', 'status', 'createdAt'];

  private tenantId: string | null = null;

  constructor(private api: ApiService, private auth: AuthService) {}

  ngOnInit(): void {
    this.tenantId = this.auth.getCurrentTenantId();
    if (!this.tenantId) return;
    this.isLoading = true;
    this.api.getAllPaymentPeriods(this.tenantId).subscribe({
      next: periods => { this.periods = periods; this.isLoading = false; },
      error: () => { this.isLoading = false; }
    });
  }

  statusColor(status: HrPaymentStatus): 'primary' | 'accent' | 'warn' {
    switch (status) {
      case HrPaymentStatus.Paid:    return 'primary';
      case HrPaymentStatus.Overdue: return 'warn';
      default:                      return 'accent';
    }
  }
}
