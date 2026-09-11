import { Component, Input } from '@angular/core';

/**
 * O selo do Prumo: quadrado sólido com um P recortado, cuja haste é a vertical
 * do prumo. Substituiu o `<mat-icon>hub</mat-icon>` no rebranding.
 *
 * SVG inline e não `<img src="assets/...">` por dois motivos: o selo aparece na
 * toolbar de todas as rotas e no login, e uma requisição a mais para 341 bytes
 * não se paga; e inline o desenho responde a `currentColor` se um dia a marca
 * precisar acompanhar o tema.
 *
 * As duas faces existem porque o quadrado é opaco. `default` (quadrado escuro,
 * símbolo menta) só se lê sobre fundo claro; a toolbar e o login são pintados
 * com o mesmo `--color-primary-700` do quadrado, então ali o selo padrão some e
 * sobra um P solto — por isso as duas telas usam `inverse`.
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
  /** Lado do selo em px. O desenho é geometria pura: aguenta 16px sem ajuste. */
  @Input() size = 32;

  /** `inverse` = quadrado menta sobre símbolo escuro, para fundo escuro. */
  @Input() variant: 'default' | 'inverse' = 'default';

  /** Vazio quando o selo vem acompanhado do wordmark: senão o leitor de tela lê "Prumo" duas vezes. */
  @Input() label = 'Prumo';

  get squareFill(): string {
    return this.variant === 'inverse' ? 'var(--color-brand-mint)' : 'var(--color-primary-700)';
  }

  get glyphFill(): string {
    return this.variant === 'inverse' ? 'var(--color-primary-700)' : 'var(--color-brand-mint)';
  }
}
