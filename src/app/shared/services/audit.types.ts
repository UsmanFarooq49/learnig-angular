// Audit trail types — returned by GET /Audit/entity/{entityName}/{entityId}.

export interface AuditDetail {
    fieldName: string;
    oldValue: string | null;
    newValue: string | null;
}

export interface AuditEntry {
    id: number;
    auditAction: string;
    auditModule: string;
    entityName: string;
    entityId: number;
    description: string;
    userId: number;
    userName: string;
    actionDate: string;
    ipAddress: string;
    details: AuditDetail[];
}

export interface AuditResponse {
    success: boolean;
    message: string;
    data: AuditEntry[] | null;
    errors: string | null;
    errorCode: string | null;
}
