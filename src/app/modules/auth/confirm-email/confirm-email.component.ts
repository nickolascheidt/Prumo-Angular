import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '@core/services';
import { AuthShellComponent } from '../auth-shell/auth-shell.component';

/**
 * O destino do link de confirmação. Não pede nada: lê `uid` e `token` da URL, chama a API
 * e mostra o resultado.
 */
@Component({
  selector: 'app-confirm-email',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    AuthShellComponent
  ],
  templateUrl: './confirm-email.component.html',
  styleUrls: ['./confirm-email.component.scss']
})
export class ConfirmEmailComponent implements OnInit {
  state: 'loading' | 'ok' | 'error' = 'loading';
  message = '';

  constructor(private route: ActivatedRoute, private api: ApiService) {}

  ngOnInit(): void {
    const userId = this.route.snapshot.queryParamMap.get('uid');
    const token = this.route.snapshot.queryParamMap.get('token');

    if (!userId || !token) {
      this.state = 'error';
      this.message = 'Este link está incompleto. Peça um novo e-mail de confirmação.';
      return;
    }

    this.api.confirmEmail(userId, token).subscribe({
      next: () => {
        this.state = 'ok';
      },
      error: (error) => {
        this.state = 'error';
        // Link expirado, já usado ou adulterado chegam com a mesma resposta da API —
        // distinguir os casos diria a um estranho quais contas existem.
        this.message = error?.error?.message
          || 'Link inválido ou expirado. Peça um novo e-mail de confirmação.';
      }
    });
  }
}
