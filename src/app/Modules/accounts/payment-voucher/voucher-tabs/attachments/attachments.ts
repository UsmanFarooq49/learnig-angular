import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FileUploadComponent } from '@/app/shared';
import { AttachmentService } from '../../attachment-service';
import { SavedAttachment, tempAttachment } from '../../payment-voucher.types';

/** Normalized row used by the table — works for both saved and pending sources. */
interface DisplayAttachment {
    kind: 'saved' | 'pending';
    /** Stable key for trackBy + the `deleting` set. */
    key: string;
    originalFileName: string;
    uploadedAt: string;
    fileSizeDisplay: string;
    previewUrl?: string;
    raw: SavedAttachment | tempAttachment;
}

@Component({
    selector: 'app-attachments-tab',
    standalone: true,
    imports: [CommonModule, FileUploadComponent],
    templateUrl: './attachments.html',
    styleUrl: './attachments.scss',
})
export class AttachmentsTab {
    private attachmentService = inject(AttachmentService);
    private destroyRef = inject(DestroyRef);

    /** Saved attachments come from GET /Voucher/{id}; pending are uploaded this session. */
    private saved = this.attachmentService.saved;
    private pending = this.attachmentService.pending;

    /** Unified list shown in the table — saved rows first, then pending uploads. */
    attachments = computed<DisplayAttachment[]>(() => [
        ...this.saved().map((a) => ({
            kind: 'saved' as const,
            key: `saved-${a.id}`,
            originalFileName: a.originalFileName,
            uploadedAt: a.uploadedOn,
            fileSizeDisplay: a.fileSizeDisplay,
            previewUrl: (a as any).previewUrl, // map dynamically if provided by API
            raw: a,
        })),
        ...this.pending().map((a) => ({
            kind: 'pending' as const,
            key: `pending-${a.tempId}`,
            originalFileName: a.originalFileName,
            uploadedAt: a.uploadedAt,
            fileSizeDisplay: a.fileSizeDisplay,
            previewUrl: a.previewUrl,
            raw: a,
        })),
    ]);

    /** Tracks per-attachment in-flight state for the trash button (keyed by `DisplayAttachment.key`). */
    deleting = signal<ReadonlySet<string>>(new Set());
    /** Tracks per-attachment in-flight download state (keyed by `DisplayAttachment.key`). */
    downloading = signal<ReadonlySet<string>>(new Set());
    /** Pending upload count, surfaced on the drop zone. */
    uploading = 0;

    /** Add/remove a key from a signal-backed set, emitting a new Set so change detection picks it up. */
    private setFlag(sig: typeof this.deleting, key: string, on: boolean): void {
        sig.update((cur) => {
            const next = new Set(cur);
            on ? next.add(key) : next.delete(key);
            return next;
        });
    }

    onFilesAdded(files: File[]): void {
        if (!files.length) return;
        this.uploading += files.length;
        this.attachmentService
            .upload(files)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: () => {
                    this.uploading = Math.max(0, this.uploading - files.length);
                },
                error: (err) => {
                    this.uploading = Math.max(0, this.uploading - files.length);
                    console.error('Attachment upload failed:', err);
                },
            });
    }

    remove(item: DisplayAttachment): void {
        if (this.deleting().has(item.key)) return;

        if (item.kind === 'saved') {
            // Queue the id — no server call until the user clicks Save.
            this.attachmentService.removeSaved(item.raw as SavedAttachment);
            return;
        }

        // Pending: actually delete the temp upload on the server now.
        this.setFlag(this.deleting, item.key, true);
        this.attachmentService
            .removeOne(item.raw as tempAttachment)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: () => this.setFlag(this.deleting, item.key, false),
                error: (err) => {
                    this.setFlag(this.deleting, item.key, false);
                    console.error('Attachment delete failed:', err);
                },
            });
    }

    preview(item: DisplayAttachment): void {
        if (item.previewUrl) {
            window.open(item.previewUrl, '_blank');
        } else {
            console.log('No preview URL available for this attachment');
        }
    }

    download(item: DisplayAttachment): void {
        // Pending uploads aren't persisted yet — there's no id-based endpoint; use the preview URL.
        if (item.kind === 'pending') {
            if (item.previewUrl) window.open(item.previewUrl, '_blank');
            return;
        }

        if (this.downloading().has(item.key)) return;
        this.setFlag(this.downloading, item.key, true);

        const id = (item.raw as SavedAttachment).id;
        this.attachmentService
            .download(id)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (res) => {
                    this.setFlag(this.downloading, item.key, false);
                    const fileName = this.fileNameFrom(res) ?? item.originalFileName;
                    this.saveBlob(res.body!, fileName);
                },
                error: (err) => {
                    this.setFlag(this.downloading, item.key, false);
                    console.error('Attachment download failed:', err);
                },
            });
    }

    /** Pull the filename from Content-Disposition, falling back to null if absent. */
    private fileNameFrom(res: HttpResponse<Blob>): string | null {
        const disposition = res.headers.get('Content-Disposition');
        if (!disposition) return null;
        const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition);
        return match ? decodeURIComponent(match[1]) : null;
    }

    /** Trigger a browser download for a blob. */
    private saveBlob(blob: Blob, fileName: string): void {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
    }

    iconFor(name: string): string {
        const ext = name.split('.').pop()?.toLowerCase();
        if (ext === 'pdf') return 'pi-file-pdf';
        if (ext === 'png' || ext === 'jpg' || ext === 'jpeg' || ext === 'gif') return 'pi-image';
        return 'pi-file';
    }

    colorFor(name: string): string {
        const ext = name.split('.').pop()?.toLowerCase();
        if (ext === 'pdf') return 'text-red-500';
        if (ext === 'png' || ext === 'jpg' || ext === 'jpeg' || ext === 'gif') return 'text-emerald-500';
        return 'text-gray-400';
    }
}
