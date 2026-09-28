import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { PrumoMarkComponent } from '../../../shared/components/brand/prumo-mark.component';

/**
 * The frame of the authentication screens: background, brand column, card and footer.
 *
 * It was born when sign-up brought five new screens outside the login. Copying the login
 * SCSS six times would guarantee one of them fell behind on the next design tweak — the
 * frame is the same, so it is one component. The rebranding proved the point: the new
 * background and the brand column were one edit, not seven.
 *
 * The card header (icon + title + subtitle) is optional. The login passes none: with the
 * brand column next to it, repeating "Prumo ERP" inside the card only pushes the form
 * down. The other six pass one, because there the title is the subject of the screen
 * ("Confirm your e-mail"), not the brand.
 */
@Component({
  selector: 'app-auth-shell',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, PrumoMarkComponent],
  template: `
    <div class="auth-page">
      <!-- The plumb-line echo: a low-contrast circular mass and two thin verticals. No
           blur — the previous version used blurred pink and blue orbs, which belonged to
           the purple theme, not the brand. -->
      <div class="auth-page__wash" aria-hidden="true"></div>
      <div class="auth-page__plumb auth-page__plumb--near" aria-hidden="true"></div>
      <div class="auth-page__plumb auth-page__plumb--far" aria-hidden="true"></div>

      <div class="auth-page__content">
        <div class="auth-brand">
          <!-- Empty label: the wordmark next to it is already the name, and screen readers
               do not need to hear "Prumo" twice. -->
          <app-prumo-mark [size]="64" variant="inverse" label=""></app-prumo-mark>
          <span class="auth-brand__word">Prumo</span>
        </div>

        <mat-card class="auth-card">
          <div class="auth-card__brand" *ngIf="title">
            <div class="auth-card__logo" *ngIf="icon">
              <mat-icon>{{ icon }}</mat-icon>
            </div>
            <h1>{{ title }}</h1>
            <p *ngIf="subtitle">{{ subtitle }}</p>
          </div>

          <ng-content></ng-content>
        </mat-card>
      </div>

      <p class="auth-page__footer">© 2026 Prumo</p>
    </div>
  `,
  styleUrls: ['./auth-shell.component.scss']
})
export class AuthShellComponent {
  /** Empty hides the whole card header. That is the login's case. */
  @Input() title = '';
  @Input() subtitle = '';
  @Input() icon = '';
}
