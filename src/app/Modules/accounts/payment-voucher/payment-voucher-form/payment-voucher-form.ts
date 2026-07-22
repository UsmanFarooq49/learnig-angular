import { Component, computed, DestroyRef, HostListener, inject, OnInit, signal, ViewChild } from '@angular/core';
import { CommonModule, formatDate } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { FloatLabelModule } from 'primeng/floatlabel';
import { VoucherDetails, VoucherDetailTotals } from '../voucher-details/voucher-details';
import { VoucherTax } from '../voucher-tax/voucher-tax';
import { VoucherSummary } from '../voucher-summary/voucher-summary';
import { VoucherTabs } from '../voucher-tabs/voucher-tabs';
import { PaymentVoucherService } from '../payment-voucher-service';
import { BaseCurrencyConfig, LookupService, SystemSettingsService } from '@/app/shared';
import { AttachmentService } from '../attachment-service';
import { MessageService } from 'primeng/api';
import { Store } from '@ngrx/store';
import { selectFinancialYearId } from '@/app/store/auth/auth.selectors';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
    BankAccounts,
    currencyLookupData,
    EditModeLookups,
    paymentVoucherByIdData,
    paymentVoucherPayload,
    paymentVoucherTax,
    VoucherDetailRow,
    VoucherTaxRow,
} from '../payment-voucher.types';

type VoucherStatus = 'Draft' | 'Posted' | 'Cancelled';

@Component({
    selector: 'app-payment-voucher-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        InputTextModule,
        InputNumberModule,
        SelectModule,
        DatePickerModule,
        FloatLabelModule,
        VoucherDetails,
        VoucherTax,
        VoucherSummary,
        VoucherTabs,
    ],
    templateUrl: './payment-voucher-form.html',
    styleUrl: './payment-voucher-form.scss',
})
export class PaymentVoucherForm implements OnInit {
    private fb = inject(FormBuilder);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private $destroyRef = inject(DestroyRef);
    private paymentVoucherService = inject(PaymentVoucherService);
    private lookupService = inject(LookupService);
    private systemSettingsService = inject(SystemSettingsService);

    /** Base currency codes + rates resolved from system settings (seeds the header defaults). */
    private baseCurrencyConfig = signal<BaseCurrencyConfig | null>(null);
    private attachmentService = inject(AttachmentService);
    private messageService = inject(MessageService);
    private store = inject(Store);

    /** Selected financial year id from the post-login modal (persisted in localStorage). */
    private financialYearId = this.store.selectSignal(selectFinancialYearId);

    @ViewChild(VoucherDetails) voucherDetailsCmp?: VoucherDetails;
    @ViewChild(VoucherTax) voucherTaxCmp?: VoucherTax;

    title = signal('Payment Voucher');
    status = signal<VoucherStatus>('Draft');
    printMenuOpen = signal(false);
    bankAccounts = signal<BankAccounts[]>([]);
    currencies = signal<currencyLookupData[]>([]);
    /** LCY dropdown is restricted to the base currency (single-option select). */
    baseCurrencies = computed(() => this.currencies().filter((c) => c.isBaseCurrency));

    /** Edit-mode state. Populated when the route has a numeric `:id`. */
    private voucherId = signal<number | null>(null);
    isEditMode = computed(() => this.voucherId() != null);
    /** Public, read-only view of the current voucher id — passed to child tabs (audit log). */
    currentVoucherId = computed(() => this.voucherId());

    /** Rows pushed down to the detail / tax tables when loading an existing voucher. */
    initialDetailRows = signal<VoucherDetailRow[] | null>(null);
    initialTaxRows = signal<VoucherTaxRow[] | null>(null);

    ngOnInit(): void {
        // AttachmentService is providedIn: 'root', so wipe any stale state from a prior
        // voucher form before this one mounts. loadVoucherForEdit will re-populate when editing.
        this.attachmentService.loadSaved([]);

        this.getBankAccountList();
        this.getCurrencyList();

        const idParam = this.route.snapshot.paramMap.get('id');
        const id = idParam != null ? Number(idParam) : NaN;
        if (Number.isFinite(id) && id > 0) {
            this.voucherId.set(id);
            this.title.set('Edit Payment Voucher');
            this.loadVoucherForEdit(id);
        } else {
            this.generateVoucherNo();
        }
    }

