import { Component, computed, inject, input, signal } from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { RippleModule } from 'primeng/ripple';
import { LayoutService } from '@/app/layout/service/layout.service';
import { filter } from 'rxjs/operators';

@Component({
    selector: '[app-menuitem]',
    imports: [CommonModule, RouterModule, RippleModule],
    template: `
        @if (root() && isVisible()) {
            <div class="layout-menuitem-root-text" [class.font-bold]="containsActiveRoute()">{{ item().label }}</div>
        }
        @if ((!hasRouterLink() || hasChildren()) && isVisible()) {
            <a [attr.href]="item().url" (click)="itemClick($event)" class="menu_item_list" [ngClass]="item().class" [attr.target]="item().target" tabindex="0" pRipple>
                @if (item().icon) {
                    <i [ngClass]="item().icon" class="pi layout-menuitem-icon"></i>
                }
                <span class="layout-menuitem-text" [class.font-bold]="containsActiveRoute()">{{ item().label }}</span>
                @if (hasChildren()) {
                    <i class="pi pi-fw pi-angle-left layout-submenu-toggler"></i>
                }
            </a>
        }
        @if (hasRouterLink() && !hasChildren() && isVisible()) {
            <a
                (click)="itemClick($event)"
                [ngClass]="[
                    item().class || '',
                    !item().icon ? 'menu_item_link' : ''
                ]"
                [routerLink]="item().routerLink"
                routerLinkActive="active-route"
                [routerLinkActiveOptions]="item().routerLinkActiveOptions || { paths: 'subset', queryParams: 'ignored', matrixParams: 'ignored', fragment: 'ignored' }"
                [fragment]="item().fragment"
                [queryParamsHandling]="item().queryParamsHandling"
                [preserveFragment]="item().preserveFragment"
                [skipLocationChange]="item().skipLocationChange"
                [replaceUrl]="item().replaceUrl"
                [state]="item().state"
                [queryParams]="item().queryParams"
                [attr.target]="item().target"
                tabindex="0"
                pRipple
            >
                @if (item().icon) {
                    <i [ngClass]="item().icon" class="pi layout-menuitem-icon"></i>
                }
                <span class="layout-menuitem-text" [class.font-bold]="containsActiveRoute()">{{ item().label }}</span>
                @if (hasChildren()) {
                    <i class="pi pi-fw pi-angle-left layout-submenu-toggler"></i>
                }
            </a>
        }
        @if (hasChildren() && isVisible() && (root() || isActive())) {
            <ul [animate.enter]="initialized() ? 'p-submenu-enter' : null" [animate.leave]="'p-submenu-leave'" [class.layout-root-submenulist]="root()">
                @for (child of item().items; track child?.label) {
                    <li app-menuitem [item]="child" [parentPath]="fullPath()" [root]="false" [class]="child['badgeClass']"></li>
                }
            </ul>
        }
    `,
    host: {
        '[class.active-menuitem]': 'isActive()',
        '[class.layout-root-menuitem]': 'root()'
    },
    styles: [
        `
            .p-submenu-enter {
                animation: p-animate-submenu-expand 450ms cubic-bezier(0.86, 0, 0.07, 1) forwards;
            }

            .p-submenu-leave {
                animation: p-animate-submenu-collapse 450ms cubic-bezier(0.86, 0, 0.07, 1) forwards;
            }

            .menu_item_link{
                font-size: 0.8rem;
                padding: 0.6rem;
            }

            @keyframes p-animate-submenu-expand {
                from {
                    max-height: 0;
                    overflow: hidden;
                }
                to {
                    max-height: 1000px;
                    overflow: visible;
                }
            }

            @keyframes p-animate-submenu-collapse {
                from {
                    max-height: 1000px;
                    overflow: hidden;
                }
                to {
                    max-height: 0;
                    overflow: hidden;
                }
            }
        `
    ]
})
export class AppMenuitem {
    layoutService = inject(LayoutService);

    router = inject(Router);

    item = input<any>(null);

    root = input<boolean>(false);

    parentPath = input<string | null>(null);

    isVisible = computed(() => this.item()?.visible !== false);

    hasChildren = computed(() => this.item()?.items && this.item()?.items.length > 0);

