import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface ReportLink {
    label: string;
    icon: string;
    /** Route segment under /reports. */
    route: string;
    /** Placeholder report — points at the ledger for now and skips the active highlight. */
    placeholder?: boolean;
}

@Component({
    selector: 'app-reports-layout',
    imports: [CommonModule, RouterModule],
    templateUrl: './reports-layout.html',
    styleUrl: './reports-layout.scss',
})
export class ReportsLayout {
    reports: ReportLink[] = [
        { label: 'General Ledger', icon: 'pi-book', route: 'general-ledger' },
        { label: 'Trial Balance', icon: 'pi-list', route: 'trial-balance' },
        { label: 'Receivable Aging', icon: 'pi-clock', route: 'general-ledger', placeholder: true },
        { label: 'Payable Aging', icon: 'pi-clock', route: 'general-ledger', placeholder: true },
        { label: 'Profit & Loss', icon: 'pi-chart-line', route: 'general-ledger', placeholder: true },
        { label: 'Balance Sheet', icon: 'pi-wallet', route: 'general-ledger', placeholder: true },
        { label: 'Cash Flow', icon: 'pi-money-bill', route: 'general-ledger', placeholder: true },
        { label: 'Accounts Receivable', icon: 'pi-arrow-down-left', route: 'general-ledger', placeholder: true },
        { label: 'Accounts Payable', icon: 'pi-arrow-up-right', route: 'general-ledger', placeholder: true },
    ];
}
