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
    <h2 mat-dialog-title>New role</h2>

    <mat-dialog-content>
      <form [formGroup]="form" class="form">
        <mat-form-field appearance="outline">
          <mat-label>Name</mat-label>
          <input matInput formControlName="name" maxlength="64" placeholder="Viewer" />
          @if (form.controls.name.hasError('required') && form.controls.name.touched) {
            <mat-error>The name is required.</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Description (optional)</mat-label>
          <input matInput formControlName="description" maxlength="256"
                 placeholder="Sees the modules but changes nothing" />
        </mat-form-field>

        <p class="hint">
          <mat-icon>info</mat-icon>
          <!-- The text has to be ONE flex item, otherwise the <strong> becomes a column
               of its own and the sentence breaks into pieces. -->
          <span>
            The role is born <strong>with no access at all</strong>. After creating it, set
            its level on each resource.
          </span>
        </p>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary" [disabled]="form.invalid" (click)="submit()">
        Create
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .form {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
      min-width: 340px;
      /* mat-dialog-content clips the top of the first field without this padding:
         the outline's floating label sits on the scroll edge. */
      padding-top: var(--space-2);
    }
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
