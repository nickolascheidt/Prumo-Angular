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
    { label: 'Overview', route: 'overview' },
    // Each tab has its own resource, not the matching module's: that way the HR
    // dashboard can be granted without granting the employees screen, and vice versa.
    // It has to match the route guard in app.routes.ts — if they diverge, the tab
    // shows and the route blocks.
    { label: 'Accounting', route: 'accounting', resourceCode: 'Dashboard.Accounting' },
    { label: 'Finance', route: 'finance', resourceCode: 'Dashboard.Finance' },
    { label: 'HR', route: 'hr', resourceCode: 'Dashboard.HR' },
    { label: 'Administration', route: 'admin', resourceCode: 'Dashboard.Admin' }
  ];

  constructor(private authService: AuthService) {
    this.currentUser$ = this.authService.currentUser$;
  }

  hasAccess(tab: DashTab): boolean {
    if (!tab.resourceCode) return true;
    return this.authService.canAccessResource(tab.resourceCode);
  }
}
