import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { AuthService } from '@core/services';
import { AuthShellComponent } from '../auth-shell/auth-shell.component';

/**
 * Onde para quem confirmou o e-mail e não pertence a empresa nenhuma.
 *
 * Antes do item 8 essa pessoa levava um snackbar e um logout imediato, o que parecia erro
 * de senha. Não é erro: a conta está certa, só falta alguém adicioná-la.
 */
@Component({
  selector: 'app-awaiting-invitation',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, AuthShellComponent],
  templateUrl: './awaiting-invitation.component.html',
  styleUrls: ['./awaiting-invitation.component.scss']
})
export class AwaitingInvitationComponent {
  readonly email = this.authService.getCurrentUser()?.email ?? '';

  constructor(private authService: AuthService, private router: Router) {}

  signOut(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}
