import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ApiService } from '@core/services';
import { JournalEntryDto, JournalEntryType } from '@core/models';

export interface JournalEntryDetailData {
  tenantId: string;
  entryId: string;
}

@Component({
  selector: 'app-journal-entry-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatTableModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatSnackBarModule
  ],
  templateUrl: './journal-entry-detail.component.html'
})
export class JournalEntryDetailComponent implements OnInit {
  entry: JournalEntryDto | null = null;
  loading = true;
  readonly displayedColumns = ['account', 'debit', 'credit'];
  readonly JournalEntryType = JournalEntryType;

  constructor(
    private api: ApiService,
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<JournalEntryDetailComponent>,
    @Inject(MAT_DIALOG_DATA) public data: JournalEntryDetailData
  ) {}

  ngOnInit(): void {
    this.api.getJournalEntry(this.data.tenantId, this.data.entryId).subscribe({
      next: entry => { this.entry = entry; this.loading = false; },
      error: err => {
        this.loading = false;
        this.snackBar.open(err?.error?.message || 'Failed to load the entry', 'Close', { duration: 5000 });
        this.dialogRef.close();
      }
    });
  }

  get totalDebit(): number {
    return this.entry?.lines.filter(l => l.entryType === JournalEntryType.Debit).reduce((s, l) => s + l.amount, 0) ?? 0;
  }

  get totalCredit(): number {
    return this.entry?.lines.filter(l => l.entryType === JournalEntryType.Credit).reduce((s, l) => s + l.amount, 0) ?? 0;
  }
}
