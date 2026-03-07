import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { RouterModule } from '@angular/router';
import { ApiService } from '@core/services';
import { Employee, Payment, WorkLog } from '@core/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatTableModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  isLoading = false;
  employees: Employee[] = [];
  recentPayments: Payment[] = [];
  totalEmployees = 0;
  totalPaymentsThisMonth = 0;
  totalHoursThisMonth = 0;
  displayedColumns = ['employeeName', 'amount', 'paymentDate'];

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  private loadDashboardData(): void {
    this.isLoading = true;
    
    this.apiService.getEmployees().subscribe({
      next: (data) => {
        this.employees = data;
        this.totalEmployees = data.length;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });

    this.apiService.getRecentPayments(5).subscribe({
      next: (data) => {
        this.recentPayments = data;
        this.totalPaymentsThisMonth = data.reduce((sum, p) => sum + p.amount, 0);
      },
      error: () => {}
    });

        this.apiService.getEmployees().subscribe({
      next: (data) => {
        this.employees = data;
        this.totalEmployees = data.length;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });

        this.apiService.getMonthlyHours().subscribe({
      next: (data) => {
        this.totalHoursThisMonth = data.reduce((sum, w) => sum + w.hoursWorked, 0);
      },
      error: () => {
        this.isLoading = false;
      }
    });

  }
}
