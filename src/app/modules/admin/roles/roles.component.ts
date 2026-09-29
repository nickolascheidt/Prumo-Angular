import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
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

/** A grid row: the resource and the level the selected role has on it. */
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
    { value: PermissionLevel.None, label: 'None' },
    { value: PermissionLevel.Read, label: 'Read' },
    { value: PermissionLevel.Write, label: 'Write' },
    { value: PermissionLevel.Full, label: 'Full' }
  ];

  roles: ManagedRole[] = [];
  selectedRole: ManagedRole | null = null;
  grid: GridRow[] = [];

  loadingRoles = false;
  loadingGrid = false;
  savingResourceId: string | null = null;

  // Read live: switching tenants updates the BehaviorSubject, and a copy in a field
  // would leave writes pointing at the previous tenant.
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
      this.snack.open('No tenant selected.', 'Close', { duration: 5000 });
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

        // Keep the selection after reloading, otherwise the grid disappears on every write.
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
        this.showError('Could not load the roles', error);
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
            this.snack.open(`Role "${created.name}" created. It does not grant access to anything yet — set the levels below.`,
              'OK', { duration: 6000 });
            this.loadRoles();
            this.selectRole(created);
          },
          error: (error: HttpErrorResponse) =>
            this.showError('Could not create the role', error)
        });
      });
  }

  deleteRole(role: ManagedRole, event: Event): void {
    event.stopPropagation();

    if (!confirm(`Delete the role "${role.name}"?\n\nIts access levels will be removed with it.`)) {
      return;
    }

    this.api.deleteTenantRole(this.tenantId, role.id).subscribe({
      next: () => {
        this.snack.open('Role deleted.', 'OK', { duration: 3000 });
        if (this.selectedRole?.id === role.id) {
          this.selectedRole = null;
          this.grid = [];
        }
        this.loadRoles();
      },
      error: (error: HttpErrorResponse) =>
        this.showError('Could not delete the role', error)
    });
  }

  // ----- grid -----

  private loadGrid(): void {
    const role = this.selectedRole;
    if (!role) { return; }

    this.loadingGrid = true;

    const buildGrid = () => {
      this.api.getTenantRolePermissions(this.tenantId, role.id).subscribe({
        next: perms => {
          // The level arrives as a string ("Read"); comparing it with a number is always false.
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
          this.showError('Could not load this role\'s levels', error);
        }
      });
    };

    if (this.resources.length > 0) {
      buildGrid();
      return;
    }

    this.api.getTenantResources(this.tenantId).subscribe({
      next: resources => {
        this.resources = [...resources].sort((a, b) =>
          a.displayOrder - b.displayOrder || a.name.localeCompare(b.name));
        buildGrid();
      },
      error: (error: HttpErrorResponse) => {
        this.loadingGrid = false;
        this.showError('Could not load the resources', error);
      }
    });
  }

  onLevelChange(row: GridRow, level: PermissionLevel): void {
    const role = this.selectedRole;
    if (!role || row.level === level) { return; }

    this.savingResourceId = row.resource.id;

    const done = () => {
      this.savingResourceId = null;
      // Re-read from the server: the grid must not diverge from what the gate will see.
      this.loadGrid();
    };

    // One call for granting and revoking: level None revokes.
    this.api.setTenantRolePermission(this.tenantId, role.id, row.resource.id, level).subscribe({
      next: () => done(),
      error: (error: HttpErrorResponse) => {
        this.savingResourceId = null;
        this.showError('Could not change the level', error);
        this.loadGrid();
      }
    });
  }

  isSaving(row: GridRow): boolean {
    return this.savingResourceId === row.resource.id;
  }

  levelLabel(level: PermissionLevel): string {
    return this.levels.find(l => l.value === level)?.label ?? 'None';
  }

  /** How many resources this role reaches — the summary that saves opening the grid. */
  grantedCount(): number {
    return this.grid.filter(r => r.level !== PermissionLevel.None).length;
  }

  private showError(prefix: string, error: HttpErrorResponse): void {
    const body = error?.error;
    const detail = typeof body === 'string' && body.trim()
      ? body
      : (typeof body?.message === 'string' && body.message.trim() ? body.message : null);
    this.snack.open(detail ? `${prefix}: ${detail}` : prefix, 'Close', { duration: 6000 });
  }
}
