import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { TenantGlSettings } from '@core/models';

interface HintRow {
  code: string;
  name: string;
  purpose: string;
  configured: boolean | null; // null = informative only
}

@Component({
  selector: 'app-accounts-hints',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule],
  template: `
    <mat-card class="hints-card">
      <mat-card-header>
        <mat-icon mat-card-avatar>tips_and_updates</mat-icon>
        <mat-card-title>Recommended accounts</mat-card-title>
        <mat-card-subtitle>Suggested mappings for the Finance and HR modules</mat-card-subtitle>
      </mat-card-header>
      <mat-card-content>
        <table class="hints-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Account</th>
              <th>Purpose</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            @for (row of rows; track row.code) {
              <tr>
                <td class="code">{{ row.code }}</td>
                <td>{{ row.name }}</td>
                <td>{{ row.purpose }}</td>
                <td>
                  @if (row.configured === null) {
                    <span class="status-info">
                      <mat-icon>info_outline</mat-icon> Informational
                    </span>
                  }
                  @if (row.configured === true) {
                    <span class="status-ok">
                      <mat-icon>check_circle</mat-icon> Configured
                    </span>
                  }
                  @if (row.configured === false) {
                    <span class="status-warn">
                      <mat-icon>warning_amber</mat-icon> Not configured
                    </span>
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .hints-card { margin-bottom: 24px; }
    .hints-table { width: 100%; border-collapse: collapse; font-size: 14px; }
    .hints-table th { text-align: left; padding: 8px 12px; border-bottom: 1px solid var(--color-border-strong); font-weight: 500; }
    .hints-table td { padding: 8px 12px; border-bottom: 1px solid var(--color-border); }
    .hints-table td.code { font-family: var(--font-mono); color: var(--color-text-muted); }
    .status-ok   { display: flex; align-items: center; gap: 4px; color: var(--color-success); font-size: 13px; }
    .status-warn { display: flex; align-items: center; gap: 4px; color: var(--color-warn); font-size: 13px; }
    .status-info { display: flex; align-items: center; gap: 4px; color: var(--color-text-subtle); font-size: 13px; }
  `]
})
export class AccountsHintsComponent {
  @Input() glSettings: TenantGlSettings | null = null;

  get rows(): HintRow[] {
    const s = this.glSettings;
    return [
      {
        code: '1.1.1',
        name: 'Cash and Cash Equivalents',
        purpose: 'Cash payments (Accounts Payable)',
        configured: s ? !!s.defaultCashAccountId : false
      },
      {
        code: '2.1.1',
        name: 'Suppliers / Accounts Payable',
        purpose: 'Accounts Payable entries',
        configured: s ? !!s.defaultAccountsPayableAccountId : false
      },
      {
        code: '5.1.4',
        name: 'Supplier Expenses',
        purpose: 'Accounts Payable expenses',
        configured: s ? !!s.defaultExpenseAccountId : false
      },
      {
        code: '2.1.3',
        name: 'Salaries Payable',
        purpose: 'HR payroll',
        configured: null
      },
      {
        code: '5.1.1',
        name: 'Personnel Expenses',
        purpose: 'HR personnel costs',
        configured: null
      }
    ];
  }
}
