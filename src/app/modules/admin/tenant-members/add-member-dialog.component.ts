import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApiService } from '@core/services';
import { InviteMemberResult } from '@core/models';

/**
 * Adicionar alguém é digitar um e-mail e escolher o cargo. Nada mais.
 *
 * Antes do item 8 este diálogo tinha dois modos: buscar uma conta existente ou **criar uma
 * conta com senha digitada pelo admin**. O segundo saiu — fazia a senha inicial de todo
 * membro passar pelo administrador. Agora, e-mail sem conta vira convite pendente, e a
 * própria pessoa escolhe a senha ao se cadastrar.
 */
@Component({
  selector: 'app-add-member-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <h2 mat-dialog-title>Adicionar membro</h2>

    <mat-dialog-content>
      <p class="hint">
        Se o e-mail já tiver conta no Prumo, a pessoa entra na hora. Se não tiver, o convite
        fica guardado e se resolve sozinho quando ela se cadastrar com esse endereço.
      </p>

      <form [formGroup]="form" class="form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>E-mail</mat-label>
          <mat-icon matPrefix>mail_outline</mat-icon>
          <input matInput formControlName="email" type="email" placeholder="pessoa@empresa.com">
          <mat-error>Informe um e-mail válido</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Cargo</mat-label>
          <mat-select formControlName="role">
            <mat-option [value]="0">Membro</mat-option>
            <mat-option [value]="1">Admin</mat-option>
          </mat-select>
        </mat-form-field>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancelar</button>
      <button
        mat-flat-button
        color="primary"
        [disabled]="form.invalid || saving"
        (click)="onSubmit()">
        <mat-spinner *ngIf="saving" diameter="18" class="inline-spinner"></mat-spinner>
        Adicionar
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .full-width { width: 100%; }
    .form { display: flex; flex-direction: column; }
    .hint {
      margin: 0 0 16px;
      font-size: 13px;
      line-height: 1.5;
      color: var(--color-text-muted);
    }
    .inline-spinner { display: inline-block; margin-right: 8px; }
  `]
})
export class AddMemberDialogComponent {
  form: FormGroup;
  saving = false;

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private snack: MatSnackBar,
    private dialogRef: MatDialogRef<AddMemberDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { tenantId: string }
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      role: [0]
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.saving = true;
    const { email, role } = this.form.value;

    this.api.inviteMember(this.data.tenantId, { email, role }).subscribe({
      next: (result: InviteMemberResult) => {
        this.saving = false;

        // As duas coisas são sucesso, mas são coisas diferentes, e a tela precisa dizer
        // qual delas aconteceu — senão o admin fica esperando alguém que ainda nem existe.
        this.snack.open(
          result.joinedImmediately
            ? `${result.email} agora é membro desta empresa.`
            : `Convite guardado para ${result.email}. Ela entra ao se cadastrar.`,
          'Fechar',
          { duration: 6000 }
        );

        this.dialogRef.close(true);
      },
      error: (err: { error?: { message?: string } }) => {
        this.saving = false;
        this.snack.open(
          err?.error?.message || 'Não foi possível adicionar este e-mail.',
          'Fechar',
          { duration: 5000, panelClass: 'error-snackbar' }
        );
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
