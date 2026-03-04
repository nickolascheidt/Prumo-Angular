import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '@core/services';
import { WorkLog } from '@core/models';

@Component({
  selector: 'app-worklogs',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="worklogs-container">
      <mat-card class="header-card">
        <mat-card-header>
          <mat-card-title>Horas Trabalhadas</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <button mat-raised-button color="primary">
            <mat-icon>add</mat-icon>
            Registrar Horas
          </button>
        </mat-card-content>
      </mat-card>

      <mat-card class="data-card">
        <mat-card-content>
          <div *ngIf="isLoading" class="loading-spinner">
            <mat-spinner diameter="50"></mat-spinner>
          </div>
          <p *ngIf="!isLoading && workLogs.length === 0" class="no-data">Nenhum registro de horas</p>
          <table mat-table [dataSource]="workLogs" *ngIf="!isLoading && workLogs.length > 0">
            <ng-container matColumnDef="employeeName">
              <th mat-header-cell *matHeaderCellDef>Funcionário</th>
              <td mat-cell *matCellDef="let element">{{ element.employeeName }}</td>
            </ng-container>

            <ng-container matColumnDef="workDate">
              <th mat-header-cell *matHeaderCellDef>Data</th>
              <td mat-cell *matCellDef="let element">{{ element.workDate | date: 'dd/MM/yyyy' }}</td>
            </ng-container>

            <ng-container matColumnDef="hoursWorked">
              <th mat-header-cell *matHeaderCellDef>Horas</th>
              <td mat-cell *matCellDef="let element">{{ element.hoursWorked }}h</td>
            </ng-container>

            <ng-container matColumnDef="totalAmount">
              <th mat-header-cell *matHeaderCellDef>Valor</th>
              <td mat-cell *matCellDef="let element">R$ {{ element.totalAmount | number: '1.2-2' }}</td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .worklogs-container { padding: 20px; max-width: 1200px; margin: 0 auto; }
    .header-card { margin-bottom: 20px; }
    mat-card-header { padding: 16px; border-bottom: 1px solid #eee; }
    table { width: 100%; }
    th { background-color: #f5f5f5; font-weight: 600; color: #666; }
    td { padding: 12px 16px; }
    tr:hover { background-color: #fafafa; }
    .no-data { text-align: center; color: #999; padding: 40px; margin: 0; }
    .loading-spinner { display: flex; justify-content: center; padding: 40px; }
  `]
})
export class WorklogsComponent implements OnInit {
  workLogs: WorkLog[] = [];
  isLoading = false;
  displayedColumns = ['employeeName', 'workDate', 'hoursWorked', 'totalAmount'];

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    // TODO: Load work logs
  }
}
