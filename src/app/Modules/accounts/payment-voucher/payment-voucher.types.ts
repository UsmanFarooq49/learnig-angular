// Generic lookup/reference-data types now live with the shared LookupService.
// Re-exported here so existing feature imports keep resolving from this file.
export type {
    BankAccounts,
    bankAccountResponse,
    LookupType,
    LookupTypeResponse,
    departmentLookupData,
    departmentLookupResponse,
    costCenterLookupData,
    costCenterLookupResponse,
    taxTypeLookupData,
    taxTypeLookupResponse,
    currencyLookupData,
    currencyLookupResponse,
} from '@/app/shared/services/lookup.types';

export interface generateVoucherNoResponse {
    success: boolean;
    message: string;
    data: { voucherNo: string } | null;
    errors: string | null;
    errorCode: string | null;
}

// ── Voucher list (POST /Voucher/list) ─────────────────────────────────────────

export interface paymentVoucherListFilter {
    column: string;
    stringValue?: string;
    numericValue?: number;
    numericValue2?: number;
    dateValue?: string;
    dateValue2?: string;
    /** 1=Contains, 2=Equals, 3=StartsWith, 4=EndsWith — confirm with backend */
    stringFilter?: number;
    /** 1=Equals, 2=NotEquals, 3=GreaterThan, 4=LessThan — confirm with backend */
    numericFilter?: number;
    /** 1=On, 2=Before, 3=After, 4=Between — confirm with backend */
    dateFilter?: number;
}

export interface paymentVoucherListRequest {
    pageNumber: number;
    pageSize: number;
    sortBy?: string;
    sortDesc?: boolean;
    filters?: paymentVoucherListFilter[];
    companyId?: number;
    documentTypeId?: number;
    statusFilter?: string;
    fromDate?: string;
    toDate?: string;
    bankAccountId?: number;
    debitAccountId?: number;
}

export interface paymentVoucherListTotals {
    totalAmountPkr: number;
    totalAmountFcy: number;
    totalDebit: number;
    totalCredit: number;
}

export interface paymentVoucherListItem {
    id: number;
    voucherNo: string;
    voucherType: string;
    voucherDate: string;
    bankAccount: string;
    totalAmountPkr: number;
    fcyCurrency: string;
    totalAmountFcy: number;
    /** Sometimes a display label ("Draft"), sometimes an enum code ("0") — handle both in the UI. */
    status: string;
    createdByName: string | null;
    createdOn: string;
    isPosted: boolean;
    remarks: string;
    totalDebit: number;
    totalCredit: number;
}

export interface paymentVoucherListData {
    items: paymentVoucherListItem[];
    pageTotals: paymentVoucherListTotals;
    grandTotals: paymentVoucherListTotals;
    totalCount: number;
    pageNumber: number;
    pageSize: number;
    totalPages: number;
}

export interface paymentVoucherListResponse {
    success: boolean;
    message: string;
    data: paymentVoucherListData | null;
    errors: string | null;
    errorCode: string | null;
}

// ── Voucher detail by id (GET /Voucher/{id}) ──────────────────────────────────

export interface paymentVoucherTaxByIdResponse {
    id: number;
    taxTypeId: number;
    accountId: number;
    taxPercent: number;
    taxAmount: number;
}

export interface paymentVoucherDetailByIdResponse {
    id: number;
    accountId: number;
    accountCode: string;
    accountName: string;
    subLedgerTypeId: number;
    subLedgerId: number;
    counterAccountId: number;
    comments: string;
    paymentModeId: number;
    chequeId: number;
    chequeNumber: string;
    chequeDate: string;
    payeeTitle: string | null;
    chequeTypeId: number;
    transactionTypeId: number;
    debit: number;
    credit: number;
    exchangeRate: number;
    amountFcy: number;
    taxAmount: number;
    discountAmount: number;
    costCenterId: number;
    departmentId: number;
    lineId: number;
    taxes: paymentVoucherTaxByIdResponse[];
}

export interface paymentVoucherByIdData {
    id: number;
    voucherNo: string;
    voucherType: string | null;
    voucherDate: string;
    postingDate: string | null;
    isPosted: boolean;
    accountId: number;
    accountName: string;
    baseCurrencyId: number;
    baseExchangeRate: number;
    fcyCurrencyId: number;
    fcyExchangeRate: number;
    remarks: string;
    companyId: number;
    createdOn: string;
    totalDebit: number;
    totalCredit: number;
    voucherDetails: paymentVoucherDetailByIdResponse[];
    attachments: SavedAttachment[];
}

export interface paymentVoucherByIdResponse {
    success: boolean;
    message: string;
    data: paymentVoucherByIdData | null;
    errors: string | null;
    errorCode: string | null;
}

