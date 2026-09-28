import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { ApiService, AuthService } from '@core/services';
import { Employee } from '@core/models';
import { EmployeeFormDialogComponent } from './employee-form-dialog.component';

@Component({
  selector: 'app-employees',
  standalone: true,
  imports: [
    CommonModule, MatTableModule, MatCardModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatDialogModule, MatChipsModule
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1>Employees</h1>
          <p class="subtitle">Employees and contracts</p>
        </div>
        <button mat-raised-button color="primary" (click)="onNew()">
          <mat-icon>add</mat-icon> New employee
        </button>
      </div>

      <mat-card>
        <mat-card-content>
          <div *ngIf="isLoading" class="spinner-wrap">
            <mat-spinner diameter="48"></mat-spinner>
          </div>
          <p *ngIf="!isLoading && employees.length === 0" class="no-data">No employees registered</p>
          <table mat-table [dataSource]="employees" *ngIf="!isLoading && employees.length > 0" class="full-table">
            <ng-container matColumnDef="fullName">
              <th mat-header-cell *matHeaderCellDef>Name</th>
              <td mat-cell *matCellDef="let e">{{ e.fullName }}</td>
            </ng-container>
            <ng-container matColumnDef="cpf">
              <th mat-header-cell *matHeaderCellDef>CPF</th>
              <td mat-cell *matCellDef="let e">{{ e.cpf }}</td>
            </ng-container>
            <ng-container matColumnDef="contractType">
              <th mat-header-cell *matHeaderCellDef>Contract</th>
              <td mat-cell *matCellDef="let e">{{ e.contractTypeName }}</td>
            </ng-container>
            <ng-container matColumnDef="hourlyRate">
              <th mat-header-cell *matHeaderCellDef>Rate/h</th>
              <td mat-cell *matCellDef="let e">R$ {{ e.hourlyRate | number:'1.2-2' }}</td>
            </ng-container>
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let e">
                <mat-chip [color]="e.isActive ? 'primary' : 'warn'" highlighted>
                  {{ e.isActive ? 'Active' : 'Inactive' }}
                </mat-chip>
              </td>
            </ng-container>
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let e">
                <button mat-icon-button color="primary" (click)="onEdit(e)" title="Edit">
                  <mat-icon>edit</mat-icon>
                </button>
                <button mat-icon-button color="warn" (click)="onDeactivate(e)" title="Deactivate"
                  [disabled]="!e.isActive">
                  <mat-icon>person_off</mat-icon>
                </button>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="columns"></tr>
            <tr mat-row *matRowDef="let row; columns: columns;"></tr>
          </table>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .page-container { padding: 24px; max-width: 1200px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
    h1 { margin: 0; font-size: 24px; font-weight: 600; color: var(--color-text); }
    .subtitle { margin: 4px 0 0; color: var(--color-text-muted); font-size: 14px; }
    .full-table { width: 100%; }
    .spinner-wrap { display: flex; justify-content: center; padding: 48px; }
    .no-data { text-align: center; color: var(--color-text-muted); padding: 48px; }
  `]
})
export class EmployeesComponent implements OnInit {
  employees: Employee[] = [];
  isLoading = false;
  columns = ['fullName', 'cpf', 'contractType', 'hourlyRate', 'status', 'actions'];

  private tenantId: string | null = null;

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.tenantId = this.auth.getCurrentTenantId();
    if (!this.tenantId) return;
    this.load();
  }

  private load(): void {
    if (!this.tenantId) return;
    this.isLoading = true;
    this.api.getEmployees(this.tenantId, true).subscribe({
      next: (data) => { this.employees = data; this.isLoading = false; },
      error: () => { this.isLoading = false; }
    });
  }

  onNew(): void {
    this.dialog.open(EmployeeFormDialogComponent, { width: '600px', data: null })
      .afterClosed().subscribe(result => { if (result) this.load(); });
  }

  onEdit(employee: Employee): void {
    this.dialog.open(EmployeeFormDialogComponent, { width: '600px', data: employee })
      .afterClosed().subscribe(result => { if (result) this.load(); });
  }

  onDeactivate(employee: Employee): void {
    if (!this.tenantId || !confirm(`Deactivate ${employee.fullName}?`)) return;
    this.api.deactivateEmployee(this.tenantId, employee.id).subscribe({
      next: () => this.load(),
      error: () => alert('Failed to deactivate the employee.')
    });
  }
}
