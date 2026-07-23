import { Component, DestroyRef, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, inject, signal } from '@angular/core';
import { CommonModule, formatDate } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { DatePickerModule } from 'primeng/datepicker';
import { FloatLabelModule } from 'primeng/floatlabel';
import { ChequeLeaf, ChequeLeafResponse, FormFieldComponent, LookupService, SelectFieldComponent } from '@/app/shared';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { of, switchMap } from 'rxjs';
import { BankAccounts, costCenterLookupData, departmentLookupData, LookupType } from '../payment-voucher.types';

@Component({
    selector: 'app-voucher-detail-modal',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        DialogModule,
        InputNumberModule,
        DatePickerModule,
        FloatLabelModule,
        FormFieldComponent,
        SelectFieldComponent,
    ],
    templateUrl: './voucher-detail-modal.html',
    styleUrl: './voucher-detail-modal.scss',
})
export class VoucherDetailModal implements OnInit, OnChanges {
    private fb = inject(FormBuilder);

    @Input() visible = false;
    @Output() visibleChange = new EventEmitter<boolean>();

    /** Emitted by Save Row / Save & Add New / Save & Close with a display-ready row */
    @Output() saved = new EventEmitter<any>();

    maximized = signal(false);

    /** Tax rate sourced from the Tax Deductions table (0% when empty) */
    @Input() taxRate = 0;

    /** When set, the modal pre-fills its form with this row for editing.
     * `null` means we're adding a new row — the form gets wiped on open. */
    @Input() editRow: any | null = null;

    /** Selected bank account id from the main header — used to load the cheque book. */
    @Input() bankAccountId: number | null = null;

    /** Re-sync the form every time the modal transitions from hidden → visible.
     * Driving this off `visible` instead of `editRow` makes it work even when
     * the parent re-emits the same `null` value on Add → Close → Add. */
    ngOnChanges(changes: SimpleChanges): void {
        const v = changes['visible'];
        if (v && v.currentValue === true && v.previousValue !== true) {
            if (this.editRow) this.patchFromRow(this.editRow);
            else this.resetForm();
        }
    }

    transactionTypes = signal<LookupType[]>([]);
    subLedgerTypes = signal<LookupType[]>([]);
    subLedgers = signal<LookupType[]>([]);
    departments = signal<departmentLookupData[]>([]);
    costCenters = signal<costCenterLookupData[]>([]);
    chequeTypes = signal<LookupType[]>([]);
    paymentModes = signal<LookupType[]>([]);
    accounts = signal<BankAccounts[]>([]);
    private lookupService = inject(LookupService);
    private $destroyRef = inject(DestroyRef);

    ngOnInit(): void {
        // Initialization logic if needed
        this.getTransactionTypes();
        this.getSubLedgerTypes();
        this.getAllDepartmentsList();
        this.getCostCenters();
        this.getChequeTypes();
        this.getPaymentModes();
        this.getAccounts();
    }

    /** Payment mode where the cheque number is picked from the bank's cheque book. */
    private static readonly CHEQUE_BOOK_MODE = 2;
    /** Payment mode that needs a manually-entered cheque/instrument number + date. */
    private static readonly MANUAL_INSTRUMENT_MODE = 3;

    /** Available cheque numbers for the header's bank account (cheque-book mode). */
    chequeLeaves = signal<ChequeLeaf[]>([]);

    /** True when Cheque No should be picked from the cheque-book dropdown (mode 2). */
    get isChequeBookMode(): boolean {
        return this.form.get('paymentMode')?.value === VoucherDetailModal.CHEQUE_BOOK_MODE;
    }

    /** Cheque No is required for both cheque-book (2) and manual instrument (3) modes. */
    get isChequeNoRequired(): boolean {
        const mode = this.form.get('paymentMode')?.value;
        return mode === VoucherDetailModal.CHEQUE_BOOK_MODE || mode === VoucherDetailModal.MANUAL_INSTRUMENT_MODE;
    }

    /** Cheque Date is required for the manual instrument mode (3). */
    get isChequeDateRequired(): boolean {
        return this.form.get('paymentMode')?.value === VoucherDetailModal.MANUAL_INSTRUMENT_MODE;
    }

    /** Called when the Payment Mode changes (user select or programmatic edit). */
    onPaymentModeChange(mode: number | null): void {
        this.applyChequeValidators(mode);
        if (mode === VoucherDetailModal.CHEQUE_BOOK_MODE) {
            this.loadChequeNumbers();
        } else {
            this.chequeLeaves.set([]);
        }
    }

