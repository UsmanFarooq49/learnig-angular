import { Component, DestroyRef, computed, effect, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AttachmentsTab } from './attachments/attachments';
import { AuditLogTab } from './audit-log/audit-log';
import { ApprovalWorkflowTab } from './approval-workflow/approval-workflow';
import { LinkedDocumentsTab } from './linked-documents/linked-documents';
import { AttachmentService } from '../attachment-service';
import { AuditEntry, AuditService } from '@/app/shared';

type TabKey = 'attachments' | 'audit-log' | 'approval-workflow' | 'linked-documents';

interface TabDef {
    key: TabKey;
    label: string;
    count?: number;
}

@Component({
    selector: 'app-voucher-tabs',
    standalone: true,
    imports: [
        CommonModule,
        AttachmentsTab,
        AuditLogTab,
        ApprovalWorkflowTab,
        LinkedDocumentsTab,
    ],
    templateUrl: './voucher-tabs.html',
    styleUrl: './voucher-tabs.scss',
})
export class VoucherTabs {
    private attachmentService = inject(AttachmentService);
    private auditService = inject(AuditService);
    private destroyRef = inject(DestroyRef);

    /** Saved voucher id (null when creating). Drives the audit log fetch. */
    voucherId = input<number | null>(null);

    active = signal<TabKey>('attachments');

    // ── Audit log state ──────────────────────────────────────────────────────
    auditEntries = signal<AuditEntry[]>([]);
    auditLoading = signal(false);
    auditError = signal<string | null>(null);

    private auditLoadedFor: number | null = null;

    constructor() {
        effect(() => {
            const id = this.voucherId();

            if (id == null || id === this.auditLoadedFor) {
                return;
            }

            this.auditLoadedFor = id;
            this.loadAudit(id);
        });
    }

    private loadAudit(id: number): void {
        this.auditLoading.set(true);
        this.auditError.set(null);

        this.auditService
            .getEntityAudit('voucher', id)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (res) => {
                    this.auditLoading.set(false);

                    if (res?.success) {
                        this.auditEntries.set(res.data ?? []);
                    } else {
                        this.auditError.set(res?.message || 'Failed to load the audit log.');
                    }
                },
                error: (err) => {
                    this.auditLoading.set(false);
                    this.auditError.set(
                        err?.error?.message ||
                        err?.message ||
                        'Failed to load the audit log.'
                    );
                },
            });
    }

    tabs = computed<TabDef[]>(() => [
        {
            key: 'attachments',
            label: 'Attachments',
            count:
                this.attachmentService.saved().length +
                this.attachmentService.pending().length,
        },
        {
            key: 'audit-log',
            label: 'Audit Log',
            count: this.auditEntries().length || undefined,
        },
        {
            key: 'approval-workflow',
            label: 'Approval Workflow',
        },
        {
            key: 'linked-documents',
            label: 'Linked Documents',
            count: 0,
        },
    ]);

    setActive(key: TabKey): void {
        this.active.set(key);
    }

    /**
     * Refresh tabs.
     * Called by the parent form when the Refresh button is clicked.
     */
    refresh(): void {
        const id = this.voucherId();

        if (id != null) {
            this.auditLoadedFor = null;
            this.loadAudit(id);
        }
    }
}