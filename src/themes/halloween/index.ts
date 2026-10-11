/**
 * @file index.ts
 * @description Punto de entrada del tema Halloween para Residencial México.
 * Implementa IThemeModule de forma desacoplada y modular.
 * @module themes/halloween
 */

import { IThemeModule, IThemeConfig, IThemeColors } from '../types';
import HalloweenNavbar from './HalloweenNavbar';
import HalloweenHero from './HalloweenHero';
import HalloweenLayoutWrapper from './HalloweenLayoutWrapper';

export const config: IThemeConfig = {
  id: 'halloween',
  displayName: 'Edición Halloween 🎃',
  description: 'Tema conmemorativo de octubre y concurso de disfraces y decoración.',
};

export const themeColors: IThemeColors = {
  primary: '#f97316',
  accent: '#7e22ce',
  badgeBackground: 'rgba(249, 115, 22, 0.15)',
  badgeText: '#fb923c',
};

export const ThemeNavbar = HalloweenNavbar;
export const ThemeHero = HalloweenHero;
export const ThemeLayoutWrapper = HalloweenLayoutWrapper;

const halloweenTheme: IThemeModule = {
  config,
  ThemeNavbar,
  ThemeHero,
  ThemeLayoutWrapper,
  themeColors,
};

export default halloweenTheme;
