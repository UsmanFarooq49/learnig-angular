import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DialogModule } from 'primeng/dialog';
import { DatePickerModule } from 'primeng/datepicker';
import { FloatLabelModule } from 'primeng/floatlabel';
import { MainDataGridComponent, DataGridColumn, LookupService, SelectFieldComponent, TableCellDirective } from '@/app/shared';
import { ConfirmationService, MessageService } from 'primeng/api';
import { PaymentVoucherService } from '../payment-voucher-service';
import {
    BankAccounts,
    paymentVoucherListItem,
    paymentVoucherListRequest,
    paymentVoucherListTotals,
} from '../payment-voucher.types';
import { selectFinancialYearId } from '@/app/store/auth/auth.selectors';

type QuickFilterId = 'all' | 'draft' | 'approved' | 'pendingApproval';
interface QuickFilter {
    id: QuickFilterId;
    label: string;
    dot?: string; // tailwind bg class for the leading dot; omitted on "All"
}

@Component({
    selector: 'app-payment-voucher-list',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MainDataGridComponent,
        TableCellDirective,
        DialogModule,
        DatePickerModule,
        FloatLabelModule,
        SelectFieldComponent,
    ],
    templateUrl: './payment-voucher-list.html',
    styleUrl: './payment-voucher-list.scss',
})
export class PaymentVoucherList implements OnInit {
    private router = inject(Router);
    private fb = inject(FormBuilder);
    private paymentVoucherService = inject(PaymentVoucherService);
    private lookupService = inject(LookupService);
    private store = inject(Store);
    private destroyRef = inject(DestroyRef);
    private messageService = inject(MessageService);
    private confirmationService = inject(ConfirmationService);

    private financialYearId = this.store.selectSignal(selectFinancialYearId);

    selectedVouchers: paymentVoucherListItem[] = [];

    // ── Quick filter chips (UI only for now — wire to backend later) ──────────
    quickFilters: QuickFilter[] = [
        { id: 'all', label: 'All' },
        { id: 'draft', label: 'Draft', dot: 'bg-sky-500' },
        { id: 'approved', label: 'Approved', dot: 'bg-emerald-500' },
        { id: 'pendingApproval', label: 'Pending Approval', dot: 'bg-amber-500' },
    ];
    selectedQuickFilter = signal<QuickFilterId>('all');

    // ── Advanced filters dialog ───────────────────────────────────────────────
    filtersDialogVisible = signal(false);
    accounts = signal<BankAccounts[]>([]);
    /** Accounts list with a sentinel "All" option (id=0) prepended for the dialog dropdowns. */
    accountsWithAll = computed<BankAccounts[]>(() => [
        { id: 0, accountName: 'All' } as BankAccounts,
        ...this.accounts(),
    ]);

    /** True when at least one advanced-filter field is currently applied. */
    hasActiveFilters = computed(() => {
        const f = this.appliedFilters();
        return !!f.fromDate || !!f.toDate || f.bankAccountId > 0 || f.debitAccountId > 0;
    });
    /** Latest applied advanced-filter values — used by loadList() to build the request body.
     * `bankAccountId` / `debitAccountId` use `0` as the "All" sentinel (matches the dropdown's prepended option). */
    private appliedFilters = signal<{
        fromDate: Date | null;
        toDate: Date | null;
        bankAccountId: number;
        debitAccountId: number;
    }>({ fromDate: null, toDate: null, bankAccountId: 0, debitAccountId: 0 });

    filterForm = this.fb.group({
        fromDate: [null as Date | null],
        toDate: [null as Date | null],
        bankAccountId: [0 as number],
        debitAccountId: [0 as number],
    });

    columns: DataGridColumn[] = [
        { field: 'voucherNo', header: 'Voucher No', sortable: true, filterable: true, frozen: 'left', width: '240px' },
        { field: 'voucherDate', header: 'Date', type: 'date', sortable: true, filterable: true, width: '140px' },
        { field: 'bankAccount', header: 'Bank Account', sortable: true, filterable: true },
        { field: 'totalAmountPkr', header: 'Amount (PKR)', type: 'number', align: 'left', sortable: true, filterable: true },
        { field: 'fcyCurrency', header: 'FCY', sortable: true, filterable: true, width: '90px' },
        { field: 'totalAmountFcy', header: 'FCY Amount', type: 'number', align: 'left', sortable: true, filterable: true },
        { field: 'status', header: 'Status', sortable: true, filterable: true, width: '140px' },
        { field: 'createdByName', header: 'Created By', sortable: true, filterable: true },
        { field: 'remarks', header: 'Remarks', sortable: true, filterable: true },
        { field: 'actions', header: 'Actions', frozen: 'right', width: '140px', sortable: false, filterable: false },
    ];

