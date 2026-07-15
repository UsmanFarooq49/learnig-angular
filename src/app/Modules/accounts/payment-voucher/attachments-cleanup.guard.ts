import { inject } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';
import { Observable, catchError, map, of } from 'rxjs';
import { AttachmentService } from './attachment-service';

/**
 * Deletes any temp attachments that were uploaded but not yet committed via Save,
 * before letting the user navigate away from the voucher form (router-level).
 */
export const attachmentsCleanupGuard: CanDeactivateFn<unknown> = (): Observable<boolean> | boolean => {
    const service = inject(AttachmentService);
    if (service.pending().length === 0) return true;
    return service.cleanup().pipe(
        map(() => true),
        // If a delete call fails we still want to allow navigation — don't trap the user.
        catchError(() => of(true)),
    );
};
