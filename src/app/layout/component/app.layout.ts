import { Component, computed, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { AppTopbar } from './app.topbar';
import { AppSidebar } from './app.sidebar';
import { AppConfigurator } from './app.configurator';
import { LayoutService } from '@/app/layout/service/layout.service';
import { FinancialYearModalComponent, LoaderComponent } from '@/app/shared';

@Component({
    selector: 'app-layout',
    standalone: true,
    imports: [CommonModule, AppTopbar, AppSidebar, AppConfigurator, RouterModule, LoaderComponent, ToastModule, ConfirmDialogModule, FinancialYearModalComponent],
    template: `<div class="layout-wrapper" [ngClass]="containerClass()">
        <app-topbar></app-topbar>
        <app-sidebar></app-sidebar>
        <div class="layout-main-container">
            <div class="layout-main">
                <router-outlet></router-outlet>
            </div>
            <!-- <app-footer></app-footer> -->
        </div>
        <div class="layout-mask"></div>
        <app-loader />
        <p-toast position="top-right" />
        <p-confirmdialog />
        <app-financial-year-modal />
        <!-- Hidden: applies the persisted theme (primary/surface) on boot. -->
        <app-configurator />
    </div> `
})
export class AppLayout {
    layoutService = inject(LayoutService);

    constructor() {
        effect(() => {
            const state = this.layoutService.layoutState();
            if (state.mobileMenuActive) {
                document.body.classList.add('blocked-scroll');
            } else {
                document.body.classList.remove('blocked-scroll');
            }
        });
    }

    containerClass = computed(() => {
        const config = this.layoutService.layoutConfig();
        const state = this.layoutService.layoutState();
        return {
            'layout-overlay': config.menuMode === 'overlay',
            'layout-static': config.menuMode === 'static',
            'layout-static-inactive': state.staticMenuDesktopInactive && config.menuMode === 'static',
            'layout-overlay-active': state.overlayMenuActive,
            'layout-mobile-active': state.mobileMenuActive
        };
    })
}
