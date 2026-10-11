/**
 * @file types.ts
 * @description Contrato e interfaces tipadas para el sistema modular de temas por temporada.
 * Todos los temas (default, halloween, christmas, easter, etc.) deben implementar este contrato.
 * @module themes/types
 */

import React from 'react';

export type ThemeSeasonId = 'default' | 'halloween' | 'christmas' | 'easter';

export interface IThemeConfig {
  /** Identificador único del tema */
  id: ThemeSeasonId;
  /** Nombre para mostrar de la festividad o temporada */
  displayName: string;
  /** Descripción o lema temático */
  description: string;
}

export interface IThemeColors {
  primary: string;
  accent: string;
  badgeBackground?: string;
  badgeText?: string;
}

export interface IThemeModule {
  /** Configuración y metadatos del tema */
  config: IThemeConfig;
  /** Barra de navegación temática propia */
  ThemeNavbar: React.ComponentType;
  /** Sección Hero temática con llamados a la acción propios */
  ThemeHero: React.ComponentType;
  /** Envoltorio de layout o decoraciones visuales de fondo (opcional) */
  ThemeLayoutWrapper?: React.ComponentType<{ children: React.ReactNode }>;
  /** Variables o tokens de color principales */
  themeColors?: IThemeColors;
}
