import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

/**
 * A moldura das telas de autenticação: fundo com os orbes, cartão centralizado e a marca.
 *
 * Nasceu quando o item 8 trouxe cinco telas novas para o lado de fora do login. Copiar o
 * SCSS do login seis vezes garantiria que uma delas ficasse para trás no próximo ajuste de
 * design — a moldura é a mesma, então é um componente só.
 */
@Component({
  selector: 'app-auth-shell',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  template: `
    <div class="auth-page">
      <div class="auth-page__bg-orb auth-page__bg-orb--1"></div>
      <div class="auth-page__bg-orb auth-page__bg-orb--2"></div>

      <mat-card class="auth-card">
        <div class="auth-card__brand">
          <div class="auth-card__logo">
            <mat-icon>{{ icon }}</mat-icon>
          </div>
          <h1>{{ title }}</h1>
          <p>{{ subtitle }}</p>
        </div>

        <ng-content></ng-content>

        <p class="auth-card__footer">© 2026 Prumo</p>
      </mat-card>
    </div>
  `,
  styleUrls: ['./auth-shell.component.scss']
})
export class AuthShellComponent {
  @Input() title = 'Prumo ERP';
  @Input() subtitle = 'Sistema de Gestão de Funcionários';
  @Input() icon = 'hub';
}
