import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '@core/services';
import { TenantMember } from '@core/models';

@Component({
  selector: 'app-change-role-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatDialogModule, MatFormFieldModule, MatSelectModule,
    MatButtonModule, MatProgressSpinnerModule
  ],
  template: `
    <h2 mat-dialog-title>Alterar Papel</h2>
    <mat-dialog-content>
      <p>Atualizar papel de <strong>{{ data.member.fullName || data.member.email }}</strong>:</p>
      <form [formGroup]="form">
        <mat-form-field appearance="outline" style="width:100%">
          <mat-label>Papel</mat-label>
          <mat-select formControlName="role">
            <mat-option [value]="0">Membro</mat-option>
            <mat-option [value]="1">Admin</mat-option>
          </mat-select>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-flat-button color="primary" [disabled]="saving" (click)="onSave()">
        @if (saving) { <mat-spinner diameter="18" style="display:inline-block"></mat-spinner> }
        Salvar
      </button>
    </mat-dialog-actions>
  `
})
export class ChangeRoleDialogComponent {
  form: FormGroup;
  saving = false;

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private dialogRef: MatDialogRef<ChangeRoleDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { tenantId: string; member: TenantMember }
  ) {
    this.form = this.fb.group({ role: [data.member.role] });
  }

  onSave(): void {
    this.saving = true;
    this.api.updateMemberRole(this.data.tenantId, this.data.member.userId, {
      role: this.form.value.role
    }).subscribe({
      next: () => this.dialogRef.close(true),
      error: () => { this.saving = false; }
    });
  }
}
