import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { ApiService, AuthService } from '@core/services';
import {
  Tenant,
  TenantMember,
  TenantRole
} from '@core/models';

@Component({
  selector: 'app-tenant-management',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTabsModule
  ],
  templateUrl: './tenant-management.component.html',
  styleUrls: ['./tenant-management.component.scss']
})
export class TenantManagementComponent implements OnInit {
  tenantId: string | null = null;
  tenant: Tenant | null = null;

  members: TenantMember[] = [];
  membersLoading = false;
  memberColumns = ['email', 'fullName', 'role', 'joinedAt'];

  TenantRole = TenantRole;

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.tenantId = this.auth.getCurrentTenantId();

    if (!this.tenantId) {
      this.snackBar.open('Nenhum tenant selecionado', 'Fechar', { duration: 5000 });
      return;
    }

    this.loadTenant();
    this.loadMembers();
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

  roleLabel(role: TenantRole): string { return TenantRole[role]; }
}
