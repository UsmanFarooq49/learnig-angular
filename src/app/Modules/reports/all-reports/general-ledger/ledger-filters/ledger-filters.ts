import { Component, DestroyRef, OnInit, inject, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { CheckboxModule } from 'primeng/checkbox';
import { LookupService } from '@/app/shared';
import { LedgerFilters as LedgerFilterValues, LedgerOption } from '../general-ledger.types';

@Component({
    selector: 'app-ledger-filters',
    imports: [CommonModule, FormsModule, ReactiveFormsModule, DatePickerModule, SelectModule, CheckboxModule],
    templateUrl: './ledger-filters.html',
    styleUrl: './ledger-filters.scss',
})
export class LedgerFilters implements OnInit {
    private fb = inject(FormBuilder);
    private lookupService = inject(LookupService);
    private destroyRef = inject(DestroyRef);

    /** Emitted with the current values when "Apply Filter" is clicked. */
    apply = output<LedgerFilterValues>();
    /** Emitted when the filters are reset. */
    resetFilters = output<void>();

    // TODO: replace the placeholder lists with their real lookup endpoints.
    fiscalYears = signal<LedgerOption[]>([{ id: 1, name: 'FY 2025-26' }]);
    branches = signal<LedgerOption[]>([{ id: 1, name: 'Head Office - Karachi' }]);
    companies = signal<LedgerOption[]>([{ id: 1, name: 'ZAS Software Pvt Ltd' }]);
    currencies = signal<LedgerOption[]>([]);

    filtersOpen = signal(true);
    showZeroBalances = signal(false);
    includeFcy = signal(false);

    filterForm = this.fb.group({
        fromDate: [this.startOfMonth() as Date | null, Validators.required],
        toDate: [new Date() as Date | null, Validators.required],
        fiscalYearId: [1 as number | null],
        branchId: [1 as number | null],
        companyId: [1 as number | null],
        currencyId: [null as number | null],
    });

    ngOnInit(): void {
        this.loadCurrencies();
    }

    private startOfMonth(): Date {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), 1);
    }

    private loadCurrencies(): void {
        this.lookupService.getCurrencies().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: (res) => {
                const list = (res.data ?? []).map((c) => ({ id: c.id, name: `${c.currencyCode} - ${c.currencyName}` }));
                this.currencies.set(list);
                const base = res.data?.find((c) => c.isBaseCurrency)?.id ?? list[0]?.id ?? null;
                this.filterForm.patchValue({ currencyId: base });
            },
            error: (err) => console.error('Failed to load currencies:', err),
        });
    }

    toggleFilters(): void {
        this.filtersOpen.update((v) => !v);
    }

    /** Summary line shown next to "Hide Filters". */
    filterSummary(): string {
        const v = this.filterForm.getRawValue();
        const fy = this.fiscalYears().find((f) => f.id === v.fiscalYearId)?.name;
        const br = this.branches().find((b) => b.id === v.branchId)?.name;
        return [fy ? `FY: ${fy}` : null, br ? `Branch: ${br}` : null].filter(Boolean).join('  ·  ');
    }

    applyFilter(): void {
        if (this.filterForm.invalid) {
            this.filterForm.markAllAsTouched();
            return;
        }
        this.apply.emit(this.currentValues());
    }

    reset(): void {
        const keepCurrency = this.filterForm.get('currencyId')?.value ?? null;
        this.filterForm.reset({
            fromDate: this.startOfMonth(),
            toDate: new Date(),
            fiscalYearId: 1,
            branchId: 1,
            companyId: 1,
            currencyId: keepCurrency,
        });
        this.showZeroBalances.set(false);
        this.includeFcy.set(false);
        this.resetFilters.emit();
    }

    private currentValues(): LedgerFilterValues {
        const v = this.filterForm.getRawValue();
        return {
            fromDate: v.fromDate ?? null,
            toDate: v.toDate ?? null,
            fiscalYearId: v.fiscalYearId ?? null,
            branchId: v.branchId ?? null,
            companyId: v.companyId ?? null,
            currencyId: v.currencyId ?? null,
            showZeroBalances: this.showZeroBalances(),
            includeFcy: this.includeFcy(),
        };
    }
}
