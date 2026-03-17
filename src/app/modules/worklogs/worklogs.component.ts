import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ApiService } from '@core/services';
import { WorkLog } from '@core/models';
import { WorklogFormDialogComponent } from './worklog-form-dialog.component';

@Component({
  selector: 'app-worklogs',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDialogModule
  ],
  template: `
    <div class="worklogs-container">
      <mat-card class="header-card">
        <mat-card-header>
          <mat-card-title>Horas Trabalhadas</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <button mat-raised-button color="primary" (click)="onNewWorklog()">
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

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Ações</th>
              <td mat-cell *matCellDef="let element">
                <button mat-icon-button color="primary" (click)="onEdit(element)">
                  <mat-icon>edit</mat-icon>
                </button>
                <button mat-icon-button color="warn" (click)="onDelete(element.id)">
                  <mat-icon>delete</mat-icon>
                </button>
              </td>
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
  displayedColumns = ['employeeName', 'workDate', 'hoursWorked', 'totalAmount', 'actions'];

  constructor(
    private apiService: ApiService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadWorkLogs();
  }

  private loadWorkLogs(): void {
    this.isLoading = true;
    this.workLogs = [];
    
    // Carrega worklogs dos últimos 30 dias
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    console.log('📅 Carregando worklogs de:', startDate.toLocaleDateString(), 'até', endDate.toLocaleDateString());

    // Carrega todos os funcionários ativos e seus worklogs
    this.apiService.getEmployees(false).subscribe({
      next: (employees) => {
        console.log('👥 Total de funcionários carregados:', employees.length);
        
        if (employees.length === 0) {
          console.warn('⚠️ Nenhum funcionário encontrado');
          this.isLoading = false;
          return;
        }

        let completedRequests = 0;
        const allWorkLogs: WorkLog[] = [];

        // Carrega worklogs de cada funcionário
        employees.forEach(employee => {
          this.apiService.getWorkLogsByEmployee(
            employee.id,
            startDate.toISOString(),
            endDate.toISOString()
          ).subscribe({
            next: (data) => {
              console.log(`📊 ${employee.fullName}: ${data.length} registro(s) de horas`);
              if (data.length > 0) {
                data.forEach((log, index) => {
                  console.log(`  [${index + 1}] Data: ${log.date}, Horas: ${log.hoursWorked}h, ID: ${log.id}`);
                });
              }
              allWorkLogs.push(...data);
              completedRequests++;
              
              // Quando todas as requisições terminarem
              if (completedRequests === employees.length) {
                console.log('✅ Total de registros agregados:', allWorkLogs.length);
                // Ordena por data (mais recente primeiro)
                this.workLogs = allWorkLogs.sort((a, b) => 
                  new Date(b.date).getTime() - new Date(a.date).getTime()
                );
                console.log('📋 Worklogs finais exibidos:', this.workLogs.length);
                this.isLoading = false;
              }
            },
            error: (error) => {
              console.error(`❌ Erro ao carregar worklogs do funcionário ${employee.fullName}:`, error);
              completedRequests++;
              
              if (completedRequests === employees.length) {
                console.log('⚠️ Total de registros aggregados (com erros):', allWorkLogs.length);
                this.workLogs = allWorkLogs.sort((a, b) => 
                  new Date(b.date).getTime() - new Date(a.date).getTime()
                );
                console.log('📋 Worklogs finais exibidos:', this.workLogs.length);
                this.isLoading = false;
              }
            }
          });
        });
      },
      error: (error) => {
        console.error('❌ Erro ao carregar funcionários:', error);
        this.isLoading = false;
      }
    });
  }

  onNewWorklog(): void {
    const dialogRef = this.dialog.open(WorklogFormDialogComponent, {
      width: '600px',
      data: null
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        this.loadWorkLogs();
      }
    });
  }

  onEdit(worklog: WorkLog): void {
    const dialogRef = this.dialog.open(WorklogFormDialogComponent, {
      width: '600px',
      data: worklog
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        this.loadWorkLogs();
      }
    });
  }

  onDelete(id: string): void {
    if (confirm('Tem certeza que deseja deletar este registro?')) {
      this.apiService.deleteWorkLog(id).subscribe({
        next: () => {
          this.loadWorkLogs();
        },
        error: (error) => {
          console.error('Erro ao deletar registro:', error);
          alert('Erro ao deletar registro');
        }
      });
    }
  }
}
