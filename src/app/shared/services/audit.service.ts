import { environment } from '@/environments/environment';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuditResponse } from './audit.types';

/**
 * Reads the audit trail for any entity. Generic by `entityName` + `entityId`,
 * so it can be reused across modules (vouchers, accounts, etc.).
 */
@Injectable({ providedIn: 'root' })
export class AuditService {
    private http = inject(HttpClient);

    getEntityAudit(entityName: string, entityId: number): Observable<AuditResponse> {
        return this.http.get<AuditResponse>(`${environment.apiUrl}/Audit/entity/${entityName}/${entityId}`);
    }
}
