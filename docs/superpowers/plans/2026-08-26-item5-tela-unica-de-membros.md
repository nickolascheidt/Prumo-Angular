# Item 5 — Tela única de membros (linha expansível)

> **Para quem executa:** use `superpowers:subagent-driven-development` ou
> `superpowers:executing-plans` para tocar tarefa por tarefa. Os passos usam
> checkbox (`- [ ]`).

**Objetivo:** fundir `/admin/members`, `/admin/users-roles` e `/admin/tenant` numa
tela só, onde cada membro é uma linha com o cargo num dropdown inline e as feature
roles num painel que expande.

**Arquitetura:** 100% frontend. O backend já tem tudo — `GET /tenants/{id}/members`
devolve `roles[]` e `isMasterAdmin` desde o item 4, então a linha expansível não faz
N+1, e todos os endpoints de escrita já existem no `ApiService`. **Nenhum arquivo do
repo backend é tocado, nenhum método novo no `api.service.ts`.**

**Stack:** Angular 18 standalone + Angular Material 18 (`mat-table` com
`multiTemplateDataRows`), SCSS com tokens do design system.

---

## Decisões que este plano executa (não reabrir)

| Assunto | Decisão | Onde foi decidido |
|---|---|---|
| Formato | Uma tela, linha expansível. Cargo no dropdown da linha, feature roles no painel. | backlog item 5, 2026-08-18 |
| Rodapé "Dados do tenant" | **Só leitura** (nome + slug). Nenhum `PUT /api/tenants/{id}` é criado. | 2026-08-26 |
| "Desativar usuário" (`DELETE /api/auth/users/{id}`, global) | **Sai da tela.** A única ação destrutiva vira "remover deste tenant". O endpoint continua vivo, sem UI. | 2026-08-26 |
| Rota sobrevivente | `/admin/members`. `/admin/users-roles` e `/admin/tenant` viram `redirectTo`. | este plano |

**Por que redirect e não sumir:** `/admin/users-roles` é uma rota que existe há meses e
pode estar em bookmark. Duas linhas de `redirectTo` custam nada e evitam um 404. O ganho
de segurança de matar `/admin/tenant` se mantém: ela era **a única rota admin sem
`canActivate`** (a verruga que fazia "Tenant" aparecer no menu de um Member simples), e o
destino do redirect tem guard.

---

## Estrutura de arquivos

**A tela nova mora em `src/app/modules/admin/tenant-members/`** — a pasta já existe e já
tem o dialog de adicionar membro, que o item 8 vai reusar.

| Ação | Arquivo | Responsabilidade |
|---|---|---|
| Reescrever | `tenant-members/tenant-members.component.ts` | estado da tela: membros, expansão, cargo, feature roles, tenant |
| Reescrever | `tenant-members/tenant-members.component.html` | tabela + linha de detalhe + rodapé |
| Criar | `tenant-members/tenant-members.component.scss` | estilos (hoje são `styles: []` inline no TS) |
| Criar | `tenant-members/tenant-members.component.spec.ts` | testa a lógica de permissão da linha |
| Manter | `tenant-members/add-member-dialog.component.ts` | intocado |
| Apagar | `tenant-members/change-role-dialog.component.ts` | cargo vira dropdown inline |
| Apagar | `admin/users-roles-management.component.{ts,html,scss}` | absorvido |
| Apagar | `admin/tenant-management.component.{ts,html,scss}` | absorvido |
| Apagar | `admin/admin-panel.component.{ts,html,scss}` | código morto: não é roteado nem importado |
| Modificar | `app.routes.ts` | 3 rotas → 1 + 2 redirects |
| Modificar | `shared/components/layout/layout.component.ts` | 3 entradas de menu → 1 |
| Modificar | `src/styles.scss` | classe `.role-chip` vinda do design system |

---

## Como verificar, neste repo

Este repo tem **um** `.spec.ts` no total — não há cultura de teste unitário de componente
aqui, e inventar uma suíte inteira não é o trabalho do item 5. O padrão de verificação já
estabelecido no projeto (fase 1, fase 2, itens 4 e 15) é:

```bash
npm run build:prod                          # build de produção limpo (strict TS + AOT)
bash .claude/skills/design-sync/check-tokens.sh   # zero hex chumbado, zero var() órfã
```

seguido de **smoke test manual contra a API viva**. O plano acrescenta **um** spec, na
Task 3, para a lógica de quem pode gerenciar quem — é a única regra da tela cujo erro tem
consequência de autorização, e é testável sem TestBed pesado.

