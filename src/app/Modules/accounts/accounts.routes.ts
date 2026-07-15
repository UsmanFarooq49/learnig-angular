import { Routes } from '@angular/router';
import { ChartOfAccount } from './chart-of-account/chart-of-account';
import { JournalVoucher } from './journal-voucher/journal-voucher';
import { ReceiptVoucher } from './receipt-voucher/receipt-voucher';
import { PaymentVoucherList } from './payment-voucher/payment-voucher-list/payment-voucher-list';
import { PaymentVoucherForm } from './payment-voucher/payment-voucher-form/payment-voucher-form';
import { PaymentVoucherPrint } from './payment-voucher/payment-voucher-print/payment-voucher-print';
import { attachmentsCleanupGuard } from './payment-voucher/attachments-cleanup.guard';

export default [
    { path: '', redirectTo: 'payment-voucher', pathMatch: 'full' },
    { path: 'chart-of-account', title: 'Chart of Accounts | Zascare', component: ChartOfAccount },
    { path: 'journal-voucher', title: 'Journal Voucher | Zascare', component: JournalVoucher },
    { path: 'payment-voucher', title: 'Payment Vouchers | Zascare', component: PaymentVoucherList },
    {
        path: 'payment-voucher/new',
        title: 'New Payment Voucher | Zascare',
        component: PaymentVoucherForm,
        canDeactivate: [attachmentsCleanupGuard],
    },
    {
        path: 'payment-voucher/:id/print',
        title: 'Print Payment Voucher | Zascare',
        component: PaymentVoucherPrint,
    },
    {
        path: 'payment-voucher/:id',
        title: 'Edit Payment Voucher | Zascare',
        component: PaymentVoucherForm,
        canDeactivate: [attachmentsCleanupGuard],
    },
    { path: 'receipt-voucher', title: 'Receipt Voucher | Zascare', component: ReceiptVoucher },
] as Routes;