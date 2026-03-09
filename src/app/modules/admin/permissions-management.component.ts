import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { ApiService } from '@core/services';
import {
  PermissionAuditLog,
  PermissionCatalog,
  PermissionItem,
  RolePermissionsResponse
} from '@core/models';

interface CatalogPermissionOption {
  moduleKey: string;
  permissionName: string;
  label: string;
}

@Component({
  selector: 'app-permissions-management',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  template: `
    <div class="permissions-container">
      <mat-card class="header-card">
        <mat-card-header>
          <mat-card-title>Gestao de Permissoes por Role</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <p>
            Configure as permissoes de cada role usando os endpoints administrativos do backend.
          </p>
        </mat-card-content>
      </mat-card>

      <mat-card class="role-card">
        <mat-card-content>
          <div class="role-toolbar">
            <mat-form-field appearance="outline" class="role-select">
              <mat-label>Role</mat-label>
              <mat-select [value]="selectedRole" (selectionChange)="onRoleSelected($event.value)">
                <mat-option *ngFor="let role of availableRoles" [value]="role">{{ role }}</mat-option>
              </mat-select>
            </mat-form-field>

            <button mat-stroked-button color="primary" (click)="reloadRoleData()" [disabled]="isLoadingRoleData">
              <mat-icon>refresh</mat-icon>
              Atualizar
            </button>
          </div>

          <div *ngIf="isLoadingRoleData" class="loading-wrapper">
            <mat-spinner diameter="40"></mat-spinner>
          </div>

          <div *ngIf="!isLoadingRoleData" class="permissions-list">
            <h3>Permissoes da role {{ selectedRole }}</h3>
            <table mat-table [dataSource]="rolePermissions" *ngIf="rolePermissions.length > 0">
              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef>Permissao</th>
                <td mat-cell *matCellDef="let item">{{ item.name }}</td>
              </ng-container>

              <ng-container matColumnDef="description">
                <th mat-header-cell *matHeaderCellDef>Descricao</th>
                <td mat-cell *matCellDef="let item">{{ item.description || 'Sem descricao' }}</td>
              </ng-container>

              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Acoes</th>
                <td mat-cell *matCellDef="let item">
                  <button mat-icon-button color="warn" (click)="revokePermission(item.name)">
                    <mat-icon>delete</mat-icon>
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="rolePermissionColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: rolePermissionColumns;"></tr>
            </table>
            <p class="no-data" *ngIf="rolePermissions.length === 0">Nenhuma permissao concedida para esta role.</p>
          </div>
        </mat-card-content>
      </mat-card>

      <mat-card class="grant-card">
        <mat-card-header>
          <mat-card-title>Conceder permissao</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="grant-form">
            <mat-form-field appearance="outline">
              <mat-label>Permissao</mat-label>
              <mat-select [value]="selectedPermissionToGrant" (selectionChange)="selectedPermissionToGrant = $event.value">
                <mat-option *ngFor="let option of catalogPermissions" [value]="option.permissionName">
                  {{ option.label }}
                </mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Motivo (opcional)</mat-label>
              <input matInput [value]="grantReason" (input)="grantReason = readInputValue($event)" maxlength="240" />
            </mat-form-field>

            <button
              mat-raised-button
              color="primary"
              (click)="grantPermission()"
              [disabled]="isGranting || !selectedPermissionToGrant">
              <mat-icon>verified_user</mat-icon>
              Conceder
            </button>
          </div>
        </mat-card-content>
      </mat-card>

      <mat-card class="audit-card">
        <mat-card-header>
          <mat-card-title>Auditoria da role {{ selectedRole }}</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div *ngIf="isLoadingAudit" class="loading-wrapper">
            <mat-spinner diameter="40"></mat-spinner>
          </div>

          <table mat-table [dataSource]="auditLogs" *ngIf="!isLoadingAudit && auditLogs.length > 0">
            <ng-container matColumnDef="performedAt">
              <th mat-header-cell *matHeaderCellDef>Data</th>
              <td mat-cell *matCellDef="let item">{{ item.performedAt | date: 'dd/MM/yyyy HH:mm' }}</td>
            </ng-container>

            <ng-container matColumnDef="action">
              <th mat-header-cell *matHeaderCellDef>Acao</th>
              <td mat-cell *matCellDef="let item">{{ item.action }}</td>
            </ng-container>

            <ng-container matColumnDef="permissionName">
              <th mat-header-cell *matHeaderCellDef>Permissao</th>
              <td mat-cell *matCellDef="let item">{{ item.permissionName }}</td>
            </ng-container>

            <ng-container matColumnDef="performedByUserEmail">
              <th mat-header-cell *matHeaderCellDef>Executado por</th>
              <td mat-cell *matCellDef="let item">{{ item.performedByUserEmail }}</td>
            </ng-container>

            <ng-container matColumnDef="reason">
              <th mat-header-cell *matHeaderCellDef>Motivo</th>
              <td mat-cell *matCellDef="let item">{{ item.reason || '-' }}</td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="auditColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: auditColumns;"></tr>
          </table>
          <p class="no-data" *ngIf="!isLoadingAudit && auditLogs.length === 0">Nenhum registro de auditoria para esta role.</p>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .permissions-container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
      display: grid;
      gap: 20px;
    }

    .header-card p {
      margin: 0;
      color: #4d4d4d;
      line-height: 1.5;
    }

    .role-toolbar {
      display: flex;
      gap: 12px;
      align-items: center;
      margin-bottom: 12px;
      flex-wrap: wrap;
    }

    .role-select {
      min-width: 260px;
      flex: 1;
    }

    .permissions-list h3 {
      margin: 0 0 12px;
      font-size: 1rem;
      color: #303030;
    }

    .grant-form {
      display: grid;
      gap: 12px;
      grid-template-columns: 1fr;
      align-items: start;
    }

    .loading-wrapper {
      display: flex;
      justify-content: center;
      padding: 24px;
    }

    table {
      width: 100%;

      th {
        background: #f4f7fb;
        font-weight: 600;
        color: #405a72;
      }

      td {
        vertical-align: middle;
      }
    }

    .no-data {
      margin: 0;
      color: #777;
      text-align: center;
      padding: 16px;
    }

    @media (min-width: 900px) {
      .grant-form {
        grid-template-columns: 1fr 1fr auto;
      }
    }
  `]
})
export class PermissionsManagementComponent implements OnInit {
  readonly availableRoles: string[] = ['Administrador', 'Funcionario', 'Cliente', 'Usuario'];
  readonly rolePermissionColumns: string[] = ['name', 'description', 'actions'];
  readonly auditColumns: string[] = ['performedAt', 'action', 'permissionName', 'performedByUserEmail', 'reason'];

