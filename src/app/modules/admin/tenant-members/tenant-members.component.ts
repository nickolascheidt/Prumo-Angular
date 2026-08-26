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
import { Tenant, TenantMember, TenantRole } from '@core/models';
import { AddMemberDialogComponent } from './add-member-dialog.component';

const ROLE_LABELS: Record<number, string> = { 0: 'Membro', 1: 'Admin', 2: 'Owner' };

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
  readonly roleOptions = [TenantRole.Member, TenantRole.Admin, TenantRole.Owner];

  members: TenantMember[] = [];
  filteredMembers: TenantMember[] = [];
  tenant: Tenant | null = null;
  availableRoles: string[] = [];

  searchText = '';
  loading = false;
  /** userId cuja linha está aberta. Uma por vez: duas abertas viram lista ilegível. */
  expandedUserId: string | null = null;
  /** userIds com uma escrita de chave em voo, para desabilitar só aquela linha. */
  savingRoleFor = new Set<string>();

  currentUserId = '';
  myRole: TenantRole | -1 = -1;

  // Lido ao vivo: trocar de tenant atualiza o BehaviorSubject, e uma cópia em campo
  // deixaria a escrita apontando para o tenant anterior.
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
      this.snack.open('Nenhum tenant selecionado.', 'Fechar', { duration: 5000 });
      return;
    }
    this.loadTenant();
    this.loadAssignableRoles();
    this.loadMembers();
  }

  // ----- carregamento -----

  loadMembers(): void {
    this.loading = true;
    this.api.getTenantMembers(this.tenantId).subscribe({
      next: members => {
        this.members = members;
        this.myRole = members.find(m => m.userId === this.currentUserId)?.role ?? -1;
        this.applyFilter();
        this.loading = false;
      },
      error: (error: HttpErrorResponse) => {
        this.loading = false;
        this.showError('Não foi possível carregar os membros', error);
      }
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
        this.showError('Não foi possível carregar as roles atribuíveis', error);
      }
    });
  }

  // ----- busca e expansão -----

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

  // ----- regras de exibição -----

  roleLabel(role: TenantRole): string {
    return ROLE_LABELS[role] ?? 'Desconhecido';
  }

  /**
   * Quem pode mexer no cargo e nas chaves de outro membro.
   * Owner é intocável pela tela (só o backend transfere ownership), e ninguém
   * edita o próprio cargo — seria o caminho mais curto para se auto-promover.
   * A API é a autoridade e nega com 403; isto evita a tela convidar para o erro.
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

  // ----- escrita -----

  onRoleChange(member: TenantMember, newRole: TenantRole): void {
    const previous = member.role;
    if (previous === newRole) {
      return;
    }
    member.role = newRole; // otimista, revertido no erro
    this.api.updateMemberRole(this.tenantId, member.userId, { role: newRole }).subscribe({
      next: () => this.snack.open(
        `${this.displayName(member)} agora é ${this.roleLabel(newRole)}.`, 'OK', { duration: 3000 }),
      error: (error: HttpErrorResponse) => {
        member.role = previous;
        this.showError('Não foi possível alterar o cargo', error);
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
        // Relê do servidor em vez de confiar no otimismo: a lista de chaves do
        // membro é o que o token vai carregar, e divergir aqui foi o bug do item 4.
        this.refreshMemberRoles(member);
      },
      error: (error: HttpErrorResponse) => {
        this.savingRoleFor.delete(member.userId);
        this.showError(
          granted ? 'Não foi possível conceder a chave' : 'Não foi possível revogar a chave',
          error);
        // A checkbox já virou na tela; a releitura desfaz o que não foi gravado.
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
        this.showError('As chaves podem estar desatualizadas', error)
    });
  }

  openAddDialog(): void {
    this.dialog.open(AddMemberDialogComponent, {
      width: '420px',
      data: { tenantId: this.tenantId }
    }).afterClosed().subscribe(added => { if (added) this.loadMembers(); });
  }

  removeMember(member: TenantMember): void {
    const confirmed = confirm(
      `Remover ${this.displayName(member)} deste tenant?\n\n` +
      `A conta continua existindo — a pessoa só perde acesso a este tenant.`);
    if (!confirmed) {
      return;
    }
    this.api.removeTenantMember(this.tenantId, member.userId).subscribe({
      next: () => {
        this.snack.open('Membro removido deste tenant.', 'OK', { duration: 3000 });
        if (this.expandedUserId === member.userId) {
          this.expandedUserId = null;
        }
        this.loadMembers();
      },
      error: (error: HttpErrorResponse) =>
        this.showError('Não foi possível remover o membro', error)
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
    this.snack.open(detail ? `${prefix}: ${detail}` : prefix, 'Fechar', { duration: 5000 });
  }
}
