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
          this.snackBar.open('Login realizado com sucesso!', 'Fechar', { duration: 3000 });
          this.router.navigate(['/dashboard']);
          return;
        }
        // Otherwise decide based on how many tenants the user can access.
        this.routeByMemberships();
      },
      error: (error) => {
        this.isLoading = false;

        // A senha está certa e o e-mail nunca foi confirmado. A API manda um `code`
        // próprio justamente para esta tela não tratar o caso como senha errada.
        if (error?.error?.code === 'email_not_confirmed') {
          this.router.navigate(['/auth/check-email'], {
            queryParams: { email: this.loginForm.value.email }
          });
          return;
        }

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
          // Não é erro de credencial: a conta está certa e só falta alguém adicioná-la a
          // uma empresa. Antes isto era um snackbar vermelho seguido de logout, que lia
          // como falha de senha.
          this.router.navigate(['/auth/awaiting-invitation']);
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
