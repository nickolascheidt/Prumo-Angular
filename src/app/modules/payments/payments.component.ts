import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ApiService } from '@core/services';
import { Payment, RecentPayment } from '@core/models';
import { PaymentFormDialogComponent } from './payment-form-dialog.component';
import { GeneratePaymentPeriodDialogComponent } from './generate-payment-period-dialog.component';

@Component({
  selector: 'app-payments',
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
    <div class="payments-container">
      <mat-card class="header-card">
        <mat-card-header>
          <mat-card-title>Pagamentos</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="button-group">
            <button mat-raised-button color="accent" (click)="onGeneratePeriod()">
              <mat-icon>event_note</mat-icon>
              Gerar Período
            </button>
            <button mat-raised-button color="primary" (click)="onNewPayment()">
              <mat-icon>add</mat-icon>
              Novo Pagamento
            </button>
          </div>
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

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Ações</th>
              <td mat-cell *matCellDef="let element">
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
    .payments-container { padding: 20px; max-width: 1200px; margin: 0 auto; }
    .header-card { margin-bottom: 20px; }
    mat-card-header { padding: 16px; border-bottom: 1px solid #eee; }
    
    .button-group {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }

    .button-group button {
      flex: 0 1 auto;
    }

    table { width: 100%; }
    th { background-color: #f5f5f5; font-weight: 600; color: #666; }
    td { padding: 12px 16px; }
    tr:hover { background-color: #fafafa; }
    .no-data { text-align: center; color: #999; padding: 40px; margin: 0; }
    .loading-spinner { display: flex; justify-content: center; padding: 40px; }
  `]
})
export class PaymentsComponent implements OnInit {
  payments: (Payment | RecentPayment)[] = [];
  isLoading = false;
  displayedColumns = ['employeeName', 'amount', 'paymentDate', 'paymentMethod', 'actions'];

  constructor(
    private apiService: ApiService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadPayments();
  }

  private loadPayments(): void {
    this.isLoading = true;
    this.apiService.getRecentPayments(50).subscribe({
      next: (data) => {
        this.payments = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erro ao carregar pagamentos:', error);
        this.isLoading = false;
      }
    });
  }

  onNewPayment(): void {
    const dialogRef = this.dialog.open(PaymentFormDialogComponent, {
      width: '600px',
      data: null
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        this.loadPayments();
      }
    });
  }

  onGeneratePeriod(): void {
    console.log('🗓️ Abrindo modal de geração de período de pagamento');
    const dialogRef = this.dialog.open(GeneratePaymentPeriodDialogComponent, {
      width: '600px',
      disableClose: false
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        console.log('✅ Período gerado com sucesso, recarregando pagamentos');
        this.loadPayments();
      }
    });
  }

  onDelete(id: string): void {
    if (confirm('Tem certeza que deseja deletar este pagamento?')) {
      this.apiService.deletePayment(id).subscribe({
        next: () => {
          this.loadPayments();
        },
        error: (error) => {
          console.error('Erro ao deletar pagamento:', error);
          alert('Erro ao deletar pagamento');
        }
      });
    }
  }
}
