import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
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
    MatChipsModule
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
    private dialogRef: MatDialogRef<JournalEntryDetailComponent>,
    @Inject(MAT_DIALOG_DATA) public data: JournalEntryDetailData
  ) {}

  ngOnInit(): void {
    this.api.getJournalEntry(this.data.tenantId, this.data.entryId).subscribe({
      next: entry => { this.entry = entry; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  get totalDebit(): number {
    return this.entry?.lines.filter(l => l.entryType === JournalEntryType.Debit).reduce((s, l) => s + l.amount, 0) ?? 0;
  }

  get totalCredit(): number {
    return this.entry?.lines.filter(l => l.entryType === JournalEntryType.Credit).reduce((s, l) => s + l.amount, 0) ?? 0;
  }
}
