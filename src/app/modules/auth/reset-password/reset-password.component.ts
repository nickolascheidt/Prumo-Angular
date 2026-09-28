import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '@core/services';
import { AuthShellComponent } from '../auth-shell/auth-shell.component';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    AuthShellComponent
  ],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent implements OnInit {
  form!: FormGroup;
  isLoading = false;
  linkIsBroken = false;

  private userId = '';
  private token = '';

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.userId = this.route.snapshot.queryParamMap.get('uid') ?? '';
    this.token = this.route.snapshot.queryParamMap.get('token') ?? '';
    this.linkIsBroken = !this.userId || !this.token;

    this.form = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit(): void {
    if (this.form.invalid || this.linkIsBroken) return;

    this.isLoading = true;

    this.api.resetPassword(this.userId, this.token, this.form.value.password).subscribe({
      next: () => {
        this.isLoading = false;
        this.snackBar.open('Password changed. Sign in with the new password.', 'Close', { duration: 5000 });
        this.router.navigate(['/auth/login']);
      },
      error: (error) => {
        this.isLoading = false;
        const message = error?.error?.message
          || 'Invalid or expired link, or the password does not meet the requirements.';
        this.snackBar.open(message, 'Close', { duration: 6000, panelClass: 'error-snackbar' });
      }
    });
  }
}