    /**
     * Fetch the voucher + every lookup we need to resolve display names, in parallel.
     * The child tables only display labels, so the parent has to resolve id → name
     * before pushing rows down.
     */
    private loadVoucherForEdit(id: number): void {
        forkJoin({
            voucher: this.paymentVoucherService.getPaymentVoucherById(id),
            transactionTypes: this.lookupService.getTransactionTypes(),
            subLedgerTypes: this.lookupService.getSubLedgerTypes(),
            departments: this.lookupService.getDepartments(),
            costCenters: this.lookupService.getCostCenters(),
            chequeTypes: this.lookupService.getChequeTypes(),
            paymentModes: this.lookupService.getPaymentModes(),
            accounts: this.lookupService.getAccountDropdown(0, 0, 2),
            taxTypes: this.lookupService.getTaxTypes(),
            taxAccounts: this.lookupService.getAccountDropdown(),
        }).pipe(takeUntilDestroyed(this.$destroyRef))
            .subscribe({
                next: (r) => {
                    if (!r.voucher?.success || !r.voucher.data) {
                        this.showError(r.voucher?.message || 'Failed to load the voucher.');
                        return;
                    }
                    const v = r.voucher.data;

                    this.patchHeaderFromVoucher(v);
                    this.status.set(v.isPosted ? 'Posted' : 'Draft');
                    this.initialDetailRows.set(this.buildDetailRows(v.voucherDetails, r));
                    this.initialTaxRows.set(this.buildTaxRows(v.voucherDetails));

                    // Seed already-saved attachments so the Attachments tab renders them.
                    this.attachmentService.loadSaved(v.attachments ?? []);
                },
                error: (err) => {
                    console.error('Failed to load voucher for edit:', err);
                    this.showError(this.extractApiError(err));
                },
            });
    }

    /** Patch the header form controls from a loaded voucher. */
    private patchHeaderFromVoucher(v: paymentVoucherByIdData): void {
        this.form.patchValue({
            voucherNo: v.voucherNo,
            voucherDate: v.voucherDate ? new Date(v.voucherDate) : null,
            bankAccount: v.accountId,
            narration: v.remarks ?? '',
            lcyCurrency: v.baseCurrencyId,
            lcyExRate: v.baseExchangeRate,
            fcyCurrency: v.fcyCurrencyId,
            fcyExRate: v.fcyExchangeRate,
        });
    }

    /** Resolve each saved detail line into a display row (id → name via the loaded lookups). */
    private buildDetailRows(
        details: paymentVoucherByIdData['voucherDetails'],
        lookups: EditModeLookups,
    ): VoucherDetailRow[] {
        return details.map((d) => {
            const amount = (d.debit || d.credit) || 0;
            return {
                // Display names
                transactionType: lookups.transactionTypes.data.find((t) => t.id === d.transactionTypeId)?.name ?? '',
                account: lookups.accounts.data.find((a) => a.id === d.accountId)?.accountName ?? d.accountName ?? '',
                subLedgerType: lookups.subLedgerTypes.data.find((t) => t.id === d.subLedgerTypeId)?.name ?? '',
                subLedger: '', // Sub-ledger names depend on type — left blank; edit a row to resolve it.
                department: lookups.departments.data.find((dep) => dep.id === d.departmentId)?.departmentName ?? '',
                costCenter: lookups.costCenters.data.find((c) => c.id === d.costCenterId)?.costCenterName ?? '',
                paymentMode: lookups.paymentModes.data.find((p) => p.id === d.paymentModeId)?.name ?? '',
                chequeType: lookups.chequeTypes.data.find((c) => c.id === d.chequeTypeId)?.name ?? '',
                // Lookup ids (kept for the save payload)
                transactionTypeId: d.transactionTypeId,
                accountId: d.accountId,
                subLedgerTypeId: d.subLedgerTypeId,
                subLedgerId: d.subLedgerId,
                departmentId: d.departmentId,
                costCenterId: d.costCenterId,
                paymentModeId: d.paymentModeId,
                chequeTypeId: d.chequeTypeId,
                // Update-only: lineId tells the backend this is an existing row.
                lineId: d.lineId ?? 0,
                // Plain fields
                exchangeRate: d.exchangeRate,
                chequeNo: d.chequeNumber ?? '',
                chequeDate: d.chequeDate ? formatDate(new Date(d.chequeDate), 'dd-MMM-yyyy', 'en-US') : '',
                payeeTitle: d.payeeTitle ?? '',
                amount,
                discount: d.discountAmount ?? 0,
                taxPercent: 0, // Recomputed by VoucherDetails' applyTax once tax rows arrive.
                taxAmount: d.taxAmount ?? 0,
                netAmount: amount - (d.discountAmount ?? 0) + (d.taxAmount ?? 0),
            };
        });
    }

