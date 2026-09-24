'use client';

/**
 * @file page.tsx
 * @description Portal público de transparencia y rendición de cuentas financieras de la ADESCO Residencial México.
 * Capa de presentación que consume la lógica desacoplada desde el hook useFinanzas.
 * @module app/finanzas
 */

import React from 'react';
import Link from 'next/link';
import UserLayout from '@/components/UserLayout';
import MonthlyFinanceChart from '@/components/finance/MonthlyFinanceChart';
import { THEME_COLORS } from '@/styles/colors';
import {
  useFinanzas,
  ConceptSummary,
  TransactionMovement,
  DailyActivity,
  MONTH_NAMES,
} from '@/hooks/useFinanzas';

// Re-exportamos interfaces para compatibilidad con otros módulos
export type { ConceptSummary, TransactionMovement, DailyActivity };

/**
 * Vista de presentación de finanzas comunitarias y transparencia.
 */
export default function FinanzasPage(): React.ReactElement {
  const {
    selectedYear,
    setSelectedYear,
    selectedMonth,
    setSelectedMonth,
    availableYears,
    monthNames,

    balanceTotalHistorico,
    totalIngresosHistoricos,
    totalEgresosHistoricos,

    loadingData,
    ingresosPeriodo,
    egresosPeriodo,
    totalIngresosMes,
    totalEgresosMes,
    balanceMes,

    conceptosIngresos,
    conceptosEgresos,
    dailyActivities,

    conceptosTab,
    setConceptosTab,
    expandedDays,
    toggleDayExpansion,
    copiedHash,
    copyHashToClipboard,

    formatCurrency,
    formatDateString,
  } = useFinanzas();

  return (
    <UserLayout>
      <div style={{ minHeight: '80vh', padding: '3rem 1.25rem 5rem' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          
          {/* Navegación y Encabezado */}
          <div style={{ marginBottom: '2.5rem' }}>
            <Link href="/" className="btnSecondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              Volver al Inicio
            </Link>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
              <div>
                <span className="sectionLabel" style={{ color: THEME_COLORS.ingreso }}>
                  Portal de Acceso Abierto
                </span>
                <h1 className="heroTitle" style={{ fontSize: '2.5rem', marginBottom: '0.5rem', marginTop: '0.25rem' }}>
                  Finanzas y Transparencia
                </h1>
                <p className="heroSubtitle" style={{ fontSize: '1rem', margin: 0, maxWidth: '750px' }}>
                  Consulta en tiempo real el estado financiero, balances auditables y desglose de movimientos de la ADESCO Residencial México.
                </p>
              </div>

              {/* Selector de Período (Mes y Año >= 2025) */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                backgroundColor: 'var(--background-card)',
                border: '1px solid var(--border)',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-sm)',
                flexWrap: 'wrap'
              }}>
                <div>
                  <label htmlFor="trans-select-mes" style={{ display: 'none' }}>Mes</label>
                  <select
                    id="trans-select-mes"
                    aria-label="Seleccionar Mes"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    style={{
                      padding: '0.5rem 0.75rem',
                      background: 'rgba(0,0,0,0.4)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--foreground)',
                      fontSize: '0.85rem',
                      cursor: 'pointer'
                    }}
                  >
                    {monthNames.map((name, idx) => (
                      <option key={name} value={idx}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="trans-select-anio" style={{ display: 'none' }}>Año</label>
                  <select
                    id="trans-select-anio"
                    aria-label="Seleccionar Año"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    style={{
                      padding: '0.5rem 0.75rem',
                      background: 'rgba(0,0,0,0.4)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--foreground)',
                      fontSize: '0.85rem',
                      cursor: 'pointer'
                    }}
                  >
                    {availableYears.map((yr) => (
                      <option key={yr} value={yr}>
                        {yr}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Tarjetas de Métricas Globales Históricas */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2.5rem'
          }}>
            {/* Balance General */}
            <div className="card" style={{ cursor: 'default', borderLeft: `4px solid ${(balanceTotalHistorico ?? 0) >= 0 ? THEME_COLORS.balancePositive : THEME_COLORS.balanceNegative}` }}>
              <span className="sectionLabel" style={{ fontSize: '0.75rem', marginBottom: '0.5rem' }}>Fondo Comunitario Disponible</span>
              <h3 className="statValue" style={{ fontSize: '2.25rem', color: (balanceTotalHistorico ?? 0) >= 0 ? THEME_COLORS.balancePositive : THEME_COLORS.balanceNegative }}>
                {balanceTotalHistorico === null ? 'Calculando...' : formatCurrency(balanceTotalHistorico)}
              </h3>
              <p className="statDesc" style={{ marginTop: '0.5rem' }}>Balance total acumulado en caja</p>
            </div>

            {/* Total Ingresos Históricos */}
            <div className="card" style={{ cursor: 'default', borderLeft: `4px solid ${THEME_COLORS.ingreso}` }}>
              <span className="sectionLabel" style={{ fontSize: '0.75rem', color: THEME_COLORS.ingreso, marginBottom: '0.5rem' }}>Ingresos Históricos</span>
              <h3 className="statValue" style={{ fontSize: '2.25rem', color: THEME_COLORS.ingreso }}>
                {formatCurrency(totalIngresosHistoricos)}
              </h3>
              <p className="statDesc" style={{ marginTop: '0.5rem' }}>Total de aportaciones recibidas</p>
            </div>

            {/* Total Egresos Históricos */}
            <div className="card" style={{ cursor: 'default', borderLeft: `4px solid ${THEME_COLORS.egreso}` }}>
              <span className="sectionLabel" style={{ fontSize: '0.75rem', color: THEME_COLORS.egreso, marginBottom: '0.5rem' }}>Egresos Históricos</span>
              <h3 className="statValue" style={{ fontSize: '2.25rem', color: THEME_COLORS.egreso }}>
                {formatCurrency(totalEgresosHistoricos)}
              </h3>
              <p className="statDesc" style={{ marginTop: '0.5rem' }}>Total ejecutado en proyectos y servicios</p>
            </div>
          </div>

          {/* Gráfico Mensual Interactivo */}
          <MonthlyFinanceChart
            year={selectedYear}
            month={selectedMonth}
            hideFilterControls={true}
            ingresosData={ingresosPeriodo}
            egresosData={egresosPeriodo}
            loading={loadingData}
          />

          {/* ========================================================================= */}
          {/* SECCIÓN 1: TABLAS DE CONCEPTOS DE INGRESOS Y GASTOS DEL MES                */}
          {/* ========================================================================= */}
          <div style={{
            background: 'var(--background-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '2rem',
            marginBottom: '3rem',
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
              <div>
                <span className="sectionLabel" style={{ color: THEME_COLORS.ingreso }}>Auditoría Abierta</span>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '0.25rem' }}>
                  Conceptos de Ingresos y Gastos: {MONTH_NAMES[selectedMonth]} {selectedYear}
                </h3>
              </div>

              {/* Selector de pestañas */}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setConceptosTab('todos')}
                  className={conceptosTab === 'todos' ? 'btnPrimary' : 'btnSecondary'}
                  style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem' }}
                >
                  Ver Ambos ({conceptosIngresos.length + conceptosEgresos.length})
                </button>
                <button
                  onClick={() => setConceptosTab('ingresos')}
                  className={conceptosTab === 'ingresos' ? 'btnPrimary' : 'btnSecondary'}
                  style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem' }}
                >
                  Ingresos ({conceptosIngresos.length})
                </button>
                <button
                  onClick={() => setConceptosTab('egresos')}
                  className={conceptosTab === 'egresos' ? 'btnPrimary' : 'btnSecondary'}
                  style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem' }}
                >
                  Gastos ({conceptosEgresos.length})
                </button>
              </div>
            </div>

            {/* Layout en dos columnas / tablas para pantallas grandes y apilado en móvil */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: conceptosTab === 'todos' ? 'repeat(auto-fit, minmax(320px, 1fr))' : '1fr',
              gap: '2rem'
            }}>
              
              {/* TABLA A: CONCEPTOS DE INGRESOS (AGRUPADOS) */}
              {(conceptosTab === 'todos' || conceptosTab === 'ingresos') && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: `2px solid ${THEME_COLORS.ingreso}`, paddingBottom: '0.5rem' }}>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: THEME_COLORS.ingreso }}>
                      Conceptos de Ingresos ({formatCurrency(totalIngresosMes)})
                    </h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--foreground-muted)' }}>
                      {conceptosIngresos.length} conceptos agrupados
                    </span>
                  </div>

                  <div className="tableResponsiveContainer">
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--foreground-muted)' }}>
                          <th style={{ padding: '0.6rem 0.5rem', textAlign: 'left', fontWeight: 600 }}>Concepto</th>
                          <th style={{ padding: '0.6rem 0.5rem', textAlign: 'right', fontWeight: 600 }}>Monto Acumulado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loadingData ? (
                          <tr>
                            <td colSpan={2} style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--foreground-muted)' }}>
                              Cargando conceptos de ingresos...
                            </td>
                          </tr>
                        ) : conceptosIngresos.length === 0 ? (
                          <tr>
                            <td colSpan={2} style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--foreground-muted)' }}>
                              No hay ingresos registrados en este mes.
                            </td>
                          </tr>
                        ) : (
                          conceptosIngresos.map((item, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                              <td style={{ padding: '0.65rem 0.5rem', fontWeight: 600, color: 'var(--foreground)' }}>
                                {item.concepto}
                                {item.count > 1 && (
                                  <span style={{ marginLeft: '0.5rem', fontSize: '0.7rem', color: 'var(--foreground-muted)', fontWeight: 400, backgroundColor: 'rgba(255,255,255,0.06)', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>
                                    {item.count} aportes
                                  </span>
                                )}
                              </td>
                              <td style={{ padding: '0.65rem 0.5rem', textAlign: 'right', fontWeight: 700, color: THEME_COLORS.ingreso, fontSize: '0.95rem' }}>
                                +{formatCurrency(item.totalMonto)}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TABLA B: CONCEPTOS DE GASTOS / EGRESOS (AGRUPADOS) */}
              {(conceptosTab === 'todos' || conceptosTab === 'egresos') && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: `2px solid ${THEME_COLORS.egreso}`, paddingBottom: '0.5rem' }}>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: THEME_COLORS.egreso }}>
                      Conceptos de Gastos ({formatCurrency(totalEgresosMes)})
                    </h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--foreground-muted)' }}>
                      {conceptosEgresos.length} conceptos agrupados
                    </span>
                  </div>

                  <div className="tableResponsiveContainer">
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--foreground-muted)' }}>
                          <th style={{ padding: '0.6rem 0.5rem', textAlign: 'left', fontWeight: 600 }}>Concepto</th>
                          <th style={{ padding: '0.6rem 0.5rem', textAlign: 'right', fontWeight: 600 }}>Monto Acumulado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loadingData ? (
                          <tr>
                            <td colSpan={2} style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--foreground-muted)' }}>
                              Cargando conceptos de gastos...
                            </td>
                          </tr>
                        ) : conceptosEgresos.length === 0 ? (
                          <tr>
                            <td colSpan={2} style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--foreground-muted)' }}>
                              No hay gastos registrados en este mes.
                            </td>
                          </tr>
                        ) : (
                          conceptosEgresos.map((item, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                              <td style={{ padding: '0.65rem 0.5rem', fontWeight: 600, color: 'var(--foreground)' }}>
                                {item.concepto}
                                {item.count > 1 && (
                                  <span style={{ marginLeft: '0.5rem', fontSize: '0.7rem', color: 'var(--foreground-muted)', fontWeight: 400, backgroundColor: 'rgba(255,255,255,0.06)', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>
                                    {item.count} pagos
                                  </span>
                                )}
                              </td>
                              <td style={{ padding: '0.65rem 0.5rem', textAlign: 'right', fontWeight: 700, color: THEME_COLORS.egreso, fontSize: '0.95rem' }}>
                                -{formatCurrency(item.totalMonto)}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECCIÓN 2: TABLA DE REGISTROS DEL MES POR DÍA (CON ACORDEÓN)              */}
          {/* ========================================================================= */}
          <div style={{
            background: 'var(--background-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '2rem',
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
          }}>
            <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 800 }}>
                  Flujo de Caja por Día ({MONTH_NAMES[selectedMonth]} {selectedYear})
                </h3>
                <p style={{ color: 'var(--foreground-muted)', fontSize: '0.85rem', margin: '0.2rem 0 0' }}>
                  Haz clic en cualquier día para desplegar los movimientos detallados y firmas de auditoría.
                </p>
              </div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: balanceMes >= 0 ? THEME_COLORS.balancePositive : THEME_COLORS.balanceNegative }}>
                Balance del Mes: {balanceMes >= 0 ? '+' : ''}{formatCurrency(balanceMes)}
              </div>
            </div>

            <div className="tableResponsiveContainer">
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--foreground-muted)' }}>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Fecha / Movimientos</th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 600, textAlign: 'right' }}>Ingresos ($)</th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 600, textAlign: 'right' }}>Gastos ($)</th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 600, textAlign: 'right' }}>Diferencia ($)</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingData ? (
                    <tr>
                      <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: 'var(--foreground-muted)' }}>
                        Cargando flujo de caja diario...
                      </td>
                    </tr>
                  ) : dailyActivities.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: 'var(--foreground-muted)' }}>
                        No se registraron movimientos en este período.
                      </td>
                    </tr>
                  ) : (
                    dailyActivities.map((row) => {
                      const isExpanded = expandedDays.has(row.date);
                      return (
                        <React.Fragment key={row.date}>
                          <tr
                            style={{
                              borderBottom: isExpanded ? 'none' : '1px solid var(--border)',
                              backgroundColor: isExpanded ? 'rgba(255, 255, 255, 0.03)' : 'transparent',
                              cursor: 'pointer',
                              transition: 'background-color 0.2s',
                            }}
                            onClick={() => toggleDayExpansion(row.date)}
                            onMouseEnter={(e) => {
                              if (!isExpanded) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.02)';
                            }}
                            onMouseLeave={(e) => {
                              if (!isExpanded) e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                          >
                            <td style={{ padding: '0.85rem 1rem', fontWeight: 500 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                <svg
                                  width="14"
                                  height="14"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  style={{
                                    transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                                    transition: 'transform 0.2s',
                                    color: 'var(--primary)',
                                  }}
                                >
                                  <polyline points="9 18 15 12 9 6" />
                                </svg>
                                <span>{formatDateString(row.date)}</span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--foreground-muted)', fontWeight: 400 }}>
                                  ({row.movements.length} {row.movements.length === 1 ? 'movimiento' : 'movimientos'})
                                </span>
                              </div>
                            </td>
                            <td style={{ padding: '0.85rem 1rem', textAlign: 'right', color: row.ingreso > 0 ? THEME_COLORS.ingreso : 'var(--foreground-muted)', fontWeight: row.ingreso > 0 ? 600 : 400 }}>
                              {row.ingreso > 0 ? `+${formatCurrency(row.ingreso)}` : '$0.00'}
                            </td>
                            <td style={{ padding: '0.85rem 1rem', textAlign: 'right', color: row.egreso > 0 ? THEME_COLORS.egreso : 'var(--foreground-muted)', fontWeight: row.egreso > 0 ? 600 : 400 }}>
                              {row.egreso > 0 ? `-${formatCurrency(row.egreso)}` : '$0.00'}
                            </td>
                            <td style={{ padding: '0.85rem 1rem', textAlign: 'right', fontWeight: 700, color: row.diferencia >= 0 ? THEME_COLORS.balancePositive : THEME_COLORS.balanceNegative }}>
                              {row.diferencia >= 0 ? '+' : ''}{formatCurrency(row.diferencia)}
                            </td>
                          </tr>

                          {/* Acordeón expandido con los movimientos detallados de ese día */}
                          {isExpanded && (
                            <tr>
                              <td colSpan={4} style={{ padding: '0 1rem 1.25rem 1rem', backgroundColor: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid var(--border)' }}>
                                <div style={{
                                  background: 'rgba(0, 0, 0, 0.3)',
                                  borderRadius: 'var(--radius-sm)',
                                  padding: '1rem',
                                  border: '1px solid var(--border)',
                                }}>
                                  <h4 style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--foreground-muted)', marginBottom: '0.75rem' }}>
                                    Desglose de Transacciones ({formatDateString(row.date)})
                                  </h4>

                                  <div className="tableResponsiveContainer">
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem' }}>
                                      <thead>
                                        <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--foreground-muted)' }}>
                                          <th style={{ padding: '0.5rem 0.4rem', textAlign: 'left', fontWeight: 600 }}>Tipo</th>
                                          <th style={{ padding: '0.5rem 0.4rem', textAlign: 'left', fontWeight: 600 }}>Nº / Recibo</th>
                                          <th style={{ padding: '0.5rem 0.4rem', textAlign: 'left', fontWeight: 600 }}>Concepto</th>
                                          <th style={{ padding: '0.5rem 0.4rem', textAlign: 'right', fontWeight: 600 }}>Monto</th>
                                          <th style={{ padding: '0.5rem 0.4rem', textAlign: 'center', fontWeight: 600 }}>Comprobante</th>
                                          <th style={{ padding: '0.5rem 0.4rem', textAlign: 'center', fontWeight: 600 }}>Firma Hash</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {row.movements.map((mov) => (
                                          <tr key={`${mov.tipo}-${mov.id}`} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                                            <td style={{ padding: '0.55rem 0.4rem' }}>
                                              <span style={{
                                                padding: '0.2rem 0.5rem',
                                                borderRadius: '4px',
                                                fontSize: '0.7rem',
                                                fontWeight: 700,
                                                textTransform: 'uppercase',
                                                backgroundColor: mov.tipo === 'ingresos' ? THEME_COLORS.ingresoGlow : THEME_COLORS.egresoGlow,
                                                color: mov.tipo === 'ingresos' ? THEME_COLORS.ingreso : THEME_COLORS.egreso,
                                                border: `1px solid ${mov.tipo === 'ingresos' ? THEME_COLORS.ingreso : THEME_COLORS.egreso}40`,
                                              }}>
                                                {mov.tipo}
                                              </span>
                                            </td>
                                            <td style={{ padding: '0.55rem 0.4rem', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--foreground-muted)' }}>
                                              {mov.correlativo ? `#${mov.correlativo}` : '—'}
                                            </td>
                                            <td style={{ padding: '0.55rem 0.4rem', color: 'var(--foreground)' }}>
                                              {mov.concepto}
                                            </td>
                                            <td style={{ padding: '0.55rem 0.4rem', textAlign: 'right', fontWeight: 700, color: mov.tipo === 'ingresos' ? THEME_COLORS.ingreso : THEME_COLORS.egreso }}>
                                              {mov.tipo === 'ingresos' ? '+' : '-'}{formatCurrency(mov.cantidad)}
                                            </td>
                                            <td style={{ padding: '0.55rem 0.4rem', textAlign: 'center' }}>
                                              {mov.comprobante ? (
                                                <a
                                                  href={mov.comprobante}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="btnSecondary"
                                                  style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                                                >
                                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                                    <polyline points="15 3 21 3 21 9" />
                                                    <line x1="10" y1="14" x2="21" y2="3" />
                                                  </svg>
                                                  Ver
                                                </a>
                                              ) : (
                                                <span style={{ color: 'var(--foreground-muted)', fontSize: '0.75rem' }}>—</span>
                                              )}
                                            </td>
                                            <td style={{ padding: '0.55rem 0.4rem', textAlign: 'center' }}>
                                              {mov.hash ? (
                                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                                                  <code
                                                    title={mov.hash}
                                                    style={{
                                                      fontSize: '0.7rem',
                                                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                                      padding: '0.15rem 0.4rem',
                                                      borderRadius: '4px',
                                                      maxWidth: '90px',
                                                      overflow: 'hidden',
                                                      textOverflow: 'ellipsis',
                                                      whiteSpace: 'nowrap',
                                                      display: 'inline-block',
                                                      verticalAlign: 'middle',
                                                    }}
                                                  >
                                                    {mov.hash.substring(0, 8)}...
                                                  </code>
                                                  <button
                                                    onClick={() => copyHashToClipboard(mov.hash)}
                                                    style={{
                                                      background: 'transparent',
                                                      border: '1px solid var(--border)',
                                                      borderRadius: '4px',
                                                      padding: '0.15rem 0.35rem',
                                                      fontSize: '0.65rem',
                                                      cursor: 'pointer',
                                                      color: copiedHash === mov.hash ? 'var(--primary)' : 'var(--foreground-muted)',
                                                    }}
                                                    title="Copiar firma Hash"
                                                  >
                                                    {copiedHash === mov.hash ? '¡Copiado!' : 'Copiar'}
                                                  </button>
                                                </div>
                                              ) : (
                                                <span style={{ fontSize: '0.75rem', color: 'var(--foreground-muted)' }}>Sin firma</span>
                                              )}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </UserLayout>
  );
}
