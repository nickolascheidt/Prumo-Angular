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

  /** How many fall due in the queried window. Feeds the fourth stat card. */
  upcomingCount = 0;

  private readonly allShortcuts: Shortcut[] = [
    { label: 'Accounts payable', icon: 'receipt_long', route: '/accounts-payable', resource: 'AccountsPayable.Entries' },
    { label: 'Chart of accounts', icon: 'account_tree', route: '/finance/chart-of-accounts', resource: 'ChartOfAccounts.Management' },
    { label: 'Ledger', icon: 'menu_book', route: '/finance/general-ledger', resource: 'GeneralLedger.Management' },
    { label: 'Employees', icon: 'badge', route: '/hr/employees', resource: 'HR.Employees' },
    { label: 'Work logs', icon: 'schedule', route: '/hr/worklogs', resource: 'HR.WorkLogs' },
    { label: 'Members', icon: 'group', route: '/admin/members', resource: 'User.Management' },
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
   * The overview is everyone's home screen, including those who cannot reach
   * Accounts Payable. Without this check, the due-dates panel would fire a call that
   * returns 403 for those members — an error in the console and an empty block on a
   * screen that should be calm.
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
        // The page total is 5; the server total is what drives the counter.
        this.upcomingCount = res.total ?? this.upcoming.length;
        this.isLoadingUpcoming = false;
      },
      error: () => {
        // A side panel that fails must not bring the whole screen down: the block goes
        // away and the rest of the overview stays up.
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
    return { overdue: 'Overdue', paid: 'Paid', cancelled: 'Cancelled', pending: 'Pending' }[this.statusOf(entry)];
  }
}
