/**
 * @file active-theme.ts
 * @description Exportador del tema activo para resolución en desarrollo y tests.
 * En producción (next build), el alias configurado en next.config.ts redirige
 * directamente a la carpeta del tema seleccionado, asegurando tree-shaking total.
 * @module themes/active-theme
 */

import defaultTheme from './default';
import halloweenTheme from './halloween';
import christmasTheme from './christmas';
import { IThemeModule } from './types';

const themeMap: Record<string, IThemeModule> = {
  default: defaultTheme,
  halloween: halloweenTheme,
  christmas: christmasTheme,
};

const activeThemeKey = process.env.NEXT_PUBLIC_ACTIVE_THEME || 'default';
const currentTheme: IThemeModule = themeMap[activeThemeKey] || defaultTheme;

export const config = currentTheme.config;
export const ThemeNavbar = currentTheme.ThemeNavbar;
export const ThemeHero = currentTheme.ThemeHero;
export const ThemeLayoutWrapper = currentTheme.ThemeLayoutWrapper;
export const themeColors = currentTheme.themeColors;

export default currentTheme;
