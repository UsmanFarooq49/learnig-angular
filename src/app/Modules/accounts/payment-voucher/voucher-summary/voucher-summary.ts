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
    @Input() otherCharges = 0;
    @Input() fcyTotal = 0;
    @Input() exchangeRate = 1;
    @Input() valid = true;
    @Input() validationMessage = 'No validation errors.';

    /** Gross minus discount */
    get taxableAmount(): number {
        return this.grossAmount - this.discount;
    }

    /** Taxable amount, less withholding tax, plus any other charges */
    get netPayable(): number {
        return this.taxableAmount - this.totalTax + this.otherCharges;
    }

    /** Foreign-currency total converted to local currency */
    get fcyAmount(): number {
        return this.fcyTotal * this.exchangeRate;
    }
}
