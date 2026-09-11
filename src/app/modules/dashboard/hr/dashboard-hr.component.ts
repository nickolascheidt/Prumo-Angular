import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService, AuthService } from '@core/services';
import { Employee, HrPayment } from '@core/models';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-dashboard-hr',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatListModule, MatProgressSpinnerModule, CurrencyPipe, DatePipe],
  templateUrl: './dashboard-hr.component.html',
  styles: [`
    .hr-dash { padding: 16px 0; }
    .spinner-wrap { display: flex; justify-content: center; padding: 48px; }
    .tiles { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 24px; }
    .tile { flex: 1; min-width: 180px; }
    .tile mat-card-content { display: flex; flex-direction: column; align-items: center; padding: 16px; gap: 8px; }
    .tile-icon { font-size: 36px; width: 36px; height: 36px; }
    .tile-icon.emp { color: var(--color-primary); }
    .tile-icon.pay { color: var(--color-accent); }
    .tile-value { font-size: 22px; font-weight: 600; }
    .tile-label { font-size: 13px; color: var(--color-text-muted); }
    .payments-card { margin-bottom: 24px; }
    .no-data { color: var(--color-text-subtle); text-align: center; padding: 32px; }
  `]
})
export class DashboardHrComponent implements OnInit {
  employees: Employee[] = [];
  recentPayments: HrPayment[] = [];
  isLoading = false;

  private tenantId: string | null = null;

  constructor(private api: ApiService, private auth: AuthService) {}

  ngOnInit(): void {
    this.tenantId = this.auth.getCurrentTenantId();
    if (!this.tenantId) return;
    this.load();
  }

  private load(): void {
    if (!this.tenantId) return;
    this.isLoading = true;
    forkJoin({
      employees: this.api.getEmployees(this.tenantId!),
      payments:  this.api.getRecentHrPayments(this.tenantId!, 5)
    }).subscribe({
      next: ({ employees, payments }) => {
        this.employees      = employees;
        this.recentPayments = payments;
        this.isLoading      = false;
      },
      error: () => { this.isLoading = false; }
    });
  }

  get activeEmployeeCount(): number {
    return this.employees.filter(e => e.isActive).length;
  }

  get recentPaymentsTotal(): number {
    return this.recentPayments.reduce((sum, p) => sum + p.amount, 0);
  }
}
