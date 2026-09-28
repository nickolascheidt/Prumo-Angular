import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '@core/services';
import { AuthShellComponent } from '../auth-shell/auth-shell.component';

/**
 * "Confirm your e-mail". Reached from sign-up and from a login refused with
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
      // The API answers 202 even for an address without an account or already confirmed.
      // The message here is the same in all three cases, on purpose.
      next: () => {
        this.isResending = false;
        this.snackBar.open('If a confirmation was pending, the e-mail has been resent.', 'Close', { duration: 5000 });
      },
      error: () => {
        this.isResending = false;
        this.snackBar.open('Could not resend right now. Try again in a moment.', 'Close',
          { duration: 5000, panelClass: 'error-snackbar' });
      }
    });
  }
}