  selectedRole = 'Funcionario';
  selectedPermissionToGrant = '';
  grantReason = '';

  catalog: PermissionCatalog = {};
  catalogPermissions: CatalogPermissionOption[] = [];
  rolePermissions: PermissionItem[] = [];
  auditLogs: PermissionAuditLog[] = [];

  isLoadingRoleData = false;
  isLoadingAudit = false;
  isGranting = false;

  constructor(
    private apiService: ApiService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadCatalog();
    this.reloadRoleData();
  }

  onRoleSelected(role: string): void {
    this.selectedRole = role;
    this.reloadRoleData();
  }

  reloadRoleData(): void {
    this.isLoadingRoleData = true;
    this.isLoadingAudit = true;

    forkJoin({
      roleData: this.apiService.getRolePermissions(this.selectedRole),
      auditData: this.apiService.getPermissionAudit(this.selectedRole, 50)
    })
      .pipe(finalize(() => {
        this.isLoadingRoleData = false;
        this.isLoadingAudit = false;
      }))
      .subscribe({
        next: ({ roleData, auditData }) => {
          this.applyRolePermissions(roleData);
          this.auditLogs = auditData;
        },
        error: (error: HttpErrorResponse) => {
          this.showError('Erro ao carregar dados da role', error);
        }
      });
  }

  grantPermission(): void {
    if (!this.selectedPermissionToGrant) {
      return;
    }

    this.isGranting = true;
    this.apiService
      .grantPermissionToRole(this.selectedRole, {
        permissionName: this.selectedPermissionToGrant,
        reason: this.grantReason.trim() || undefined
      })
      .pipe(finalize(() => {
        this.isGranting = false;
      }))
      .subscribe({
        next: (response) => {
          this.showSuccess(response.message || 'Permissao concedida com sucesso.');
          this.grantReason = '';
          this.reloadRoleData();
        },
        error: (error: HttpErrorResponse) => {
          this.showError('Nao foi possivel conceder permissao', error);
        }
      });
  }

  revokePermission(permissionName: string): void {
    const confirmed = confirm(`Deseja revogar a permissao "${permissionName}" da role "${this.selectedRole}"?`);
    if (!confirmed) {
      return;
    }

    this.apiService.revokePermissionFromRole(this.selectedRole, permissionName, 'Revogado via painel administrativo').subscribe({
      next: (response) => {
        this.showSuccess(response.message || 'Permissao revogada com sucesso.');
        this.reloadRoleData();
      },
      error: (error: HttpErrorResponse) => {
        this.showError('Nao foi possivel revogar permissao', error);
      }
    });
  }

  readInputValue(event: Event): string {
    return (event.target as HTMLInputElement)?.value ?? '';
  }

  private loadCatalog(): void {
    this.apiService.getPermissionCatalog().subscribe({
      next: (catalog) => {
        this.catalog = catalog;
        this.catalogPermissions = this.flattenCatalog(catalog);
      },
      error: (error: HttpErrorResponse) => {
        this.showError('Nao foi possivel carregar o catalogo de permissoes', error);
      }
    });
  }

  private applyRolePermissions(response: RolePermissionsResponse): void {
    this.rolePermissions = response.permissions;
  }

  private flattenCatalog(catalog: PermissionCatalog): CatalogPermissionOption[] {
    return Object.entries(catalog)
      .flatMap(([moduleKey, permissions]) =>
        Object.values(permissions).map(permissionName => ({
          moduleKey,
          permissionName,
          label: `${moduleKey} - ${permissionName}`
        }))
      )
      .sort((a, b) => a.permissionName.localeCompare(b.permissionName));
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Fechar', { duration: 3000 });
  }

  private showError(prefix: string, error: HttpErrorResponse): void {
    const backendMessage = error?.error?.message || error?.error?.title;
    const message = backendMessage ? `${prefix}: ${backendMessage}` : prefix;
    this.snackBar.open(message, 'Fechar', { duration: 5000 });
  }
}
