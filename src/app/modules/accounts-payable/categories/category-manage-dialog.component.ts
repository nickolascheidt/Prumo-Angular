import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';

import { ApiService } from '@core/services';
import { AccountsPayableCategory } from '@core/models';
import {
  CategoryQuickCreateDialogComponent,
  CategoryQuickCreateDialogData
} from './category-quick-create-dialog.component';

export interface CategoryManageDialogData {
  tenantId: string;
}

@Component({
  selector: 'app-category-manage-dialog',
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
    MatSnackBarModule,
    MatListModule,
    MatDividerModule,
    MatTooltipModule
  ],
  template: `
    <h2 mat-dialog-title>Gerenciar categorias</h2>
    <mat-dialog-content class="manage-content">
      <div class="manage-toolbar">
        <button mat-flat-button color="primary" (click)="openCreate()" [disabled]="loading">
          <mat-icon>add</mat-icon>
          <span>Nova categoria</span>
        </button>
        <span class="spacer"></span>
        <span *ngIf="loading" class="loading-inline"><mat-spinner diameter="20"></mat-spinner></span>
      </div>

      <mat-divider></mat-divider>

      <p *ngIf="!loading && !categories.length" class="empty">
        Nenhuma categoria cadastrada.
      </p>

      <ul *ngIf="!loading && categories.length" class="category-list">
        <li *ngFor="let c of categories" class="category-item">
          <ng-container *ngIf="editingId !== c.id; else editTpl">
            <span class="swatch" [style.background]="c.color || '#9e9e9e'"></span>
            <div class="info">
              <strong>{{ c.name }}</strong>
              <small *ngIf="c.description">{{ c.description }}</small>
            </div>
            <span class="spacer"></span>
            <button mat-icon-button (click)="startEdit(c)" matTooltip="Editar">
              <mat-icon>edit</mat-icon>
            </button>
            <button mat-icon-button color="warn" (click)="remove(c)" matTooltip="Excluir">
              <mat-icon>delete</mat-icon>
            </button>
          </ng-container>

          <ng-template #editTpl>
            <form [formGroup]="editForm" class="edit-form" (ngSubmit)="saveEdit(c)">
              <mat-form-field appearance="outline" class="edit-name">
                <mat-label>Nome</mat-label>
                <input matInput formControlName="name" autocomplete="off" maxlength="80">
              </mat-form-field>
              <mat-form-field appearance="outline" class="edit-color">
                <mat-label>Cor</mat-label>
                <input matInput formControlName="color" maxlength="9">
              </mat-form-field>
              <mat-form-field appearance="outline" class="edit-description">
                <mat-label>Descrição</mat-label>
                <input matInput formControlName="description" maxlength="200">
              </mat-form-field>
              <button mat-icon-button type="submit" color="primary" [disabled]="editForm.invalid || savingEdit" matTooltip="Salvar">
                <mat-icon>check</mat-icon>
              </button>
              <button mat-icon-button type="button" (click)="cancelEdit()" matTooltip="Cancelar">
                <mat-icon>close</mat-icon>
              </button>
            </form>
          </ng-template>
        </li>
      </ul>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="close()">Fechar</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .manage-content { min-width: 480px; }
    .manage-toolbar { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
    .loading-inline { display: inline-flex; align-items: center; }
    .spacer { flex: 1; }
    .category-list { list-style: none; padding: 0; margin: 8px 0 0; }
    .category-item {
      display: flex; align-items: center; gap: 12px;
      padding: 8px 4px; border-bottom: 1px solid rgba(0,0,0,0.06);
    }
    .swatch { width: 18px; height: 18px; border-radius: 4px; flex-shrink: 0; }
    .info { display: flex; flex-direction: column; }
    .info small { color: rgba(0,0,0,0.55); }
    .empty { color: rgba(0,0,0,0.55); padding: 12px 0; text-align: center; }
    .edit-form { display: flex; align-items: center; gap: 8px; flex: 1; }
    .edit-form mat-form-field { flex: 1; }
    .edit-form .edit-color { max-width: 110px; flex: 0 0 auto; }
  `]
})
export class CategoryManageDialogComponent implements OnInit {
  categories: AccountsPayableCategory[] = [];
  loading = false;
  savingEdit = false;
  editingId: string | null = null;
  editForm: FormGroup;
  changed = false;

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private ref: MatDialogRef<CategoryManageDialogComponent, boolean>,
    @Inject(MAT_DIALOG_DATA) private data: CategoryManageDialogData
  ) {
    this.editForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(80)]],
      color: [''],
      description: ['']
    });
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.api.getAccountsPayableCategories(this.data.tenantId).subscribe({
      next: cats => (this.categories = cats),
      error: err =>
        this.snackBar.open(
          err?.error?.message || 'Erro ao carregar categorias',
          'Fechar',
          { duration: 5000 }
        ),
      complete: () => (this.loading = false)
    });
  }

  openCreate(): void {
    const ref = this.dialog.open(CategoryQuickCreateDialogComponent, {
      data: { tenantId: this.data.tenantId } as CategoryQuickCreateDialogData,
      width: '420px'
    });
    ref.afterClosed().subscribe(created => {
      if (created) {
        this.changed = true;
        this.load();
      }
    });
  }

  startEdit(c: AccountsPayableCategory): void {
    this.editingId = c.id;
    this.editForm.reset({
      name: c.name,
      color: c.color ?? '',
      description: c.description ?? ''
    });
  }

  cancelEdit(): void {
    this.editingId = null;
  }

  saveEdit(c: AccountsPayableCategory): void {
    if (this.editForm.invalid) return;
    const raw = this.editForm.value;
    this.savingEdit = true;
    this.api
      .updateAccountsPayableCategory(this.data.tenantId, c.id, {
        name: raw.name.trim(),
        color: raw.color?.trim() || null,
        description: raw.description?.trim() || null,
        isActive: c.isActive ?? true
      })
      .subscribe({
        next: updated => {
          this.snackBar.open('Categoria atualizada', 'Fechar', { duration: 2500 });
          this.changed = true;
          this.editingId = null;
          this.categories = this.categories.map(x => (x.id === updated.id ? updated : x));
        },
        error: err => {
          this.snackBar.open(
            err?.error?.message || 'Erro ao atualizar categoria',
            'Fechar',
            { duration: 5000 }
          );
        },
        complete: () => (this.savingEdit = false)
      });
  }

  remove(c: AccountsPayableCategory): void {
    if (!confirm(`Excluir a categoria "${c.name}"? Lançamentos existentes não são afetados.`)) return;
    this.api.deleteAccountsPayableCategory(this.data.tenantId, c.id).subscribe({
      next: () => {
        this.snackBar.open('Categoria excluída', 'Fechar', { duration: 2500 });
        this.changed = true;
        this.categories = this.categories.filter(x => x.id !== c.id);
      },
      error: err =>
        this.snackBar.open(
          err?.error?.message || 'Erro ao excluir categoria',
          'Fechar',
          { duration: 5000 }
        )
    });
  }

  close(): void {
    this.ref.close(this.changed);
  }
}
