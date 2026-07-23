import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-voucher-summary',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './voucher-summary.html',
    styleUrl: './voucher-summary.scss',
})
export class VoucherSummary {

    @Input() grossAmount = 0;

    @Input() discount = 0;

    @Input() totalTax = 0;

    @Input() valid = false;

    @Input() validationMessage = '';

    /** Future use */
    @Input() otherCharges = 0;

    /** Future use */
    @Input() exchangeRate = 1;

    /** Future use */
    @Input() fcyTotal = 0;

    /**
     * Taxable Amount
     */
    get taxableAmount(): number {
        return this.grossAmount - this.discount;
    }

    /**
     * Net Payable
     * Gross - Discount + Tax + Other Charges
     */
    get netPayable(): number {
        return (
            this.grossAmount -
            this.discount +
            this.totalTax +
            this.otherCharges
        );
    }

    /**
     * FCY Amount
     */
    get fcyAmount(): number {
        return this.fcyTotal * this.exchangeRate;
    }
}