> **Gotcha:** `bash` no PowerShell resolve para o WSL e falha com `execvpe(/bin/bash)`.
> Rodar o `check-tokens.sh` pela ferramenta Bash do Claude Code, não pelo PowerShell.

---

## Task 1: `.role-chip` desce do design system

O design system (Claude Design, projeto `019df28f-17ee-750e-a62f-64153583d01b`) é a fonte
da verdade dos tokens e tem classes base que nunca desceram para o Angular. `.role-chip` é
uma delas, e o item 5 é quem precisa dela — o painel expansível é uma grade de chips de
role.

**Arquivos:**
- Modificar: `src/styles.scss`

- [ ] **Passo 1: ler a classe no design system**

Carregar a ferramenta `DesignSync` (é deferred):

```
ToolSearch: select:DesignSync
```

Depois `list_files` no projeto `019df28f-17ee-750e-a62f-64153583d01b` e `get_file` em
`colors_and_type.css` e no UI kit, procurando `.role-chip`.

**Se `.role-chip` não existir lá**, não invente uma ida ao design system: escreva a classe
no `styles.scss` com os tokens já existentes (passo 2) e **empurre-a de volta** para o
`colors_and_type.css` no mesmo dia, como foi feito com `--gradient-toolbar` em 2026-08-24.

- [ ] **Passo 2: acrescentar a classe ao `styles.scss`**

No fim do arquivo, junto das outras classes utilitárias:

```scss
/* Chip de feature role — a "chave de módulo" que o membro carrega.
   Vive aqui e não no componente porque o item 3 (criar role) vai reusá-la. */
.role-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 0.8125rem;
  font-weight: 500;
  line-height: 1.4;
  background: var(--color-primary-surface);
  color: var(--color-primary);
  border: 1px solid var(--color-primary-border);
}

.role-chip--off {
  background: var(--color-surface-alt);
  color: var(--color-text-muted);
  border-color: var(--color-border);
}
```

- [ ] **Passo 3: conferir que os quatro tokens existem**

```bash
grep -nE "\-\-color-(primary-surface|primary-border|surface-alt|text-muted|border):" src/styles.scss
```

Esperado: **5 linhas**, uma por token. **Se algum não existir**, não crie quase-duplicata
(decisão de 2026-08-24) — encaixe no token mais próximo que existe e anote a troca no
commit.

- [ ] **Passo 4: rodar o verificador de tokens**

Pela ferramenta Bash:

```bash
cd ~/source/repos/SaaSBasePlatform-Angular && bash .claude/skills/design-sync/check-tokens.sh
```

Esperado: exit 0, sem violação.

- [ ] **Passo 5: commit**

```bash
git add src/styles.scss
git commit -F- <<'EOF'
style(tokens): bring the role chip class down from the design system

The expandable member row renders one chip per feature role. The class lives
in styles.scss rather than the component because item 3 (create role) reuses it.
EOF
```

---

## Task 2: a tela nova — tabela com linha expansível e cargo inline

**Arquivos:**
- Reescrever: `src/app/modules/admin/tenant-members/tenant-members.component.ts`
- Reescrever: `src/app/modules/admin/tenant-members/tenant-members.component.html`
- Criar: `src/app/modules/admin/tenant-members/tenant-members.component.scss`

- [ ] **Passo 1: escrever o componente**

Conteúdo integral de `tenant-members.component.ts`:

```ts
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
  /** userIds com uma escrita de feature role em voo, para desabilitar só aquela linha. */
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

    const done = (ok: boolean, error?: HttpErrorResponse) => {
      this.savingRoleFor.delete(member.userId);
      if (ok) {
        // Relê do servidor em vez de confiar no otimismo: a lista de roles do
        // membro é o que o token vai carregar, e divergir aqui foi o bug do item 4.
        this.refreshMemberRoles(member);
      } else if (error) {
        this.showError(
          granted ? 'Não foi possível conceder a chave' : 'Não foi possível revogar a chave',
          error);
      }
    };

    const request$ = granted
      ? this.api.assignMemberFeatureRole(this.tenantId, member.userId, { roleName })
      : this.api.revokeMemberFeatureRole(this.tenantId, member.userId, roleName);

    request$.subscribe({
      next: () => done(true),
      error: (error: HttpErrorResponse) => done(false, error)
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
```

