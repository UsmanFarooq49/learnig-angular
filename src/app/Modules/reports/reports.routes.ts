import { Routes } from '@angular/router';
import { ReportsLayout } from './reports-layout/reports-layout';
import { GeneralLedger } from './all-reports/general-ledger/general-ledger';
import { TrialBalance } from './all-reports/trial-balance/trial-balance';

export default [
    {
        path: '',
        component: ReportsLayout,
        children: [
            { path: '', redirectTo: 'general-ledger', pathMatch: 'full' },
            { path: 'general-ledger', title: 'General Ledger | Zascare', component: GeneralLedger },
            { path: 'trial-balance', title: 'Trial Balance | Zascare', component: TrialBalance },
        ],
    },
] as Routes;