    /** Toggle required validators on Cheque Type / No / Date based on the payment mode. */
    private applyChequeValidators(mode: number | null): void {
        const chequeType = this.form.get('chequeType');
        const chequeNo = this.form.get('chequeNo');
        const chequeDate = this.form.get('chequeDate');
        const noRequired = mode === VoucherDetailModal.CHEQUE_BOOK_MODE || mode === VoucherDetailModal.MANUAL_INSTRUMENT_MODE;
        const dateRequired = mode === VoucherDetailModal.MANUAL_INSTRUMENT_MODE;
        const typeRequired = mode === VoucherDetailModal.CHEQUE_BOOK_MODE;

        typeRequired ? chequeType?.setValidators([Validators.required]) : chequeType?.clearValidators();
        noRequired ? chequeNo?.setValidators([Validators.required]) : chequeNo?.clearValidators();
        dateRequired ? chequeDate?.setValidators([Validators.required]) : chequeDate?.clearValidators();
        chequeType?.updateValueAndValidity({ emitEvent: false });
        chequeNo?.updateValueAndValidity({ emitEvent: false });
        chequeDate?.updateValueAndValidity({ emitEvent: false });
    }

    /**
     * Load available cheque numbers for the header's bank account:
     * cheque-book dropdown → the first book's available leaves.
     */
    private loadChequeNumbers(): void {
        const bankAccountId = this.bankAccountId;
        console.log("bankAccountId",bankAccountId);
        
        if (bankAccountId == null) {
            this.chequeLeaves.set([]);
            return;
        }
        this.lookupService.getChequeBooks(bankAccountId).pipe(
            switchMap((res) => {
                const bookId = res.data?.[0]?.id;
                return bookId != null
                    ? this.lookupService.getChequeLeaves(bookId, bankAccountId)
                    : of({ data: [] } as unknown as ChequeLeafResponse);
            }),
            takeUntilDestroyed(this.$destroyRef),
        ).subscribe({
            next: (res) => this.chequeLeaves.set(res.data ?? []),
            error: (err) => console.error('Error loading cheque numbers:', err),
        });
    }

    getAllDepartmentsList() {
        this.lookupService.getDepartments().pipe(
            takeUntilDestroyed(this.$destroyRef),
        ).subscribe({
            next: (response) => this.departments.set(response.data),
            error: (err) => console.error('Error fetching departments:', err),
        });
    }

    /** Loads the Account (Dr) dropdown — AccountTypeId = 2 per business spec. */
    getAccounts() {
        this.lookupService.getAccountDropdown(0, 0, 2).pipe(
            takeUntilDestroyed(this.$destroyRef),
        ).subscribe({
            next: (response) => {
                this.accounts.set(response.data);
                // Item 3 Fix: if we're editing a row, (re)apply the Control Account lock
                // now that the accounts list has arrived (it may load after editRow is patched).
                if (this.editRow) {
                    this.applyControlAccountLock(this.form.get('account')?.value ?? null);
                }
            },
            error: (err) => console.error('Error fetching accounts:', err),
        });
    }

    getPaymentModes() {
        this.lookupService.getPaymentModes().pipe(
            takeUntilDestroyed(this.$destroyRef),
        ).subscribe({
            next: (response) => {
              this.paymentModes.set(response.data);
                   this.applyDefaultValues();
},
            error: (err) => console.error('Error fetching payment modes:', err),
        });
    }

    getCostCenters() {
        this.lookupService.getCostCenters().pipe(
            takeUntilDestroyed(this.$destroyRef),
        ).subscribe({
            next: (response) => this.costCenters.set(response.data),
            error: (err) => console.error('Error fetching cost centers:', err),
        });
    }

    getChequeTypes() {
        this.lookupService.getChequeTypes().pipe(
            takeUntilDestroyed(this.$destroyRef),
        ).subscribe({
            next: (response) => this.chequeTypes.set(response.data),
            error: (err) => console.error('Error fetching cheque types:', err),
        });
    }

    getTransactionTypes() {
        this.lookupService.getTransactionTypes().pipe(
            takeUntilDestroyed(this.$destroyRef),
        ).subscribe({
            next: (response) => {
                console.log(response.data);
                this.transactionTypes.set(response.data);
                this.applyDefaultValues();
            },
            error: (err) => {
                console.error('Error fetching transaction types:', err);
            }
        });
    }

    getSubLedgerTypes() {
        this.lookupService.getSubLedgerTypes().pipe(
            takeUntilDestroyed(this.$destroyRef),
        ).subscribe({
            next: (response) => {
                this.subLedgerTypes.set(response.data);
            },
            error: (err) => {
                console.error('Error fetching sub ledger types:', err);
            }
        });
    }

