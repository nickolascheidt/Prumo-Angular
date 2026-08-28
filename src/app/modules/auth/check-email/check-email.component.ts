import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '@core/services';
import { AuthShellComponent } from '../auth-shell/auth-shell.component';

/**
 * "Confirme seu e-mail". Chega-se aqui pelo cadastro e pelo login recusado com
 * `email_not_confirmed`.
 */
@Component({
  selector: 'app-check-email',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatIconModule, MatSnackBarModule, AuthShellComponent],
  templateUrl: './check-email.component.html',
  styleUrls: ['./check-email.component.scss']
})
export class CheckEmailComponent implements OnInit {
  email = '';
  isResending = false;

  constructor(
    private route: ActivatedRoute,
    private api: ApiService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.email = this.route.snapshot.queryParamMap.get('email') ?? '';
  }

  resend(): void {
    if (!this.email) return;

    this.isResending = true;
    this.api.resendConfirmation(this.email).subscribe({
      // A API responde 202 mesmo para endereço sem conta ou já confirmado. A mensagem
      // aqui é a mesma nos três casos, de propósito.
      next: () => {
        this.isResending = false;
        this.snackBar.open('Se houver uma confirmação pendente, o e-mail foi reenviado.', 'Fechar', { duration: 5000 });
      },
      error: () => {
        this.isResending = false;
        this.snackBar.open('Não foi possível reenviar agora. Tente de novo em instantes.', 'Fechar',
          { duration: 5000, panelClass: 'error-snackbar' });
      }
    });
  }
}