    hasRouterLink = computed(() => !!this.item()?.routerLink);

    fullPath = computed(() => {
        const item = this.item();
        const itemPath = item?.path || item?.routerLink?.[0] || item?.url;

        if (itemPath) {
            const parent = this.parentPath();
            return parent && !itemPath.startsWith(parent) ? `${parent}|${itemPath}` : itemPath;
        }

        const label = item?.label?.toString().toLowerCase().replace(/\s+/g, '-');
        if (!label) {
            return this.parentPath();
        }

        return this.parentPath() ? `${this.parentPath()}|${label}` : label;
    });

    isActive = computed(() => {
        const activePath = this.layoutService.layoutState().activePath;
        return activePath?.startsWith(this.fullPath() ?? '') ?? false;
    });

    /** Current router URL (path only), kept in sync so derived state recomputes on navigation. */
    currentUrl = signal<string>(this.stripUrl(this.router.url));

    /**
     * True when the active route lives anywhere in this item's subtree. Drives the
     * submenu open state directly from the URL, so deep-linking / refreshing keeps the
     * containing groups expanded (groups without their own route can't self-activate otherwise).
     */
    containsActiveRoute = computed(() => this.subtreeMatchesUrl(this.item(), this.currentUrl()));

    initialized = signal<boolean>(false);

    constructor() {
        this.router.events
            .pipe(
                filter((event) => event instanceof NavigationEnd),
                takeUntilDestroyed()
            )
            .subscribe(() => {
                this.currentUrl.set(this.stripUrl(this.router.url));
                if (this.item()?.routerLink) {
                    this.updateActiveStateFromRoute();
                }
                this.autoExpandForRoute();
            });
    }

    /**
     * Open this group when the active route lives in its subtree. Seeds `activePath`
     * (the normal expand mechanism) so deep-link / refresh auto-expands the containing
     * groups, while still leaving them collapsible via click afterwards.
     */
    private autoExpandForRoute(): void {
        if (this.hasChildren() && !this.root() && this.containsActiveRoute()) {
            this.layoutService.layoutState.update((val) => ({ ...val, activePath: this.fullPath() }));
        }
    }

    /** Strip query string / fragment so route matching compares paths only. */
    private stripUrl(url: string): string {
        return url.split('?')[0].split('#')[0];
    }

    /** Recursively check whether `url` matches this item's routerLink or any descendant's. */
    private subtreeMatchesUrl(item: any, url: string): boolean {
        if (!item) return false;
        const link = item.routerLink?.[0];
        if (link && (url === link || url.startsWith(link + '/'))) return true;
        return (item.items ?? []).some((child: any) => this.subtreeMatchesUrl(child, url));
    }

    ngOnInit() {
        if (this.item()?.routerLink) {
            this.updateActiveStateFromRoute();
        }
        this.autoExpandForRoute();
    }

    ngAfterViewInit() {
        setTimeout(() => {
            this.initialized.set(true);
        });
    }

    updateActiveStateFromRoute() {
        const item = this.item();
        if (!item?.routerLink) return;

        const isRouteActive = this.router.isActive(item.routerLink[0], {
            paths: 'exact',
            queryParams: 'ignored',
            matrixParams: 'ignored',
            fragment: 'ignored'
        });

        if (isRouteActive) {
            const parentPath = this.parentPath();
            if (parentPath) {
                this.layoutService.layoutState.update((val) => ({
                    ...val,
                    activePath: parentPath
                }));
            }
        }
    }

    itemClick(event: Event) {
        const item = this.item();

        if (item?.disabled) {
            event.preventDefault();
            return;
        }

        if (item?.command) {
            item.command({ originalEvent: event, item: item });
        }

        if (this.hasChildren()) {
            if (this.isActive()) {
                this.layoutService.layoutState.update((val) => ({
                    ...val,
                    activePath: this.parentPath()
                }));
            } else {
                this.layoutService.layoutState.update((val) => ({
                    ...val,
                    activePath: this.fullPath(),
                    menuHoverActive: true
                }));
            }
        } else {
            this.layoutService.layoutState.update((val) => ({
                ...val,
                overlayMenuActive: false,
                staticMenuMobileActive: false,
                mobileMenuActive: false,
                menuHoverActive: false
            }));
        }
    }
}
