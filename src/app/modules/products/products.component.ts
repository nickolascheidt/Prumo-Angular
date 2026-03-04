import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '@core/services';
import { Product } from '@core/models';

@Component({
  selector: 'app-products',
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
    <div class="products-container">
      <mat-card class="header-card">
        <mat-card-header>
          <mat-card-title>Produtos</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <button mat-raised-button color="primary">
            <mat-icon>add</mat-icon>
            Novo Produto
          </button>
        </mat-card-content>
      </mat-card>

      <mat-card class="data-card">
        <mat-card-content>
          <div *ngIf="isLoading" class="loading-spinner">
            <mat-spinner diameter="50"></mat-spinner>
          </div>
          <p *ngIf="!isLoading && products.length === 0" class="no-data">Nenhum produto cadastrado</p>
          <table mat-table [dataSource]="products" *ngIf="!isLoading && products.length > 0">
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Nome</th>
              <td mat-cell *matCellDef="let element">{{ element.name }}</td>
            </ng-container>

            <ng-container matColumnDef="sku">
              <th mat-header-cell *matHeaderCellDef>SKU</th>
              <td mat-cell *matCellDef="let element">{{ element.sku }}</td>
            </ng-container>

            <ng-container matColumnDef="category">
              <th mat-header-cell *matHeaderCellDef>Categoria</th>
              <td mat-cell *matCellDef="let element">{{ element.category }}</td>
            </ng-container>

            <ng-container matColumnDef="unitPrice">
              <th mat-header-cell *matHeaderCellDef>Preço</th>
              <td mat-cell *matCellDef="let element">R$ {{ element.unitPrice | number: '1.2-2' }}</td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .products-container { padding: 20px; max-width: 1200px; margin: 0 auto; }
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
export class ProductsComponent implements OnInit {
  products: Product[] = [];
  isLoading = false;
  displayedColumns = ['name', 'sku', 'category', 'unitPrice'];

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  private loadProducts(): void {
    this.isLoading = true;
    this.apiService.getProducts().subscribe({
      next: (data) => {
        this.products = data;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }
}
