import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
  ElementRef,
  AfterViewInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApiService, AuthService } from '@core/services';
import {
  AccountsPayableCategory,
  AccountsPayableEntry,
  CreateAccountsPayableEntryRequest,
  PaymentMethod
} from '@core/models';

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'Cash', label: 'Dinheiro' },
  { value: 'BankTransfer', label: 'Transferência' },
  { value: 'CreditCard', label: 'Cartão de Crédito' },
  { value: 'DebitCard', label: 'Cartão de Débito' },
  { value: 'Pix', label: 'Pix' },
  { value: 'Boleto', label: 'Boleto' },
  { value: 'Other', label: 'Outro' }
];

@Component({
  selector: 'app-accounts-payable-quick-entry',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTabsModule,
    MatExpansionModule,
    MatTooltipModule
  ],
  templateUrl: './quick-entry.component.html',
  styleUrls: ['./quick-entry.component.scss']
})
export class AccountsPayableQuickEntryComponent implements OnInit, AfterViewInit {
  @Input() categories: AccountsPayableCategory[] = [];
  @Output() entryCreated = new EventEmitter<AccountsPayableEntry>();
  @Output() entriesBulkCreated = new EventEmitter<void>();

  @ViewChild('descriptionInput') descriptionInput?: ElementRef<HTMLInputElement>;

  quickForm!: FormGroup;
  bulkForm!: FormGroup;
  isSaving = false;
  isBulkSaving = false;
  readonly paymentMethods = PAYMENT_METHODS;

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private auth: AuthService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.quickForm = this.fb.group({
      description: ['', [Validators.required, Validators.maxLength(200)]],
      amount: [null, [Validators.required, Validators.min(0.01)]],
      dueDate: [new Date(), [Validators.required]],
      categoryId: ['', [Validators.required]],
      supplierName: [''],
      paymentMethod: [null]
    });

    this.bulkForm = this.fb.group({
      categoryId: ['', [Validators.required]],
      paymentMethod: [null],
      lines: ['', [Validators.required]]
    });
  }

  ngAfterViewInit(): void {
    this.focusDescription();
  }

  submitQuick(): void {
    if (this.quickForm.invalid) {
      this.quickForm.markAllAsTouched();
      return;
    }

    const tenantId = this.auth.getCurrentTenantId();
    if (!tenantId) {
      this.snackBar.open('Nenhum tenant selecionado', 'Fechar', { duration: 5000 });
      return;
    }

    const raw = this.quickForm.value;
    const payload: CreateAccountsPayableEntryRequest = {
      description: raw.description,
      amount: Number(raw.amount),
      dueDate: this.toIsoDate(raw.dueDate),
      categoryId: raw.categoryId,
      supplierName: raw.supplierName || null,
      paymentMethod: raw.paymentMethod || null
    };

    this.isSaving = true;
    this.api.createAccountsPayableEntry(tenantId, payload).subscribe({
      next: entry => {
        this.snackBar.open('Lançamento adicionado', 'Fechar', { duration: 2500 });
        this.entryCreated.emit(entry);
        this.resetQuickForm(raw.categoryId, raw.dueDate);
        this.focusDescription();
      },
      error: err => {
        this.isSaving = false;
        this.snackBar.open(
          err?.error?.message || 'Erro ao salvar lançamento',
          'Fechar',
          { duration: 5000 }
        );
      },
      complete: () => {
        this.isSaving = false;
      }
    });
  }

  submitBulk(): void {
    if (this.bulkForm.invalid) {
      this.bulkForm.markAllAsTouched();
      return;
    }

    const tenantId = this.auth.getCurrentTenantId();
    if (!tenantId) {
      this.snackBar.open('Nenhum tenant selecionado', 'Fechar', { duration: 5000 });
      return;
    }

    const raw = this.bulkForm.value;
    const lines = (raw.lines as string)
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0);

    const parsed = lines.map(l => this.parseBulkLine(l, raw.categoryId, raw.paymentMethod));
    const errors = parsed.filter(p => p.error);
    if (errors.length) {
      this.snackBar.open(
        `Linha(s) inválida(s): ${errors.map(e => e.lineNumber).join(', ')}`,
        'Fechar',
        { duration: 5000 }
      );
      return;
    }

    this.isBulkSaving = true;
    this.api
      .bulkCreateAccountsPayableEntries(tenantId, {
        entries: parsed.map(p => p.entry!)
      })
      .subscribe({
        next: resp => {
          const msg = `${resp.created} lançamento(s) criado(s)` +
            (resp.failed > 0 ? `, ${resp.failed} falharam` : '');
          this.snackBar.open(msg, 'Fechar', { duration: 4000 });
          this.bulkForm.patchValue({ lines: '' });
          this.entriesBulkCreated.emit();
        },
        error: err => {
          this.isBulkSaving = false;
          this.snackBar.open(
            err?.error?.message || 'Erro ao processar lote',
            'Fechar',
            { duration: 5000 }
          );
        },
        complete: () => {
          this.isBulkSaving = false;
        }
      });
  }

  private parseBulkLine(
    line: string,
    fallbackCategoryId: string,
    fallbackPaymentMethod: PaymentMethod | null
  ): { lineNumber: number; entry?: CreateAccountsPayableEntryRequest; error?: string } {
    const parts = line.split('|').map(p => p.trim());
    if (parts.length < 3) {
      return { lineNumber: 0, error: 'formato' };
    }

    const [dueDateRaw, description, amountRaw, supplier] = parts;
    const dueDate = this.parseLooseDate(dueDateRaw);
    const amount = Number(String(amountRaw).replace(',', '.'));

    if (!dueDate || !description || !isFinite(amount) || amount <= 0) {
      return { lineNumber: 0, error: 'campos' };
    }

    return {
      lineNumber: 0,
      entry: {
        description,
        amount,
        dueDate,
        categoryId: fallbackCategoryId,
        supplierName: supplier || null,
        paymentMethod: fallbackPaymentMethod || null
      }
    };
  }

  private parseLooseDate(raw: string): string | null {
    const d = new Date(raw);
    if (!isNaN(d.getTime())) return this.toIsoDate(d);
    const m = raw.match(/^(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?$/);
    if (m) {
      const day = parseInt(m[1], 10);
      const month = parseInt(m[2], 10) - 1;
      const year = m[3]
        ? parseInt(m[3].length === 2 ? '20' + m[3] : m[3], 10)
        : new Date().getFullYear();
      const dt = new Date(year, month, day);
      if (!isNaN(dt.getTime())) return this.toIsoDate(dt);
    }
    return null;
  }

  private toIsoDate(value: Date | string): string {
    const d = value instanceof Date ? value : new Date(value);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  private resetQuickForm(keepCategoryId: string, keepDueDate: Date | string): void {
    this.quickForm.reset({
      description: '',
      amount: null,
      dueDate: keepDueDate,
      categoryId: keepCategoryId,
      supplierName: '',
      paymentMethod: null
    });
  }

  private focusDescription(): void {
    setTimeout(() => this.descriptionInput?.nativeElement?.focus(), 0);
  }
}
