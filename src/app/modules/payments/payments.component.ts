import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '@core/services';
import { Payment } from '@core/models';

@Component({
  selector: 'app-payments',
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
    <div class="payments-container">
      <mat-card class="header-card">
        <mat-card-header>
          <mat-card-title>Pagamentos</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <button mat-raised-button color="primary">
            <mat-icon>add</mat-icon>
            Novo Pagamento
          </button>
        </mat-card-content>
      </mat-card>

      <mat-card class="data-card">
        <mat-card-content>
          <div *ngIf="isLoading" class="loading-spinner">
            <mat-spinner diameter="50"></mat-spinner>
          </div>
          <p *ngIf="!isLoading && payments.length === 0" class="no-data">Nenhum pagamento registrado</p>
          <table mat-table [dataSource]="payments" *ngIf="!isLoading && payments.length > 0">
            <ng-container matColumnDef="employeeName">
              <th mat-header-cell *matHeaderCellDef>Funcionário</th>
              <td mat-cell *matCellDef="let element">{{ element.employeeName }}</td>
            </ng-container>

            <ng-container matColumnDef="amount">
              <th mat-header-cell *matHeaderCellDef>Valor</th>
              <td mat-cell *matCellDef="let element">R$ {{ element.amount | number: '1.2-2' }}</td>
            </ng-container>

            <ng-container matColumnDef="paymentDate">
              <th mat-header-cell *matHeaderCellDef>Data de Pagamento</th>
              <td mat-cell *matCellDef="let element">{{ element.paymentDate | date: 'dd/MM/yyyy' }}</td>
            </ng-container>

            <ng-container matColumnDef="paymentMethod">
              <th mat-header-cell *matHeaderCellDef>Método</th>
              <td mat-cell *matCellDef="let element">{{ element.paymentMethod }}</td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .payments-container { padding: 20px; max-width: 1200px; margin: 0 auto; }
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
export class PaymentsComponent implements OnInit {
  payments: Payment[] = [];
  isLoading = false;
  displayedColumns = ['employeeName', 'amount', 'paymentDate', 'paymentMethod'];

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    // TODO: Load payments
  }
}
