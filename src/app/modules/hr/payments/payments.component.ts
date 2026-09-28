import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ApiService, AuthService } from '@core/services';
import { HrPayment } from '@core/models';
import { PaymentFormDialogComponent } from './payment-form-dialog.component';
import { GeneratePaymentPeriodDialogComponent } from './generate-payment-period-dialog.component';

@Component({
  selector: 'app-hr-payments',
  standalone: true,
  imports: [
    CommonModule, MatTableModule, MatCardModule, MatButtonModule,
    MatIconModule, MatProgressSpinnerModule, MatDialogModule
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1>Payments</h1>
          <p class="subtitle">Employee payment history</p>
        </div>
        <div class="button-group">
          <button mat-stroked-button color="accent" (click)="onGeneratePeriod()">
            <mat-icon>event_note</mat-icon> Generate period
          </button>
          <button mat-raised-button color="primary" (click)="onNew()">
            <mat-icon>add</mat-icon> New payment
          </button>
        </div>
      </div>

      <mat-card>
        <mat-card-content>
          <div *ngIf="isLoading" class="spinner-wrap"><mat-spinner diameter="48"></mat-spinner></div>
          <p *ngIf="!isLoading && payments.length === 0" class="no-data">No payments recorded</p>
          <table mat-table [dataSource]="payments" *ngIf="!isLoading && payments.length > 0" class="full-table">
            <ng-container matColumnDef="employeeName">
              <th mat-header-cell *matHeaderCellDef>Employee</th>
              <td mat-cell *matCellDef="let p">{{ p.employeeName }}</td>
            </ng-container>
            <ng-container matColumnDef="paymentDate">
              <th mat-header-cell *matHeaderCellDef>Date</th>
              <td mat-cell *matCellDef="let p">{{ p.paymentDate | date:'mediumDate' }}</td>
            </ng-container>
            <ng-container matColumnDef="amount">
              <th mat-header-cell *matHeaderCellDef>Amount</th>
              <td mat-cell *matCellDef="let p">R$ {{ p.amount | number:'1.2-2' }}</td>
            </ng-container>
            <ng-container matColumnDef="paymentMethod">
              <th mat-header-cell *matHeaderCellDef>Method</th>
              <td mat-cell *matCellDef="let p">{{ p.paymentMethodName }}</td>
            </ng-container>
            <ng-container matColumnDef="paidBy">
              <th mat-header-cell *matHeaderCellDef>Paid by</th>
              <td mat-cell *matCellDef="let p">{{ p.paidByUserName }}</td>
            </ng-container>
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let p">
                <button mat-icon-button color="warn" (click)="onDelete(p)" title="Delete">
                  <mat-icon>delete</mat-icon>
                </button>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="columns"></tr>
            <tr mat-row *matRowDef="let row; columns: columns;"></tr>
          </table>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .page-container { padding: 24px; max-width: 1200px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
    h1 { margin: 0; font-size: 24px; font-weight: 600; color: var(--color-text); }
    .subtitle { margin: 4px 0 0; color: var(--color-text-muted); font-size: 14px; }
    .button-group { display: flex; gap: 12px; }
    .full-table { width: 100%; }
    .spinner-wrap { display: flex; justify-content: center; padding: 48px; }
    .no-data { text-align: center; color: var(--color-text-muted); padding: 48px; }
  `]
})
export class HrPaymentsComponent implements OnInit {
  payments: HrPayment[] = [];
  isLoading = false;
  columns = ['employeeName', 'paymentDate', 'amount', 'paymentMethod', 'paidBy', 'actions'];

  private tenantId: string | null = null;

  constructor(private api: ApiService, private auth: AuthService, private dialog: MatDialog) {}

  ngOnInit(): void {
    this.tenantId = this.auth.getCurrentTenantId();
    if (!this.tenantId) return;
    this.load();
  }

  private load(): void {
    if (!this.tenantId) return;
    this.isLoading = true;
    this.api.getRecentHrPayments(this.tenantId, 50).subscribe({
      next: (data) => { this.payments = data; this.isLoading = false; },
      error: () => { this.isLoading = false; }
    });
  }

  onNew(): void {
    this.dialog.open(PaymentFormDialogComponent, { width: '560px' })
      .afterClosed().subscribe(result => { if (result) this.load(); });
  }

  onGeneratePeriod(): void {
    this.dialog.open(GeneratePaymentPeriodDialogComponent, { width: '560px' })
      .afterClosed().subscribe(result => { if (result) this.load(); });
  }

  onDelete(p: HrPayment): void {
    if (!this.tenantId || !confirm(`Delete the R$ ${p.amount} payment to ${p.employeeName}?\nThe period will go back to Pending.`)) return;
    this.api.deleteHrPayment(this.tenantId, p.id).subscribe({
      next: () => this.load(),
      error: (err) => alert(err.error?.message ?? 'Failed to delete the payment.')
    });
  }
}
