import { Component, Input } from '@angular/core';

/**
 * The Prumo mark: a solid square with a P cut out of it, whose stem is the plumb line
 * ("prumo" in Portuguese).
 *
 * Inline SVG rather than `<img src="assets/...">` for two reasons: the mark shows on
 * the toolbar of every route and on the login screen, and one more request for 341
 * bytes does not pay for itself; and inline, the drawing responds to `currentColor`
 * if the brand ever needs to follow the theme.
 *
 * The two faces exist because the square is opaque. `default` (dark square, mint
 * glyph) only reads on a light background; the toolbar and the login screen are
 * painted with the same `--color-primary-700` as the square, so there the default
 * mark disappears and leaves a loose P — which is why both screens use `inverse`.
 */
@Component({
  selector: 'app-prumo-mark',
  standalone: true,
  template: `
    <svg
      [attr.width]="size"
      [attr.height]="size"
      viewBox="0 0 40 40"
      role="img"
      [attr.aria-label]="label"
      focusable="false">
      <rect width="40" height="40" rx="11" [attr.fill]="squareFill"></rect>
      <path d="M13 9h3.6v22H13z" [attr.fill]="glyphFill"></path>
      <path
        d="M18.6 9H25a6.9 6.9 0 0 1 0 13.8h-6.4v-3.5H25a3.4 3.4 0 0 0 0-6.8h-6.4z"
        [attr.fill]="glyphFill"></path>
    </svg>
  `,
  styles: [`
    :host { display: inline-flex; line-height: 0; }
  `]
})
export class PrumoMarkComponent {
  /** Side of the mark in px. The drawing is pure geometry: it holds up at 16px without tweaks. */
  @Input() size = 32;

  /** `inverse` = mint square over a dark glyph, for dark backgrounds. */
  @Input() variant: 'default' | 'inverse' = 'default';

  /** Empty when the mark comes with the wordmark: otherwise screen readers read "Prumo" twice. */
  @Input() label = 'Prumo';

  get squareFill(): string {
    return this.variant === 'inverse' ? 'var(--color-brand-mint)' : 'var(--color-primary-700)';
  }

  get glyphFill(): string {
    return this.variant === 'inverse' ? 'var(--color-primary-700)' : 'var(--color-brand-mint)';
  }
}