    /** Tax rows live on voucherDetails[0].taxes (save logic duplicates them across all lines). */
    private buildTaxRows(details: paymentVoucherByIdData['voucherDetails']): VoucherTaxRow[] {
        return (details[0]?.taxes ?? []).map((t) => ({
            taxAccount: t.accountId,
            taxType: t.taxTypeId,
            whtPercent: t.taxPercent,
            baseAmount: 0,
            taxAmount: t.taxAmount,
            editing: false,
        }));
    }

    /** Asks the backend for the next voucher number and patches the disabled field. */
    private generateVoucherNo(): void {
        const fyId = this.financialYearId();
        if (fyId == null) return; // Modal blocks app until selected — defensive guard.
        const documentTypeId = 1; // Payment voucher.
        this.paymentVoucherService.generateVoucherNo(documentTypeId, fyId).pipe(
            takeUntilDestroyed(this.$destroyRef),
        ).subscribe({
            next: (res) => {
                if (res?.success && res.data?.voucherNo) {
                    this.form.patchValue({ voucherNo: res.data.voucherNo });
                }
            },
            error: (err) => console.error('Error generating voucher no:', err),
        });
    }

    private getBankAccountList(): void {
        this.lookupService.getAccountDropdown(0, 0, 2).pipe(
            takeUntilDestroyed(this.$destroyRef),
        ).subscribe({
            next: (accounts) => this.bankAccounts.set(accounts.data ?? []),
            error: (err) => console.error('Error fetching bank accounts:', err),
        });
    }

    /**
     * Load the currency list + base-currency system settings, then seed the header
     * defaults from those settings (LCY/FCY currency + rates).
     */
    private getCurrencyList(): void {
        forkJoin({
            currencies: this.lookupService.getCurrencies(),
            settings: this.systemSettingsService.getBaseCurrencyConfig(),
        }).pipe(takeUntilDestroyed(this.$destroyRef)).subscribe({
            next: ({ currencies, settings }) => {
                this.currencies.set(currencies.data ?? []);
                this.baseCurrencyConfig.set(settings);
                this.seedCurrencyDefaults();
            },
            error: (err) => console.error('Error fetching currencies / settings:', err),
        });
    }

    /**
     * Seed LCY + FCY currency selects and their rates from system settings
     * (matching the currency code to its id). Skipped in edit mode, where the
     * loaded voucher's own values take precedence.
     */
    private seedCurrencyDefaults(): void {
        if (this.isEditMode()) return;

        const list = this.currencies();
        const cfg = this.baseCurrencyConfig();
        const idForCode = (code: string | undefined) =>
            code ? list.find((c) => c.currencyCode === code)?.id ?? null : null;

        this.form.patchValue({
            lcyCurrency: idForCode(cfg?.lcyCurrency) ?? list.find((c) => c.isBaseCurrency)?.id ?? null,
            lcyExRate: cfg?.lcyRate ?? null,
            fcyCurrency: idForCode(cfg?.fcyCurrency) ?? list.find((c) => c.currencyCode === 'USD')?.id ?? null,
            fcyExRate: cfg?.fcyRate ?? null,
        });
    }

    form = this.fb.group({
        voucherNo: [{ value: '' as string, disabled: true }],
        voucherDate: [new Date() as Date | null, Validators.required],
        bankAccount: [null as number | null, Validators.required],
        narration: [''],
        // Seeded from system settings — read-only to the user.
        lcyCurrency: [{ value: null as number | null, disabled: true }],
        lcyExRate: [{ value: null as number | null, disabled: true }],
        fcyCurrency: [{ value: null as number | null, disabled: true }],
        fcyExRate: [{ value: null as number | null, disabled: true }],
    });

    get f() {
        return this.form.controls;
    }

    get selectedBalance(): string | null {
        const id = this.form.get('bankAccount')?.value;
        if (!id) return null;
        const balance = this.bankAccounts().find((a) => a.id === id)?.balance;
        // Fall back to a dummy balance until the API exposes real account balances.
        return balance || '15,000,000 DR';
    }

    // ── Summary state (fed by the detail + tax tables) ─────────────────────────
    summaryGross = 0;
    summaryDiscount = 0;
    summaryTotalTax = 0;

    /** Effective tax rate for voucher detail lines = Σ(WHT %) from the tax table */
    detailTaxRate = 0;

