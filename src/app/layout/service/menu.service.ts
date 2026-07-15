import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { retry } from 'rxjs';
import { MenuItem } from 'primeng/api';
import { MenuApiService } from './menu-api.service';

@Injectable({
    providedIn: 'root'
})
export class MenuService {
    private destroyRef = inject(DestroyRef);

    menuItems = signal<MenuItem[]>([]);
    isLoading = signal<boolean>(false);
    error = signal<string | null>(null);

    constructor(private menuApiService: MenuApiService) {}

    setMenuItems(items: MenuItem[]) {
        this.menuItems.set(items);
    }

    addMenuItem(item: MenuItem) {
        this.menuItems.update((current) => [...current, item]);
    }

    resetMenu() {
        this.menuItems.set([]);
    }

    loadMenuFromApi() {
        this.isLoading.set(true);
        this.error.set(null);

        this.menuApiService.getMenu()
            .pipe(
                retry(1),
                takeUntilDestroyed(this.destroyRef)
            )
            .subscribe({
                next: (items) => {
                    this.menuItems.set(items);
                    this.isLoading.set(false);
                },
                error: (err) => {
                    console.error('Failed to load menu from API:', err);
                    this.error.set('Failed to load menu');
                    this.isLoading.set(false);
                    // Optionally fallback to default menu
                    // this.loadDefaultMenu();
                }
            });
    }
}
