import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { Observable } from 'rxjs';
import { AuthService } from '@core/services';
import { User } from '@core/models';

interface DashTab {
  label: string;
  route: string;
  roles?: string[];
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, MatTabsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {
  currentUser$: Observable<User | null>;

  readonly tabs: DashTab[] = [
    { label: 'Visão Geral', route: 'overview' },
    { label: 'Contabilidade', route: 'contabilidade', roles: ['Administrador', 'Funcionario'] },
    { label: 'Financeiro', route: 'financeiro' },
    { label: 'Administração', route: 'admin', roles: ['Administrador'] }
  ];

  constructor(private authService: AuthService) {
    this.currentUser$ = this.authService.currentUser$;
  }

  hasAccess(tab: DashTab, user: User | null): boolean {
    if (!tab.roles?.length) return true;
    const userRoles = user?.roles ?? [];
    return tab.roles.some(r => userRoles.includes(r));
  }
}
