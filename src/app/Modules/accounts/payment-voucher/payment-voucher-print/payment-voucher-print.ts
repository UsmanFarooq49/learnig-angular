import { Component, DestroyRef, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PaymentVoucherService } from '../payment-voucher-service';
import { paymentVoucherByIdData } from '../payment-voucher.types';

@Component({
    selector: 'app-payment-voucher-print',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './payment-voucher-print.html',
    styleUrl: './payment-voucher-print.scss',
})
export class PaymentVoucherPrint implements OnInit {
    private route = inject(ActivatedRoute);
    private paymentVoucherService = inject(PaymentVoucherService);
    private destroyRef = inject(DestroyRef);

    voucher = signal<paymentVoucherByIdData | null>(null);
    error = signal<string | null>(null);
    loading = signal(true);

    /** Sum of tax amounts across all lines (NOT deduped — this is the real tax burden). */
    totalTax = computed(() => {
        const v = this.voucher();
        if (!v) return 0;
        return v.voucherDetails.reduce((sum, line) => sum + (Number(line.taxAmount) || 0), 0);
    });

    /** Net payable = total debit + tax (simple model; refine if the backend exposes a field). */
    netPayable = computed(() => {
        const v = this.voucher();
        if (!v) return 0;
        return (Number(v.totalDebit) || 0) + this.totalTax();
    });

    ngOnInit(): void {
        const idParam = this.route.snapshot.paramMap.get('id');
        const id = idParam != null ? Number(idParam) : NaN;
        if (!Number.isFinite(id) || id <= 0) {
            this.loading.set(false);
            this.error.set('No voucher id supplied.');
            return;
        }

        this.paymentVoucherService.getPaymentVoucherById(id)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (res) => {
                    this.loading.set(false);
                    if (res?.success && res.data) {
                        this.voucher.set(res.data);
                        // When opened from the form's Print / Download PDF menu, kick off the
                        // browser print dialog once the sheet has rendered.
                        if (this.route.snapshot.queryParamMap.get('autoprint') === '1') {
                            setTimeout(() => window.print(), 300);
                        }
                    } else {
                        this.error.set(res?.message || 'Voucher not found.');
                    }
                },
                error: (err) => {
                    this.loading.set(false);
                    this.error.set(err?.error?.message || err?.message || 'Failed to load voucher.');
                },
            });
    }

    print(): void {
        window.print();
    }

    /** Status label resolver — mirrors the list component so prints don't show a raw "0". */
    statusLabel(): string {
        const v = this.voucher();
        if (!v) return '';
        if (v.isPosted) return 'Posted';
        return 'Draft';
    }
}
