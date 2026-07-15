import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { MenuItem } from 'primeng/api';
import { environment } from '@/environments/environment.development';

export interface Screen {
    id: number;
    screenName: string;
    route: string | null;
    icon: string | null;
}

export interface SubModule {
    id: number;
    subModuleName: string;
    icon: string | null;
    route: string | null;
    screens: Screen[];
}

export interface Module {
    id: number;
    moduleName: string;
    icon: string | null;
    subModules: SubModule[];
}

@Injectable({
    providedIn: 'root'
})
export class MenuApiService {
    /** Fallback icon for modules / sub-modules that come back without one. */
    private readonly defaultIcon = 'pi pi-circle';

    constructor(private http: HttpClient) {}

    /** Use the API-provided icon when present (non-empty), otherwise the default. */
    private iconOrDefault(icon: string | null): string {
        return icon && icon.trim() ? icon : this.defaultIcon;
    }

    getMenu(): Observable<MenuItem[]> {
        const apiUrl = environment.apiUrl + '/Menu/GetFullMenu/1'; 
        return this.http.get<Module[]>(apiUrl).pipe(
            map((modules) => this.transformToMenuItems(modules))
        );
    }

    private transformToMenuItems(modules: Module[]): MenuItem[] {
        return modules.map((module) => ({
            label: module.moduleName,
            icon: this.iconOrDefault(module.icon),
            items: this.transformSubModules(module.subModules)
        }));
    }

    private transformSubModules(subModules: SubModule[]): MenuItem[] {
        return subModules.map((subModule) => {
            const item: MenuItem = {
                label: subModule.subModuleName,
                icon: this.iconOrDefault(subModule.icon),
                path: subModule.route ?? undefined,
                items: subModule.screens.length > 0 ? this.transformScreens(subModule.screens) : undefined
            };

            if (subModule.screens.length === 0 && subModule.route) {
                item.routerLink = [subModule.route];
                item.items = undefined;
            }

            return item;
        });
    }

    private transformScreens(screens: Screen[]): MenuItem[] {
        // Screens are leaf items — intentionally no icon (only modules/sub-modules show icons).
        return screens.map((screen) => ({
            label: screen.screenName,
            path: screen.route ?? undefined,
            routerLink: screen.route ? [screen.route] : undefined
        }));
    }
}
