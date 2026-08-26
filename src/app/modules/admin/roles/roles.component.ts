import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApiService, AuthService } from '@core/services';
import {
  PermissionLevel,
  Resource,
  ManagedRole,
  toPermissionLevel
} from '@core/models';
import { CreateRoleDialogComponent } from './create-role-dialog.component';

/** Uma linha da grade: o recurso e o nível que a role selecionada tem nele. */
interface GridRow {
  resource: Resource;
  level: PermissionLevel;
}

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatCardModule, MatTableModule, MatIconModule,
    MatButtonModule, MatButtonToggleModule, MatDialogModule,
    MatProgressSpinnerModule, MatSnackBarModule, MatTooltipModule
  ],
  templateUrl: './roles.component.html',
  styleUrls: ['./roles.component.scss']
})
export class RolesComponent implements OnInit {
  readonly gridColumns = ['resource', 'level'];
  readonly levels = [
    { value: PermissionLevel.None, label: 'Nenhum' },
    { value: PermissionLevel.Read, label: 'Ler' },
    { value: PermissionLevel.Write, label: 'Escrever' },
    { value: PermissionLevel.Full, label: 'Total' }
  ];

  roles: ManagedRole[] = [];
  selectedRole: ManagedRole | null = null;
  grid: GridRow[] = [];

  loadingRoles = false;
  loadingGrid = false;
  savingResourceId: string | null = null;

  // Lido ao vivo: trocar de tenant atualiza o BehaviorSubject, e uma cópia em campo
  // deixaria a escrita apontando para o tenant anterior.
  private get tenantId(): string {
    return this.auth.getCurrentTenantId() ?? '';
  }

  private resources: Resource[] = [];

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private dialog: MatDialog,
    private snack: MatSnackBar
  ) {}

  ngOnInit(): void {
    if (!this.tenantId) {
      this.snack.open('Nenhum tenant selecionado.', 'Fechar', { duration: 5000 });
      return;
    }
    this.loadRoles();
  }

  // ----- roles -----

  loadRoles(): void {
    this.loadingRoles = true;
    this.api.getTenantRoles(this.tenantId).subscribe({
      next: roles => {
        this.roles = roles;
        this.loadingRoles = false;

        // Mantém a seleção depois de recarregar, senão a grade some a cada escrita.
        const stillThere = this.selectedRole
          ? roles.find(r => r.id === this.selectedRole!.id) ?? null
          : null;
        if (stillThere) {
          this.selectedRole = stillThere;
        } else if (this.selectedRole) {
          this.selectedRole = null;
          this.grid = [];
        }
      },
      error: (error: HttpErrorResponse) => {
        this.loadingRoles = false;
        this.showError('Não foi possível carregar as roles', error);
      }
    });
  }

  selectRole(role: ManagedRole): void {
    this.selectedRole = role;
    this.loadGrid();
  }

  openCreateDialog(): void {
    this.dialog.open(CreateRoleDialogComponent, { width: '420px' })
      .afterClosed()
      .subscribe((data?: { name: string; description?: string }) => {
        if (!data) { return; }
        this.api.createTenantRole(this.tenantId, data).subscribe({
          next: created => {
            this.snack.open(`Role "${created.name}" criada. Ela ainda não dá acesso a nada — defina os níveis abaixo.`,
              'OK', { duration: 6000 });
            this.loadRoles();
            this.selectRole(created);
          },
          error: (error: HttpErrorResponse) =>
            this.showError('Não foi possível criar a role', error)
        });
      });
  }

  deleteRole(role: ManagedRole, event: Event): void {
    event.stopPropagation();

    if (!confirm(`Excluir a role "${role.name}"?\n\nOs níveis de acesso dela serão removidos junto.`)) {
      return;
    }

    this.api.deleteTenantRole(this.tenantId, role.id).subscribe({
      next: () => {
        this.snack.open('Role excluída.', 'OK', { duration: 3000 });
        if (this.selectedRole?.id === role.id) {
          this.selectedRole = null;
          this.grid = [];
        }
        this.loadRoles();
      },
      error: (error: HttpErrorResponse) =>
        this.showError('Não foi possível excluir a role', error)
    });
  }

  // ----- grade -----

  private loadGrid(): void {
    const role = this.selectedRole;
    if (!role) { return; }

    this.loadingGrid = true;

    const buildGrid = () => {
      this.api.getRoleResourcePermissions(role.id).subscribe({
        next: perms => {
          // O nível chega como string ("Read"); comparar com número dá sempre falso.
          const byResource = new Map<string, PermissionLevel>(
            perms.map(p => [p.resourceId, toPermissionLevel(p.level)]));

          this.grid = this.resources.map(resource => ({
            resource,
            level: byResource.get(resource.id) ?? PermissionLevel.None
          }));
          this.loadingGrid = false;
        },
        error: (error: HttpErrorResponse) => {
          this.loadingGrid = false;
          this.showError('Não foi possível carregar os níveis desta role', error);
        }
      });
    };

    if (this.resources.length > 0) {
      buildGrid();
      return;
    }

    this.api.getResources().subscribe({
      next: resources => {
        this.resources = [...resources].sort((a, b) =>
          a.displayOrder - b.displayOrder || a.name.localeCompare(b.name));
        buildGrid();
      },
      error: (error: HttpErrorResponse) => {
        this.loadingGrid = false;
        this.showError('Não foi possível carregar os recursos', error);
      }
    });
  }

  onLevelChange(row: GridRow, level: PermissionLevel): void {
    const role = this.selectedRole;
    if (!role || row.level === level) { return; }

    this.savingResourceId = row.resource.id;

    const done = () => {
      this.savingResourceId = null;
      // Relê do servidor: a grade não pode divergir do que o gate vai enxergar.
      this.loadGrid();
    };

    // Tipado como unknown de propósito: os dois ramos devolvem Observables de tipos
    // diferentes, e a união deles não é chamável. Só interessa se completou.
    const request$: Observable<unknown> = level === PermissionLevel.None
      ? this.api.removeResourcePermission(role.id, row.resource.id)
      : this.api.assignResourcePermission({
          roleId: role.id,
          resourceId: row.resource.id,
          level
        });

    request$.subscribe({
      next: () => done(),
      error: (error: HttpErrorResponse) => {
        this.savingResourceId = null;
        this.showError('Não foi possível alterar o nível', error);
        this.loadGrid();
      }
    });
  }

  isSaving(row: GridRow): boolean {
    return this.savingResourceId === row.resource.id;
  }

  levelLabel(level: PermissionLevel): string {
    return this.levels.find(l => l.value === level)?.label ?? 'Nenhum';
  }

  /** Quantos recursos esta role alcança — o resumo que evita abrir a grade. */
  grantedCount(): number {
    return this.grid.filter(r => r.level !== PermissionLevel.None).length;
  }

  private showError(prefix: string, error: HttpErrorResponse): void {
    const body = error?.error;
    const detail = typeof body === 'string' && body.trim()
      ? body
      : (typeof body?.message === 'string' && body.message.trim() ? body.message : null);
    this.snack.open(detail ? `${prefix}: ${detail}` : prefix, 'Fechar', { duration: 6000 });
  }
}
