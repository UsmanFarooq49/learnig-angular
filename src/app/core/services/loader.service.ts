import { Injectable, computed, signal } from '@angular/core';

/**
 * Tracks in-flight HTTP requests so a global overlay can render whenever any
 * request is pending. Uses a count rather than a boolean so concurrent requests
 * don't hide the loader as soon as the first one finishes.
 */
@Injectable({ providedIn: 'root' })
export class LoaderService {
    private activeCount = signal(0);

    /** True when at least one tracked request is in flight. */
    loading = computed(() => this.activeCount() > 0);

    show(): void {
        this.activeCount.update((c) => c + 1);
    }

    hide(): void {
        this.activeCount.update((c) => Math.max(0, c - 1));
    }
}