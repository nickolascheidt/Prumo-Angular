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
import { Router } from '@angular/router';
import { AuthService } from '@core/services';

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
    MatSnackBarModule
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
          this.snackBar.open('Login realizado com sucesso!', 'Fechar', { duration: 3000 });
          this.router.navigate(['/dashboard']);
          return;
        }
        // Otherwise decide based on how many tenants the user can access.
        this.routeByMemberships();
      },
      error: (error) => {
        this.isLoading = false;
        const message = error?.error?.message || 'Erro ao realizar login';
        this.snackBar.open(message, 'Fechar', { duration: 5000, panelClass: 'error-snackbar' });
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
          this.authService.logout();
          this.snackBar.open(
            'Sua conta não tem acesso a nenhum tenant. Contate um administrador.',
            'Fechar',
            { duration: 6000, panelClass: 'error-snackbar' }
          );
          return;
        }

        if (memberships.length === 1) {
          this.authService.selectTenant(memberships[0].tenantId).subscribe({
            next: () => {
              this.isLoading = false;
              this.snackBar.open('Login realizado com sucesso!', 'Fechar', { duration: 3000 });
              this.router.navigate(['/dashboard']);
            },
            error: (error) => {
              this.isLoading = false;
              const message = error?.error?.message || 'Erro ao selecionar tenant';
              this.snackBar.open(message, 'Fechar', { duration: 5000, panelClass: 'error-snackbar' });
            }
          });
          return;
        }

        this.isLoading = false;
        this.router.navigate(['/auth/select-tenant']);
      },
      error: (error) => {
        this.isLoading = false;
        const message = error?.error?.message || 'Erro ao carregar tenants';
        this.snackBar.open(message, 'Fechar', { duration: 5000, panelClass: 'error-snackbar' });
      }
    });
  }
}
