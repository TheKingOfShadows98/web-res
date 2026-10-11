/**
 * @file index.ts
 * @description Tema por defecto / estándar institucional de la Residencial México.
 * @module themes/default
 */

import React from 'react';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import { IThemeModule, IThemeConfig, IThemeColors } from '../types';

export const config: IThemeConfig = {
  id: 'default',
  displayName: 'Estándar Institucional',
  description: 'Portal oficial de la Residencial México.',
};

export const themeColors: IThemeColors = {
  primary: '#10b981',
  accent: '#059669',
  badgeBackground: 'rgba(16, 185, 129, 0.1)',
  badgeText: '#10b981',
};

export const ThemeNavbar: React.ComponentType = Navbar;
export const ThemeHero: React.ComponentType = Hero;

export const ThemeLayoutWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return React.createElement(React.Fragment, null, children);
};

const defaultTheme: IThemeModule = {
  config,
  ThemeNavbar,
  ThemeHero,
  ThemeLayoutWrapper,
  themeColors,
};

export default defaultTheme;