> **Nota sobre o `showError`:** o helper que veio de `users-roles-management` tinha
> **seis `console.log` de debug** e quatro caminhos de fallback (`errors`, `message`,
> `detail`, `title`). Depois do item 15 o backend responde o envelope `{ "message": … }`
> de forma consistente, inclusive em validação — os fallbacks eram para o 500 cru que
> não existe mais. Esta versão é a que sobrou depois de tirar o andaime.

- [ ] **Passo 2: escrever o template**

Conteúdo integral de `tenant-members.component.html`:

```html
<div class="members-page">
  <section class="page-header">
    <div class="page-header__icon"><mat-icon>group</mat-icon></div>
    <div class="page-header__text">
      <h1>Membros</h1>
      <p>O cargo define o que a pessoa administra. As chaves definem quais módulos ela abre.</p>
    </div>
    <button mat-flat-button color="primary" (click)="openAddDialog()">
      <mat-icon>person_add</mat-icon> Adicionar membro
    </button>
  </section>

  <mat-form-field appearance="outline" class="search-field">
    <mat-label>Buscar por nome ou e-mail</mat-label>
    <mat-icon matPrefix>search</mat-icon>
    <input matInput [value]="searchText" (input)="onSearchInput($event)" />
  </mat-form-field>

  @if (loading) {
    <div class="loading-state"><mat-spinner diameter="48"></mat-spinner></div>
  } @else {
    <table mat-table [dataSource]="filteredMembers" multiTemplateDataRows class="members-table">

      <ng-container matColumnDef="expand">
        <th mat-header-cell *matHeaderCellDef class="col-expand"></th>
        <td mat-cell *matCellDef="let m" class="col-expand">
          <mat-icon class="expand-icon" [class.expand-icon--open]="isExpanded(m)">
            chevron_right
          </mat-icon>
        </td>
      </ng-container>

      <ng-container matColumnDef="name">
        <th mat-header-cell *matHeaderCellDef>Nome</th>
        <td mat-cell *matCellDef="let m">
          <div class="user-cell">
            <div class="user-cell__avatar">{{ (m.fullName || m.email)[0] | uppercase }}</div>
            <span>{{ m.fullName || '—' }}</span>
            <!-- O master admin é role global, não chave deste tenant: ele mostra zero
                 chaves e está certo. O selo evita ler isso como "não tem acesso". -->
            @if (m.isMasterAdmin) {
              <span class="master-badge"
                    matTooltip="Administrador global — acesso a todos os tenants. Não é uma chave deste tenant e não se remove aqui.">
                master
              </span>
            }
          </div>
        </td>
      </ng-container>

      <ng-container matColumnDef="email">
        <th mat-header-cell *matHeaderCellDef>E-mail</th>
        <td mat-cell *matCellDef="let m" class="muted">{{ m.email }}</td>
      </ng-container>

      <ng-container matColumnDef="role">
        <th mat-header-cell *matHeaderCellDef>Cargo</th>
        <td mat-cell *matCellDef="let m">
          @if (canManage(m)) {
            <!-- click.stop: sem isso, abrir o dropdown também toggla a linha. -->
            <mat-form-field appearance="outline" class="role-select" subscriptSizing="dynamic">
              <mat-select [value]="m.role"
                          (click)="$event.stopPropagation()"
                          (selectionChange)="onRoleChange(m, $event.value)">
                @for (option of roleOptions; track option) {
                  <mat-option [value]="option">{{ roleLabel(option) }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
          } @else {
            <span class="role-static">{{ roleLabel(m.role) }}</span>
          }
        </td>
      </ng-container>

      <ng-container matColumnDef="joinedAt">
        <th mat-header-cell *matHeaderCellDef>Desde</th>
        <td mat-cell *matCellDef="let m" class="muted">{{ m.joinedAt | date:'dd/MM/yyyy' }}</td>
      </ng-container>

      <ng-container matColumnDef="actions">
        <th mat-header-cell *matHeaderCellDef></th>
        <td mat-cell *matCellDef="let m">
          @if (canManage(m)) {
            <button mat-icon-button color="warn"
                    matTooltip="Remover deste tenant"
                    (click)="$event.stopPropagation(); removeMember(m)">
              <mat-icon>person_remove</mat-icon>
            </button>
          }
        </td>
      </ng-container>

      <!-- Linha de detalhe: as chaves de módulo. -->
      <ng-container matColumnDef="expandedDetail">
        <td mat-cell *matCellDef="let m" [attr.colspan]="displayedColumns.length">
          <div class="detail" [class.detail--open]="isExpanded(m)">
            <div class="detail__inner">
              <h4>Chaves de módulo</h4>
              @if (availableRoles.length === 0) {
                <p class="muted">Nenhuma role atribuível neste tenant.</p>
              } @else {
                <div class="keys-grid">
                  @for (role of availableRoles; track role) {
                    <label class="role-chip"
                           [class.role-chip--off]="!hasRole(m, role)">
                      <mat-checkbox [checked]="hasRole(m, role)"
                                    [disabled]="!canManage(m) || isSaving(m)"
                                    (change)="onFeatureRoleToggle(m, role, $event.checked)">
                        {{ role }}
                      </mat-checkbox>
                    </label>
                  }
                </div>
              }
              @if (!canManage(m)) {
                <p class="muted detail__note">
                  Você não pode alterar as chaves deste membro.
                </p>
              }
            </div>
          </div>
        </td>
      </ng-container>

      <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
      <tr mat-row *matRowDef="let row; columns: displayedColumns;"
          class="member-row"
          [class.member-row--open]="isExpanded(row)"
          (click)="toggleExpand(row)"></tr>
      <tr mat-row *matRowDef="let row; columns: ['expandedDetail'];" class="detail-row"></tr>

      <tr class="mat-row" *matNoDataRow>
        <td class="mat-cell empty-row" [attr.colspan]="displayedColumns.length">
          Nenhum membro encontrado.
        </td>
      </tr>
    </table>

    <!-- Rodapé só-leitura: preserva o único conteúdo exclusivo de /admin/tenant. -->
    <footer class="tenant-footer">
      <mat-icon>business</mat-icon>
      @if (tenant) {
        <span>Tenant: <strong>{{ tenant.name }}</strong> <span class="muted">({{ tenant.slug }})</span></span>
      } @else {
        <span class="muted">Dados do tenant indisponíveis.</span>
      }
    </footer>
  }
</div>
```

