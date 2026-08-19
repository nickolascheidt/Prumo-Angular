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
import { MatTooltipModule } from '@angular/material/tooltip';
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
    MatSnackBarModule,
    MatTooltipModule
  ],
  templateUrl: './permissions-management.component.html',
  styleUrls: ['./permissions-management.component.scss']
})
export class PermissionsManagementComponent implements OnInit {
  // Vem do backend (`GET /api/permissions/roles`). Chumbar esta lista foi o item 2 do
  // backlog: inventava uma role "Usuario" que nunca existiu e escondia RH, Financeiro
  // e ContasAPagar da tela.
  availableRoles: string[] = [];
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
    this.loadRoles();
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

  private loadRoles(): void {
    this.apiService.getConfigurableRoles().subscribe({
      next: (roles) => {
        this.availableRoles = roles;
        // Se a role pré-selecionada não existir mais no backend, cai na primeira que
        // existe em vez de deixar o select apontando para nada.
        if (roles.length > 0 && !roles.includes(this.selectedRole)) {
          this.selectedRole = roles[0];
          this.reloadRoleData();
        }
      },
      error: (error: HttpErrorResponse) => {
        this.availableRoles = [];
        this.showError('Nao foi possivel carregar as roles', error);
      }
    });
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
