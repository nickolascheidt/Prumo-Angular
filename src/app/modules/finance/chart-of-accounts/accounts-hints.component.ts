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
        <mat-card-title>Contas Recomendadas</mat-card-title>
        <mat-card-subtitle>Mapeamentos sugeridos para os módulos Financeiro e RH</mat-card-subtitle>
      </mat-card-header>
      <mat-card-content>
        <table class="hints-table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Conta</th>
              <th>Finalidade</th>
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
                      <mat-icon>info_outline</mat-icon> Informativo
                    </span>
                  }
                  @if (row.configured === true) {
                    <span class="status-ok">
                      <mat-icon>check_circle</mat-icon> Configurado
                    </span>
                  }
                  @if (row.configured === false) {
                    <span class="status-warn">
                      <mat-icon>warning_amber</mat-icon> Não configurado
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
    .hints-table th { text-align: left; padding: 8px 12px; border-bottom: 1px solid #e0e0e0; font-weight: 500; }
    .hints-table td { padding: 8px 12px; border-bottom: 1px solid #f5f5f5; }
    .hints-table td.code { font-family: monospace; color: #555; }
    .status-ok   { display: flex; align-items: center; gap: 4px; color: #388e3c; font-size: 13px; }
    .status-warn { display: flex; align-items: center; gap: 4px; color: #f57c00; font-size: 13px; }
    .status-info { display: flex; align-items: center; gap: 4px; color: #9e9e9e; font-size: 13px; }
  `]
})
export class AccountsHintsComponent {
  @Input() glSettings: TenantGlSettings | null = null;

  get rows(): HintRow[] {
    const s = this.glSettings;
    return [
      {
        code: '1.1.1',
        name: 'Caixa e Equivalentes',
        purpose: 'Pagamentos em caixa (Contas a Pagar)',
        configured: s ? !!s.defaultCashAccountId : false
      },
      {
        code: '2.1.1',
        name: 'Fornecedores / Contas a Pagar',
        purpose: 'Lançamentos de Contas a Pagar',
        configured: s ? !!s.defaultAccountsPayableAccountId : false
      },
      {
        code: '5.1.4',
        name: 'Despesas com Fornecedores',
        purpose: 'Despesas de Contas a Pagar',
        configured: s ? !!s.defaultExpenseAccountId : false
      },
      {
        code: '2.1.3',
        name: 'Salários a Pagar',
        purpose: 'Folha de pagamento RH',
        configured: null
      },
      {
        code: '5.1.1',
        name: 'Despesas com Pessoal',
        purpose: 'Custos de pessoal RH',
        configured: null
      }
    ];
  }
}
