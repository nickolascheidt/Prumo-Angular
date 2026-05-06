import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ApiService, AuthService } from '@core/services';
import { Employee, WorkLog } from '@core/models';
import { WorklogFormDialogComponent } from './worklog-form-dialog.component';

@Component({
  selector: 'app-worklogs',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatTableModule, MatCardModule, MatButtonModule,
    MatIconModule, MatProgressSpinnerModule, MatDialogModule,
    MatSelectModule, MatFormFieldModule
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1>Horas Trabalhadas</h1>
          <p class="subtitle">Registros de horas por funcionário</p>
        </div>
        <button mat-raised-button color="primary" (click)="onNew()">
          <mat-icon>add</mat-icon> Registrar Horas
        </button>
      </div>

      <mat-card class="filter-card">
        <mat-card-content>
          <mat-form-field appearance="outline">
            <mat-label>Funcionário</mat-label>
            <mat-select [(ngModel)]="selectedEmployeeId" (ngModelChange)="onFilterChange()">
              <mat-option value="">Todos</mat-option>
              <mat-option *ngFor="let e of employees" [value]="e.id">{{ e.fullName }}</mat-option>
            </mat-select>
          </mat-form-field>
        </mat-card-content>
      </mat-card>

      <mat-card>
        <mat-card-content>
          <div *ngIf="isLoading" class="spinner-wrap"><mat-spinner diameter="48"></mat-spinner></div>
          <p *ngIf="!isLoading && workLogs.length === 0" class="no-data">Nenhum registro encontrado</p>
          <table mat-table [dataSource]="workLogs" *ngIf="!isLoading && workLogs.length > 0" class="full-table">
            <ng-container matColumnDef="employeeName">
              <th mat-header-cell *matHeaderCellDef>Funcionário</th>
              <td mat-cell *matCellDef="let w">{{ w.employeeName }}</td>
            </ng-container>
            <ng-container matColumnDef="workDate">
              <th mat-header-cell *matHeaderCellDef>Data</th>
              <td mat-cell *matCellDef="let w">{{ w.workDate | date:'dd/MM/yyyy' }}</td>
            </ng-container>
            <ng-container matColumnDef="hoursWorked">
              <th mat-header-cell *matHeaderCellDef>Horas</th>
              <td mat-cell *matCellDef="let w">{{ w.hoursWorked | number:'1.1-2' }}h</td>
            </ng-container>
            <ng-container matColumnDef="totalAmount">
              <th mat-header-cell *matHeaderCellDef>Valor</th>
              <td mat-cell *matCellDef="let w">R$ {{ w.totalAmount | number:'1.2-2' }}</td>
            </ng-container>
            <ng-container matColumnDef="period">
              <th mat-header-cell *matHeaderCellDef>Período</th>
              <td mat-cell *matCellDef="let w">
                <span [class.assigned]="w.paymentPeriodId">
                  {{ w.paymentPeriodId ? 'Atribuído' : 'Livre' }}
                </span>
              </td>
            </ng-container>
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let w">
                <button mat-icon-button color="primary" (click)="onEdit(w)" title="Editar"
                  [disabled]="!!w.paymentPeriodId">
                  <mat-icon>edit</mat-icon>
                </button>
                <button mat-icon-button color="warn" (click)="onDelete(w)" title="Excluir"
                  [disabled]="!!w.paymentPeriodId">
                  <mat-icon>delete</mat-icon>
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
    .filter-card { margin-bottom: 16px; }
    .filter-card mat-card-content { display: flex; gap: 16px; padding: 16px; }
    .full-table { width: 100%; }
    .spinner-wrap { display: flex; justify-content: center; padding: 48px; }
    .no-data { text-align: center; color: var(--color-text-muted); padding: 48px; }
    .assigned { color: #2e7d32; font-weight: 500; font-size: 12px; }
  `]
})
export class WorklogsComponent implements OnInit {
  employees: Employee[] = [];
  workLogs: WorkLog[] = [];
  isLoading = false;
  selectedEmployeeId = '';
  columns = ['employeeName', 'workDate', 'hoursWorked', 'totalAmount', 'period', 'actions'];

  private tenantId: string | null = null;

  constructor(private api: ApiService, private auth: AuthService, private dialog: MatDialog) {}

  ngOnInit(): void {
    this.tenantId = this.auth.getCurrentTenantId();
    if (!this.tenantId) return;
    this.api.getEmployees(this.tenantId).subscribe({ next: (data) => { this.employees = data; this.load(); } });
  }

  private load(): void {
    if (!this.tenantId) return;
    if (this.selectedEmployeeId) {
      this.isLoading = true;
      this.api.getWorkLogs(this.tenantId, this.selectedEmployeeId).subscribe({
        next: (data) => { this.workLogs = data; this.isLoading = false; },
        error: () => { this.isLoading = false; }
      });
    } else {
      this.loadAllEmployees();
    }
  }

  private loadAllEmployees(): void {
    if (!this.tenantId || this.employees.length === 0) { this.workLogs = []; return; }
    this.isLoading = true;
    const tenantId = this.tenantId;
    let completed = 0;
    const all: WorkLog[] = [];
    this.employees.forEach(emp => {
      this.api.getWorkLogs(tenantId, emp.id).subscribe({
        next: (data) => {
          all.push(...data);
          if (++completed === this.employees.length) {
            this.workLogs = all.sort((a, b) => new Date(b.workDate).getTime() - new Date(a.workDate).getTime());
            this.isLoading = false;
          }
        },
        error: () => { if (++completed === this.employees.length) { this.workLogs = all; this.isLoading = false; } }
      });
    });
  }

  onFilterChange(): void { this.load(); }

  onNew(): void {
    this.dialog.open(WorklogFormDialogComponent, { width: '560px', data: null })
      .afterClosed().subscribe(result => { if (result) this.load(); });
  }

  onEdit(w: WorkLog): void {
    this.dialog.open(WorklogFormDialogComponent, { width: '560px', data: w })
      .afterClosed().subscribe(result => { if (result) this.load(); });
  }

  onDelete(w: WorkLog): void {
    if (!this.tenantId || !confirm('Excluir este registro de horas?')) return;
    this.api.deleteWorkLog(this.tenantId, w.employeeId, w.id).subscribe({
      next: () => this.load(),
      error: (err) => alert(err.error?.message ?? 'Erro ao excluir registro.')
    });
  }
}