    /** Status badge palette. The API mixes labels ("Draft") with enum codes ("0") — both fall back to gray. */
    statusDot: Record<string, string> = {
        Draft: 'bg-sky-500',
        Posted: 'bg-violet-500',
        Cancelled: 'bg-red-500',
    };

    vouchers = signal<paymentVoucherListItem[]>([]);
    totalCount = signal(0);
    grandTotals = signal<paymentVoucherListTotals | null>(null);
    /** True while a server fetch is in flight — drives the grid's loading state. */
    listLoading = signal(false);

    // ── Server-side pagination / sort state (kept in sync with the grid's lazy events). ──
    private pageNumber = 1;
    private pageSize = 25;
    private sortBy: string = 'voucherDate';
    private sortDesc = true;
    /** Translated per-column filters ready to ship to the API. */
    private columnFilters: paymentVoucherListRequest['filters'] = [];

    ngOnInit(): void {
        // PrimeNG p-table (lazy mode) auto-fires `onLazyLoad` on mount with the initial
        // page/sort state — `onLazyLoad` triggers `loadList()` for us. We only kick off
        // the accounts lookup here.
        this.loadAccounts();
    }

    private loadAccounts(): void {
        this.lookupService.getAccountDropdown().pipe(
            takeUntilDestroyed(this.destroyRef),
        ).subscribe({
            next: (res) => this.accounts.set(res.data ?? []),
            error: (err) => console.error('Accounts dropdown failed:', err),
        });
    }

    private loadList(): void {
        const f = this.appliedFilters();
        const statusFilter = this.statusFilterForBackend(this.selectedQuickFilter());
        const req: paymentVoucherListRequest = {
            pageNumber: this.pageNumber,
            pageSize: this.pageSize,
            sortBy: this.sortBy,
            sortDesc: this.sortDesc,
            documentTypeId: 1, // payment voucher
            companyId: 1,      // TODO: pull from JWT (claim CompanyId)
            ...(this.columnFilters?.length && { filters: this.columnFilters }),
            ...(statusFilter && { statusFilter }),
            ...(f.fromDate && { fromDate: f.fromDate.toISOString() }),
            ...(f.toDate && { toDate: f.toDate.toISOString() }),
            ...(f.bankAccountId > 0 && { bankAccountId: f.bankAccountId }),
            ...(f.debitAccountId > 0 && { debitAccountId: f.debitAccountId }),
        };

        this.listLoading.set(true);
        this.paymentVoucherService.getPaymentVoucherList(req).pipe(
            takeUntilDestroyed(this.destroyRef),
        ).subscribe({
            next: (res) => {
                this.listLoading.set(false);
                if (res?.success && res.data) {
                    this.vouchers.set(res.data.items ?? []);
                    this.totalCount.set(res.data.totalCount ?? 0);
                    this.grandTotals.set(res.data.grandTotals ?? null);
                } else {
                    this.handleListError(res?.message || 'The server refused the request.');
                }
            },
            error: (err) => {
                this.listLoading.set(false);
                this.handleListError(this.extractListError(err));
            },
        });
    }

    private handleListError(detail: string): void {
        // Keep the previous successful data on screen so the user isn't dumped to a blank table.
        this.messageService.add({
            severity: 'error',
            summary: 'Could not load vouchers',
            detail,
            life: 5000,
        });
    }

    /** Pull a human-readable message out of a .NET API error response. */
    private extractListError(err: any): string {
        const body = err?.error;
        if (!body) return err?.message || 'Request failed.';
        if (body.errors && typeof body.errors === 'object') {
            const messages = Object.values(body.errors).flat() as string[];
            if (messages.length) return messages.join(' ');
        }
        return body.message || body.title || 'Request failed.';
    }

    // ── Filter actions ────────────────────────────────────────────────────────

    setQuickFilter(id: QuickFilterId): void {
        if (this.selectedQuickFilter() === id) return;
        this.selectedQuickFilter.set(id);
        this.pageNumber = 1; // any filter change should drop the user back to page 1
        this.loadList();
    }

    /**
     * PrimeNG fires this whenever the user changes page, sort, or column filter
     * while `lazy=true`. We translate the event into the API request shape and
     * refetch. Called once on mount with the initial state too.
     */
    onLazyLoad(event: import('primeng/table').TableLazyLoadEvent): void {
        const first = Number(event.first ?? 0);
        const rows = Number(event.rows ?? this.pageSize) || this.pageSize;
        this.pageNumber = Math.floor(first / rows) + 1;
        this.pageSize = rows;

        // Sort
        const sortField = Array.isArray(event.sortField) ? event.sortField[0] : event.sortField;
        if (sortField) {
            this.sortBy = sortField;
            this.sortDesc = (event.sortOrder ?? 1) < 0;
        }

        this.columnFilters = this.translateColumnFilters(event.filters);
        this.loadList();
    }

