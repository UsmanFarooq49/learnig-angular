import { Component, inject } from '@angular/core';
import { LoaderService } from '@/app/core/services/loader.service';

/**
 * Global HTTP loader overlay. Shows whenever LoaderService.loading() is true
 * (driven by the HTTP loaderInterceptor). Mount once near the app root.
 */
@Component({
    selector: 'app-loader',
    standalone: true,
    template: `
        @if (loader.loading()) {
            <div
                class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/15 backdrop-blur-[1px]"
                role="status"
                aria-live="polite"
                aria-label="Loading"
            >
                <div class="bg-white rounded-xl shadow-2xl px-5 py-4 flex items-center gap-3">
                    <i class="pi pi-spin pi-spinner text-2xl text-[var(--primary-color)]"></i>
                    <span class="text-sm font-medium text-gray-700">Loading…</span>
                </div>
            </div>
        }
    `,
})
export class LoaderComponent {
    loader = inject(LoaderService);
}