    /** Valid once the header is complete and at least one line item exists */
    get summaryValid(): boolean {
        return this.form.valid && this.summaryGross > 0;
    }

    get summaryValidationMessage(): string {
        if (this.summaryGross <= 0) return 'Please add at least one row in Voucher Details to continue.';
        if (this.form.invalid) return 'Complete the required header fields.';
        return 'No validation errors.';
    }

    onDetailsTotals(totals: VoucherDetailTotals): void {
        this.summaryGross = totals.gross;
        this.summaryDiscount = totals.discount;
    }

    onTaxTotal(total: number): void {
        this.summaryTotalTax = total;
    }

    onTaxRate(rate: number): void {
        this.detailTaxRate = rate;
    }

    onCancel(): void {
        // Pending temp attachments get wiped by the CanDeactivate guard during navigation.
        this.router.navigate(['/accounts/payment-voucher']);
    }
    onReset(): void {
    this.resetFormForNew();
}

onRefresh(): void {
    // Reload header lookups
    this.getBankAccountList();
    this.getCurrencyList();

    // Reload child lookups
    this.voucherDetailsCmp?.refreshLookups();
    this.voucherTaxCmp?.refreshLookups();

    this.showSuccess('Lookup data refreshed successfully.'  );
}

    /** Submit guard against concurrent clicks of Save / Save & New while a POST is in flight. */
    saving = signal(false);

    onSave(): void {
        this.submit(false);
    }

    onSaveAndNew(): void {
        this.submit(true);
    }

