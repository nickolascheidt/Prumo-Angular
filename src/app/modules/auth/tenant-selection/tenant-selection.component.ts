import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '@core/services';
import { TenantMembership, TenantRole, tenantRoleLabel } from '@core/models';

@Component({
  selector: 'app-tenant-selection',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
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
  TenantRole = TenantRole;

  constructor(
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadMemberships();
  }

  loadMemberships(): void {
    this.isLoading = true;
    this.authService.loadMyMemberships().subscribe({
      next: (data) => {
        this.memberships = data;
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.snackBar.open(err?.error?.message || 'Failed to load tenants', 'Close', { duration: 5000 });
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
        this.snackBar.open(err?.error?.message || 'Failed to select the tenant', 'Close', { duration: 5000 });
      }
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }

  roleLabel(role: TenantRole): string {
    return tenantRoleLabel(role);
  }
}
