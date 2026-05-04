import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-dashboard-finance',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './dashboard-finance.component.html'
})
export class DashboardFinanceComponent {}