    /**
     * PrimeNG's filter metadata → our API's `filters[]` shape. The API supports
     * stringValue/numericValue/dateValue with parallel `stringFilter`/`numericFilter`/`dateFilter`
     * mode codes — we emit one entry per column with the right value slot populated and the
     * match mode (Contains / Equals / Greater than / …) translated to the backend enum.
     */
    private translateColumnFilters(
        raw: import('primeng/table').TableLazyLoadEvent['filters'],
    ): paymentVoucherListRequest['filters'] {
        if (!raw) return [];
        const out: NonNullable<paymentVoucherListRequest['filters']> = [];
        for (const [column, meta] of Object.entries(raw)) {
            const entries = Array.isArray(meta) ? meta : [meta];
            for (const m of entries) {
                if (m?.value == null || m.value === '') continue;
                const v = m.value;
                const mode = m.matchMode;
                if (typeof v === 'number') {
                    out.push({ column, numericValue: v, numericFilter: this.numericFilterCode(mode) });
                } else if (v instanceof Date) {
                    out.push({ column, dateValue: v.toISOString(), dateFilter: this.dateFilterCode(mode) });
                } else {
                    out.push({ column, stringValue: String(v), stringFilter: this.stringFilterCode(mode) });
                }
            }
        }
        return out;
    }

    // ── PrimeNG matchMode → backend filter-enum mappings ──────────────────────
    // Backend enums are documented on `paymentVoucherListFilter` in the types file.

    /** Text match mode → stringFilter (1=Contains, 2=Equals, 3=StartsWith, 4=EndsWith). */
    private stringFilterCode(mode: string | undefined): number {
        switch (mode) {
            case 'equals':
            case 'notEquals':   return 2;
            case 'startsWith':  return 3;
            case 'endsWith':    return 4;
            case 'contains':
            case 'notContains':
            default:            return 1;
        }
    }

    /** Numeric match mode → numericFilter (1=Equals, 2=NotEquals, 3=GreaterThan, 4=LessThan). */
    private numericFilterCode(mode: string | undefined): number {
        switch (mode) {
            case 'notEquals':   return 2;
            case 'gt':
            case 'gte':         return 3;
            case 'lt':
            case 'lte':         return 4;
            case 'equals':
            default:            return 1;
        }
    }

    /** Date match mode → dateFilter (1=On, 2=Before, 3=After, 4=Between). */
    private dateFilterCode(mode: string | undefined): number {
        switch (mode) {
            case 'dateBefore':  return 2;
            case 'dateAfter':   return 3;
            case 'dateIs':
            case 'dateIsNot':
            default:            return 1;
        }
    }

    /** Map the chip id to the string the backend expects in `statusFilter`.
     * "All" returns `null` so the request body omits the field entirely.
     * Adjust the right-hand strings if the backend uses different labels (e.g. "PendingApproval"). */
    private statusFilterForBackend(id: QuickFilterId): string | null {
        switch (id) {
            case 'draft':           return 'Draft';
            case 'approved':        return 'Approved';
            case 'pendingApproval': return 'Pending Approval';
            case 'all':
            default:                return null;
        }
    }

    openFiltersDialog(): void {
        // Seed the form with the currently-applied values so the dialog reflects state.
        this.filterForm.setValue(this.appliedFilters());
        this.filtersDialogVisible.set(true);
    }

    closeFiltersDialog(): void {
        this.filtersDialogVisible.set(false);
    }

    applyAdvancedFilters(): void {
        const v = this.filterForm.getRawValue();
        this.appliedFilters.set({
            fromDate: v.fromDate ?? null,
            toDate: v.toDate ?? null,
            bankAccountId: v.bankAccountId ?? 0,
            debitAccountId: v.debitAccountId ?? 0,
        });
        this.filtersDialogVisible.set(false);
        this.pageNumber = 1;
        this.loadList();
    }

    resetAdvancedFilters(): void {
        this.filterForm.reset({
            fromDate: null,
            toDate: null,
            bankAccountId: 0,
            debitAccountId: 0,
        });
        this.appliedFilters.set({ fromDate: null, toDate: null, bankAccountId: 0, debitAccountId: 0 });
        this.pageNumber = 1;
        this.loadList();
    }

    /** Deterministic palette for the voucher avatar — same voucherNo → same color across renders. */
    private readonly avatarPalette = [
        'bg-rose-100 text-rose-600',
        'bg-emerald-100 text-emerald-600',
        'bg-sky-100 text-sky-600',
        'bg-violet-100 text-violet-600',
        'bg-amber-100 text-amber-600',
        'bg-fuchsia-100 text-fuchsia-600',
        'bg-teal-100 text-teal-600',
        'bg-indigo-100 text-indigo-600',
    ];

