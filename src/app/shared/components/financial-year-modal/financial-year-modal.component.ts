import { Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { FloatLabelModule } from 'primeng/floatlabel';
import { AuthService, FinancialYear } from '@/app/core/services/auth.service';
import { AuthActions } from '@/app/store/auth/auth.actions';
import { selectFinancialYear, selectIsAuthenticated } from '@/app/store/auth/auth.selectors';

@Component({
    selector: 'app-financial-year-modal',
    standalone: true,
    imports: [CommonModule, FormsModule, DialogModule, SelectModule, FloatLabelModule],
    templateUrl: './financial-year-modal.component.html',
    styleUrl: './financial-year-modal.component.scss',
})
export class FinancialYearModalComponent {
    private authService = inject(AuthService);
    private store = inject(Store);
    private destroyRef = inject(DestroyRef);

    private isAuthenticated = this.store.selectSignal(selectIsAuthenticated);
    private selectedFy = this.store.selectSignal(selectFinancialYear);

    /** Shown only when the user is logged in AND no financial year has been picked yet. */
    visible = computed(() => this.isAuthenticated() && !this.selectedFy());

    financialYears = signal<FinancialYear[]>([]);
    loading = signal(false);
    selectedYearId = signal<number | null>(null);

    constructor() {
        // Fetch the list whenever the modal flips from hidden → visible.
        // On logout the modal hides; on next login it shows again and re-fetches.
        let lastVisible = false;
        effect(() => {
            const v = this.visible();
            if (v && !lastVisible) this.fetchYears();
            lastVisible = v;
        });
    }

    private fetchYears(): void {
        this.loading.set(true);
        this.authService.getFinancialYearList()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (res) => {
                    this.loading.set(false);
                    if (res?.success) {
                        const list = res.data ?? [];
                        this.financialYears.set(list);
                        // Pre-select the active, open year (skip closed years).
                        const preferred = list.find((y) => y.isActive && !y.isClosed);
                        this.selectedYearId.set(preferred?.id ?? list[0]?.id ?? null);
                    }
                },
                error: (err) => {
                    this.loading.set(false);
                    console.error('Failed to load financial years:', err);
                },
            });
    }

    confirm(): void {
        const id = this.selectedYearId();
        if (id == null) return;
        const year = this.financialYears().find((y) => y.id === id);
        if (!year) return;
        this.store.dispatch(AuthActions.setFinancialYear({ financialYear: year }));
    }
}
