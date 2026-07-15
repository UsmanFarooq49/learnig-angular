import { environment } from '@/environments/environment';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, forkJoin, map, of, tap } from 'rxjs';
import {
    SavedAttachment,
    tempAttachment,
    tempAttachmentDeleteResponse,
    tempAttachmentUploadResponse,
} from './payment-voucher.types';

/**
 * Tracks temp attachments uploaded for a voucher that isn't saved yet.
 *
 * - `upload()` POSTs immediately and adds the returned items to `pending`.
 * - `removeOne()` deletes one staged item on the server and from `pending`.
 * - `commit()` clears `pending` without deleting (call on Save).
 * - `cleanup()` deletes everything in `pending` (call on Cancel / navigation).
 */
@Injectable({ providedIn: 'root' })
export class AttachmentService {
    private http = inject(HttpClient);
    private baseUrl = `${environment.apiUrl}/attachments/temp`;
    private attachmentsUrl = `${environment.apiUrl}/attachments`;

    /** Files currently staged on the server but not yet committed. */
    pending = signal<tempAttachment[]>([]);

    /** Already-saved attachments for the voucher being edited (returned by GET /Voucher/{id}). */
    saved = signal<SavedAttachment[]>([]);

    /** Ids of saved attachments the user removed in this session — sent in the PUT body. */
    deletedIds = signal<number[]>([]);

    /** Seed the saved list when loading a voucher for edit. Resets any prior deletion queue. */
    loadSaved(items: SavedAttachment[] | null | undefined): void {
        this.saved.set(items ?? []);
        this.deletedIds.set([]);
    }

    /** Queue a saved attachment for deletion on next save. No server call until commit. */
    removeSaved(att: SavedAttachment): void {
        this.saved.update((cur) => cur.filter((a) => a.id !== att.id));
        this.deletedIds.update((cur) => (cur.includes(att.id) ? cur : [...cur, att.id]));
    }

    upload(files: File[]): Observable<tempAttachment[]> {
        if (!files.length) return of([]);
        const form = new FormData();
        for (const f of files) form.append('Files', f, f.name);
        return this.http.post<tempAttachmentUploadResponse>(`${this.baseUrl}/upload`, form).pipe(
            tap((res) => {
                if (res?.success && res.data?.length) {
                    this.pending.update((cur) => [...cur, ...res.data]);
                }
            }),
            map((res) => res?.data ?? []),
        );
    }

    removeOne(att: tempAttachment): Observable<void> {
        const body = {
            storedTempFolderPath: att.storedTempFolderPath,
            // The delete endpoint expects the tempId in this field (not the on-disk name).
            storedFileName: att.tempId,
        };
        return this.http
            .delete<tempAttachmentDeleteResponse>(this.baseUrl, { body })
            .pipe(
                tap(() => {
                    this.pending.update((cur) => cur.filter((a) => a.tempId !== att.tempId));
                }),
                map(() => void 0),
            );
    }

    /**
     * Download a saved attachment as a blob. The auth interceptor adds the Bearer token.
     * Returns the full response so the caller can read the Content-Disposition filename.
     */
    download(id: number): Observable<HttpResponse<Blob>> {
        return this.http.get(`${this.attachmentsUrl}/${id}/download`, {
            observe: 'response',
            responseType: 'blob',
        });
    }

    /** Drop the pending + saved + deletedIds state. Call this after a successful Save. */
    commit(): void {
        this.pending.set([]);
        this.saved.set([]);
        this.deletedIds.set([]);
    }

    /** Delete every pending attachment on the server. Returns when all calls finish. */
    cleanup(): Observable<void> {
        const items = this.pending();
        if (items.length === 0) return of(void 0);
        return forkJoin(items.map((a) => this.removeOne(a))).pipe(map(() => void 0));
    }
}