    avatarClassFor(key: string | null | undefined): string {
        if (!key) return this.avatarPalette[0];
        let hash = 0;
        for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) | 0;
        return this.avatarPalette[Math.abs(hash) % this.avatarPalette.length];
    }

    initials(name: string | null | undefined): string {
        if (!name) return '—';
        return name
            .split(/[\s-]/)
            .map((w) => w[0])
            .filter(Boolean)
            .slice(0, 2)
            .join('')
            .toUpperCase();
    }

    openVoucher(item: paymentVoucherListItem): void {
        if (item?.id != null) this.router.navigate(['/accounts/payment-voucher', item.id]);
    }

    /**
     * Resolve the status label shown in the grid. The backend's `status` column
     * is inconsistent — some rows hold a label ("Draft"), others a numeric code ("0").
     * `isPosted` is the source of truth, so we lean on it first.
     */
    displayStatus(row: paymentVoucherListItem): string {
        if (row.isPosted) return 'Posted';
        const s = row.status;
        if (!s || /^\d+$/.test(s)) return 'Draft';
        return s;
    }

    onNew(): void {
        this.router.navigate(['/accounts/payment-voucher/new']);
    }

    // ── Per-row actions ───────────────────────────────────────────────────────

    editVoucher(item: paymentVoucherListItem, event: Event): void {
        event.stopPropagation();
        if (item?.id != null) this.router.navigate(['/accounts/payment-voucher', item.id]);
    }

    printVoucher(item: paymentVoucherListItem, event: Event): void {
        event.stopPropagation();
        if (item?.id == null) return;
        // Open the print-friendly route in a new tab; user clicks Print there.
        window.open(`/accounts/payment-voucher/${item.id}/print`, '_blank');
    }

    deleteVoucher(item: paymentVoucherListItem, event: Event): void {
        event.stopPropagation();
        if (item?.id == null) return;
        this.confirmationService.confirm({
            header: 'Delete voucher',
            message: `Delete voucher ${item.voucherNo}? This cannot be undone.`,
            icon: 'pi pi-exclamation-triangle text-red-500',
            acceptLabel: 'Delete',
            rejectLabel: 'Cancel',
            acceptButtonStyleClass: 'p-button-danger',
            rejectButtonStyleClass: 'p-button-text',
            accept: () => this.runDelete(item),
        });
    }

    private runDelete(item: paymentVoucherListItem): void {
        this.paymentVoucherService.deletePaymentVoucher(item.id)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (res) => {
                    if (res?.success) {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Deleted',
                            detail: `Voucher ${item.voucherNo} was removed.`,
                            life: 3000,
                        });
                        // Drop from the grid locally — no need to refetch the whole page.
                        this.vouchers.update((rows) => rows.filter((r) => r.id !== item.id));
                        this.totalCount.update((n) => Math.max(0, n - 1));
                    } else {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Delete failed',
                            detail: res?.message || 'The server refused the request.',
                            life: 5000,
                        });
                    }
                },
                error: (err) => {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Delete failed',
                        detail: err?.error?.message || err?.message || 'Request failed.',
                        life: 5000,
                    });
                },
            });
    }

    reverseVoucher(item: paymentVoucherListItem, event: Event): void {
        event.stopPropagation();
        if (item?.id == null) return;
        this.confirmationService.confirm({
            header: 'Reverse voucher',
            message: `Reverse voucher ${item.voucherNo}? A counter-entry will be posted to offset it.`,
            icon: 'pi pi-replay text-amber-500',
            acceptLabel: 'Reverse',
            rejectLabel: 'Cancel',
            acceptButtonStyleClass: 'p-button-warning',
            rejectButtonStyleClass: 'p-button-text',
            accept: () => this.runReverse(item),
        });
    }

    private runReverse(item: paymentVoucherListItem): void {
        this.paymentVoucherService.reversePaymentVoucher(item.id)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (res) => {
                    if (res?.success) {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Reversed',
                            detail: `Voucher ${item.voucherNo} was reversed.`,
                            life: 3000,
                        });
                        // The reversal flips the original and creates a counter-entry —
                        // refetch so the grid reflects both.
                        this.loadList();
                    } else {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Reverse failed',
                            detail: res?.message || 'The server refused the request.',
                            life: 5000,
                        });
                    }
                },
                error: (err) => {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Reverse failed',
                        detail: err?.error?.message || err?.message || 'Request failed.',
                        life: 5000,
                    });
                },
            });
    }

    /** Posted vouchers are part of the audit trail and shouldn't be deletable from the UI. */
    canDelete(item: paymentVoucherListItem): boolean {
        return !item?.isPosted;
    }

    /** Reverse is the posted-only counterpart to delete — only meaningful on posted vouchers. */
    canReverse(item: paymentVoucherListItem): boolean {
        return !!item?.isPosted;
    }
}