- [ ] **Passo 3: escrever o SCSS**

Conteúdo integral de `tenant-members.component.scss`. **Sem hex chumbado** — o
`check-tokens.sh` quebra com qualquer um:

```scss
.members-page { padding: 24px; }

.page-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;

  &__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    border-radius: 12px;
    background: var(--color-primary-surface);
    color: var(--color-primary);
  }

  &__text {
    flex: 1;

    h1 { margin: 0; font-size: 1.5rem; }
    p { margin: 4px 0 0; color: var(--color-text-muted); font-size: 0.875rem; }
  }
}

.search-field { width: 100%; max-width: 420px; margin-bottom: 16px; }

.loading-state { display: flex; justify-content: center; padding: 64px; }

.members-table { width: 100%; background: var(--color-surface); }

.col-expand { width: 40px; }

.expand-icon {
  color: var(--color-text-muted);
  transition: transform 160ms ease;

  &--open { transform: rotate(90deg); }
}

.member-row {
  cursor: pointer;

  &:hover { background: var(--color-surface-alt); }
  &--open { background: var(--color-surface-alt); }
}

/* A linha de detalhe existe sempre no DOM; o que anima é a altura.
   Sem isto o mat-table pisca ao expandir. */
.detail-row { height: 0; }

.detail {
  overflow: hidden;
  max-height: 0;
  transition: max-height 200ms ease;

  &--open { max-height: 320px; }

  &__inner { padding: 16px 16px 20px 56px; }
  &__note { margin: 12px 0 0; font-size: 0.8125rem; }

  h4 {
    margin: 0 0 12px;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
}

.keys-grid { display: flex; flex-wrap: wrap; gap: 12px; }

.user-cell {
  display: flex;
  align-items: center;
  gap: 10px;

  &__avatar {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: var(--color-primary);
    color: var(--color-on-primary);
    font-size: 0.8125rem;
    font-weight: 600;
  }
}

.master-badge {
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  background: var(--color-warn-surface);
  color: var(--color-warn);
}

.role-select { width: 130px; }
.role-static { color: var(--color-text-muted); }

.muted { color: var(--color-text-muted); }

.empty-row { text-align: center; padding: 32px; color: var(--color-text-muted); }

.tenant-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 20px;
  padding: 12px 16px;
  border-radius: 8px;
  background: var(--color-surface-alt);
  color: var(--color-text);
  font-size: 0.875rem;

  mat-icon { color: var(--color-text-muted); }
}
```