    /**
     * Item 4 Fix:
     * Fires when the Sub Ledger Type select changes — fetches the dependent Sub Ledgers.
     * Filters by the selected Debit Account (if any) AND the Sub Ledger Type; when no
     * Debit Account is selected, falls back to filtering by Sub Ledger Type only.
     */
    handleOnchnageOfsubLedgerType(value: any): void {
        // Reset only the Sub Ledger (departments load independently on init).
        this.form.patchValue({ subLedger: null });
        this.subLedgers.set([]);
        if (value == null) return;

        const accountId = this.form.get('account')?.value ?? null;

        this.lookupService.getSubLedgers(value, accountId).pipe(
            takeUntilDestroyed(this.$destroyRef),
        ).subscribe({
            next: (response) => this.subLedgers.set(response.data),
            error: (err) => console.error('Error fetching sub ledgers:', err),
        });
    }

    /**
     * Item 3 Fix:
     * Fires when the "Account (Dr)" select changes. When the selected account is a
     * Control Account, auto-selects and locks the Sub Ledger Type mapped to it
     * (Customer / Vendor / Employee, etc.) so the user cannot override it manually.
     * For any other account, the Sub Ledger Type field is (re)enabled for manual entry.
     * Either way, the Sub Ledger dropdown is re-filtered for the new Debit Account (Item 4).
     */
    onAccountChange(accountId: number | null): void {
        this.applyControlAccountLock(accountId);
        this.handleOnchnageOfsubLedgerType(this.form.get('subLedgerType')?.value ?? null);
    }

    /** Locks/unlocks the Sub Ledger Type control based on whether `accountId` is a Control Account. */
    private applyControlAccountLock(accountId: number | null): void {
        const subLedgerTypeCtrl = this.form.get('subLedgerType');
        const account = accountId != null ? this.accounts().find((a) => a.id === accountId) : undefined;

        if (account?.isControlAccount) {
            // Force the mapped Sub Ledger Type and prevent manual override.
            subLedgerTypeCtrl?.setValue(account.controlType, { emitEvent: false });
            subLedgerTypeCtrl?.disable({ emitEvent: false });
        } else if (subLedgerTypeCtrl?.disabled) {
            // Only reset when unlocking a field that was previously auto-set/locked.
            subLedgerTypeCtrl.enable({ emitEvent: false });
            subLedgerTypeCtrl.setValue(null, { emitEvent: false });
        }
    }

    form = this.fb.group({
        transactionType: [null as number | null, Validators.required],
        account: [null as number | null, Validators.required],
        subLedgerType: [null as number | null],
        subLedger: [null as number | null],
        department: [null as number | null],
        costCenter: [null as number | null],
        paymentMode: [null as number | null],
        exchangeRate: [1.0 as number | null],
        chequeType: [null as number | null],
        chequeNo: [''],
        chequeDate: [null as Date | null],
        payeeTitle: [''],
        amount: [0 as number | null, [Validators.required, Validators.min(0.01)]],
        discount: [0 as number | null],
    });

    get f() {
        return this.form.controls;
    }

    /** The entered amount is the NET payable (the amount after WHT is deducted). */
    get netAmount(): number {
        return Number(this.form.get('amount')?.value) || 0;
    }

    /**
     * Withholding-tax gross-up: Gross = Net / (1 − WHT%).
     * e.g. 100,000 / (1 − 0.04) = 104,166.67
     */
    get grossAmount(): number {
        const rate = this.taxRate / 100;
        return rate > 0 && rate < 1 ? this.netAmount / (1 - rate) : this.netAmount;
    }

    /** WHT withheld = Gross − Net. */
    get taxAmount(): number {
        return this.grossAmount - this.netAmount;
    }

    /** Discount applied to the line. */
    get discountAmount(): number {
        return Number(this.form.get('discount')?.value) || 0;
    }

    /** Net payable to the payee = entered net + discount. */
    get netPayable(): number {
        return this.netAmount + this.discountAmount;
    }

    onVisibleChange(v: boolean): void {
        this.visibleChange.emit(v);
    }

    toggleMaximize(): void {
        this.maximized.update((m) => !m);
    }

    onCancel(): void {
        this.close();
    }

    onSaveRow(): void {
        this.emitRow();
    }

    onSaveAddNew(): void {
        if (!this.emitRow()) return;
        this.resetForm();
    }

    /** Reset every field to its initial blank state. */
    private resetForm(): void {
        // Item 3 Fix: clear any lock left over from a previously-edited Control Account row.
        this.form.get('subLedgerType')?.enable({ emitEvent: false });

        this.form.reset({
    transactionType: null,
    account: null,
    subLedgerType: null,
    subLedger: null,
    department: null,
    costCenter: null,
    paymentMode: null,
    exchangeRate: 1.0,
    chequeType: null,
    chequeNo: '',
    chequeDate: null,
    payeeTitle: '',
    amount: 0,
    discount: 0,
});

this.applyDefaultValues();
    }

