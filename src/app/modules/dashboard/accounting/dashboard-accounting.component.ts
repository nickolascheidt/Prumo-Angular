import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { ApiService, AuthService } from '@core/services';
import { AccountsPayableSummary } from '@core/models';

@Component({
  selector: 'app-dashboard-accounting',
  standalone: true,
  imports: [CommonModule, RouterModule, MatCardModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './dashboard-accounting.component.html',
  styleUrls: ['./dashboard-accounting.component.scss']
})
export class DashboardAccountingComponent implements OnInit {
  summary: AccountsPayableSummary | null = null;
  loading = true;

  private tenantId: string | null = null;

  constructor(private api: ApiService, private auth: AuthService) {}

  ngOnInit(): void {
    this.tenantId = this.auth.getCurrentTenantId();
    if (!this.tenantId) return;

    const today = new Date();
    const from = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const to = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    this.api.getAccountsPayableSummary(this.tenantId, from, to).subscribe({
      next: s => { this.summary = s; this.loading = false; },
      error: () => (this.loading = false)
    });
  }
}
