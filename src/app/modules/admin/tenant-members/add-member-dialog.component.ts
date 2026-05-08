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

      <!-- LOOKUP MODE -->
      @if (mode === 'lookup') {
        <form [formGroup]="lookupForm" (ngSubmit)="onLookup()">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>E-mail do Usuário</mat-label>
            <input matInput formControlName="email" type="email" placeholder="usuario@exemplo.com">
            @if (lookupForm.get('email')?.hasError('required')) {
              <mat-error>E-mail é obrigatório</mat-error>
            }
            @if (lookupForm.get('email')?.hasError('email')) {
              <mat-error>Informe um e-mail válido</mat-error>
            }
          </mat-form-field>

          <button mat-stroked-button type="submit"
            [disabled]="lookingUp || lookupForm.get('email')?.invalid">
            @if (lookingUp) { <mat-spinner diameter="18" style="display:inline-block"></mat-spinner> }
            Buscar
          </button>

          @if (lookupDone && !foundUser) {
            <div class="not-found-msg">Nenhum usuário ativo encontrado com esse e-mail.</div>
            <button mat-stroked-button type="button" color="primary"
              style="margin-top:8px;width:100%" (click)="onSwitchToCreate()">
              + Criar novo usuário com este e-mail
            </button>
          }

          @if (foundUser) {
            <div class="found-user">
              <mat-icon color="primary">check_circle</mat-icon>
              <span><strong>{{ foundUser.fullName || foundUser.email }}</strong> ({{ foundUser.email }})</span>
            </div>
            <mat-form-field appearance="outline" class="full-width" style="margin-top:16px">
              <mat-label>Papel</mat-label>
              <mat-select formControlName="role">
                <mat-option [value]="0">Membro</mat-option>
                <mat-option [value]="1">Admin</mat-option>
              </mat-select>
            </mat-form-field>
          }
        </form>
      }

      <!-- CREATE MODE -->
      @if (mode === 'create') {
        <div class="creating-label">Criando novo usuário: <strong>{{ lookupForm.value.email }}</strong></div>
        <form [formGroup]="createForm">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Nome Completo *</mat-label>
            <input matInput formControlName="fullName" placeholder="João Silva">
            @if (createForm.get('fullName')?.hasError('required') && createForm.get('fullName')?.touched) {
              <mat-error>Nome é obrigatório</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Senha *</mat-label>
            <input matInput formControlName="password" type="password" autocomplete="new-password">
            @if (createForm.get('password')?.hasError('required') && createForm.get('password')?.touched) {
              <mat-error>Senha é obrigatória</mat-error>
            }
            @if (createForm.get('password')?.hasError('minlength') && createForm.get('password')?.touched) {
              <mat-error>Senha deve ter ao menos 6 caracteres</mat-error>
            }
            @if (passwordError) {
              <mat-error>{{ passwordError }}</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Telefone (opcional)</mat-label>
            <input matInput formControlName="phoneNumber" placeholder="+55 11 99999-0000">
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Papel *</mat-label>
            <mat-select formControlName="role">
              <mat-option [value]="0">Membro</mat-option>
              <mat-option [value]="1">Admin</mat-option>
            </mat-select>
          </mat-form-field>
        </form>
      }

    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancelar</button>

      @if (mode === 'lookup') {
        <button mat-flat-button color="primary"
          [disabled]="!foundUser || saving"
          (click)="onAdd()">
          @if (saving) { <mat-spinner diameter="18" style="display:inline-block"></mat-spinner> }
          Adicionar
        </button>
      }

      @if (mode === 'create') {
        <button mat-flat-button color="primary"
          [disabled]="createForm.invalid || saving"
          (click)="onCreate()">
          @if (saving) { <mat-spinner diameter="18" style="display:inline-block"></mat-spinner> }
          Criar e Adicionar
        </button>
      }
    </mat-dialog-actions>
  `,
  styles: [`
    .full-width { width: 100%; }
    .not-found-msg { color: #e53935; margin: 8px 0; font-size: 13px; }
    .found-user { display: flex; align-items: center; gap: 8px; color: #388e3c; margin: 8px 0; }
    .creating-label { font-size: 13px; color: #1565c0; margin-bottom: 16px; }
  `]
})
export class AddMemberDialogComponent {
  mode: 'lookup' | 'create' = 'lookup';

  lookupForm: FormGroup;
  createForm: FormGroup;

  lookingUp = false;
  lookupDone = false;
  saving = false;
  foundUser: UserLookupResult | null = null;
  passwordError: string | null = null;

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private snack: MatSnackBar,
    private dialogRef: MatDialogRef<AddMemberDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { tenantId: string }
  ) {
    this.lookupForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      role: [0]
    });
    this.createForm = this.fb.group({
      fullName: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
      phoneNumber: [''],
      role: [0]
    });
    this.lookupForm.get('email')!.valueChanges.subscribe(() => {
      this.foundUser = null;
      this.lookupDone = false;
    });
  }

  onLookup(): void {
    if (this.lookupForm.get('email')?.invalid) return;
    this.lookingUp = true;
    this.lookupDone = false;
    this.foundUser = null;

    this.api.lookupUserByEmail(this.lookupForm.value.email).subscribe({
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

  onSwitchToCreate(): void {
    this.createForm.reset({ role: 0 });
    this.passwordError = null;
    this.mode = 'create';
  }

  onCancel(): void {
    if (this.mode === 'create') {
      this.mode = 'lookup';
      this.createForm.reset({ role: 0 });
      this.passwordError = null;
    } else {
      this.dialogRef.close(false);
    }
  }

  onAdd(): void {
    if (!this.foundUser) return;
    this.saving = true;

    this.api.addTenantMember(this.data.tenantId, {
      userId: this.foundUser.userId,
      role: this.lookupForm.value.role
    }).subscribe({
      next: () => { this.saving = false; this.dialogRef.close(true); },
      error: () => {
        this.saving = false;
        this.snack.open('Falha ao adicionar membro.', 'OK', { duration: 4000 });
      }
    });
  }

  onCreate(): void {
    if (this.createForm.invalid) return;
    this.saving = true;
    this.passwordError = null;

    const { fullName, password, phoneNumber, role } = this.createForm.value;
    this.api.createTenantUser(this.data.tenantId, {
      email: this.lookupForm.value.email,
      password,
      fullName,
      phoneNumber: phoneNumber || undefined,
      role
    }).subscribe({
      next: () => { this.saving = false; this.dialogRef.close(true); },
      error: (err) => {
        this.saving = false;
        const msg = err?.error?.message || err?.error?.title || 'Falha ao criar usuário.';
        if (msg.toLowerCase().includes('password') || msg.toLowerCase().includes('senha')) {
          this.passwordError = msg;
        } else {
          this.snack.open(msg, 'OK', { duration: 5000 });
        }
      }
    });
  }
}