// Saved attachments — returned by GET /Voucher/{id}.
// Same idea as `tempAttachment` but with a numeric primary `id` and richer metadata.
export interface SavedAttachment {
    id: number;
    uploadMode: string;
    screenId: number;
    referenceDocId: number;
    attachmentFolderId: number | null;
    folderPath: string | null;
    companyCode: string;
    moduleCode: string;
    subModuleCode: string;
    screenName: string;
    originalFileName: string;
    fileExtension: string;
    contentType: string;
    fileSizeBytes: number;
    fileSizeDisplay: string;
    revisionNo: number;
    isLatestVersion: boolean;
    notes: string | null;
    isDeleted: boolean;
    uploadedOn: string;
    uploadedBy: number;
}

// Temp attachments (staged on the server until the voucher is saved)
export interface tempAttachment {
    tempId: string;
    originalFileName: string;
    storedFileName: string;
    storedTempFolderPath: string;
    fileExtension: string;
    contentType: string;
    fileSizeBytes: number;
    fileSizeDisplay: string;
    uploadedAt: string;
    previewUrl?: string;
}

export interface tempAttachmentUploadResponse {
    success: boolean;
    message: string;
    data: tempAttachment[];
    errors: string | null;
    errorCode: string | null;
}

export interface tempAttachmentDeleteResponse {
    success: boolean;
    message: string;
    data: null;
    errors: string | null;
    errorCode: string | null;
}

// ── Save payload (POST /Voucher) ──────────────────────────────────────────────
// All fields are non-nullable — the .NET API rejects `null` for int/string fields.
// Use `0` for an unset id and `""` for an unset string.

export interface paymentVoucherTax {
    taxTypeId: number;
    accountId: number;
    taxPercent: number;
    taxAmount: number;
}

export interface paymentVoucherDetail {
    accountId: number;
    subLedgerTypeId: number;
    subLedgerId: number;
    counterAccountId: number;
    comments: string;
    paymentModeId: number;
    chequeId: number;
    chequeNumber: string;
    /** ISO date string. */
    chequeDate: string;
    payeeTitle: string;
    chequeTypeId: number;
    transactionTypeId: number;
    debit: number;
    credit: number;
    exchangeRate: number;
    amountFcy: number;
    taxAmount: number;
    discountAmount: number;
    costCenterId: number;
    departmentId: number;
    /** 0 for new lines; carries the existing id when editing. */
    lineId: number;
    taxes: paymentVoucherTax[];
}

export interface paymentVoucherPayload {
    documentTypeId: number;
    /** Voucher type discriminator — 1 = payment voucher. */
    voucherType: number;
    /** ISO date string. */
    voucherDate: string;
    /** ISO date string. */
    postingDate: string;
    /** Header bank account id. */
    accountId: number;
    baseCurrencyId: number;
    baseExchangeRate: number;
    fcyCurrencyId: number;
    fcyExchangeRate: number;
    remarks: string;
    companyId: number;
    financialYearId: number;
    voucherDetails: paymentVoucherDetail[];
    /** Staged temp attachments; the backend commits them on save. */
    attachments: tempAttachment[];
    /** Update-only: ids of previously-saved attachments the user removed during this edit. */
    deleteAttachmentIds?: number[];
}

export interface paymentVoucherSaveResponse {
    success: boolean;
    message: string;
    data: unknown;
    errors: string | null;
    errorCode: string | null;
}

// ── Form view-models (payment-voucher-form ⇄ detail / tax child tables) ────────

/** Row shape fed to the VoucherDetails table when loading a voucher for edit. */
export interface VoucherDetailRow {
    transactionType: string;
    account: string;
    subLedgerType: string;
    subLedger: string;
    department: string;
    costCenter: string;
    paymentMode: string;
    chequeType: string;
    transactionTypeId: number;
    accountId: number;
    subLedgerTypeId: number;
    subLedgerId: number;
    departmentId: number;
    costCenterId: number;
    paymentModeId: number;
    chequeTypeId: number;
    lineId: number;
    exchangeRate: number;
    chequeNo: string;
    chequeDate: string;
    payeeTitle: string;
    amount: number;
    discount: number;
    taxPercent: number;
    taxAmount: number;
    netAmount: number;
}

/** Row shape fed to the VoucherTax table when loading a voucher for edit. */
export interface VoucherTaxRow {
    taxAccount: number;
    taxType: number;
    whtPercent: number;
    baseAmount: number;
    taxAmount: number;
    editing: boolean;
}

/** The id → name lookups resolved alongside the voucher when entering edit mode. */
export interface EditModeLookups {
    transactionTypes: { data: { id: number; name: string }[] };
    subLedgerTypes: { data: { id: number; name: string }[] };
    departments: { data: { id: number; departmentName: string }[] };
    costCenters: { data: { id: number; costCenterName: string }[] };
    paymentModes: { data: { id: number; name: string }[] };
    chequeTypes: { data: { id: number; name: string }[] };
    accounts: { data: { id: number; accountName: string }[] };
}

