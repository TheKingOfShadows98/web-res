'use client';

/**
 * @file MonthlyFinanceChart.tsx
 * @description Módulo de visualización gráfica mensual para el panel de finanzas.
 * Permite seleccionar cualquier mes del año y años superiores o iguales a 2025,
 * mostrando las barras comparativas de ingresos/egresos del día 1 al último día
 * y el balance neto al cierre del mes en tipografía destacada.
 * @module components/finance
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { createClient } from '@/utils/supabase/client';
import { THEME_COLORS, CHART_COLORS } from '@/styles/colors';

interface DayMovement {
  diaNumero: number;
  diaLabel: string;
  ingresos: number;
  egresos: number;
  balance: number;
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const START_YEAR = 2025;

export interface MonthlyFinanceChartProps {
  initialYear?: number;
  initialMonth?: number; // 0-11
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    dataKey?: string | number;
    value?: number | string;
    name?: string;
  }>;
  label?: string | number;
}

// Tooltip personalizado para el gráfico de barras
function CustomTooltip({ active, payload, label }: CustomTooltipProps): React.ReactElement | null {
  if (active && payload && payload.length) {
    const ing = payload.find((p) => p.dataKey === 'ingresos')?.value || 0;
    const egr = payload.find((p) => p.dataKey === 'egresos')?.value || 0;
    const diff = Number(ing) - Number(egr);

    const formatCurr = (val: number) =>
      new Intl.NumberFormat('es-SV', { style: 'currency', currency: 'USD' }).format(val);

    return (
      <div style={{
        background: THEME_COLORS.chartTooltipBg,
        border: `1px solid ${THEME_COLORS.chartTooltipBorder}`,
        borderRadius: 'var(--radius-sm)',
        padding: '0.75rem 1rem',
        boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
        fontSize: '0.85rem'
      }}>
        <p style={{ fontWeight: 700, color: 'var(--foreground)', marginBottom: '0.4rem' }}>
          Día {label}
        </p>
        <p style={{ color: THEME_COLORS.ingreso, margin: '0.2rem 0' }}>
          Ingresos: <strong>{formatCurr(Number(ing))}</strong>
        </p>
        <p style={{ color: THEME_COLORS.egreso, margin: '0.2rem 0' }}>
          Egresos: <strong>{formatCurr(Number(egr))}</strong>
        </p>
        <p style={{
          color: diff >= 0 ? THEME_COLORS.balancePositive : THEME_COLORS.balanceNegative,
          margin: '0.3rem 0 0',
          borderTop: '1px solid var(--border)',
          paddingTop: '0.3rem',
          fontWeight: 600
        }}>
          Flujo Neto: {diff >= 0 ? '+' : ''}{formatCurr(diff)}
        </p>
      </div>
    );
  }
  return null;
}

export default function MonthlyFinanceChart({
  initialYear = new Date().getFullYear() >= START_YEAR ? new Date().getFullYear() : START_YEAR,
  initialMonth = new Date().getMonth(),
}: MonthlyFinanceChartProps): React.ReactElement {
  const supabase = useMemo(() => createClient(), []);

  // Estados de período
  const [selectedYear, setSelectedYear] = useState<number>(initialYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(initialMonth);

  // Estados de datos
  const [loading, setLoading] = useState<boolean>(true);
  const [chartData, setChartData] = useState<DayMovement[]>([]);
  const [totalIngresos, setTotalIngresos] = useState<number>(0);
  const [totalEgresos, setTotalEgresos] = useState<number>(0);

  // Lista de años configurables desde 2025 hasta año actual + 2
  const availableYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const maxYear = Math.max(currentYear + 2, 2028);
    const years: number[] = [];
    for (let y = START_YEAR; y <= maxYear; y++) {
      years.push(y);
    }
    return years;
  }, []);

  // Formateador de moneda
  const formatCurrency = useCallback((val: number) => {
    return new Intl.NumberFormat('es-SV', { style: 'currency', currency: 'USD' }).format(val);
  }, []);

  // Cargar datos del mes seleccionado
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        // 1. Calcular rango de fechas: Día 1 al último día del mes
        const lastDayOfMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
        const startIso = new Date(Date.UTC(selectedYear, selectedMonth, 1, 0, 0, 0, 0)).toISOString();
        const endIso = new Date(Date.UTC(selectedYear, selectedMonth, lastDayOfMonth, 23, 59, 59, 999)).toISOString();

        const { data: ingresos, error: errIng } = await supabase
          .from('ingreso')
          .select('cantidad, fecha')
          .gte('fecha', startIso)
          .lte('fecha', endIso);

        const { data: egresos, error: errEgr } = await supabase
          .from('egreso')
          .select('cantidad, fecha')
          .gte('fecha', startIso)
          .lte('fecha', endIso);

        if (errIng) throw errIng;
        if (errEgr) throw errEgr;

        // 2. Mapear días del 1 al último día
        const dayMap: { [day: number]: { ingresos: number; egresos: number } } = {};
        for (let d = 1; d <= lastDayOfMonth; d++) {
          dayMap[d] = { ingresos: 0, egresos: 0 };
        }

        let sumIng = 0;
        let sumEgr = 0;

        (ingresos || []).forEach((item) => {
          if (!item.fecha) return;
          const itemDate = new Date(item.fecha);
          const dayNum = itemDate.getUTCDate();
          const amount = Number(item.cantidad) || 0;
          if (dayMap[dayNum]) {
            dayMap[dayNum].ingresos += amount;
          }
          sumIng += amount;
        });

        (egresos || []).forEach((item) => {
          if (!item.fecha) return;
          const itemDate = new Date(item.fecha);
          const dayNum = itemDate.getUTCDate();
          const amount = Number(item.cantidad) || 0;
          if (dayMap[dayNum]) {
            dayMap[dayNum].egresos += amount;
          }
          sumEgr += amount;
        });

        const series: DayMovement[] = [];
        for (let d = 1; d <= lastDayOfMonth; d++) {
          const ing = dayMap[d].ingresos;
          const egr = dayMap[d].egresos;
          series.push({
            diaNumero: d,
            diaLabel: `${d}`,
            ingresos: ing,
            egresos: egr,
            balance: ing - egr,
          });
        }

        if (isMounted) {
          setChartData(series);
          setTotalIngresos(sumIng);
          setTotalEgresos(sumEgr);
        }
      } catch (err) {
        console.error('Error al cargar datos mensuales para gráfica:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [selectedYear, selectedMonth, refreshTrigger, supabase]);

  const balanceFinalMes = useMemo(() => {
    return totalIngresos - totalEgresos;
  }, [totalIngresos, totalEgresos]);

  const isPositiveBalance = balanceFinalMes >= 0;

  return (
    <div style={{
      background: 'var(--background-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-md)',
      padding: '2rem',
      marginBottom: '3rem',
      boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
      backdropFilter: 'blur(10px)'
    }}>
      {/* Encabezado y Selectores de Período */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1.25rem',
        marginBottom: '2rem',
        borderBottom: '1px solid var(--border)',
        paddingBottom: '1.5rem'
      }}>
        <div>
          <span className="sectionLabel" style={{ fontSize: '0.8rem', color: THEME_COLORS.ingreso }}>
            Análisis de Flujo de Caja
          </span>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--foreground)', marginTop: '0.25rem' }}>
            Rendimiento Mensual: {MONTH_NAMES[selectedMonth]} {selectedYear}
          </h3>
          <p style={{ color: 'var(--foreground-muted)', fontSize: '0.875rem' }}>
            Ingresos y egresos diarios del día 1 al {new Date(selectedYear, selectedMonth + 1, 0).getDate()}
          </p>
        </div>

        {/* Controles de Selección de Mes y Año */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div>
            <label htmlFor="select-mes" style={{ display: 'none' }}>Mes</label>
            <select
              id="select-mes"
              aria-label="Seleccionar Mes"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              style={{
                padding: '0.55rem 1rem',
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--foreground)',
                fontSize: '0.9rem',
                cursor: 'pointer'
              }}
            >
              {MONTH_NAMES.map((name, idx) => (
                <option key={name} value={idx}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="select-anio" style={{ display: 'none' }}>Año</label>
            <select
              id="select-anio"
              aria-label="Seleccionar Año"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              style={{
                padding: '0.55rem 1rem',
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--foreground)',
                fontSize: '0.9rem',
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

          <button
            onClick={() => {
              setLoading(true);
              setRefreshTrigger((prev) => prev + 1);
            }}
            disabled={loading}
            className="btnSecondary"
            style={{ padding: '0.55rem 0.9rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10"></polyline>
              <polyline points="1 20 1 14 7 14"></polyline>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
            </svg>
            {loading ? '...' : 'Actualizar'}
          </button>
        </div>
      </div>

      {/* Tarjeta de Balance al Cierre del Mes (En Grande) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1.25rem',
        marginBottom: '2rem'
      }}>
        {/* Balance Final del Mes */}
        <div style={{
          gridColumn: 'span 2',
          background: isPositiveBalance ? THEME_COLORS.ingresoGlow : THEME_COLORS.egresoGlow,
          border: `1px solid ${isPositiveBalance ? THEME_COLORS.balancePositive : THEME_COLORS.balanceNegative}`,
          borderRadius: 'var(--radius-md)',
          padding: '1.5rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <span style={{
              fontSize: '0.85rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--foreground-muted)'
            }}>
              Balance al Final del Mes ({MONTH_NAMES[selectedMonth]} {selectedYear})
            </span>
            <div style={{
              fontSize: '2.75rem',
              fontWeight: 800,
              color: isPositiveBalance ? THEME_COLORS.balancePositive : THEME_COLORS.balanceNegative,
              marginTop: '0.25rem',
              lineHeight: 1.1
            }}>
              {loading ? 'Calculando...' : formatCurrency(balanceFinalMes)}
            </div>
            <p style={{ color: 'var(--foreground-muted)', fontSize: '0.85rem', marginTop: '0.4rem' }}>
              {isPositiveBalance ? 'Superávit neto registrado en este período' : 'Déficit registrado en este período'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', borderLeft: '1px solid var(--border)', paddingLeft: '1.5rem' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: THEME_COLORS.ingreso, fontWeight: 600, textTransform: 'uppercase' }}>
                Ingresos Mes
              </span>
              <div style={{ fontSize: '1.35rem', fontWeight: 700, color: THEME_COLORS.ingreso }}>
                +{formatCurrency(totalIngresos)}
              </div>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: THEME_COLORS.egreso, fontWeight: 600, textTransform: 'uppercase' }}>
                Egresos Mes
              </span>
              <div style={{ fontSize: '1.35rem', fontWeight: 700, color: THEME_COLORS.egreso }}>
                -{formatCurrency(totalEgresos)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gráfico de Barras de Ingresos vs Egresos */}
      <div style={{ width: '100%', height: '340px', marginTop: '1rem' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ width: '32px', height: '32px', border: '3px solid var(--border)', borderTop: `3px solid ${THEME_COLORS.ingreso}`, borderRadius: '50%', animation: 'pulseGlow 1s infinite' }} />
            <p style={{ color: 'var(--foreground-muted)', fontSize: '0.85rem' }}>Cargando datos del gráfico...</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 15, right: 15, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} vertical={false} />
              <XAxis
                dataKey="diaLabel"
                stroke={CHART_COLORS.axisText}
                tick={{ fill: CHART_COLORS.axisText, fontSize: 11 }}
                tickLine={false}
              />
              <YAxis
                stroke={CHART_COLORS.axisText}
                tick={{ fill: CHART_COLORS.axisText, fontSize: 11 }}
                tickLine={false}
                tickFormatter={(val) => `$${val}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ color: CHART_COLORS.axisText, fontSize: '0.85rem', paddingTop: '10px' }}
              />
              <Bar
                dataKey="ingresos"
                name="Ingresos"
                fill={CHART_COLORS.ingresoBar}
                radius={[4, 4, 0, 0]}
                maxBarSize={16}
              />
              <Bar
                dataKey="egresos"
                name="Egresos"
                fill={CHART_COLORS.egresoBar}
                radius={[4, 4, 0, 0]}
                maxBarSize={16}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
