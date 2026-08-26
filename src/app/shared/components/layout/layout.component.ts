import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSidenavModule, MatSidenav } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { RouterModule } from '@angular/router';
import { AuthService } from '@core/services';
import { Router } from '@angular/router';
import { Observable, Subject } from 'rxjs';
import { User } from '@core/models';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { takeUntil } from 'rxjs/operators';

interface NavigationItem {
  label: string;
  icon: string;
  route: string;
  // Items with a resourceCode are gated by per-tenant resource access; items
  // without one are visible to any authenticated member (e.g. Dashboard, Tenant).
  resourceCode?: string;
}

interface NavigationSection {
  title: string;
  items: NavigationItem[];
}

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatBadgeModule
  ],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss']
})
export class LayoutComponent implements OnInit, OnDestroy {
  @ViewChild('sidenav') sidenav!: MatSidenav;
  
  currentUser$: Observable<User | null>;
  sidenavOpened = false;
  isMobile = false;
  readonly menuSections: NavigationSection[] = [
    {
      title: 'Principal',
      items: [
        { label: 'Dashboard', icon: 'dashboard', route: '/dashboard' }
      ]
    },
    {
      title: 'Contas a Pagar',
      items: [
        {
          label: 'Lançamentos',
          icon: 'request_quote',
          route: '/accounts-payable',
          resourceCode: 'AccountsPayable.Entries'
        }
      ]
    },
    {
      title: 'Financeiro',
      items: [
        {
          label: 'Plano de Contas',
          icon: 'account_tree',
          route: '/finance/chart-of-accounts',
          resourceCode: 'ChartOfAccounts.Management'
        },
        {
          label: 'Razão Geral',
          icon: 'menu_book',
          route: '/finance/general-ledger',
          resourceCode: 'GeneralLedger.Management'
        }
      ]
    },
    {
      title: 'RH',
      items: [
        { label: 'Funcionários', icon: 'badge', route: '/hr/employees', resourceCode: 'HR.Employees' },
        { label: 'Horas', icon: 'schedule', route: '/hr/worklogs', resourceCode: 'HR.WorkLogs' },
        { label: 'Pagamentos', icon: 'payments', route: '/hr/payments', resourceCode: 'HR.Payments' },
        { label: 'Períodos', icon: 'event_note', route: '/hr/periodos', resourceCode: 'HR.PaymentPeriods' }
      ]
    },
    {
      title: 'Administração',
      items: [
        {
          label: 'Roles',
          icon: 'admin_panel_settings',
          route: '/admin/roles',
          resourceCode: 'Role.Management'
        },
        {
          label: 'Membros',
          icon: 'group',
          route: '/admin/members',
          resourceCode: 'User.Management'
        }
      ]
    }
  ];
  
  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private router: Router,
    private breakpointObserver: BreakpointObserver
  ) {
    this.currentUser$ = this.authService.currentUser$;
  }

  ngOnInit(): void {
    this.breakpointObserver
      .observe([Breakpoints.HandsetPortrait])
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        this.isMobile = result.matches;
        if (!this.isMobile && !this.sidenavOpened) {
          this.sidenavOpened = true;
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }

  switchTenant(): void {
    this.authService.clearTenantSelection();
    this.router.navigate(['/auth/select-tenant']);
  }

  toggleSidenav(): void {
    if (this.sidenav) {
      this.sidenav.toggle();
    }
  }

  onNavItemClick(): void {
    if (this.isMobile && this.sidenav) {
      this.sidenav.close();
    }
  }

  hasAccess(item: NavigationItem): boolean {
    if (item.resourceCode) {
      return this.authService.canAccessResource(item.resourceCode);
    }
    return true;
  }

  hasVisibleItems(section: NavigationSection): boolean {
    return section.items.some(item => this.hasAccess(item));
  }
}
