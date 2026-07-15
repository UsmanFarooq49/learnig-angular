import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { DataTableComponent, TableColumn, TableRowActionsDirective } from '@/app/shared';
import { VoucherDetailModal } from '../voucher-detail-modal/voucher-detail-modal';

export interface VoucherDetailTotals {
    gross: number;
    discount: number;
}

@Component({
    selector: 'app-voucher-details',
    standalone: true,
    imports: [DataTableComponent, TableRowActionsDirective, VoucherDetailModal],
    templateUrl: './voucher-details.html',
    styleUrl: './voucher-details.scss',
})
export class VoucherDetails implements OnChanges {
    /** Tax rate (sum of WHT %) sourced from the Tax Deductions table */
    @Input() taxRate = 0;
    /** Selected bank account id from the header — forwarded to the detail modal for the cheque book. */
    @Input() bankAccountId: number | null = null;
    voucherColumns: TableColumn[] = [
        { field: 'transactionType', header: 'Transaction Type', required: true },
        { field: 'account', header: 'Account (Dr)', required: true },
        { field: 'subLedgerType', header: 'Sub Ledger Type' },
        { field: 'subLedger', header: 'Sub Ledger' },
        { field: 'department', header: 'Department' },
        { field: 'costCenter', header: 'Cost Center' },
        { field: 'paymentMode', header: 'Payment Mode' },
        { field: 'chequeType', header: 'Cheque Type' },
        { field: 'chequeNo', header: 'Cheque No' },
        { field: 'chequeDate', header: 'Cheque Date' },
        { field: 'payeeTitle', header: 'Payee Title / Narration' },
        { field: 'amount', header: 'Amount (PKR)', type: 'currency', required: true, total: true },
        { field: 'discount', header: 'Discount', type: 'number', total: true },
        { field: 'taxPercent', header: 'Tax %', type: 'number' },
        { field: 'taxAmount', header: 'Tax Amount', type: 'number', total: true },
        { field: 'netAmount', header: 'Net Amount', type: 'currency', total: true },
    ];

    voucherRows: any[] = [];

    /** Replace the rows wholesale — used by the parent form when loading a saved voucher for edit. */
    @Input() set initialRows(rows: any[] | null) {
        if (rows && rows.length) {
            this.voucherRows = rows.map((r) => this.applyTax({ ...r }));
            this.emitTotals();
        }
    }

    modalVisible = false;
    /** Index of the row currently being edited (null when adding a new row) */
    editingIndex: number | null = null;
    /** Snapshot of the row passed to the modal for editing */
    editingRow: any | null = null;

    /** Emits the gross + discount totals whenever the rows change */
    @Output() totalsChange = new EventEmitter<VoucherDetailTotals>();

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['taxRate'] && this.voucherRows.length) {
            this.voucherRows = this.voucherRows.map((r) => this.applyTax({ ...r }));
        }
    }

    /**
     * Apply the current WHT rate to a row using the gross-up model:
     * the row `amount` is the NET (after WHT), Gross = Net / (1 − WHT%),
     * and the withheld tax = Gross − Net.
     */
    private applyTax(row: any): any {
        const net = Number(row.amount) || 0;
        const discount = Number(row.discount) || 0;
        const rate = this.taxRate / 100;
        const gross = rate > 0 && rate < 1 ? net / (1 - rate) : net;
        row.taxPercent = this.taxRate;
        row.taxAmount = gross - net;       // WHT withheld
        row.netAmount = net + discount;    // net payable
        return row;
    }

    onAddRow(): void {
        this.editingIndex = null;
        this.editingRow = null;
        this.modalVisible = true;
    }

    onModalVisibleChange(visible: boolean): void {
        this.modalVisible = visible;
        // Clear edit state when the modal closes (cancel or save & close)
        if (!visible) {
            this.editingIndex = null;
            this.editingRow = null;
        }
    }

    onModalSaved(row: any): void {
        const taxed = this.applyTax(row);
        if (this.editingIndex !== null) {
            const idx = this.editingIndex;
            this.voucherRows = this.voucherRows.map((r, i) => (i === idx ? taxed : r));
        } else {
            this.voucherRows = [...this.voucherRows, taxed];
        }
        this.emitTotals();
    }

    /** Duplicate the picked row — inserts the copy right after it */
    onDuplicateRow(event: { row: any; index: number }): void {
        const copy = this.applyTax({ ...event.row });
        this.voucherRows = [
            ...this.voucherRows.slice(0, event.index + 1),
            copy,
            ...this.voucherRows.slice(event.index + 1),
        ];
        this.emitTotals();
    }

    onEditRow(event: { row: any; index: number }): void {
        this.editingIndex = event.index;
        this.editingRow = { ...event.row };
        this.modalVisible = true;
    }

    onRemoveRow(event: { row: any; index: number }): void {
        this.voucherRows = this.voucherRows.filter((_, i) => i !== event.index);
        this.emitTotals();
    }

    /** Clear every row — called by the parent form after a "Save & New". */
    reset(): void {
        this.voucherRows = [];
        this.emitTotals();
    }

    private emitTotals(): void {
        const gross = this.voucherRows.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
        const discount = this.voucherRows.reduce((sum, r) => sum + (Number(r.discount) || 0), 0);
        this.totalsChange.emit({ gross, discount });
    }
}
