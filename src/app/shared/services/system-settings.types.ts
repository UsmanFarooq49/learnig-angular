// System settings — returned by GET /system-settings.

export interface SystemSetting {
    id: number;
    settingId: number;
    settingKey: string;
    description: string;
    valueType: string;
    value: string;
    createdOn: string;
    modifiedOn: string | null;
    isActive: boolean;
    rowVersion: string;
}

export interface SystemSettingsResponse {
    success: boolean;
    message: string;
    data: SystemSetting[] | null;
    errors: string | null;
    errorCode: string | null;
}

/** Stable setting ids (independent of row `id`). */
export const SETTING_ID = {
    baseFcyCurrency: 11,
    baseFcyRate: 12,
    baseLcyCurrency: 13,
    baseLcyRate: 14,
} as const;

/** Convenience shape: the base currency configuration resolved from settings. */
export interface BaseCurrencyConfig {
    fcyCurrency: string;
    fcyRate: number;
    lcyCurrency: string;
    lcyRate: number;
}
