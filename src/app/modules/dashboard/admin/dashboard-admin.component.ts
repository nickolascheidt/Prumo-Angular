import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-dashboard-admin',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './dashboard-admin.component.html'
})
export class DashboardAdminComponent {}
