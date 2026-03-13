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
  roles?: string[];
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
      title: 'Menu Principal',
      items: [
        { label: 'Dashboard', icon: 'dashboard', route: '/dashboard' },
        { label: 'Funcionarios', icon: 'people', route: '/employees' },
        { label: 'Horas Trabalhadas', icon: 'schedule', route: '/worklogs' },
        { label: 'Pagamentos', icon: 'payment', route: '/payments' }
      ]
    },
    {
      title: 'Produtos e Servicos',
      items: [
        { label: 'Produtos', icon: 'inventory_2', route: '/products' },
        { label: 'Clientes', icon: 'business', route: '/customers' }
      ]
    },
    {
      title: 'Administracao',
      items: [
        {
          label: 'Painel Admin',
          icon: 'admin_panel_settings',
          route: '/admin',
          roles: ['Administrador']
        },
        {
          label: 'Permissoes por Role',
          icon: 'security',
          route: '/admin/permissions',
          roles: ['Administrador']
        },
        {
          label: 'Roles por Usuario',
          icon: 'manage_accounts',
          route: '/admin/users-roles',
          roles: ['Administrador']
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
    // Detecta se está em dispositivo móvel
    this.breakpointObserver
      .observe([Breakpoints.HandsetPortrait])
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        this.isMobile = result.matches;
        // Se retornar a desktop e o sidenav estava fechado, abre
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

  toggleSidenav(): void {
    if (this.sidenav) {
      this.sidenav.toggle();
    }
  }

  /**
   * Fecha o sidenav quando um item do menu é clicado (útil em mobile)
   * Em desktop, o sidenav permanece aberto
   */
  onNavItemClick(): void {
    if (this.isMobile && this.sidenav) {
      this.sidenav.close();
    }
  }

  hasAccess(requiredRoles: string[] | undefined, user: User | null): boolean {
    if (!requiredRoles?.length) {
      return true;
    }

    const userRoles = user?.roles ?? [];
    return requiredRoles.some(role => userRoles.includes(role));
  }

  hasVisibleItems(section: NavigationSection, user: User | null): boolean {
    return section.items.some(item => this.hasAccess(item.roles, user));
  }
}
