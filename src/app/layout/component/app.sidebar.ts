import { Component, computed, DestroyRef, effect, ElementRef, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter } from 'rxjs';
import { DialogModule } from 'primeng/dialog';
import { AppMenu } from './app.menu';
import { AppConfigurator } from './app.configurator';
import { LayoutService } from '@/app/layout/service/layout.service';
import { MenuService } from '@/app/layout/service/menu.service';

import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-sidebar',
    standalone: true,
    imports: [CommonModule, AppMenu, RouterModule, DialogModule, AppConfigurator],
    template: `
        <div class="layout-sidebar flex flex-col justify-between h-full bg-white border-r border-gray-200">
            <!-- Top section: Logo & Menu -->
            <div class="flex flex-col w-full">
                <!-- Brand Header -->
                <div class="sidebar-brand flex items-center justify-between pb-1.5">
                    <div class="flex items-center gap-2.5">
                        <div class="w-7 h-7 bg-linear-to-tr from-[#a855f7] to-[#6366f1] rounded-lg flex items-center justify-center text-white font-black text-sm shadow-md shadow-indigo-500/20 select-none">
                            Z
                        </div>
                        <span class="sidebar-brand-text text-xl font-black text-gray-900 tracking-tight select-none">ZAS ERP</span>
                    </div>
                    <button class="sidebar-collapse-btn w-6 h-6 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-colors cursor-pointer shadow-[0_1px_2px_0_rgba(0,0,0,0.05)]" (click)="layoutService.onMenuToggle()">
                        <i class="pi pi-angle-left text-[10px] font-bold"></i>
                    </button>
                </div>
                <p class="sidebar-subtitle text-[11px] text-gray-400 pb-3 mb-3 border-b border-gray-100 font-medium tracking-tight select-none">Simplifying Enterprise Operations</p>

                <!-- Loading State -->
                @if (isLoading()) {
                    <div class="flex items-center justify-center py-8">
                        <i class="pi pi-spin pi-spinner text-gray-400"></i>
                    </div>
                }

                <!-- Error State -->
                @if (error()) {
                    <div class="bg-red-50 border border-red-200 rounded-lg p-3 mb-3 mx-3">
                        <p class="text-xs text-red-600">{{ error() }}</p>
                        <button (click)="retryLoadMenu()" class="text-xs text-red-700 font-semibold mt-2 hover:underline">
                            Retry
                        </button>
                    </div>
                }

                <!-- Menu Navigation -->
                @if (!isLoading() && !error()) {
                    <app-menu [model]="menuItems()"></app-menu>
                }
            </div>

            <!-- Bottom section: Settings Button -->
            <div class="pt-3 border-t border-gray-100 mt-auto w-full pb-1">
                <button type="button" (click)="openSettings()" class="sidebar-setting-btn w-full flex items-center gap-3 px-4 py-2.5 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold rounded-2xl transition-all duration-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)] cursor-pointer text-sm select-none">
                    <i class="pi pi-cog text-gray-500 text-base"></i>
                    <span class="sidebar-setting-label">Setting</span>
                </button>
            </div>
        </div>

        <!-- Appearance / theme settings modal -->
        <p-dialog
            [visible]="settingsVisible()"
            (visibleChange)="settingsVisible.set($event)"
            [modal]="true"
            [draggable]="false"
            [resizable]="false"
            [dismissableMask]="true"
            header="Settings"
            [style]="{ width: '24rem', maxWidth: '92vw' }"
        >
            <p class="text-sm text-gray-500 mb-4 -mt-1">Customize the theme — primary color, surface, preset and menu mode.</p>
            <app-configurator [inline]="true" />
        </p-dialog>
    `
})
export class AppSidebar implements OnInit, OnDestroy {
    layoutService = inject(LayoutService);

    menuService = inject(MenuService);

    menuItems = computed(() => this.menuService.menuItems());

    isLoading = computed(() => this.menuService.isLoading());

    error = computed(() => this.menuService.error());

    /** Controls the appearance/theme settings modal. */
    settingsVisible = signal(false);

    router = inject(Router);

    el = inject(ElementRef);

    private outsideClickListener: ((event: MouseEvent) => void) | null = null;

    private destroyRef = inject(DestroyRef);

    constructor() {
        effect(() => {
            const state = this.layoutService.layoutState();

            if (this.layoutService.isDesktop()) {
                if (state.overlayMenuActive) {
                    this.bindOutsideClickListener();
                } else {
                    this.unbindOutsideClickListener();
                }
            } else {
                if (state.mobileMenuActive) {
                    this.bindOutsideClickListener();
                } else {
                    this.unbindOutsideClickListener();
                }
            }
        });
    }

    ngOnInit() {
        this.menuService.loadMenuFromApi();

        this.router.events
            .pipe(
                filter((event) => event instanceof NavigationEnd),
                takeUntilDestroyed(this.destroyRef)
            )
            .subscribe((event) => {
                const navEvent = event as NavigationEnd;
                this.onRouteChange(navEvent.urlAfterRedirects);
            });

        this.onRouteChange(this.router.url);
    }

    retryLoadMenu() {
        this.menuService.loadMenuFromApi();
    }

    openSettings() {
        this.settingsVisible.set(true);
    }

    ngOnDestroy() {
        this.unbindOutsideClickListener();
    }

    private onRouteChange(path: string) {
        this.layoutService.layoutState.update((val) => ({
            ...val,
            activePath: path,
            overlayMenuActive: false,
            staticMenuMobileActive: false,
            mobileMenuActive: false,
            menuHoverActive: false
        }));
    }

    private bindOutsideClickListener() {
        if (!this.outsideClickListener) {
            this.outsideClickListener = (event: MouseEvent) => {
                if (this.isOutsideClicked(event)) {
                    this.layoutService.layoutState.update((val) => ({
                        ...val,
                        overlayMenuActive: false,
                        staticMenuMobileActive: false,
                        mobileMenuActive: false,
                        menuHoverActive: false
                    }));
                }
            };

            document.addEventListener('click', this.outsideClickListener);
        }
    }

    private unbindOutsideClickListener() {
        if (this.outsideClickListener) {
            document.removeEventListener('click', this.outsideClickListener);
            this.outsideClickListener = null;
        }
    }

    private isOutsideClicked(event: MouseEvent): boolean {
        const topbarButtonEl = document.querySelector('.topbar-start > button');
        const sidebarEl = this.el.nativeElement;

        return !(
            sidebarEl?.isSameNode(event.target as Node) ||
            sidebarEl?.contains(event.target as Node) ||
            topbarButtonEl?.isSameNode(event.target as Node) ||
            topbarButtonEl?.contains(event.target as Node)
        );
    }
}
