import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService, AuthService } from '@core/services';
import { AccountsPayableSummary } from '@core/models';

@Component({
  selector: 'app-dashboard-finance',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatProgressBarModule, MatProgressSpinnerModule, CurrencyPipe, DatePipe],
  templateUrl: './dashboard-finance.component.html',
  styles: [`
    .finance-dash { padding: 16px 0; }
    .spinner-wrap { display: flex; justify-content: center; padding: 48px; }
    .tiles { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 24px; }
    .tile { flex: 1; min-width: 180px; }
    .tile mat-card-content { display: flex; flex-direction: column; align-items: center; padding: 16px; gap: 8px; }
    .tile-icon { font-size: 36px; width: 36px; height: 36px; }
    .tile-icon.pending { color: var(--color-warn); }
    .tile-icon.paid    { color: var(--color-success); }
    .tile-icon.total   { color: var(--color-info); }
    .tile-value { font-size: 22px; font-weight: 600; }
    .tile-label { font-size: 13px; color: var(--color-text-muted); }
    .category-card { margin-bottom: 24px; }
    .cat-row { display: grid; grid-template-columns: 180px 1fr 120px; align-items: center; gap: 12px; margin-bottom: 10px; }
    .cat-name { font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .cat-bar { height: 8px; border-radius: 4px; }
    .cat-amount { font-size: 13px; text-align: right; color: var(--color-text); }
    .no-data { color: var(--color-text-subtle); text-align: center; padding: 32px; }
  `]
})
export class DashboardFinanceComponent implements OnInit {
  summary: AccountsPayableSummary | null = null;
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
    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const lastOfMonth  = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    this.api.getAccountsPayableSummary(this.tenantId, firstOfMonth, lastOfMonth).subscribe({
      next: s => { this.summary = s; this.isLoading = false; },
      error: () => { this.isLoading = false; }
    });
  }

  get totalPending(): number { return this.summary?.totalPending ?? 0; }
  get totalPaid(): number    { return this.summary?.totalPaid    ?? 0; }
  get grandTotal(): number   { return this.totalPending + this.totalPaid; }

  get categoryRows(): { name: string; amount: number; pct: number }[] {
    if (!this.summary?.totalsByCategory?.length) return [];
    const cats = this.summary.totalsByCategory;
    const max = Math.max(...cats.map(c => c.totalPending + c.totalPaid), 1);
    return cats
      .map(c => ({
        name:   c.categoryName,
        amount: c.totalPending + c.totalPaid,
        pct:    Math.round(((c.totalPending + c.totalPaid) / max) * 100)
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 8);
  }
}
