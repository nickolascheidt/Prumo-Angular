import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-create-role-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatButtonModule, MatDialogModule,
    MatFormFieldModule, MatInputModule, MatIconModule
  ],
  template: `
    <h2 mat-dialog-title>Nova role</h2>

    <mat-dialog-content>
      <form [formGroup]="form" class="form">
        <mat-form-field appearance="outline">
          <mat-label>Nome</mat-label>
          <input matInput formControlName="name" maxlength="64" placeholder="Leitura" />
          @if (form.controls.name.hasError('required') && form.controls.name.touched) {
            <mat-error>O nome é obrigatório.</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Descrição (opcional)</mat-label>
          <input matInput formControlName="description" maxlength="256"
                 placeholder="Vê os módulos, mas não altera nada" />
        </mat-form-field>

        <p class="hint">
          <mat-icon>info</mat-icon>
          <!-- O texto precisa ser UM flex item, senão o <strong> vira uma coluna
               própria e a frase quebra em pedaços. -->
          <span>
            A role nasce <strong>sem acesso nenhum</strong>. Depois de criar, defina o
            nível dela em cada recurso.
          </span>
        </p>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-flat-button color="primary" [disabled]="form.invalid" (click)="submit()">
        Criar
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .form { display: flex; flex-direction: column; gap: var(--space-2); min-width: 340px; }
    .hint {
      display: flex;
      align-items: flex-start;
      gap: var(--space-2);
      margin: 0;
      font-size: var(--text-sm);
      color: var(--color-text-muted);
    }
    .hint mat-icon { font-size: 18px; width: 18px; height: 18px; color: var(--color-info); }
  `]
})
export class CreateRoleDialogComponent {
  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(64)]],
    description: ['']
  });

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<CreateRoleDialogComponent>
  ) {}

  submit(): void {
    if (this.form.invalid) { return; }
    const { name, description } = this.form.getRawValue();
    this.dialogRef.close({
      name: name.trim(),
      description: description.trim() || undefined
    });
  }
}