- [ ] **Passo 4: conferir os tokens usados aqui**

```bash
grep -nE "\-\-color-(surface|surface-alt|primary|primary-surface|on-primary|text|text-muted|warn|warn-surface):" src/styles.scss
```

Esperado: uma linha por token. **Qualquer um que faltar** — encaixe no mais próximo que
existe, não crie quase-duplicata.

- [ ] **Passo 5: apagar o dialog de cargo, que ficou sem chamador**

```bash
git rm src/app/modules/admin/tenant-members/change-role-dialog.component.ts
grep -rn "ChangeRoleDialog" src/ || echo "sem referências, ok"
```

Esperado: o `grep` não acha nada.

- [ ] **Passo 6: build**

```bash
npm run build:prod
```

Esperado: `Application bundle generation complete`, zero erro.

- [ ] **Passo 7: verificador de tokens** (pela ferramenta Bash)

```bash
bash .claude/skills/design-sync/check-tokens.sh
```

Esperado: exit 0.

- [ ] **Passo 8: commit**

```bash
git add src/app/modules/admin/tenant-members/
git commit -F- <<'EOF'
feat(admin): one member screen, with the role inline and the keys in the row

The job title (Owner/Admin/Member) is a dropdown on the row; the module keys
(feature roles) live in the panel the row expands into. Both levels stay
visible, which is what merging the screens risked losing.

Removes the change-role dialog: the dropdown replaces it.
EOF
```

---

## Task 3: o teste da regra de quem gerencia quem

`canManage` é a única regra da tela cujo erro tem consequência de autorização: se ela
liberar demais, a UI oferece uma ação que a API vai negar com 403 — ou pior, oferece
auto-promoção. A API é a autoridade, mas a tela não deve convidar para o erro.

**Isto é teste de fixação, não TDD.** `canManage` nasce na Task 2, junto do componente que
não compila sem ele — escrever o teste antes exigiria um componente pela metade. O papel
deste teste é **prender** a regra para que ela não afrouxe depois, e ele só vale se você
o vir mordendo: o Passo 3 quebra a regra de propósito e confirma que o teste acusa.

**Arquivos:**
- Criar: `src/app/modules/admin/tenant-members/tenant-members.component.spec.ts`

- [ ] **Passo 1: escrever o teste**

```ts
import { TenantMembersComponent } from './tenant-members.component';
import { TenantMember, TenantRole } from '@core/models';

function member(over: Partial<TenantMember> = {}): TenantMember {
  return {
    userId: 'u-outro',
    email: 'outro@x.com',
    fullName: 'Outro',
    role: TenantRole.Member,
    joinedAt: '2026-05-05T00:00:00Z',
    roles: [],
    isMasterAdmin: false,
    ...over
  };
}

/** A tela é testada como objeto: as regras são síncronas e não tocam no DOM. */
function screenAs(myRole: TenantRole | -1, myId = 'u-eu'): TenantMembersComponent {
  const c = Object.create(TenantMembersComponent.prototype) as TenantMembersComponent;
  c.myRole = myRole;
  c.currentUserId = myId;
  return c;
}

describe('TenantMembersComponent.canManage', () => {
  it('deixa um Admin gerenciar um Member', () => {
    expect(screenAs(TenantRole.Admin).canManage(member())).toBe(true);
  });

  it('deixa um Owner gerenciar um Admin', () => {
    expect(screenAs(TenantRole.Owner).canManage(member({ role: TenantRole.Admin }))).toBe(true);
  });

  it('não deixa um Member gerenciar ninguém', () => {
    expect(screenAs(TenantRole.Member).canManage(member())).toBe(false);
  });

  it('não deixa ninguém mexer no Owner pela tela', () => {
    expect(screenAs(TenantRole.Owner).canManage(member({ role: TenantRole.Owner }))).toBe(false);
  });

  it('não deixa o usuário editar o próprio cargo', () => {
    const eu = member({ userId: 'u-eu', role: TenantRole.Admin });
    expect(screenAs(TenantRole.Admin, 'u-eu').canManage(eu)).toBe(false);
  });

  it('não deixa gerenciar quando nem se sabe o próprio cargo', () => {
    expect(screenAs(-1).canManage(member())).toBe(false);
  });
});
```

- [ ] **Passo 2: rodar e ver passar**

