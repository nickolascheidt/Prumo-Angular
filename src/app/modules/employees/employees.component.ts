import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ApiService } from '@core/services';
import { Employee } from '@core/models';
import { Router } from '@angular/router';
import { EmployeeFormDialogComponent } from './employee-form-dialog.component';

@Component({
  selector: 'app-employees',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatDialogModule
  ],
  template: `
    <div class="employees-container">
      <mat-card class="header-card">
        <mat-card-header>
          <mat-card-title>Gestão de Funcionários</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <button mat-raised-button color="primary" (click)="onNewEmployee()">
            <mat-icon>add</mat-icon>
            Novo Funcionário
          </button>
        </mat-card-content>
      </mat-card>

      <mat-card class="data-card">
        <mat-card-content>
          <div *ngIf="isLoading" class="loading-spinner">
            <mat-spinner diameter="50"></mat-spinner>
          </div>
          <table mat-table [dataSource]="employees" *ngIf="!isLoading">
            <ng-container matColumnDef="fullName">
              <th mat-header-cell *matHeaderCellDef>Nome</th>
              <td mat-cell *matCellDef="let element">{{ element.fullName }}</td>
            </ng-container>

            <ng-container matColumnDef="cpf">
              <th mat-header-cell *matHeaderCellDef>CPF</th>
              <td mat-cell *matCellDef="let element">{{ element.cpf }}</td>
            </ng-container>

            <ng-container matColumnDef="phone">
              <th mat-header-cell *matHeaderCellDef>Telefone</th>
              <td mat-cell *matCellDef="let element">{{ element.phone }}</td>
            </ng-container>

            <ng-container matColumnDef="hourlyRate">
              <th mat-header-cell *matHeaderCellDef>Taxa Horária</th>
              <td mat-cell *matCellDef="let element">R$ {{ element.hourlyRate | number: '1.2-2' }}</td>
            </ng-container>

            <ng-container matColumnDef="isActive">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let element">
                <span [class.active]="element.isActive">
                  {{ element.isActive ? 'Ativo' : 'Inativo' }}
                </span>
              </td>
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
          <p *ngIf="!isLoading && employees.length === 0" class="no-data">Nenhum funcionário cadastrado</p>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .employees-container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .header-card {
      margin-bottom: 20px;

      mat-card-header {
        padding: 16px;
        border-bottom: 1px solid #eee;
      }

      mat-card-content {
        padding: 16px;
      }
    }

    table {
      width: 100%;

      th {
        background-color: #f5f5f5;
        font-weight: 600;
        color: #666;
      }

      td {
        padding: 12px 16px;
      }

      tr:hover {
        background-color: #fafafa;
      }
    }

    .active {
      color: #43e97b;
      font-weight: 500;
    }

    .no-data {
      text-align: center;
      color: #999;
      padding: 40px;
      margin: 0;
    }

    .loading-spinner {
      display: flex;
      justify-content: center;
      padding: 40px;
    }
  `]
})
export class EmployeesComponent implements OnInit {
  employees: Employee[] = [];
  isLoading = false;
  displayedColumns = ['fullName', 'cpf', 'phone', 'hourlyRate', 'isActive', 'actions'];

  constructor(
    private apiService: ApiService,
    private router: Router,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadEmployees();
  }

  private loadEmployees(): void {
    this.isLoading = true;
    this.apiService.getEmployees().subscribe({
      next: (data) => {
        this.employees = data;
        this.isLoading = false;
        console.log('Funcionários carregados:', data);
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Erro ao carregar funcionários:', error);
      }
    });
  }

  onNewEmployee(): void {
    const dialogRef = this.dialog.open(EmployeeFormDialogComponent, {
      width: '500px',
      data: null
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        this.loadEmployees();
      }
    });
  }

  onEdit(employee: Employee): void {
    const dialogRef = this.dialog.open(EmployeeFormDialogComponent, {
      width: '500px',
      data: employee
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        this.loadEmployees();
      }
    });
  }

  onDelete(id: string): void {
    if (confirm('Tem certeza que deseja deletar este funcionário?')) {
      this.apiService.deleteEmployee(id).subscribe({
        next: () => {
          this.loadEmployees();
        },
        error: () => {}
      });
    }
  }
}
