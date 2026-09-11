import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { ApiService } from '@core/services';
import { AccountsPayableCategory } from '@core/models';

export interface CategoryQuickCreateDialogData {
  tenantId: string;
  initialName?: string;
}

@Component({
  selector: 'app-category-quick-create-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  template: `
    <h2 mat-dialog-title>Nova categoria</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="quick-create-form">
        <mat-form-field appearance="outline">
          <mat-label>Nome</mat-label>
          <input matInput formControlName="name" autocomplete="off" maxlength="80" cdkFocusInitial>
          <mat-error *ngIf="form.get('name')?.hasError('required')">Obrigatório</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Cor (opcional)</mat-label>
          <!-- token-exempt: exemplo de formato num campo de cor livre, nao cor da UI -->
          <input matInput formControlName="color" placeholder="#1b5c86" maxlength="9">
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Descrição (opcional)</mat-label>
          <input matInput formControlName="description" maxlength="200">
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="cancel()" [disabled]="saving">Cancelar</button>
      <button mat-flat-button color="primary" (click)="save()" [disabled]="saving || form.invalid">
        <mat-icon *ngIf="!saving">save</mat-icon>
        <mat-spinner *ngIf="saving" diameter="18"></mat-spinner>
        <span>Criar</span>
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .quick-create-form { display: flex; flex-direction: column; gap: 8px; min-width: 320px; }
  `]
})
export class CategoryQuickCreateDialogComponent {
  form: FormGroup;
  saving = false;

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private snackBar: MatSnackBar,
    private ref: MatDialogRef<CategoryQuickCreateDialogComponent, AccountsPayableCategory | null>,
    @Inject(MAT_DIALOG_DATA) private data: CategoryQuickCreateDialogData
  ) {
    this.form = this.fb.group({
      name: [data.initialName ?? '', [Validators.required, Validators.maxLength(80)]],
      color: [''],
      description: ['']
    });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.value;
    this.saving = true;
    this.api
      .createAccountsPayableCategory(this.data.tenantId, {
        name: raw.name.trim(),
        color: raw.color?.trim() || null,
        description: raw.description?.trim() || null
      })
      .subscribe({
        next: cat => {
          this.snackBar.open('Categoria criada', 'Fechar', { duration: 2500 });
          this.ref.close(cat);
        },
        error: err => {
          this.saving = false;
          this.snackBar.open(
            err?.error?.message || 'Erro ao criar categoria',
            'Fechar',
            { duration: 5000 }
          );
        }
      });
  }

  cancel(): void {
    this.ref.close(null);
  }
}