    private applyDefaultValues(): void {
    if (this.editRow) return;
    console.log(this.transactionTypes());

   const transactionTypeId =
    this.transactionTypes().find(
        t => t.name?.trim() === 'InvoicePayment'
    )?.id ?? null;

    const paymentModeId =
        this.paymentModes().find(
            p => p.name?.toLowerCase() === 'cheque'
        )?.id ?? null;

    this.form.patchValue({
        transactionType: transactionTypeId,
        paymentMode: paymentModeId,
    });

    this.onPaymentModeChange(paymentModeId);
}

    onSaveClose(): void {
        if (this.emitRow()) this.close();
    }

    private emitRow(): boolean {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return false;
        }
        this.saved.emit(this.buildRow());
        return true;
    }

    private close(): void {
        this.maximized.set(false);
        this.visibleChange.emit(false);
    }

    /** Parse "dd-MMM-yyyy" (the format buildRow emits) back into a Date. */
    private parseDate(s: string | null | undefined): Date | null {
        if (!s) return null;
        const m = /^(\d{1,2})-(\w{3})-(\d{4})$/.exec(s);
        if (!m) return null;
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const month = months.indexOf(m[2]);
        if (month === -1) return null;
        return new Date(Number(m[3]), month, Number(m[1]));
    }

   private patchFromRow(row: any): void {
    this.form.patchValue({
        transactionType: row.transactionTypeId ?? null,
        account: row.accountId ?? null,
        subLedgerType: row.subLedgerTypeId ?? null,
        subLedger: row.subLedgerId ?? null,
        department: row.departmentId ?? null,
        costCenter: row.costCenterId ?? null,
        paymentMode: row.paymentModeId ?? null,
        chequeType: row.chequeTypeId ?? null,
        exchangeRate: row.exchangeRate ?? 1,
        chequeNo: row.chequeNo ?? '',
        chequeDate: this.parseDate(row.chequeDate),
        payeeTitle: row.payeeTitle ?? '',
        amount: row.amount ?? 0,
        discount: row.discount ?? 0,
    });

    // Item 3 Fix: lock the Sub Ledger Type if the saved Debit Account is a Control Account.
    this.applyControlAccountLock(row.accountId ?? null);

    if (row.subLedgerTypeId) {
        this.handleOnchnageOfsubLedgerType(row.subLedgerTypeId);
    }

    this.onPaymentModeChange(row.paymentModeId ?? null);
}
/**
 * Reload all lookup data used by the voucher detail modal.
 * Called when the parent Payment Voucher form Refresh button is clicked.
 */
refreshLookups(): void {
    this.getTransactionTypes();
    this.getSubLedgerTypes();
    this.getAllDepartmentsList();
    this.getCostCenters();
    this.getChequeTypes();
    this.getPaymentModes();
    this.getAccounts();

    // If cheque-book mode is active, reload available cheque leaves as well.
    if (this.isChequeBookMode) {
        this.loadChequeNumbers();
    }
}
    private buildRow() {
        const v = this.form.getRawValue();
        return {
            // Display names (used by the read-only Voucher Details table)
            transactionType: this.transactionTypes().find((t) => t.id === v.transactionType)?.name ?? '',
            account: this.accounts().find((a) => a.id === v.account)?.accountName ?? '',
            subLedgerType: this.subLedgerTypes().find((t) => t.id === v.subLedgerType)?.name ?? '',
            subLedger: this.subLedgers().find((s) => s.id === v.subLedger)?.name ?? '',
            department: this.departments().find((d) => d.id === v.department)?.departmentName ?? '',
            costCenter: this.costCenters().find((c) => c.id === v.costCenter)?.costCenterName ?? '',
            paymentMode: this.paymentModes().find((p) => p.id === v.paymentMode)?.name ?? '',
            chequeType: this.chequeTypes().find((c) => c.id === v.chequeType)?.name ?? '',
            // Lookup ids (used by the save payload)
            transactionTypeId: v.transactionType ?? null,
            accountId: v.account ?? null,
            subLedgerTypeId: v.subLedgerType ?? null,
            subLedgerId: v.subLedger ?? null,
            departmentId: v.department ?? null,
            costCenterId: v.costCenter ?? null,
            paymentModeId: v.paymentMode ?? null,
            chequeTypeId: v.chequeType ?? null,
            exchangeRate: v.exchangeRate ?? null,
            chequeNo: v.chequeNo,
            chequeDate: v.chequeDate ? formatDate(v.chequeDate, 'dd-MMM-yyyy', 'en-US') : '',
            payeeTitle: v.payeeTitle,
            amount: v.amount ?? 0,
            discount: v.discount ?? 0,
            taxPercent: this.taxRate,
            taxAmount: this.taxAmount,
            netAmount: this.netPayable,
        };
    }
}