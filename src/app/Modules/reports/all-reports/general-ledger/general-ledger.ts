import { Component, OnInit, computed, signal } from '@angular/core';
import { LedgerHeader } from './ledger-header/ledger-header';
import { LedgerFilters } from './ledger-filters/ledger-filters';
import { LedgerCards } from './ledger-cards/ledger-cards';
import { LedgerTable } from './ledger-table/ledger-table';
import {
    LedgerAction,
    LedgerFilters as LedgerFilterValues,
    LedgerNode,
    LedgerRow,
    ViewMode,
} from './general-ledger.types';

@Component({
    selector: 'app-general-ledger',
    imports: [LedgerHeader, LedgerFilters, LedgerCards, LedgerTable],
    templateUrl: './general-ledger.html',
    styleUrl: './general-ledger.scss',
})
export class GeneralLedger implements OnInit {
    // ── View state ──────────────────────────────────────────────────────────────
    viewMode = signal<ViewMode>('subsidiary');
    searchTerm = signal('');
    expandedIds = signal<Set<string>>(new Set());

    /**
     * The ledger tree.
     * TEMP: seeded with representative data so the layout matches the design.
     * Replace with the GL hierarchy endpoint response once available.
     */
    tree = signal<LedgerNode[]>(this.mockTree());

    /** Flatten the tree into visible rows (respecting expand state) + search. */
    rows = computed<LedgerRow[]>(() => {
        const expanded = this.expandedIds();
        const term = this.searchTerm().trim().toLowerCase();
        const out: LedgerRow[] = [];

        const matches = (n: LedgerNode): boolean => {
            if (!term) return true;
            const hay = [n.code, n.name, n.voucherNo, n.reference, n.description, n.branch, n.user]
                .filter(Boolean).join(' ').toLowerCase();
            return hay.includes(term) || (n.children ?? []).some(matches);
        };

        const walk = (nodes: LedgerNode[], level: number) => {
            for (const n of nodes) {
                if (!matches(n)) continue;
                out.push({ ...n, level, expanded: expanded.has(n.id) || !!term });
                if (n.children?.length && (expanded.has(n.id) || term)) walk(n.children, level + 1);
            }
        };
        walk(this.tree(), 0);
        return out;
    });

    entryCount = computed(() => this.count('transaction'));
    totalDebit = computed(() => this.sum('debit'));
    totalCredit = computed(() => this.sum('credit'));
    netMovement = computed(() => this.totalDebit() - this.totalCredit());

    ngOnInit(): void {
        this.expandAll();
    }

    // ── Tree interaction ──────────────────────────────────────────────────────
    toggle(row: LedgerRow): void {
        if (!row.children?.length) return;
        this.expandedIds.update((cur) => {
            const next = new Set(cur);
            next.has(row.id) ? next.delete(row.id) : next.add(row.id);
            return next;
        });
    }

    private expandAll(): void {
        const ids = new Set<string>();
        const walk = (nodes: LedgerNode[]) => {
            for (const n of nodes) {
                if (n.children?.length) { ids.add(n.id); walk(n.children); }
            }
        };
        walk(this.tree());
        this.expandedIds.set(ids);
    }

    // ── Child events ────────────────────────────────────────────────────────────
    onAction(action: LedgerAction): void {
        switch (action) {
            case 'print': window.print(); break;
            case 'refresh': this.load(); break;
            default: console.log(`${action} — not implemented yet.`);
        }
    }

    onApply(_filters: LedgerFilterValues): void {
        // TODO: call the GL hierarchy endpoint with these filters and tree.set(response).
        this.load();
    }

    onReset(): void {
        this.searchTerm.set('');
    }

    private load(): void {
        // Placeholder until the hierarchy endpoint is wired.
    }

    // ── Helpers ───────────────────────────────────────────────────────────────
    private sum(field: 'debit' | 'credit'): number {
        let total = 0;
        const walk = (nodes: LedgerNode[]) => {
            for (const n of nodes) {
                if (n.kind === 'transaction') total += Number(n[field]) || 0;
                if (n.children?.length) walk(n.children);
            }
        };
        walk(this.tree());
        return total;
    }

    private count(kind: LedgerNode['kind']): number {
        let total = 0;
        const walk = (nodes: LedgerNode[]) => {
            for (const n of nodes) {
                if (n.kind === kind) total++;
                if (n.children?.length) walk(n.children);
            }
        };
        walk(this.tree());
        return total;
    }

    // ── TEMP mock data (remove once the hierarchy API is wired) ───────────────
    private mockTree(): LedgerNode[] {
        return [
            {
                id: 'g-1000', kind: 'group', code: '1000', name: 'Assets',
                children: [
                    {
                        id: 'g-1100', kind: 'group', code: '1100', name: 'Current Assets',
                        children: [
                            {
                                id: 'a-1101', kind: 'account', code: '1101', name: 'Cash at Bank - HBL',
                                debit: 15800000, credit: 8500000, balance: 45200000,
                                children: [
                                    { id: 't-1', kind: 'transaction', voucherNo: 'PV-2025-0001', date: '2025-06-01', reference: 'CHQ-001245', description: 'Payment to vendor - Tech Solutions Ltd for server equipment', credit: 2500000, branch: 'Head Office - Karachi', user: 'Sufian Arshad', hasAttachment: true },
                                    { id: 't-2', kind: 'transaction', voucherNo: 'PV-2025-0003', date: '2025-06-06', reference: 'CHQ-001247', description: 'Office rent payment - Q2 2025 for Karachi HQ', credit: 6000000, branch: 'Head Office - Karachi', user: 'Fatima Zaidi', hasAttachment: true },
                                    { id: 't-3', kind: 'transaction', voucherNo: 'RV-2025-0090', date: '2025-06-07', reference: 'INV-2025-0457', description: 'Receipt - Implementation milestone payment from TechCorp', debit: 15800000, branch: 'Head Office - Karachi', user: 'Ahmed Khan', hasAttachment: true },
                                ],
                            },
                            {
                                id: 'a-1102', kind: 'account', code: '1102', name: 'Cash at Bank - MCB',
                                debit: 8500000, credit: 4500000, balance: 38750000,
                                children: [
                                    { id: 't-4', kind: 'transaction', voucherNo: 'RV-2025-0089', date: '2025-06-02', reference: 'INV-2025-0456', description: 'Receipt from client - Digital Dynamics for ERP implementation Phase 2', debit: 8500000, branch: 'Lahore Branch', user: 'Ahmed Khan', hasAttachment: true },
                                    { id: 't-5', kind: 'transaction', voucherNo: 'PV-2025-0004', date: '2025-06-10', reference: 'CHQ-001248', description: 'Marketing campaign payment - Digital ads Q2', credit: 4500000, branch: 'Lahore Branch', user: 'Sufian Arshad', hasAttachment: true },
                                ],
                            },
                            {
                                id: 'a-1103', kind: 'account', code: '1103', name: 'Cash at Bank - Askari',
                                debit: 20000000, credit: 0, balance: 29800000,
                                children: [
                                    { id: 't-6', kind: 'transaction', voucherNo: 'PV-2025-0002', date: '2025-06-04', reference: 'CHQ-001246', description: 'Salary disbursement for May 2025 - Head Office', credit: 8500000, branch: 'Head Office - Karachi', user: 'Sufian Arshad', hasAttachment: true },
                                ],
                            },
                        ],
                    },
                ],
            },
        ];
    }
}
