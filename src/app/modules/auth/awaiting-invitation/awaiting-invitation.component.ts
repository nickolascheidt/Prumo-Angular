import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { AuthService } from '@core/services';
import { AuthShellComponent } from '../auth-shell/auth-shell.component';

/**
 * Where someone lands after confirming their e-mail when they belong to no company.
 *
 * This used to be a snackbar and an immediate logout, which looked like a wrong password.
 * It is not an error: the account is fine, someone just has to add it.
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
