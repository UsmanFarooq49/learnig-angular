// Generic reference-data (lookup) types shared across feature modules.
// Fetched via LookupService and cached for the session.

export interface BankAccounts {
    id: number;
    accountCode: string;
    accountName: string;
    displayText: string;
    nature: number;
    mainType: number;
    controlType: number;
    isControlAccount: boolean;
    balance: string;
}

export interface bankAccountResponse {
    data: BankAccounts[];
    errors: string | null;
    message: string;
    success: boolean;
}

export interface LookupType {
    id: number;
    name: string;
}

export interface LookupTypeResponse {
    success: Boolean;
    message: String;
    data: LookupType[];
    errors: string | null;
    errorCode: string | null;
}

export interface departmentLookupData {
    id: number;
    departmentCode: string;
    departmentName: string;
    isActive: boolean;
}

export interface departmentLookupResponse {
    success: Boolean;
    message: String;
    data: departmentLookupData[];
    errors: string | null;
    errorCode: string | null;
}

export interface costCenterLookupData {
    id: number;
    costCenterCode: string;
    costCenterName: string;
    isActive: boolean;
}

export interface costCenterLookupResponse {
    success: Boolean;
    message: String;
    data: costCenterLookupData[];
    errors: string | null;
    errorCode: string | null;
}

export interface taxTypeLookupData {
    id: number;
    taxTypeName: string;
    defaultRate: number;
    accountId: number;
    accountName: string;
    mainTaxTypeId: number;
    mainTaxTypeName: string;
    effectiveDate: string;
    isActive: boolean;
}

export interface taxTypeLookupResponse {
    success: Boolean;
    message: String;
    data: taxTypeLookupData[];
    errors: string | null;
    errorCode: string | null;
}

export interface currencyLookupData {
    id: number;
    currencyCode: string;
    currencyName: string;
    symbol: string;
    isBaseCurrency: boolean;
    isActive: boolean;
}

export interface currencyLookupResponse {
    success: boolean;
    message: string;
    data: currencyLookupData[];
    errors: string | null;
    errorCode: string | null;
}

// ── Cheque book (GET /ChequeBook/dropdown, /ChequeBook/{id}/available-leaves) ──

export interface ChequeBook {
    id: number;
    bookNumber: string;
    bankAccount: string;
    availableLeaves: number;
}

export interface ChequeBookResponse {
    success: boolean;
    message: string;
    data: ChequeBook[] | null;
    errors: string | null;
    errorCode: string | null;
}

export interface ChequeLeaf {
    id: number;
    chequeNumber: string;
}

export interface ChequeLeafResponse {
    success: boolean;
    message: string;
    data: ChequeLeaf[] | null;
    errors: string | null;
    errorCode: string | null;
}
