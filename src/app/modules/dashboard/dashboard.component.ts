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
  resourceCode?: string;
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
    // Cada aba tem recurso próprio, e não o do módulo correspondente: assim dá para
    // conceder o painel de RH sem conceder a tela de funcionários, e vice-versa.
    // Precisa casar com o guard da rota em app.routes.ts — se divergirem, a aba
    // aparece e a rota barra.
    { label: 'Contabilidade', route: 'accounting', resourceCode: 'Dashboard.Accounting' },
    { label: 'Financeiro', route: 'finance', resourceCode: 'Dashboard.Finance' },
    { label: 'RH', route: 'hr', resourceCode: 'Dashboard.HR' },
    { label: 'Administração', route: 'admin', resourceCode: 'Dashboard.Admin' }
  ];

  constructor(private authService: AuthService) {
    this.currentUser$ = this.authService.currentUser$;
  }

  hasAccess(tab: DashTab): boolean {
    if (!tab.resourceCode) return true;
    return this.authService.canAccessResource(tab.resourceCode);
  }
}
