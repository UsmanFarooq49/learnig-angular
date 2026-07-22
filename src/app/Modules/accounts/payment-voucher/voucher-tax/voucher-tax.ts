import { Component, DestroyRef, EventEmitter, inject, Input, OnInit, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { DataTableComponent, LookupService, TableCellDirective, TableRowActionsDirective, TableColumn } from '@/app/shared';
import { BankAccounts, taxTypeLookupData } from '../payment-voucher.types';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
    selector: 'app-voucher-tax',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        SelectModule,
        DataTableComponent,
        TableCellDirective,
        TableRowActionsDirective,
    ],
    templateUrl: './voucher-tax.html',
    styleUrl: './voucher-tax.scss',
})
export class VoucherTax implements OnInit {
    taxAccounts = signal<BankAccounts[]>([]);

    taxColumns: TableColumn[] = [
        { field: 'taxAccount', header: 'Tax Account (Cr)', required: true, width: '210px' },
        { field: 'taxType', header: 'Tax Type', width: '150px' },
        { field: 'whtPercent', header: 'WHT %', width: '110px' },
        { field: 'baseAmount', header: 'Base Amount', type: 'number', align: 'left' },
        { field: 'taxAmount', header: 'Tax Amount', type: 'number', align: 'left', total: true },
    ];

    taxRows: any[] = [];

    /** Replace the rows wholesale — used by the parent form when loading a saved voucher for edit. */
    @Input() set initialTaxRows(rows: any[] | null) {
        if (rows) {
            this.taxRows = [...rows];
        } else {
            this.taxRows = [];
        }

        if (this.taxRows.length === 0) {
            this.onAddRow();
        }

        this.emitTotal();
    }

    /** Tax type lookup loaded from the API */
    taxTypes = signal<taxTypeLookupData[]>([]);

    /** Emits the summed Tax Amount whenever the rows change */
    @Output() totalTaxChange = new EventEmitter<number>();

    /** Emits the summed WHT % (used as the voucher-line tax rate) */
    @Output() taxRateChange = new EventEmitter<number>();

    private lookupService = inject(LookupService);
    private $destroyRef = inject(DestroyRef);

    ngOnInit(): void {
        this.onAddRow();
        this.getTaxAccountsList();
        this.getTaxTypesList();
    }

    getTaxAccountsList(): void {
        this.lookupService.getAccountDropdown().pipe(
            takeUntilDestroyed(this.$destroyRef),
        ).subscribe({
            next: (response) => this.taxAccounts.set(response.data),
            error: (err) => console.error('Error fetching tax accounts:', err),
        });
    }

    /** Display name for the tax account stored on a saved row (used in read-only cells). */
    taxAccountNameFor(row: any): string {
        return this.taxAccounts().find((a) => a.id === row.taxAccount)?.accountName ?? '';
    }

    getTaxTypesList(): void {
        this.lookupService.getTaxTypes().pipe(
            takeUntilDestroyed(this.$destroyRef),
        ).subscribe({
            next: (response) => this.taxTypes.set(response.data),
            error: (err) => console.error('Error fetching tax types:', err),
        });
    }

    /** Fires when the Tax Type select changes — auto-fills WHT % from defaultRate. */
    onTaxTypeChange(row: any, value: number): void {
        const picked = this.taxTypes().find((t) => t.id === value);
        row.whtPercent = picked?.defaultRate ?? 0;
        this.recalc(row);
    }

    /** Display name for the tax type stored on a saved row (used in read-only cells). */
    taxTypeNameFor(row: any): string {
        return this.taxTypes().find((t) => t.id === row.taxType)?.taxTypeName ?? '';
    }

    onAddRow(): void {
        this.taxRows = [
            ...this.taxRows,
            {
                taxAccount: null,
                taxType: null,
                whtPercent: 0,
                baseAmount: 0,
                taxAmount: 0,
                editing: true,
            },
        ];
    }

    /** Tax Amount = Base Amount × WHT % */
    recalc(row: any): void {
        const base = Number(row.baseAmount) || 0;
        const wht = Number(row.whtPercent) || 0;

        row.taxAmount = (base * wht) / 100;

        this.emitTotal();
    }

    saveRow(row: any): void {
        if (row.taxAccount == null) return;

        row.editing = false;
        this.emitTotal();
    }

    editRow(row: any): void {
        row.editing = true;
        this.taxRows = [...this.taxRows];
    }

    onRemoveRow(event: { row: any; index: number }): void {
        this.taxRows = this.taxRows.filter((_, i) => i !== event.index);
        this.emitTotal();
    }

    /** Reset to a single empty row — called by the parent form after a "Save & New". */
    reset(): void {
        this.taxRows = [];
        this.onAddRow();
        this.emitTotal();
    }

    /** Refresh table after parent Refresh button */
    refresh(): void {
        this.taxRows = [...this.taxRows];
        this.emitTotal();
    }

    /**
     * Reload all lookup data used by the Voucher Tax component.
     * Called by the parent Payment Voucher form when Refresh is clicked.
     */
    refreshLookups(): void {
        this.getTaxAccountsList();
        this.getTaxTypesList();
        this.refresh();
    }

    private emitTotal(): void {
        const total = this.taxRows.reduce(
            (sum, r) => sum + (Number(r.taxAmount) || 0),
            0
        );

        const rate = this.taxRows.reduce(
            (sum, r) => sum + (Number(r.whtPercent) || 0),
            0
        );

        this.totalTaxChange.emit(total);
        this.taxRateChange.emit(rate);
    }
}