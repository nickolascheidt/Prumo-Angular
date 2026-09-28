import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApiService, AuthService } from '@core/services';
import { Tenant, TenantInvitation, TenantMember, TenantRole, toTenantRole, tenantRoleLabel } from '@core/models';
import { AddMemberDialogComponent } from './add-member-dialog.component';

@Component({
  selector: 'app-tenant-members',
  standalone: true,
  imports: [
    CommonModule, DatePipe, FormsModule, MatTableModule, MatButtonModule,
    MatIconModule, MatDialogModule, MatSnackBarModule, MatFormFieldModule,
    MatSelectModule, MatInputModule, MatCheckboxModule,
    MatProgressSpinnerModule, MatTooltipModule
  ],
  templateUrl: './tenant-members.component.html',
  styleUrls: ['./tenant-members.component.scss']
})
export class TenantMembersComponent implements OnInit {
  readonly displayedColumns = ['expand', 'name', 'email', 'role', 'joinedAt', 'actions'];
  // No Owner: the API refuses to promote to Owner and refuses to add a member as Owner
  // (the position is only born with the tenant). Offering the option invited a 400.
  readonly roleOptions = [TenantRole.Member, TenantRole.Admin];

  members: TenantMember[] = [];
  filteredMembers: TenantMember[] = [];
  /** Invitations to e-mails that do not have an account yet. They go away when the person signs up. */
  pendingInvitations: TenantInvitation[] = [];
  tenant: Tenant | null = null;
  availableRoles: string[] = [];

  searchText = '';
  loading = false;
  /** userId whose row is open. One at a time: two open rows make an unreadable list. */
  expandedUserId: string | null = null;
  /** userIds with a key write in flight, to disable only that row. */
  savingRoleFor = new Set<string>();

  currentUserId = '';
  myRole: TenantRole | -1 = -1;

