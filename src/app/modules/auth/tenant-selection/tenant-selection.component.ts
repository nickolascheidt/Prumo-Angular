import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService, ApiService } from '@core/services';
import { TenantMembership, TenantRole } from '@core/models';

@Component({
  selector: 'app-tenant-selection',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatListModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDividerModule
  ],
  templateUrl: './tenant-selection.component.html',
  styleUrls: ['./tenant-selection.component.scss']
})
export class TenantSelectionComponent implements OnInit {
  memberships: TenantMembership[] = [];
  isLoading = false;
  isSelecting = false;
  isCreating = false;
  createForm!: FormGroup;
  showCreateForm = false;
  TenantRole = TenantRole;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private apiService: ApiService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.createForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]]
    });
    this.loadMemberships();
  }

  loadMemberships(): void {
    this.isLoading = true;
    this.authService.loadMyMemberships().subscribe({
      next: (data) => {
        this.memberships = data;
        this.isLoading = false;
        if (!data.length) {
          this.showCreateForm = true;
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.snackBar.open(err?.error?.message || 'Erro ao carregar tenants', 'Fechar', { duration: 5000 });
      }
    });
  }

  select(tenantId: string): void {
    this.isSelecting = true;
    this.authService.selectTenant(tenantId).subscribe({
      next: () => {
        this.isSelecting = false;
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isSelecting = false;
        this.snackBar.open(err?.error?.message || 'Erro ao selecionar tenant', 'Fechar', { duration: 5000 });
      }
    });
  }

  toggleCreate(): void {
    this.showCreateForm = !this.showCreateForm;
  }

  create(): void {
    if (this.createForm.invalid) return;
    this.isCreating = true;
    this.apiService.createTenant(this.createForm.value).subscribe({
      next: (tenant) => {
        this.snackBar.open('Tenant criado!', 'Fechar', { duration: 3000 });
        this.select(tenant.id);
      },
      error: (err) => {
        this.isCreating = false;
        this.snackBar.open(err?.error?.message || 'Erro ao criar tenant', 'Fechar', { duration: 5000 });
      },
      complete: () => { this.isCreating = false; }
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }

  roleLabel(role: TenantRole): string {
    return TenantRole[role];
  }
}
