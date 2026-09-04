/**
 * @file colors.ts
 * @description Centralización de tokens de color y estilos de la ADESCO.
 * Permite evitar valores hexadecimales hardcodeados en componentes y páginas.
 */

export const THEME_COLORS = {
  // Finanzas
  ingreso: 'var(--color-ingreso, #10b981)',
  ingresoHex: '#10b981',
  ingresoGlow: 'var(--color-ingreso-glow, rgba(16, 185, 129, 0.15))',

  egreso: 'var(--color-egreso, #ef4444)',
  egresoHex: '#ef4444',
  egresoGlow: 'var(--color-egreso-glow, rgba(239, 68, 68, 0.15))',

  balancePositive: 'var(--color-balance-positive, #10b981)',
  balancePositiveHex: '#10b981',
  balanceNegative: 'var(--color-balance-negative, #ef4444)',
  balanceNegativeHex: '#ef4444',

  // Roles de Usuario
  roleOwner: 'var(--color-role-owner, #8b5cf6)',
  roleOwnerHex: '#8b5cf6',
  roleOwnerGlow: 'var(--color-role-owner-glow, rgba(139, 92, 246, 0.15))',

  roleAdmin: 'var(--color-role-admin, #10b981)',
  roleAdminHex: '#10b981',

  roleAuditor: 'var(--color-role-auditor, #3b82f6)',
  roleAuditorHex: '#3b82f6',
  roleAuditorGlow: 'var(--color-role-auditor-glow, rgba(59, 130, 246, 0.15))',

  roleColaborador: 'var(--color-role-colaborador, #f59e0b)',
  roleColaboradorHex: '#f59e0b',

  roleMiembro: 'var(--color-role-miembro, #64748b)',
  roleMiembroHex: '#64748b',

  // Recharts y Gráficos
  chartGrid: 'var(--chart-grid, rgba(255, 255, 255, 0.08))',
  chartAxisText: 'var(--chart-axis-text, #94a3b8)',
  chartTooltipBg: 'var(--chart-tooltip-bg, #0f172a)',
  chartTooltipBorder: 'var(--chart-tooltip-border, rgba(255, 255, 255, 0.12))',
} as const;

export const CHART_COLORS = {
  ingresoBar: THEME_COLORS.ingresoHex,
  egresoBar: THEME_COLORS.egresoHex,
  grid: THEME_COLORS.chartGrid,
  axisText: THEME_COLORS.chartAxisText,
  tooltipBg: THEME_COLORS.chartTooltipBg,
  tooltipBorder: THEME_COLORS.chartTooltipBorder,
} as const;
