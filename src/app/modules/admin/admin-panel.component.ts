import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule, RouterModule],
  template: `
    <div class="admin-panel-container">
      <mat-card class="header-card">
        <mat-card-header>
          <mat-card-title>Painel Admin</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <p>
            Esta area concentra configuracoes administrativas e controles avancados do sistema.
          </p>
        </mat-card-content>
      </mat-card>

      <mat-card class="status-card">
        <mat-card-content>
          <div class="status-icon">
            <mat-icon>pending_actions</mat-icon>
          </div>
          <div class="status-text">
            <h3>Integracao com backend pendente</h3>
            <p>
              A interface do painel admin ja esta disponivel no frontend.
              Os endpoints de backend ainda precisam ser implementados para habilitar todas as funcoes.
            </p>
          </div>
        </mat-card-content>
      </mat-card>

      <mat-card class="next-steps-card">
        <mat-card-header>
          <mat-card-title>Acoes administrativas</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <p>Use as ferramentas abaixo para administrar permissoes e navegar entre as configuracoes.</p>
          <div class="action-buttons">
            <button mat-raised-button color="accent" routerLink="/admin/permissions">
              <mat-icon>security</mat-icon>
              Gerenciar permissoes por role
            </button>

            <button mat-raised-button color="primary" routerLink="/admin/users-roles">
              <mat-icon>manage_accounts</mat-icon>
              Gerenciar roles por usuario
            </button>

            <button mat-raised-button color="primary" routerLink="/dashboard">
              <mat-icon>arrow_back</mat-icon>
              Voltar ao Dashboard
            </button>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .admin-panel-container {
      padding: 20px;
      max-width: 1100px;
      margin: 0 auto;
      display: grid;
      gap: 20px;
    }

    .header-card mat-card-content p {
      margin: 0;
      color: #4a4a4a;
    }

    .status-card mat-card-content {
      display: flex;
      gap: 16px;
      align-items: flex-start;
    }

    .status-icon {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: #fff3e0;
      color: #ef6c00;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .status-text h3 {
      margin: 0 0 8px;
      font-size: 1.05rem;
    }

    .status-text p {
      margin: 0;
      color: #616161;
      line-height: 1.5;
    }

    .next-steps-card p {
      margin: 0 0 16px;
      color: #424242;
      line-height: 1.6;
    }

    .action-buttons {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }

    @media (max-width: 768px) {
      .status-card mat-card-content {
        flex-direction: column;
      }
    }
  `]
})
export class AdminPanelComponent {}
