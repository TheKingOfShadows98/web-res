/**
 * @file index.ts
 * @description Punto de entrada del tema Navidad e Invierno para Residencial México.
 * Implementa IThemeModule con paleta de tonos invernales y glaciares.
 * @module themes/christmas
 */

import { IThemeModule, IThemeConfig, IThemeColors } from '../types';
import ChristmasNavbar from './ChristmasNavbar';
import ChristmasHero from './ChristmasHero';
import ChristmasLayoutWrapper from './ChristmasLayoutWrapper';

export const config: IThemeConfig = {
  id: 'christmas',
  displayName: 'Edición Invernal y Fiestas Navideñas ❄️🎄',
  description: 'Tema invernal conmemorativo de fin de año, posadas y convivencia vecinal.',
};

export const themeColors: IThemeColors = {
  primary: '#38bdf8', // Azul escarcha
  accent: '#0284c7',  // Azul ártico profundo
  badgeBackground: 'rgba(56, 189, 248, 0.15)',
  badgeText: '#7dd3fc',
};

export const ThemeNavbar = ChristmasNavbar;
export const ThemeHero = ChristmasHero;
export const ThemeLayoutWrapper = ChristmasLayoutWrapper;

const christmasTheme: IThemeModule = {
  config,
  ThemeNavbar,
  ThemeHero,
  ThemeLayoutWrapper,
  themeColors,
};

export default christmasTheme;
