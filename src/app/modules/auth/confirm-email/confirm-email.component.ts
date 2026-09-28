import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '@core/services';
import { AuthShellComponent } from '../auth-shell/auth-shell.component';

/**
 * The target of the confirmation link. It asks for nothing: it reads `uid` and `token`
 * from the URL, calls the API and shows the result.
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
      this.message = 'This link is incomplete. Request a new confirmation e-mail.';
      return;
    }

    this.api.confirmEmail(userId, token).subscribe({
      next: () => {
        this.state = 'ok';
      },
      error: (error) => {
        this.state = 'error';
        // An expired, used or tampered link all get the same API answer — telling them
        // apart would tell a stranger which accounts exist.
        this.message = error?.error?.message
          || 'Invalid or expired link. Request a new confirmation e-mail.';
      }
    });
  }
}
