import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { PrumoMarkComponent } from '../../../shared/components/brand/prumo-mark.component';

/**
 * A moldura das telas de autenticação: fundo, coluna de marca, cartão e rodapé.
 *
 * Nasceu quando o item 8 trouxe cinco telas novas para o lado de fora do login. Copiar o
 * SCSS do login seis vezes garantiria que uma delas ficasse para trás no próximo ajuste de
 * design — a moldura é a mesma, então é um componente só. O rebranding provou o ponto: a
 * troca de fundo e a coluna de marca foram uma edição, não sete.
 *
 * O cabeçalho do cartão (ícone + título + subtítulo) é opcional. O login não passa nenhum:
 * com a coluna de marca ao lado, repetir "Prumo ERP" dentro do cartão só empurra o
 * formulário para baixo. As outras seis passam, porque ali o título é o assunto da tela
 * ("Confirme seu e-mail"), não a marca.
 */
@Component({
  selector: 'app-auth-shell',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, PrumoMarkComponent],
  template: `
    <div class="auth-page">
      <!-- O eco do prumo: uma massa circular de baixo contraste e duas verticais
           finas. Sem blur — a versão anterior usava orbes borradas em rosa e azul,
           que eram do tema roxo e não da marca. -->
      <div class="auth-page__wash" aria-hidden="true"></div>
      <div class="auth-page__plumb auth-page__plumb--near" aria-hidden="true"></div>
      <div class="auth-page__plumb auth-page__plumb--far" aria-hidden="true"></div>

      <div class="auth-page__content">
        <div class="auth-brand">
          <!-- label vazio: o wordmark ao lado já é o nome, e o leitor de tela
               não precisa ouvir "Prumo" duas vezes. -->
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
  /** Vazio esconde o cabeçalho do cartão inteiro. É o caso do login. */
  @Input() title = '';
  @Input() subtitle = '';
  @Input() icon = '';
}
