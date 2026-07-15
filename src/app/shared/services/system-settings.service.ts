import { environment } from '@/environments/environment';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, shareReplay, throwError } from 'rxjs';
import { BaseCurrencyConfig, SETTING_ID, SystemSettingsResponse } from './system-settings.types';

/**
 * Reads application-wide system settings (e.g. base currency / rates).
 * Settings are static for a session, so the response is cached and shared.
 */
@Injectable({ providedIn: 'root' })
export class SystemSettingsService {
    private http = inject(HttpClient);
    private settings$?: Observable<SystemSettingsResponse>;

    getSettings(): Observable<SystemSettingsResponse> {
        if (!this.settings$) {
            this.settings$ = this.http.get<SystemSettingsResponse>(`${environment.apiUrl}/system-settings`).pipe(
                catchError((err) => {
                    this.settings$ = undefined; // allow a retry on the next call
                    return throwError(() => err);
                }),
                shareReplay({ bufferSize: 1, refCount: false }),
            );
        }
        return this.settings$;
    }

    /** Resolve the base currency codes + rates from the settings list. */
    getBaseCurrencyConfig(): Observable<BaseCurrencyConfig> {
        return this.getSettings().pipe(
            map((res) => {
                const data = res?.data ?? [];
                const valueOf = (settingId: number) => data.find((s) => s.settingId === settingId)?.value ?? '';
                return {
                    fcyCurrency: valueOf(SETTING_ID.baseFcyCurrency),
                    fcyRate: Number(valueOf(SETTING_ID.baseFcyRate)) || 0,
                    lcyCurrency: valueOf(SETTING_ID.baseLcyCurrency),
                    lcyRate: Number(valueOf(SETTING_ID.baseLcyRate)) || 0,
                };
            }),
        );
    }
}