    /**
     * Branches between POST (create) and PUT (update) based on edit mode.
     * On success, `resetForNew` keeps the user on the form with a fresh voucher;
     * otherwise we navigate back to the list.
     */
    private submit(resetForNew: boolean): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }
        if (this.saving()) return;
        this.saving.set(true);

        const payload = this.buildSavePayload();
        const id = this.voucherId();
        const request$ = id != null
            ? this.paymentVoucherService.updatePaymentVoucher(id, payload)
            : this.paymentVoucherService.savePaymentVoucher(payload);

        const successMessage = id != null
            ? 'Payment voucher updated successfully.'
            : 'Payment voucher saved successfully.';

        request$.pipe(takeUntilDestroyed(this.$destroyRef)).subscribe({
            next: (res) => {
                this.saving.set(false);
                if (res?.success) {
                    // Backend has committed the attachments; clear local pending so the guard doesn't delete them.
                    this.attachmentService.commit();
                    this.showSuccess(successMessage);
                    if (resetForNew) {
                        this.resetFormForNew();
                    } else {
                        this.router.navigate(['/accounts/payment-voucher']);
                    }
                } else {
                    this.showError(res?.message || 'Failed to save the payment voucher.');
                }
            },
            error: (err) => {
                this.saving.set(false);
                this.showError(this.extractApiError(err));
            },
        });
    }

    /** Clear the form, child tables, summary, and attachments so the user can enter a fresh voucher. */
    private resetFormForNew(): void {
        // Whether we were creating or editing, this becomes a brand-new voucher.
        this.voucherId.set(null);
        this.title.set('Payment Voucher');
        this.status.set('Draft');

        this.form.reset({
            voucherNo: '',
            voucherDate: new Date(),
            bankAccount: null,
            narration: '',
            lcyCurrency: null,
            lcyExRate: null,
            fcyCurrency: null,
            fcyExRate: null,
        });
        this.seedCurrencyDefaults();

        // Child tables + summary back to empty.
        this.voucherDetailsCmp?.reset();
        this.voucherTaxCmp?.reset();
        this.summaryGross = 0;
        this.summaryDiscount = 0;
        this.summaryTotalTax = 0;
        this.detailTaxRate = 0;

        // Attachments were already committed; clear the local display + queues.
        this.attachmentService.loadSaved([]);

        // Pull a fresh voucher number for the new entry.
        this.generateVoucherNo();
    }

    private showSuccess(detail: string): void {
        this.messageService.add({ severity: 'success', summary: 'Success', detail, life: 3000 });
    }

    private showError(detail: string): void {
        this.messageService.add({ severity: 'error', summary: 'Error', detail, life: 5000 });
    }

    /** Pull a human-readable message out of a .NET API error response. */
    private extractApiError(err: any): string {
        const body = err?.error;
        if (!body) return err?.message || 'Something went wrong. Please try again.';
        // Validation problem details: { errors: { '$.field': ['msg'] } }
        if (body.errors && typeof body.errors === 'object') {
            const messages = Object.values(body.errors).flat() as string[];
            if (messages.length) return messages.join(' ');
        }
        return body.message || body.title || 'Failed to save the payment voucher.';
    }

    /** Coerce a form/row value (possibly string or null) to a number, defaulting to 0. */
    private toNum(value: unknown): number {
        return Number(value) || 0;
    }

    /**
     * Assemble the save payload from the current form state, the detail rows,
     * the tax rows, and the staged attachments. The .NET API rejects `null` for
     * int/string DTO fields, so unknown / not-yet-collected values default to
     * `0` / `""` (matching the swagger example).
     */
    private buildSavePayload(): paymentVoucherPayload {
        const header = this.form.getRawValue();
        const detailRows = this.voucherDetailsCmp?.voucherRows ?? [];
        const taxRows = this.voucherTaxCmp?.taxRows ?? [];
        const attachments = this.attachmentService.pending();

        const voucherDateIso = header.voucherDate
            ? new Date(header.voucherDate).toISOString()
            : new Date().toISOString();

        // Global Tax Deductions get duplicated onto every detail line until the API
        // tells us whether taxes are truly per-line or applied at header level.
        // Skip rows that the user never filled in — the placeholder row added by
        // VoucherTax on init would otherwise post as `{ all zeros }`.
        const taxes: paymentVoucherTax[] = taxRows
            .filter((t) => t.taxAccount != null)
            .map((t) => ({
                taxTypeId: this.toNum(t.taxType),
                accountId: this.toNum(t.taxAccount),
                taxPercent: this.toNum(t.whtPercent),
                taxAmount: this.toNum(t.taxAmount),
            }));

        return {
            documentTypeId: 1,
            voucherType: 1, // assumed constant for payment vouchers
            voucherDate: voucherDateIso,
            // Posting date isn't collected yet — fall back to voucher date.
            postingDate: voucherDateIso,
            accountId: this.toNum(header.bankAccount),
            baseCurrencyId: this.toNum(header.lcyCurrency),
            baseExchangeRate: this.toNum(header.lcyExRate),
            fcyCurrencyId: this.toNum(header.fcyCurrency),
            fcyExchangeRate: this.toNum(header.fcyExRate),
            remarks: header.narration ?? '',
            companyId: 1, // pull from JWT / session context
            financialYearId: this.financialYearId() ?? 0,
            voucherDetails: detailRows.map((r) => ({
                accountId: this.toNum(r.accountId),
                subLedgerTypeId: this.toNum(r.subLedgerTypeId),
                subLedgerId: this.toNum(r.subLedgerId),
                counterAccountId: this.toNum(r.accountId),
                comments: '',
                paymentModeId: this.toNum(r.paymentModeId),
                chequeId: 0,
                chequeNumber: r.chequeNo ?? '',
                chequeDate: r.chequeDate
                    ? new Date(r.chequeDate).toISOString()
                    : voucherDateIso,
                payeeTitle: r.payeeTitle ?? '',
                chequeTypeId: this.toNum(r.chequeTypeId),
                transactionTypeId: this.toNum(r.transactionTypeId),
                debit: this.toNum(r.amount), // for now, treat amount as debit
                credit: 0,
                exchangeRate: this.toNum(r.exchangeRate),
                amountFcy: 0,
                taxAmount: this.toNum(r.taxAmount),
                discountAmount: this.toNum(r.discount),
                costCenterId: this.toNum(r.costCenterId),
                departmentId: this.toNum(r.departmentId),
                // Existing rows carry the API's lineId; new rows added in the modal default to 0.
                lineId: this.toNum(r.lineId),
                taxes,
            })),
            attachments,
            // Update endpoint only — POST ignores this; PUT consumes the queued removals.
            deleteAttachmentIds: this.attachmentService.deletedIds(),
        };
    }

    togglePrintMenu(event: Event): void {
        event.stopPropagation();
        this.printMenuOpen.update((v) => !v);
    }

    print(type: 'pdf' | 'print'): void {
        this.printMenuOpen.set(false);
        const id = this.voucherId();
        if (id == null) return; // Only available for a saved voucher (edit mode).
        // Open the print-friendly view in a new tab and auto-open the browser print
        // dialog. For "Download PDF" the dialog's "Save as PDF" destination is used.
        window.open(`/accounts/payment-voucher/${id}/print?autoprint=1`, '_blank');
    }

    @HostListener('document:click')
    closePrintMenu(): void {
        this.printMenuOpen.set(false);
    }
}
