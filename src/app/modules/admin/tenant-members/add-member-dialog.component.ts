import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ApiService } from '@core/services';
import { UserLookupResult } from '@core/models';

@Component({
  selector: 'app-add-member-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatDialogModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatButtonModule, MatProgressSpinnerModule, MatIconModule, MatSnackBarModule
  ],
  template: `
    <h2 mat-dialog-title>Adicionar Membro</h2>
    <mat-dialog-content>
      <form [formGroup]="form" (ngSubmit)="onLookup()">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>E-mail do Usuário</mat-label>
          <input matInput formControlName="email" type="email" placeholder="usuario@exemplo.com">
          @if (form.get('email')?.hasError('required')) {
            <mat-error>E-mail é obrigatório</mat-error>
          }
          @if (form.get('email')?.hasError('email')) {
            <mat-error>Informe um e-mail válido</mat-error>
          }
        </mat-form-field>

        <button mat-stroked-button type="submit" [disabled]="lookingUp || form.get('email')?.invalid">
          @if (lookingUp) { <mat-spinner diameter="18" style="display:inline-block"></mat-spinner> }
          Buscar
        </button>

        @if (lookupDone && !foundUser) {
          <div class="not-found-msg">Nenhum usuário ativo encontrado com esse e-mail.</div>
        }

        @if (foundUser) {
          <div class="found-user">
            <mat-icon color="primary">check_circle</mat-icon>
            <span><strong>{{ foundUser.fullName || foundUser.email }}</strong> ({{ foundUser.email }})</span>
          </div>
        }

        @if (foundUser) {
          <mat-form-field appearance="outline" class="full-width" style="margin-top:16px">
            <mat-label>Papel</mat-label>
            <mat-select formControlName="role">
              <mat-option [value]="0">Membro</mat-option>
              <mat-option [value]="1">Admin</mat-option>
            </mat-select>
          </mat-form-field>
        }
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-flat-button color="primary"
        [disabled]="!foundUser || saving"
        (click)="onAdd()">
        @if (saving) { <mat-spinner diameter="18" style="display:inline-block"></mat-spinner> }
        Adicionar
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .full-width { width: 100%; }
    .not-found-msg { color: #e53935; margin: 8px 0; font-size: 13px; }
    .found-user { display: flex; align-items: center; gap: 8px; color: #388e3c; margin: 8px 0; }
  `]
})
export class AddMemberDialogComponent {
  form: FormGroup;
  lookingUp = false;
  lookupDone = false;
  saving = false;
  foundUser: UserLookupResult | null = null;

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

  onLookup(): void {
    if (this.form.get('email')?.invalid) return;
    this.lookingUp = true;
    this.lookupDone = false;
    this.foundUser = null;

    this.api.lookupUserByEmail(this.form.value.email).subscribe({
      next: user => {
        this.foundUser = user;
        this.lookupDone = true;
        this.lookingUp = false;
      },
      error: () => {
        this.lookupDone = true;
        this.lookingUp = false;
      }
    });
  }

  onAdd(): void {
    if (!this.foundUser) return;
    this.saving = true;

    this.api.addTenantMember(this.data.tenantId, {
      userId: this.foundUser.userId,
      role: this.form.value.role
    }).subscribe({
      next: () => this.dialogRef.close(true),
      error: () => {
        this.saving = false;
        this.snack.open('Falha ao adicionar membro.', 'OK', { duration: 4000 });
      }
    });
  }
}