O `karma.conf.js` deste repo é o padrão interativo (`singleRun: false`,
`browsers: ['Chrome']`), então **passe as flags na linha de comando**:

```bash
npx ng test --watch=false --browsers=ChromeHeadless \
  --include='src/app/modules/admin/tenant-members/tenant-members.component.spec.ts'
```

Esperado: `Executed 6 of 6 SUCCESS`. Se algum falhar, o bug está no `canManage` da
Task 2, não no teste — leia a asserção antes de mexer no spec.

**Se o Chrome não subir neste ambiente, não invente infraestrutura de teste.** Apague o
spec, registre o motivo no commit, e cubra `canManage` no smoke test da Task 6 — os casos
"Member não vê dropdown", "Owner não é editável" e "não edito meu próprio cargo" são todos
observáveis na tela.

- [ ] **Passo 3: ver o teste morder**

Um teste que nunca falhou não prova nada. Em `tenant-members.component.ts`, afrouxe a
regra de propósito, tirando a cláusula que impede editar o próprio cargo:

```ts
    return iAmAdmin
      && member.role !== TenantRole.Owner;
```

Rodar de novo. Esperado: **1 de 6 falha**, exatamente
`não deixa o usuário editar o próprio cargo`. Depois **restaure** a linha
`&& member.userId !== this.currentUserId;` e confirme que volta a 6 de 6.

- [ ] **Passo 4: commit**

```bash
git add src/app/modules/admin/tenant-members/tenant-members.component.spec.ts
git commit -F- <<'EOF'
test(admin): pin down who may manage whom on the member screen

Six cases, including the two that would be a security smell if they flipped:
nobody edits their own job title, and the Owner is not editable from the screen.
EOF
```

---

## Task 4: rotas e menu — três entradas viram uma

Aqui morre a verruga achada no smoke test de 2026-08-18: `admin/tenant` é a **única rota
admin sem `canActivate`**, e é por isso que "Tenant" aparecia no menu de um Member simples.

**Arquivos:**
- Modificar: `src/app/app.routes.ts`
- Modificar: `src/app/shared/components/layout/layout.component.ts`

- [ ] **Passo 1: trocar as rotas**

Em `app.routes.ts`, substituir as quatro linhas de rotas admin (hoje nas linhas 90-96) por:

```ts
      { path: 'admin/permissions', component: PermissionsManagementComponent,
        canActivate: [resourceAccessGuard], data: { resource: 'Permission.Management', requiredLevel: PermissionLevel.Read } },
      { path: 'admin/members', component: TenantMembersComponent,
        canActivate: [resourceAccessGuard], data: { resource: 'User.Management', requiredLevel: PermissionLevel.Read } },
      // As duas telas antigas foram fundidas em /admin/members. O redirect existe só
      // para não quebrar link salvo; /admin/tenant era a única rota admin sem guard,
      // e o destino tem.
      { path: 'admin/users-roles', redirectTo: 'admin/members', pathMatch: 'full' },
      { path: 'admin/tenant', redirectTo: 'admin/members', pathMatch: 'full' },
```

- [ ] **Passo 2: tirar os imports que sobraram**

Remover de `app.routes.ts` as linhas 16 e 17:

```ts
import { UsersRolesManagementComponent } from './modules/admin/users-roles-management.component';
import { TenantManagementComponent } from './modules/admin/tenant-management.component';
```

- [ ] **Passo 3: o menu**

Em `layout.component.ts`, substituir os três itens do bloco `Administração`
(`Roles por Usuário`, `Tenant`, `Membros do Tenant`) por um só, mantendo `Permissões por
Role` como está:

```ts
        {
          label: 'Membros',
          icon: 'group',
          route: '/admin/members',
          resourceCode: 'User.Management'
        }
```

- [ ] **Passo 4: conferir que não sobrou referência**

```bash
grep -rn "admin/users-roles\|admin/tenant\b" src/app --include=*.ts --include=*.html
```

Esperado: **só** as duas linhas de `redirectTo` em `app.routes.ts`. Se
`admin-panel.component.html` aparecer, tudo bem — ele é apagado na Task 5.

- [ ] **Passo 5: build**

```bash
npm run build:prod
```

Esperado: zero erro.

- [ ] **Passo 6: commit**

