import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import { ApiService } from '@core/services';
import { AuthShellComponent } from '../auth-shell/auth-shell.component';

@Component({
  selector: 'app-forgot-password',
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
    AuthShellComponent
  ],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent implements OnInit {
  form!: FormGroup;
  isLoading = false;
  sent = false;

  constructor(private fb: FormBuilder, private api: ApiService) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.isLoading = true;

    this.api.forgotPassword(this.form.value.email).subscribe({
      // A tela mostra a mesma confirmação exista a conta ou não. Dizer "não encontramos
      // esse e-mail" transformaria esta tela num verificador de quem tem conta aqui.
      next: () => {
        this.isLoading = false;
        this.sent = true;
      },
      error: () => {
        this.isLoading = false;
        this.sent = true;
      }
    });
  }
}
