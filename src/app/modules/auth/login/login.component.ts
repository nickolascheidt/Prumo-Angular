import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '@core/services';
import { AuthShellComponent } from '../auth-shell/auth-shell.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    RouterLink,
    AuthShellComponent
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) return;

    this.isLoading = true;
    const { email, password } = this.loginForm.value;
    this.authService.login({ email, password }).subscribe({
      next: (response) => {
        // Token already bound to a tenant — go straight in.
        if (response.tenantId) {
          this.snackBar.open('Signed in', 'Close', { duration: 3000 });
          this.router.navigate(['/dashboard']);
          return;
        }
        // Otherwise decide based on how many tenants the user can access.
        this.routeByMemberships();
      },
      error: (error) => {
        this.isLoading = false;

        // The password is right and the e-mail was never confirmed. The API sends its own
        // `code` precisely so this screen does not treat the case as a wrong password.
        if (error?.error?.code === 'email_not_confirmed') {
          this.router.navigate(['/auth/check-email'], {
            queryParams: { email: this.loginForm.value.email }
          });
          return;
        }

        const message = error?.error?.message || 'Sign-in failed';
        this.snackBar.open(message, 'Close', { duration: 5000, panelClass: 'error-snackbar' });
      }
    });
  }

  /**
   * Post-login routing when the session is not yet bound to a tenant:
   * - 0 memberships  -> no access (creation is not allowed here)
   * - exactly 1      -> auto-select it and continue
   * - more than 1    -> show the tenant selection screen
   */
  private routeByMemberships(): void {
    this.authService.loadMyMemberships().subscribe({
      next: (memberships) => {
        if (memberships.length === 0) {
          this.isLoading = false;
          // Not a credentials error: the account is fine and someone just has to add it
          // to a company. This used to be a red snackbar followed by a logout, which read
          // like a wrong password.
          this.router.navigate(['/auth/awaiting-invitation']);
          return;
        }

        if (memberships.length === 1) {
          this.authService.selectTenant(memberships[0].tenantId).subscribe({
            next: () => {
              this.isLoading = false;
              this.snackBar.open('Signed in', 'Close', { duration: 3000 });
              this.router.navigate(['/dashboard']);
            },
            error: (error) => {
              this.isLoading = false;
              const message = error?.error?.message || 'Failed to select the tenant';
              this.snackBar.open(message, 'Close', { duration: 5000, panelClass: 'error-snackbar' });
            }
          });
          return;
        }

        this.isLoading = false;
        this.router.navigate(['/auth/select-tenant']);
      },
      error: (error) => {
        this.isLoading = false;
        const message = error?.error?.message || 'Failed to load tenants';
        this.snackBar.open(message, 'Close', { duration: 5000, panelClass: 'error-snackbar' });
      }
    });
  }
}
