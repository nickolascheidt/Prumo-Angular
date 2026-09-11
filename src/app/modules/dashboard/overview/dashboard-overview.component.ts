import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterModule } from '@angular/router';
import { Observable } from 'rxjs';
import { ApiService, AuthService, PermissionService } from '@core/services';
import { AccountsPayableEntry, PermissionLevel, User } from '@core/models';

interface Shortcut {
  label: string;
  icon: string;
  route: string;
  resource: string;
}

@Component({
  selector: 'app-dashboard-overview',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './dashboard-overview.component.html',
  styleUrls: ['./dashboard-overview.component.scss']
})
export class DashboardOverviewComponent implements OnInit {
  currentUser$: Observable<User | null>;

  upcoming: AccountsPayableEntry[] = [];
  isLoadingUpcoming = false;
  upcomingFailed = false;

  /** Quantos vencem na janela consultada. Alimenta o quarto stat card. */
  upcomingCount = 0;

  private readonly allShortcuts: Shortcut[] = [
    { label: 'Contas a pagar', icon: 'receipt_long', route: '/accounts-payable', resource: 'AccountsPayable.Entries' },
    { label: 'Plano de contas', icon: 'account_tree', route: '/finance/chart-of-accounts', resource: 'ChartOfAccounts.Management' },
    { label: 'Razão', icon: 'menu_book', route: '/finance/general-ledger', resource: 'GeneralLedger.Management' },
    { label: 'Funcionários', icon: 'badge', route: '/hr/employees', resource: 'HR.Employees' },
    { label: 'Apontamentos', icon: 'schedule', route: '/hr/worklogs', resource: 'HR.WorkLogs' },
    { label: 'Membros', icon: 'group', route: '/admin/members', resource: 'User.Management' },
  ];

  constructor(
    private authService: AuthService,
    private api: ApiService,
    private permissions: PermissionService
  ) {
    this.currentUser$ = this.authService.currentUser$;
  }

  ngOnInit(): void {
    if (this.canSeePayables) this.loadUpcoming();
  }

  /**
   * A visão geral é a tela inicial de todo mundo, inclusive de quem não alcança
   * Contas a Pagar. Sem esta trava, o painel de vencimentos dispararia uma
   * chamada que volta 403 para esses membros — erro no console e bloco vazio
   * numa tela que deveria ser tranquila.
   */
  get canSeePayables(): boolean {
    return this.permissions.userCanAccessResource('AccountsPayable.Entries', PermissionLevel.Read);
  }

  get shortcuts(): Shortcut[] {
    return this.allShortcuts
      .filter(s => this.permissions.userCanAccessResource(s.resource, PermissionLevel.Read))
      .slice(0, 3);
  }

  private loadUpcoming(): void {
    const tenantId = this.authService.getCurrentTenantId();
    if (!tenantId) return;

    this.isLoadingUpcoming = true;
    const today = new Date();
    const horizon = new Date(today.getTime());
    horizon.setDate(horizon.getDate() + 30);

    this.api.listAccountsPayableEntries(tenantId, {
      from: this.asDate(today),
      to: this.asDate(horizon),
      status: 'Pending',
      sortBy: 'dueDate',
      sortDir: 'asc',
      page: 1,
      pageSize: 5
    }).subscribe({
      next: res => {
        this.upcoming = res.items ?? [];
        // O total da página é 5; quem manda no contador é o total do servidor.
        this.upcomingCount = res.total ?? this.upcoming.length;
        this.isLoadingUpcoming = false;
      },
      error: () => {
        // Um painel de apoio que falha não pode derrubar a tela inteira: some
        // com o bloco e deixa o resto da visão geral de pé.
        this.upcomingFailed = true;
        this.isLoadingUpcoming = false;
      }
    });
  }

  private asDate(d: Date): string {
    return d.toISOString().split('T')[0];
  }

  statusOf(entry: AccountsPayableEntry): 'overdue' | 'paid' | 'cancelled' | 'pending' {
    if (entry.status === 'Paid') return 'paid';
    if (entry.status === 'Cancelled') return 'cancelled';
    return entry.isOverdue ? 'overdue' : 'pending';
  }

  statusLabel(entry: AccountsPayableEntry): string {
    return { overdue: 'Atrasado', paid: 'Pago', cancelled: 'Cancelado', pending: 'Pendente' }[this.statusOf(entry)];
  }
}
