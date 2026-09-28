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
 * Adding someone is typing an e-mail and picking the position. Nothing else.
 *
 * This dialog used to have two modes: find an existing account, or **create an account
 * with a password typed by the admin**. The second is gone — it made every member's
 * initial password pass through the administrator. Now an e-mail without an account
 * becomes a pending invitation, and the person picks their own password at sign-up.
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
    <h2 mat-dialog-title>Add member</h2>

    <mat-dialog-content>
      <p class="hint">
        If the e-mail already has a Prumo account, the person joins right away. If not, the
        invitation is kept and resolves itself when they sign up with that address.
      </p>

      <form [formGroup]="form" class="form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>E-mail</mat-label>
          <mat-icon matPrefix>mail_outline</mat-icon>
          <input matInput formControlName="email" type="email" placeholder="person@company.com">
          <mat-error>Enter a valid e-mail</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Position</mat-label>
          <mat-select formControlName="role">
            <mat-option [value]="0">Member</mat-option>
            <mat-option [value]="1">Admin</mat-option>
          </mat-select>
        </mat-form-field>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button
        mat-flat-button
        color="primary"
        [disabled]="form.invalid || saving"
        (click)="onSubmit()">
        <mat-spinner *ngIf="saving" diameter="18" class="inline-spinner"></mat-spinner>
        Add
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

        // Both are success, but they are different things, and the screen has to say which
        // one happened — otherwise the admin waits for someone who does not exist yet.
        this.snack.open(
          result.joinedImmediately
            ? `${result.email} is now a member of this company.`
            : `Invitation saved for ${result.email}. They join when they sign up.`,
          'Close',
          { duration: 6000 }
        );

        this.dialogRef.close(true);
      },
      error: (err: { error?: { message?: string } }) => {
        this.saving = false;
        this.snack.open(
          err?.error?.message || 'Could not add this e-mail.',
          'Close',
          { duration: 5000, panelClass: 'error-snackbar' }
        );
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
