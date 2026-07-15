import { Component, DestroyRef, inject, signal, HostListener, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { StyleClassModule } from 'primeng/styleclass';
import { LayoutService } from '@/app/layout/service/layout.service';
import { Store } from '@ngrx/store';
import { selectAuthUser } from '@/app/store/auth/auth.selectors';
import { AuthActions } from '@/app/store/auth/auth.actions';

@Component({
    selector: 'app-topbar',
    standalone: true,
    imports: [RouterModule, CommonModule, StyleClassModule],
    template: ` <div class="layout-topbar bg-white border-b border-gray-200 flex items-center justify-between px-6 h-20 fixed top-0 left-0 w-full z-[997]">
        <!-- Left Section: Mobile Menu Button & Search -->
        <div class="flex items-center gap-3">
            <!-- Mobile Menu Toggle Button / Desktop Expand Button -->
            <button
                [ngClass]="{'flex': layoutService.isMobile(), 'hidden': layoutService.isDesktop()}"
                class="w-10 h-10 items-center justify-center rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                (click)="layoutService.onMenuToggle()"
            >
                <i class="pi pi-bars text-lg font-medium"></i>
            </button>

            <!-- Search Bar -->
            <div class="relative flex items-center">
                <i class="pi pi-search absolute left-4 text-gray-400 text-sm font-semibold"></i>
                <input type="text" placeholder="Search..." class="w-60 sm:w-80 pl-11 pr-4 py-2.5 bg-white border border-gray-200 hover:border-gray-300 focus:border-[var(--primary-color)] focus:ring-1 focus:ring-[var(--primary-color)] rounded-full text-sm text-gray-800 placeholder-gray-400 outline-none transition-all shadow-[0_1px_2px_0_rgba(0,0,0,0.05)]" />
            </div>
        </div>

        <!-- Right Section: Notification & User Profile -->
        <div class="flex items-center gap-6">
            <!-- Notification Bell -->
            <button class="relative w-10 h-10 flex items-center justify-center rounded-full text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer outline-none border border-transparent">
                <i class="pi pi-bell text-xl font-medium"></i>
                <span class="absolute top-2 right-2 w-2.5 h-2.5 bg-[#ef4444] rounded-full ring-2 ring-white"></span>
            </button>

            <!-- User Profile Section with Dropdown -->
            <div class="relative flex items-center gap-3 border-l border-gray-200 pl-6 cursor-pointer select-none" (click)="toggleDropdown($event)">
                <div class="relative">
                    <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&h=100&q=80" alt="User Avatar" class="w-10 h-10 rounded-full object-cover ring-1 ring-gray-200 shadow-sm" />
                    <span class="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#22c55e] rounded-full ring-2 ring-white"></span>
                </div>
                <div class="hidden sm:flex flex-col text-left">
                    <span class="text-sm font-bold text-gray-800 leading-none mb-1 select-none">{{ (user$ | async)?.fullName || (user$ | async)?.username || 'User' }}</span>
                    <span class="text-xs text-gray-400 font-medium select-none leading-none">{{ (user$ | async)?.role || 'Admin' }}</span>
                </div>
                <i class="pi pi-chevron-down text-xs text-gray-400 transition-transform duration-200" [class.rotate-180]="dropdownOpen()"></i>

                <!-- Dropdown Menu -->
                @if (dropdownOpen()) {
                    <div class="absolute right-0 top-14 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50" (click)="$event.stopPropagation()">
                        <div class="px-4 py-3 border-b border-gray-100">
                            <p class="text-xs text-gray-400 font-medium">Signed in as</p>
                            <p class="text-sm font-semibold text-gray-800 truncate">{{ (user$ | async)?.email || 'user@zascare.com' }}</p>
                        </div>
                        <button class="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer">
                            <i class="pi pi-user text-gray-400"></i>
                            Profile
                        </button>
                        <div class="border-t border-gray-100 mt-1"></div>
                        <button 
                            id="logout-btn"
                            class="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                            (click)="logout()"
                        >
                            <i class="pi pi-sign-out text-red-400"></i>
                            Logout
                        </button>
                    </div>
                }
            </div>
        </div>
    </div>`
})
export class AppTopbar implements OnInit {
    layoutService = inject(LayoutService);
    private store = inject(Store);
    private destroyRef = inject(DestroyRef);

    user$ = this.store.select(selectAuthUser);
    dropdownOpen = signal(false);

    ngOnInit(): void {
        this.user$
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe();
    }

    toggleDropdown(event: Event) {
        event.stopPropagation();
        this.dropdownOpen.update((v) => !v);
    }

    @HostListener('document:click')
    closeDropdown() {
        this.dropdownOpen.set(false);
    }

    logout() {
        this.store.dispatch(AuthActions.logout());
    }
}