```bash
git add src/app/app.routes.ts src/app/shared/components/layout/layout.component.ts
git commit -F- <<'EOF'
refactor(admin): collapse three admin entries into one

/admin/users-roles and /admin/tenant now redirect to /admin/members. This also
retires the only admin route that had no canActivate, which is why "Tenant"
showed up in a plain Member's menu.
EOF
```

---

## Task 5: apagar o que ficou órfão

**Arquivos:**
- Apagar: `src/app/modules/admin/users-roles-management.component.{ts,html,scss}`
- Apagar: `src/app/modules/admin/tenant-management.component.{ts,html,scss}`
- Apagar: `src/app/modules/admin/admin-panel.component.{ts,html,scss}`

`AdminPanelComponent` é **código morto desde antes deste item** — achado registrado em
2026-08-24: não é roteado em `app.routes.ts` nem importado por ninguém. Ele some agora
porque o `admin-panel.component.html` referencia as três rotas que este plano funde, e
deixá-lo vivo deixaria links quebrados num arquivo que ninguém abre.

- [ ] **Passo 1: provar que estão órfãos antes de apagar**

```bash
grep -rn "UsersRolesManagementComponent\|TenantManagementComponent\|AdminPanelComponent" src/ --include=*.ts
```

Esperado: **nada** (a Task 4 já tirou os dois imports). Se aparecer alguma referência,
pare e resolva — não apague com referência viva.

- [ ] **Passo 2: apagar**

```bash
git rm src/app/modules/admin/users-roles-management.component.ts \
       src/app/modules/admin/users-roles-management.component.html \
       src/app/modules/admin/users-roles-management.component.scss \
       src/app/modules/admin/tenant-management.component.ts \
       src/app/modules/admin/tenant-management.component.html \
       src/app/modules/admin/tenant-management.component.scss \
       src/app/modules/admin/admin-panel.component.ts \
       src/app/modules/admin/admin-panel.component.html \
       src/app/modules/admin/admin-panel.component.scss
```

- [ ] **Passo 3: build e verificador de tokens**

```bash
npm run build:prod
```

```bash
bash .claude/skills/design-sync/check-tokens.sh
```

Esperado: zero erro nos dois.

- [ ] **Passo 4: commit**

```bash
git add -A src/app/modules/admin/
git commit -F- <<'EOF'
chore(admin): delete the screens the merge replaced

users-roles-management and tenant-management are absorbed by the member screen.
admin-panel goes with them: it had been dead code for months — never routed,
never imported — and it linked to the two routes this merge retires.
EOF
```

---

## Task 6: verificação contra a API viva

O padrão do projeto: build limpo prova compilação, não comportamento. O que pegou os bugs
reais (o reseed da fase 1, o corpo divergente do token no item 4) foi dirigir a app.

**Pré-requisito — a ordem que evita o `MSB3027`:** subir Postgres, **depois** a API.

```bash
cd ~/source/repos/SaaSBasePlatform && docker compose up -d
dotnet run --project Prumo.Api        # localhost:5201
```

```bash
cd ~/source/repos/SaaSBasePlatform-Angular && npm start   # localhost:4200
```

- [ ] **Passo 1: como admin, a tela abre e mostra os dois níveis**

Entrar como o admin semeado, selecionar um tenant, ir em **Administração › Membros**.

Conferir: a lista carrega; o menu de Administração tem **duas** entradas (Permissões por
Role, Membros) e nenhuma "Tenant" nem "Roles por Usuário"; o rodapé mostra
`Tenant: <nome> (<slug>)`; o admin aparece com o selo `master`.

- [ ] **Passo 2: a linha expande e as chaves batem com o backend**

Clicar na linha de um Member que tenha a role `RH`. A linha expande e `RH` aparece
marcado, os demais desmarcados. Confirmar contra a API:

```bash
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:5201/api/tenants/$TENANT_ID/members | jq '.[] | {email, role, roles}'
```

Esperado: o `roles` do JSON é exatamente o que a linha desenha.

- [ ] **Passo 3: conceder e revogar uma chave**

Marcar `Financeiro` no painel. Esperado: snackbar de sucesso e o chip fica aceso.
Desmarcar. Esperado: apaga. Recarregar a página (F5) e confirmar que o estado persistiu —
é o que prova que a releitura do servidor está funcionando e não só o otimismo local.

- [ ] **Passo 4: trocar o cargo**

No dropdown de um Member, escolher `Admin`. Esperado: snackbar
"<nome> agora é Admin.". Recarregar e confirmar que ficou. Voltar para `Membro`.

