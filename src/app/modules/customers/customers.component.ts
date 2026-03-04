import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '@core/services';
import { Customer } from '@core/models';

@Component({
  selector: 'app-customers',
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
    <div class="customers-container">
      <mat-card class="header-card">
        <mat-card-header>
          <mat-card-title>Clientes</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <button mat-raised-button color="primary">
            <mat-icon>add</mat-icon>
            Novo Cliente
          </button>
        </mat-card-content>
      </mat-card>

      <mat-card class="data-card">
        <mat-card-content>
          <div *ngIf="isLoading" class="loading-spinner">
            <mat-spinner diameter="50"></mat-spinner>
          </div>
          <p *ngIf="!isLoading && customers.length === 0" class="no-data">Nenhum cliente cadastrado</p>
          <table mat-table [dataSource]="customers" *ngIf="!isLoading && customers.length > 0">
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Nome</th>
              <td mat-cell *matCellDef="let element">{{ element.name }}</td>
            </ng-container>

            <ng-container matColumnDef="document">
              <th mat-header-cell *matHeaderCellDef>Documento</th>
              <td mat-cell *matCellDef="let element">{{ element.document }}</td>
            </ng-container>

            <ng-container matColumnDef="email">
              <th mat-header-cell *matHeaderCellDef>Email</th>
              <td mat-cell *matCellDef="let element">{{ element.email }}</td>
            </ng-container>

            <ng-container matColumnDef="phone">
              <th mat-header-cell *matHeaderCellDef>Telefone</th>
              <td mat-cell *matCellDef="let element">{{ element.phone }}</td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .customers-container { padding: 20px; max-width: 1200px; margin: 0 auto; }
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
export class CustomersComponent implements OnInit {
  customers: Customer[] = [];
  isLoading = false;
  displayedColumns = ['name', 'document', 'email', 'phone'];

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadCustomers();
  }

  private loadCustomers(): void {
    this.isLoading = true;
    this.apiService.getCustomers().subscribe({
      next: (data) => {
        this.customers = data;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }
}
