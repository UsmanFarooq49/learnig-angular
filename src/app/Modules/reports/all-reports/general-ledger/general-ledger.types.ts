// ── General Ledger (GET /Ledger/account) ──────────────────────────────────────

/** Query params for the account-ledger endpoint. */
export interface GeneralLedgerRequest {
    companyId: number;
    accountId: number | null;
    partyId?: number | null;
    subLedgerTypeId?: number | null;
    /** null = all, true = posted only, false = unposted only. */
    isPosted?: boolean | null;
    fromDate: string;
    toDate: string;
    pageNumber: number;
    pageSize: number;
}

/**
 * A single ledger line.
 * NOTE: field names are inferred from the report mockup — confirm against a real
 * API response and adjust if the backend uses different keys.
 */
export interface LedgerEntry {
    voucherId: number;
    voucherNo: string;
    voucherType: string | null;
    date: string;
    reference: string | null;
    description: string | null;
    debit: number;
    credit: number;
    /** Running balance after this line. */
    balance: number;
    branchName: string | null;
    userName: string | null;
    hasAttachment: boolean;
}

export interface GeneralLedgerData {
    accountId: number;
    accountCode: string | null;
    accountName: string | null;
    openingBalance: number;
    closingBalance: number;
    totalDebit: number;
    totalCredit: number;
    netMovement: number;
    totalTransactions: number;
    entries: LedgerEntry[];
    pageNumber: number;
    pageSize: number;
    totalCount: number;
}

export interface GeneralLedgerResponse {
    success: boolean;
    message: string;
    data: GeneralLedgerData | null;
    errors: string | null;
    errorCode: string | null;
}

// ── UI models (component layer) ────────────────────────────────────────────────

export type ViewMode = 'one' | 'subsidiary';
export type LedgerAction = 'favorite' | 'export' | 'print' | 'share' | 'schedule' | 'refresh';

/** Generic option for the filter selects. */
export interface LedgerOption {
    id: number;
    name: string;
}

/** A node in the ledger tree — a group, a leaf account, or a transaction. */
export interface LedgerNode {
    id: string;
    kind: 'group' | 'account' | 'transaction';
    code?: string;
    name?: string;
    voucherNo?: string;
    date?: string;
    reference?: string;
    description?: string;
    branch?: string;
    user?: string;
    hasAttachment?: boolean;
    debit?: number;
    credit?: number;
    balance?: number;
    children?: LedgerNode[];
}

/** A flattened, render-ready row for the table (with depth + expand state). */
export interface LedgerRow extends LedgerNode {
    level: number;
    expanded: boolean;
}

/** Filter values emitted by the filters bar. */
export interface LedgerFilters {
    fromDate: Date | null;
    toDate: Date | null;
    fiscalYearId: number | null;
    branchId: number | null;
    companyId: number | null;
    currencyId: number | null;
    showZeroBalances: boolean;
    includeFcy: boolean;
}