  // Read live: switching tenants updates the BehaviorSubject, and a copy in a field
  // would leave writes pointing at the previous tenant.
  private get tenantId(): string {
    return this.auth.getCurrentTenantId() ?? '';
  }

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private dialog: MatDialog,
    private snack: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.currentUserId = this.auth.getCurrentUser()?.id ?? '';
    if (!this.tenantId) {
      this.snack.open('No tenant selected.', 'Close', { duration: 5000 });
      return;
    }
    this.loadTenant();
    this.loadAssignableRoles();
    this.loadMembers();
    this.loadInvitations();
  }

  // ----- loading -----

  loadMembers(): void {
    this.loading = true;
    this.api.getTenantMembers(this.tenantId).subscribe({
      next: members => {
        // Normalize at the boundary: from here on, role is always the numeric enum.
        this.members = members.map(m => ({ ...m, role: toTenantRole(m.role) }));
        this.myRole = this.members.find(m => m.userId === this.currentUserId)?.role ?? -1;
        this.applyFilter();
        this.loading = false;
      },
      error: (error: HttpErrorResponse) => {
        this.loading = false;
        this.showError('Could not load the members', error);
      }
    });
  }

  loadInvitations(): void {
    this.api.getPendingInvitations(this.tenantId).subscribe({
      next: invitations => this.pendingInvitations = invitations.map(
        i => ({ ...i, role: toTenantRole(i.role) })
      ),
      // Pending invitations are secondary information: failing to load them must not
      // spoil the members screen, which is what the person came to see.
      error: () => this.pendingInvitations = []
    });
  }

  cancelInvitation(invitation: TenantInvitation): void {
    this.api.cancelInvitation(this.tenantId, invitation.id).subscribe({
      next: () => {
        this.snack.open(`Invitation for ${invitation.email} cancelled.`, 'Close', { duration: 4000 });
        this.loadInvitations();
      },
      error: (error: HttpErrorResponse) =>
        this.showError('Could not cancel the invitation', error)
    });
  }

  private loadTenant(): void {
    this.api.getTenantById(this.tenantId).subscribe({
      next: t => this.tenant = t,
      error: () => this.tenant = null
    });
  }

  private loadAssignableRoles(): void {
    this.api.getAssignableTenantRoles(this.tenantId).subscribe({
      next: roles => this.availableRoles = roles,
      error: (error: HttpErrorResponse) => {
        this.availableRoles = [];
        this.showError('Could not load the assignable roles', error);
      }
    });
  }

  // ----- search and expansion -----

  onSearchInput(event: Event): void {
    this.searchText = (event.target as HTMLInputElement)?.value ?? '';
    this.applyFilter();
  }

  private applyFilter(): void {
    const term = this.searchText.trim().toLowerCase();
    this.filteredMembers = term
      ? this.members.filter(m =>
          (m.fullName ?? '').toLowerCase().includes(term) ||
          m.email.toLowerCase().includes(term))
      : [...this.members];
  }

  isExpanded(member: TenantMember): boolean {
    return this.expandedUserId === member.userId;
  }

  toggleExpand(member: TenantMember): void {
    this.expandedUserId = this.isExpanded(member) ? null : member.userId;
  }

  // ----- display rules -----

  roleLabel(role: TenantRole): string {
    return tenantRoleLabel(role);
  }

  /**
   * Who can change another member's position and keys.
   * An Owner cannot be touched from the screen (only the backend transfers ownership),
   * and nobody edits their own position — that would be the shortest path to promoting
   * yourself. The API is the authority and denies with 403; this keeps the screen from
   * inviting the error.
   */
  canManage(member: TenantMember): boolean {
    const iAmAdmin = this.myRole === TenantRole.Admin || this.myRole === TenantRole.Owner;
    return iAmAdmin
      && member.role !== TenantRole.Owner
      && member.userId !== this.currentUserId;
  }

  hasRole(member: TenantMember, roleName: string): boolean {
    return (member.roles ?? []).includes(roleName);
  }

  isSaving(member: TenantMember): boolean {
    return this.savingRoleFor.has(member.userId);
  }

  // ----- writes -----

  onRoleChange(member: TenantMember, newRole: TenantRole): void {
    const previous = member.role;
    if (previous === newRole) {
      return;
    }
    member.role = newRole; // optimistic, reverted on error
    this.api.updateMemberRole(this.tenantId, member.userId, { role: newRole }).subscribe({
      next: () => this.snack.open(
        `${this.displayName(member)} is now ${this.roleLabel(newRole)}.`, 'OK', { duration: 3000 }),
      error: (error: HttpErrorResponse) => {
        member.role = previous;
        this.showError('Could not change the position', error);
      }
    });
  }

  onFeatureRoleToggle(member: TenantMember, roleName: string, granted: boolean): void {
    this.savingRoleFor.add(member.userId);

    const request$ = granted
      ? this.api.assignMemberFeatureRole(this.tenantId, member.userId, { roleName })
      : this.api.revokeMemberFeatureRole(this.tenantId, member.userId, roleName);

    request$.subscribe({
      next: () => {
        this.savingRoleFor.delete(member.userId);
        // Re-read from the server instead of trusting the optimistic update: the member's
        // key list is what the token will carry, and diverging here was a real bug.
        this.refreshMemberRoles(member);
      },
      error: (error: HttpErrorResponse) => {
        this.savingRoleFor.delete(member.userId);
        this.showError(
          granted ? 'Could not grant the key' : 'Could not revoke the key',
          error);
        // The checkbox already flipped on screen; the re-read undoes what was not saved.
        this.refreshMemberRoles(member);
      }
    });
  }

  private refreshMemberRoles(member: TenantMember): void {
    this.api.getMemberFeatureRoles(this.tenantId, member.userId).subscribe({
      next: response => {
        member.roles = response.roles ?? [];
        this.applyFilter();
      },
      error: (error: HttpErrorResponse) =>
        this.showError('The keys may be out of date', error)
    });
  }

  openAddDialog(): void {
    this.dialog.open(AddMemberDialogComponent, {
      width: '420px',
      data: { tenantId: this.tenantId }
    }).afterClosed().subscribe(added => {
      if (!added) return;
      // Reload both lists: the e-mail may have become a member (if it had an account) or a
      // pending invitation (if it did not), and the dialog does not tell the screen which.
      this.loadMembers();
      this.loadInvitations();
    });
  }

  removeMember(member: TenantMember): void {
    const confirmed = confirm(
      `Remove ${this.displayName(member)} from this tenant?\n\n` +
      `The account keeps existing — the person only loses access to this tenant.`);
    if (!confirmed) {
      return;
    }
    this.api.removeTenantMember(this.tenantId, member.userId).subscribe({
      next: () => {
        this.snack.open('Member removed from this tenant.', 'OK', { duration: 3000 });
        if (this.expandedUserId === member.userId) {
          this.expandedUserId = null;
        }
        this.loadMembers();
      },
      error: (error: HttpErrorResponse) =>
        this.showError('Could not remove the member', error)
    });
  }

  private displayName(member: TenantMember): string {
    return member.fullName || member.email;
  }

  private showError(prefix: string, error: HttpErrorResponse): void {
    const body = error?.error;
    const detail = typeof body === 'string' && body.trim()
      ? body
      : (typeof body?.message === 'string' && body.message.trim() ? body.message : null);
    this.snack.open(detail ? `${prefix}: ${detail}` : prefix, 'Close', { duration: 5000 });
  }
}
