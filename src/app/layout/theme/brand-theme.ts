import Aura from '@primeuix/themes/aura';
import { definePreset } from '@primeuix/themes';

/**
 * ZAS ERP brand blue (#0015ff) expressed as a full primary scale.
 * `500` is the brand color itself; lighter/darker shades are derived around it.
 * Used both as the app's default theme primary and as a swatch in the configurator.
 */
export const BRAND_PRIMARY = {
    50: '#eef1ff',
    100: '#e0e5ff',
    200: '#c7ceff',
    300: '#a3acff',
    400: '#7c80ff',
    500: '#0015ff',
    600: '#0011cc',
    700: '#000ea3',
    800: '#000b80',
    900: '#000a66',
    950: '#000640',
} as const;

/** Aura preset with the brand blue as the primary palette — the app's default theme. */
export const ZascarePreset = definePreset(Aura, {
    semantic: {
        primary: BRAND_PRIMARY,
    },
});
