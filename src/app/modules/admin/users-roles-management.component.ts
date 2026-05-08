import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApiService, AuthService } from '@core/services';
import { AppUserSummary } from '@core/models';

@Component({
  selector: 'app-users-roles-management',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule
  ],
  templateUrl: './users-roles-management.component.html',
  styleUrls: ['./users-roles-management.component.scss']
})
export class UsersRolesManagementComponent implements OnInit {
  readonly usersColumns: string[] = ['fullName', 'email', 'rolesCount', 'actions'];
  readonly availableRoles: string[] = ['Administrador', 'Funcionario', 'Usuario', 'Cliente'];

  users: AppUserSummary[] = [];
  filteredUsers: AppUserSummary[] = [];
  selectedUser: AppUserSummary | null = null;
  selectedUserRoles: string[] = [];

  searchText = '';
  roleToAssign = '';

  isLoadingUsers = false;
  isLoadingRoles = false;
  isSavingRole = false;

  get assignableRoles(): string[] {
    return this.availableRoles.filter(role => !this.selectedUserRoles.includes(role));
  }

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    const tenantId = this.authService.getCurrentTenantId();
    if (!tenantId) {
      this.showErrorMessage('Nenhum tenant selecionado.');
      return;
    }
    this.isLoadingUsers = true;
    this.apiService.getTenantMembers(tenantId).subscribe({
      next: (members) => {
        this.users = members.map(m => ({
          id: m.userId,
          email: m.email,
          fullName: m.fullName ?? '',
          roles: []
        }));
        this.applyFilter();
        this.isLoadingUsers = false;
      },
      error: (error: HttpErrorResponse) => {
        this.isLoadingUsers = false;
        this.showError('Nao foi possivel carregar membros do tenant', error);
      }
    });
  }

  onSearchInput(event: Event): void {
    this.searchText = (event.target as HTMLInputElement)?.value ?? '';
    this.applyFilter();
  }

  selectUser(user: AppUserSummary): void {
    this.selectedUser = user;
    this.roleToAssign = '';
    this.loadSelectedUserRoles();
  }

  assignRole(): void {
    if (!this.selectedUser || !this.roleToAssign) {
      return;
    }

    if (this.selectedUserRoles.includes(this.roleToAssign)) {
      this.showErrorMessage(`Usuario ja possui a role '${this.roleToAssign}'.`);
      return;
    }

    this.isSavingRole = true;
    this.apiService.assignRoleToUser(this.selectedUser.id, { 
      roleName: this.roleToAssign,
      email: this.selectedUser.email
    }).subscribe({
      next: (response) => {
        this.isSavingRole = false;
        this.showSuccess(response.message || 'Role atribuida com sucesso.');
        this.roleToAssign = '';
        this.loadSelectedUserRoles();
      },
      error: (error: HttpErrorResponse) => {
        this.isSavingRole = false;
        console.error('[Users Roles] Erro ao atribuir role:', error);
        console.error('[Users Roles] Status:', error.status);
        console.error('[Users Roles] Response Body:', error.error);
        this.showError('Nao foi possivel atribuir role', error);
      }
    });
  }

  deleteUser(user: AppUserSummary): void {
    const confirmed = confirm(`Deseja desativar o usuario "${user.fullName}" (${user.email})?\n\nO usuario perdera acesso ao sistema.`);
    if (!confirmed) {
      return;
    }

    this.apiService.deleteUser(user.id).subscribe({
      next: () => {
        this.users = this.users.filter(u => u.id !== user.id);
        this.applyFilter();
        if (this.selectedUser?.id === user.id) {
          this.selectedUser = null;
          this.selectedUserRoles = [];
        }
        this.showSuccess(`Usuario "${user.fullName}" desativado com sucesso.`);
      },
      error: (error: HttpErrorResponse) => {
        if (error.status === 400) {
          this.showErrorMessage('Nao e possivel desativar o proprio usuario.');
        } else {
          this.showError('Nao foi possivel desativar o usuario', error);
        }
      }
    });
  }

  removeRole(roleName: string): void {
    if (!this.selectedUser) {
      return;
    }

    const confirmed = confirm(`Deseja remover a role "${roleName}" do usuario "${this.selectedUser.fullName}"?`);
    if (!confirmed) {
      return;
    }

    this.isSavingRole = true;
    this.apiService.removeRoleFromUser(this.selectedUser.id, roleName).subscribe({
      next: (response) => {
        this.isSavingRole = false;
        this.showSuccess(response.message || 'Role removida com sucesso.');
        this.loadSelectedUserRoles();
      },
      error: (error: HttpErrorResponse) => {
        this.isSavingRole = false;
        this.showError('Nao foi possivel remover role', error);
      }
    });
  }

  private loadSelectedUserRoles(): void {
    if (!this.selectedUser) {
      return;
    }

    this.isLoadingRoles = true;
    this.apiService.getUserRoles(this.selectedUser.id).subscribe({
      next: (response) => {
        this.selectedUserRoles = response.roles || [];

        const userIndex = this.users.findIndex(u => u.id === this.selectedUser?.id);
        if (userIndex >= 0) {
          this.users[userIndex] = {
            ...this.users[userIndex],
            roles: [...this.selectedUserRoles]
          };
          this.applyFilter();
        }

        this.isLoadingRoles = false;
      },
      error: (error: HttpErrorResponse) => {
        this.isLoadingRoles = false;
        this.showError('Nao foi possivel carregar roles do usuario', error);
      }
    });
  }

  private applyFilter(): void {
    const term = this.searchText.trim().toLowerCase();
    if (!term) {
      this.filteredUsers = [...this.users];
      return;
    }

    this.filteredUsers = this.users.filter(user =>
      user.fullName.toLowerCase().includes(term) ||
      user.email.toLowerCase().includes(term)
    );
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Fechar', { duration: 3000 });
  }

  private showError(prefix: string, error: HttpErrorResponse): void {
    const backendMessage = this.extractHttpErrorMessage(error);
    const message = backendMessage ? `${prefix}: ${backendMessage}` : prefix;
    this.snackBar.open(message, 'Fechar', { duration: 5000 });
  }

  private showErrorMessage(message: string): void {
    this.snackBar.open(message, 'Fechar', { duration: 4000 });
  }

  private extractHttpErrorMessage(error: HttpErrorResponse): string | null {
    const errorBody = error?.error;

    console.log('[extractHttpErrorMessage] Error body type:', typeof errorBody);
    console.log('[extractHttpErrorMessage] Error body:', errorBody);
    console.log('[extractHttpErrorMessage] Full error:', error);

    // Se for string pura, retorna logo
    if (typeof errorBody === 'string' && errorBody.trim()) {
      console.log('[extractHttpErrorMessage] Retornando string:', errorBody);
      return errorBody;
    }

    // Tenta extrair de errors (RFC 7231 Problem Details)
    if (errorBody?.errors && typeof errorBody.errors === 'object') {
      const validationMessages = Object.entries(errorBody.errors as Record<string, any>)
        .map(([key, value]) => {
          if (Array.isArray(value)) {
            return value.filter((v): v is string => typeof v === 'string' && v.trim().length > 0);
          }
          if (typeof value === 'string' && value.trim().length > 0) {
            return [value];
          }
          return [];
        })
        .flat();

      if (validationMessages.length > 0) {
        console.log('[extractHttpErrorMessage] Retornando validation messages:', validationMessages);
        return validationMessages.join(' | ');
      }
    }

    // Tenta extrair message
    if (errorBody?.message && typeof errorBody.message === 'string' && errorBody.message.trim()) {
      console.log('[extractHttpErrorMessage] Retornando message:', errorBody.message);
      return errorBody.message;
    }

    // Tenta extrair detail
    if (errorBody?.detail && typeof errorBody.detail === 'string' && errorBody.detail.trim()) {
      console.log('[extractHttpErrorMessage] Retornando detail:', errorBody.detail);
      return errorBody.detail;
    }

    // Fallback: retorna title genérico
    if (errorBody?.title && typeof errorBody.title === 'string' && errorBody.title.trim()) {
      console.log('[extractHttpErrorMessage] Retornando title (fallback):', errorBody.title);
      return errorBody.title;
    }

    console.log('[extractHttpErrorMessage] Nenhuma mensagem extraida');
    return null;
  }
}
