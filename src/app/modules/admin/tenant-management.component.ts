import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { ApiService, AuthService } from '@core/services';
import {
  Tenant,
  TenantMember,
  TenantRole,
  ApiKey,
  ApiKeyType,
  CreateApiKeyResponse
} from '@core/models';

@Component({
  selector: 'app-tenant-management',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    MatTabsModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  templateUrl: './tenant-management.component.html',
  styleUrls: ['./tenant-management.component.scss']
})
export class TenantManagementComponent implements OnInit {
  tenantId: string | null = null;
  tenant: Tenant | null = null;

  members: TenantMember[] = [];
  membersLoading = false;
  memberColumns = ['email', 'fullName', 'role', 'joinedAt', 'actions'];
  addMemberForm!: FormGroup;
  isAddingMember = false;

  apiKeys: ApiKey[] = [];
  apiKeysLoading = false;
  apiKeyColumns = ['name', 'type', 'prefix', 'createdAt', 'expiresAt', 'lastUsedAt', 'status', 'actions'];
  createKeyForm!: FormGroup;
  isCreatingKey = false;
  newlyCreatedKey: CreateApiKeyResponse | null = null;

  TenantRole = TenantRole;
  ApiKeyType = ApiKeyType;
  tenantRoles = [TenantRole.Member, TenantRole.Admin, TenantRole.Owner];
  apiKeyTypes = [ApiKeyType.Anon, ApiKeyType.Service];

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private auth: AuthService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.tenantId = this.auth.getCurrentTenantId();
    this.addMemberForm = this.fb.group({
      userId: ['', [Validators.required]],
      role: [TenantRole.Member, [Validators.required]]
    });
    this.createKeyForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      type: [ApiKeyType.Anon, [Validators.required]],
      expiresAt: [null]
    });

    if (!this.tenantId) {
      this.snackBar.open('Nenhum tenant selecionado', 'Fechar', { duration: 5000 });
      return;
    }

    this.loadTenant();
    this.loadMembers();
    this.loadApiKeys();
  }

  loadTenant(): void {
    if (!this.tenantId) return;
    this.api.getTenantById(this.tenantId).subscribe({
      next: t => this.tenant = t,
      error: err => this.snackBar.open(err?.error?.message || 'Erro ao carregar tenant', 'Fechar', { duration: 5000 })
    });
  }

  loadMembers(): void {
    if (!this.tenantId) return;
    this.membersLoading = true;
    this.api.getTenantMembers(this.tenantId).subscribe({
      next: m => { this.members = m; this.membersLoading = false; },
      error: err => {
        this.membersLoading = false;
        this.snackBar.open(err?.error?.message || 'Erro ao carregar membros', 'Fechar', { duration: 5000 });
      }
    });
  }

  addMember(): void {
    if (!this.tenantId || this.addMemberForm.invalid) return;
    this.isAddingMember = true;
    this.api.addTenantMember(this.tenantId, this.addMemberForm.value).subscribe({
      next: () => {
        this.snackBar.open('Membro adicionado', 'Fechar', { duration: 3000 });
        this.addMemberForm.reset({ userId: '', role: TenantRole.Member });
        this.loadMembers();
      },
      error: err => this.snackBar.open(err?.error?.message || 'Erro ao adicionar membro', 'Fechar', { duration: 5000 }),
      complete: () => { this.isAddingMember = false; }
    });
  }

  removeMember(userId: string): void {
    if (!this.tenantId) return;
    if (!confirm('Remover este membro do tenant?')) return;
    this.api.removeTenantMember(this.tenantId, userId).subscribe({
      next: () => {
        this.snackBar.open('Membro removido', 'Fechar', { duration: 3000 });
        this.loadMembers();
      },
      error: err => this.snackBar.open(err?.error?.message || 'Erro ao remover membro', 'Fechar', { duration: 5000 })
    });
  }

  loadApiKeys(): void {
    if (!this.tenantId) return;
    this.apiKeysLoading = true;
    this.api.listApiKeys(this.tenantId).subscribe({
      next: k => { this.apiKeys = k; this.apiKeysLoading = false; },
      error: err => {
        this.apiKeysLoading = false;
        this.snackBar.open(err?.error?.message || 'Erro ao carregar API keys', 'Fechar', { duration: 5000 });
      }
    });
  }

  createApiKey(): void {
    if (!this.tenantId || this.createKeyForm.invalid) return;
    this.isCreatingKey = true;
    const raw = this.createKeyForm.value;
    const payload = {
      name: raw.name,
      type: raw.type,
      expiresAt: raw.expiresAt ? new Date(raw.expiresAt).toISOString() : null
    };
    this.api.createApiKey(this.tenantId, payload).subscribe({
      next: (resp) => {
        this.newlyCreatedKey = resp;
        this.snackBar.open('API key criada — copie-a agora!', 'Fechar', { duration: 5000 });
        this.createKeyForm.reset({ name: '', type: ApiKeyType.Anon, expiresAt: null });
        this.loadApiKeys();
      },
      error: err => this.snackBar.open(err?.error?.message || 'Erro ao criar API key', 'Fechar', { duration: 5000 }),
      complete: () => { this.isCreatingKey = false; }
    });
  }

  revokeApiKey(apiKeyId: string): void {
    if (!this.tenantId) return;
    if (!confirm('Revogar esta API key?')) return;
    this.api.revokeApiKey(this.tenantId, apiKeyId).subscribe({
      next: () => {
        this.snackBar.open('API key revogada', 'Fechar', { duration: 3000 });
        this.loadApiKeys();
      },
      error: err => this.snackBar.open(err?.error?.message || 'Erro ao revogar API key', 'Fechar', { duration: 5000 })
    });
  }

  copyKey(): void {
    if (!this.newlyCreatedKey) return;
    navigator.clipboard.writeText(this.newlyCreatedKey.key);
    this.snackBar.open('Chave copiada', 'Fechar', { duration: 2000 });
  }

  dismissNewKey(): void {
    this.newlyCreatedKey = null;
  }

  roleLabel(role: TenantRole): string { return TenantRole[role]; }
  apiKeyTypeLabel(t: ApiKeyType): string { return ApiKeyType[t]; }

  isRevoked(k: ApiKey): boolean { return !!k.revokedAt; }
  isExpired(k: ApiKey): boolean { return !!k.expiresAt && new Date(k.expiresAt) < new Date(); }
}