- [ ] **Passo 5: os limites da tela**

- O **Owner** do tenant: cargo aparece como texto, sem dropdown, e sem botão de remover.
- **Você mesmo**: sua própria linha não tem dropdown nem remover.
- Entrar como um **Member só com RH**: `/admin/members` deve dar **403 / redirect do
  guard** (o `resourceAccessGuard` com `User.Management`), e o menu não deve mostrar
  "Membros".
- Abrir `http://localhost:4200/admin/tenant` na barra: deve **redirecionar** para
  `/admin/members` (e, para o Member, cair no guard).

- [ ] **Passo 6: remover membro**

Criar um usuário descartável (`POST /tenants/{id}/users` com `Role: 0`), removê-lo pela
tela, e confirmar que some da lista. Confirmar pela API que a **conta continua existindo**
(`GET /auth/users/lookup?email=…` responde) — o que prova que a tela removeu do tenant e
não desativou a conta.

- [ ] **Passo 7: parar a API antes de qualquer `dotnet test`**

```powershell
Get-Process -Name "Prumo.Api" | Stop-Process -Force
```

Com a API rodando, `dotnet test` falha com `MSB3027` — o processo trava as DLLs.
Este plano não muda o backend, então a suíte .NET deve seguir em **101 testes**; rodar
uma vez ao fim é a prova barata de que nada vazou para lá.

- [ ] **Passo 8: registrar o resultado**

Anotar no fim deste arquivo uma seção `## Registro de execução (data)` com: o que foi
verificado, quantas telas/respostas, e **os erros do plano** que a execução revelou. É o
que tornou os planos anteriores mais úteis que a memória.

---

## Task 7: fechar o item no backlog

**Arquivos:**
- Modificar: `~/source/repos/SaaSBasePlatform/docs/MVP-BACKLOG.md` (repo **backend**)

- [ ] **Passo 1: marcar o item 5**

Trocar o cabeçalho da linha 114 de `## 5. Fundir as telas de membros — CONVERSAR ANTES`
para `## 5. Fundir as telas de membros — ✅ FEITO em 2026-08-26`, e acrescentar logo abaixo
do bloco de decisão o que ficou **fora**, com o motivo:

```markdown
**Feito em 2026-08-26.** Duas decisões estreitaram o escopo na execução:
o rodapé de dados do tenant ficou **só-leitura** (nenhum `PUT /api/tenants/{id}` foi
criado — vira item próprio se editar o tenant fizer falta), e o botão
**"Desativar usuário"** (`DELETE /api/auth/users/{id}`, que vale em **todos** os
tenants) **saiu da tela**: numa tela por tenant, ele ficaria ao lado de "remover deste
tenant" com ícone quase igual e raio de ação muito maior. O endpoint segue vivo, sem UI.
```

- [ ] **Passo 2: atualizar a ordem da semana**

Na seção "Ordem sugerida", marcar o item 5 como feito e apontar o **item 3** como próximo.

- [ ] **Passo 3: commit no repo backend**

```bash
cd ~/source/repos/SaaSBasePlatform
git add docs/MVP-BACKLOG.md
git commit -F- <<'EOF'
docs: close backlog item 5

The three admin screens are one. Records the two scope calls made while
executing: the tenant footer is read-only, and the global "deactivate user"
button is gone from a per-tenant screen.
EOF
```

---

## Revisão do plano

**Cobertura do item 5.** Linha expansível → Task 2. Cargo no dropdown da linha → Task 2.
Feature roles no painel → Task 2. `/admin/members` e `/admin/tenant` somem do menu →
Task 4. Dados do tenant preservados → rodapé na Task 2. `[+ Adicionar membro]` como ponto
de entrada do item 8 → mantido, `AddMemberDialogComponent` intocado. Os **dois níveis**
visíveis (o risco que o backlog levantou) → cargo na linha + chaves no painel, e a Task 3
prende a regra de quem edita o quê.

**Dependência do item 4:** satisfeita e verificada — `TenantMemberDto` já tem
`Roles` e `IsMasterAdmin`, e o `TenantMember` do Angular também. Nenhuma chamada por
membro na carga da lista.

**O que este plano deliberadamente não faz:** não cria endpoint, não toca
`api.service.ts`, não mexe em `PermissionsController` (aquele controller não tem
`{tenantId}` na rota — é item próprio, junto do item 3), e não traz as outras classes base
do design system além de `.role-chip`.
