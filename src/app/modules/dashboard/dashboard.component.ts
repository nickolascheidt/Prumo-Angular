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
    { label: 'Contabilidade', route: 'accounting', resourceCode: 'GeneralLedger.Management' },
    { label: 'Financeiro', route: 'finance', resourceCode: 'AccountsPayable.Entries' },
    { label: 'RH', route: 'hr', resourceCode: 'HR.Employees' },
    { label: 'Administração', route: 'admin', resourceCode: 'User.Management' }
  ];

  constructor(private authService: AuthService) {
    this.currentUser$ = this.authService.currentUser$;
  }

  hasAccess(tab: DashTab): boolean {
    if (!tab.resourceCode) return true;
    return this.authService.canAccessResource(tab.resourceCode);
  }
}
