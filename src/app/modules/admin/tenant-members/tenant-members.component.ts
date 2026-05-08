import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApiService } from '@core/services';
import { AuthService } from '@core/services';
import { TenantMember } from '@core/models';
import { AddMemberDialogComponent } from './add-member-dialog.component';
import { ChangeRoleDialogComponent } from './change-role-dialog.component';

const ROLE_LABELS: Record<number, string> = { 0: 'Membro', 1: 'Admin', 2: 'Owner' };

@Component({
  selector: 'app-tenant-members',
  standalone: true,
  imports: [
    CommonModule, DatePipe, MatTableModule, MatButtonModule, MatIconModule,
    MatDialogModule, MatSnackBarModule, MatChipsModule,
    MatProgressSpinnerModule, MatTooltipModule
  ],
  templateUrl: './tenant-members.component.html'
})
export class TenantMembersComponent implements OnInit {
  displayedColumns = ['name', 'email', 'role', 'joinedAt', 'actions'];
  members: TenantMember[] = [];
  loading = false;
  currentUserId = '';
  private tenantId = '';

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private dialog: MatDialog,
    private snack: MatSnackBar
  ) {}

  ngOnInit(): void {
    const user = this.auth.getCurrentUser();
    this.currentUserId = user?.id ?? '';
    this.tenantId = this.auth.getCurrentTenantId() ?? '';
    this.loadMembers();
  }

  loadMembers(): void {
    this.loading = true;
    this.api.getTenantMembers(this.tenantId).subscribe({
      next: members => { this.members = members; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  roleLabel(role: number): string { return ROLE_LABELS[role] ?? 'Desconhecido'; }

  canManage(member: TenantMember): boolean {
    const myRole = this.members.find(m => m.userId === this.currentUserId)?.role ?? -1;
    return (myRole === 1 || myRole === 2) && member.role !== 2;
  }

  openAddDialog(): void {
    this.dialog.open(AddMemberDialogComponent, {
      width: '420px',
      data: { tenantId: this.tenantId }
    }).afterClosed().subscribe(added => { if (added) this.loadMembers(); });
  }

  openChangeRoleDialog(member: TenantMember): void {
    this.dialog.open(ChangeRoleDialogComponent, {
      width: '360px',
      data: { tenantId: this.tenantId, member }
    }).afterClosed().subscribe(changed => { if (changed) this.loadMembers(); });
  }

  removeMember(member: TenantMember): void {
    if (!confirm(`Remover ${member.fullName || member.email} deste tenant?`)) return;
    this.api.removeTenantMember(this.tenantId, member.userId).subscribe({
      next: () => {
        this.snack.open('Membro removido.', 'OK', { duration: 3000 });
        this.loadMembers();
      },
      error: () => this.snack.open('Falha ao remover membro.', 'OK', { duration: 4000 })
    });
  }
}
