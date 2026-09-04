'use client';

/**
 * @file page.tsx
 * @description Portal público de transparencia y rendición de cuentas financieras de la ADESCO Residencial México.
 * Incluye tablas separadas de conceptos de ingresos y gastos, flujo de caja diario con acordeón y diseño 100% responsive.
 * @module app/finanzas
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MonthlyFinanceChart from '@/components/finance/MonthlyFinanceChart';
import { createClient } from '@/utils/supabase/client';
import { THEME_COLORS } from '@/styles/colors';
import { TransactionMovement, DailyActivity } from '@/app/admin/finanzas/page';

export interface ConceptSummary {
  concepto: string;
  totalMonto: number;
  count: number;
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const START_YEAR = 2025;

export default function FinanzasPage(): React.ReactElement {
  const supabase = useMemo(() => createClient(), []);

  // Período seleccionado
  const now = useMemo(() => new Date(), []);
  const [selectedYear, setSelectedYear] = useState<number>(
    now.getFullYear() >= START_YEAR ? now.getFullYear() : START_YEAR
  );
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth());

  // Métricas globales históricas
  const [balanceTotalHistorico, setBalanceTotalHistorico] = useState<number | null>(null);
  const [totalIngresosHistoricos, setTotalIngresosHistoricos] = useState<number>(0);
  const [totalEgresosHistoricos, setTotalEgresosHistoricos] = useState<number>(0);

  // Datos del período seleccionado
  const [loadingData, setLoadingData] = useState<boolean>(true);
  const [ingresosPeriodo, setIngresosPeriodo] = useState<TransactionMovement[]>([]);
  const [egresosPeriodo, setEgresosPeriodo] = useState<TransactionMovement[]>([]);
  const [dailyActivities, setDailyActivities] = useState<DailyActivity[]>([]);
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const [conceptosTab, setConceptosTab] = useState<'todos' | 'ingresos' | 'egresos'>('todos');
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  // Lista de años disponibles
  const availableYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const maxYear = Math.max(currentYear + 2, 2028);
    const years: number[] = [];
    for (let y = START_YEAR; y <= maxYear; y++) {
      years.push(y);
    }
    return years;
  }, []);

  // Formateadores
  const formatCurrency = useCallback((val: number) => {
    return new Intl.NumberFormat('es-SV', { style: 'currency', currency: 'USD' }).format(val);
  }, []);

  const formatDateString = useCallback((dateStr: string) => {
    const parts = dateStr.split('T')[0].split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  }, []);

  // 1. Cargar métricas globales históricas
  useEffect(() => {
    let isMounted = true;
    const fetchGlobalMetrics = async () => {
      try {
        const { data: ingresos, error: errIng } = await supabase.from('ingreso').select('cantidad');
        const { data: egresos, error: errEgr } = await supabase.from('egreso').select('cantidad');

        if (errIng) throw errIng;
        if (errEgr) throw errEgr;

        const sumIng = (ingresos || []).reduce((sum, item) => sum + (Number(item.cantidad) || 0), 0);
        const sumEgr = (egresos || []).reduce((sum, item) => sum + (Number(item.cantidad) || 0), 0);

        if (isMounted) {
          setTotalIngresosHistoricos(sumIng);
          setTotalEgresosHistoricos(sumEgr);
          setBalanceTotalHistorico(sumIng - sumEgr);
        }
      } catch (err) {
        console.error('Error al cargar métricas globales de transparencia:', err);
      }
    };

    fetchGlobalMetrics();
    return () => {
      isMounted = false;
    };
  }, [supabase]);

  // 2. Cargar transacciones del mes seleccionado
  useEffect(() => {
    let isMounted = true;

    const fetchPeriodTransactions = async () => {
      setLoadingData(true);
      try {
        const lastDayOfMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
        const startIso = new Date(Date.UTC(selectedYear, selectedMonth, 1, 0, 0, 0, 0)).toISOString();
        const endIso = new Date(Date.UTC(selectedYear, selectedMonth, lastDayOfMonth, 23, 59, 59, 999)).toISOString();

        const { data: ingresos, error: errIng } = await supabase
          .from('ingreso')
          .select('id, correlativo, concepto, cantidad, comprobante, fecha, hash, prev_hash')
          .gte('fecha', startIso)
          .lte('fecha', endIso);

        const { data: egresos, error: errEgr } = await supabase
          .from('egreso')
          .select('id, correlativo, concepto, cantidad, comprobante, fecha, hash, prev_hash')
          .gte('fecha', startIso)
          .lte('fecha', endIso);

        if (errIng) throw errIng;
        if (errEgr) throw errEgr;

        const ingMovements: TransactionMovement[] = (ingresos || []).map((item) => ({
          id: item.id,
          tipo: 'ingreso',
          correlativo: item.correlativo || '',
          concepto: item.concepto || 'Ingreso sin concepto',
          cantidad: Number(item.cantidad) || 0,
          comprobante: item.comprobante || null,
          hash: item.hash || '',
          prev_hash: item.prev_hash || '',
          fecha: item.fecha,
        }));

        const egrMovements: TransactionMovement[] = (egresos || []).map((item) => ({
          id: item.id,
          tipo: 'egreso',
          correlativo: item.correlativo || '',
          concepto: item.concepto || 'Egreso sin concepto',
          cantidad: Number(item.cantidad) || 0,
          comprobante: item.comprobante || null,
          hash: item.hash || '',
          prev_hash: item.prev_hash || '',
          fecha: item.fecha,
        }));

        // Ordenar listas de conceptos por inserción más reciente
        const sortDesc = (a: TransactionMovement, b: TransactionMovement) => {
          const timeA = new Date(a.fecha).getTime();
          const timeB = new Date(b.fecha).getTime();
          if (timeB !== timeA) return timeB - timeA;
          return Number(b.id || 0) - Number(a.id || 0);
        };

        ingMovements.sort(sortDesc);
        egrMovements.sort(sortDesc);

        // Agrupar movimientos diarios
        const dailyMap: { [key: string]: { ingreso: number; egreso: number; movements: TransactionMovement[] } } = {};

        ingMovements.forEach((item) => {
          if (!item.fecha) return;
          const dateStr = new Date(item.fecha).toISOString().split('T')[0];
          if (!dailyMap[dateStr]) dailyMap[dateStr] = { ingreso: 0, egreso: 0, movements: [] };
          dailyMap[dateStr].ingreso += item.cantidad;
          dailyMap[dateStr].movements.push(item);
        });

        egrMovements.forEach((item) => {
          if (!item.fecha) return;
          const dateStr = new Date(item.fecha).toISOString().split('T')[0];
          if (!dailyMap[dateStr]) dailyMap[dateStr] = { ingreso: 0, egreso: 0, movements: [] };
          dailyMap[dateStr].egreso += item.cantidad;
          dailyMap[dateStr].movements.push(item);
        });

        const activitiesList: DailyActivity[] = Object.keys(dailyMap).map((date) => {
          const ing = dailyMap[date].ingreso;
          const egr = dailyMap[date].egreso;
          const sorted = [...dailyMap[date].movements].sort(sortDesc);

          return {
            date,
            ingreso: ing,
            egreso: egr,
            diferencia: ing - egr,
            movements: sorted,
          };
        }).sort((a, b) => b.date.localeCompare(a.date));

        if (isMounted) {
          setIngresosPeriodo(ingMovements);
          setEgresosPeriodo(egrMovements);
          setDailyActivities(activitiesList);
        }
      } catch (err) {
        console.error('Error al cargar movimientos del período:', err);
      } finally {
        if (isMounted) {
          setLoadingData(false);
        }
      }
    };

    fetchPeriodTransactions();

    return () => {
      isMounted = false;
    };
  }, [selectedYear, selectedMonth, supabase]);

  const totalIngresosMes = useMemo(() => {
    return ingresosPeriodo.reduce((sum, item) => sum + item.cantidad, 0);
  }, [ingresosPeriodo]);

  const totalEgresosMes = useMemo(() => {
    return egresosPeriodo.reduce((sum, item) => sum + item.cantidad, 0);
  }, [egresosPeriodo]);

  // Agrupación de conceptos por similitud y acumulación de montos
  const conceptosIngresos = useMemo<ConceptSummary[]>(() => {
    const map = new Map<string, { concepto: string; totalMonto: number; count: number }>();
    for (const item of ingresosPeriodo) {
      const rawConcept = item.concepto?.trim() || 'Ingreso sin concepto';
      const key = rawConcept.toLowerCase().replace(/\s+/g, ' ');
      if (!map.has(key)) {
        map.set(key, { concepto: rawConcept, totalMonto: 0, count: 0 });
      }
      const entry = map.get(key)!;
      entry.totalMonto += Number(item.cantidad) || 0;
      entry.count += 1;
    }
    return Array.from(map.values()).sort((a, b) => b.totalMonto - a.totalMonto);
  }, [ingresosPeriodo]);

  const conceptosEgresos = useMemo<ConceptSummary[]>(() => {
    const map = new Map<string, { concepto: string; totalMonto: number; count: number }>();
    for (const item of egresosPeriodo) {
      const rawConcept = item.concepto?.trim() || 'Gasto sin concepto';
      const key = rawConcept.toLowerCase().replace(/\s+/g, ' ');
      if (!map.has(key)) {
        map.set(key, { concepto: rawConcept, totalMonto: 0, count: 0 });
      }
      const entry = map.get(key)!;
      entry.totalMonto += Number(item.cantidad) || 0;
      entry.count += 1;
    }
    return Array.from(map.values()).sort((a, b) => b.totalMonto - a.totalMonto);
  }, [egresosPeriodo]);

  const balanceMes = totalIngresosMes - totalEgresosMes;

  const copyHashToClipboard = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  return (
    <>
      <Navbar />

      <main style={{ minHeight: '80vh', padding: '3rem 1.25rem 5rem' }}>
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
                    {MONTH_NAMES.map((name, idx) => (
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

          {/* Gráfico Mensual Interactivo sincronizado con el período de la página */}
          <MonthlyFinanceChart year={selectedYear} month={selectedMonth} hideFilterControls={true} />

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
                            onClick={() => {
                              setExpandedDays((prev) => {
                                const next = new Set(prev);
                                if (next.has(row.date)) next.delete(row.date);
                                else next.add(row.date);
                                return next;
                              });
                            }}
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
                                  strokeWidth="2.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  style={{
                                    transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                                    transition: 'transform 0.2s ease',
                                    color: THEME_COLORS.ingreso,
                                  }}
                                >
                                  <polyline points="9 18 15 12 9 6"></polyline>
                                </svg>
                                <span>{formatDateString(row.date)}</span>
                                <span style={{
                                  fontSize: '0.75rem',
                                  padding: '0.15rem 0.5rem',
                                  borderRadius: '12px',
                                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                                  color: 'var(--foreground-muted)',
                                }}>
                                  {row.movements.length} {row.movements.length === 1 ? 'movimiento' : 'movimientos'}
                                </span>
                              </div>
                            </td>
                            <td style={{ padding: '0.85rem 1rem', textAlign: 'right', color: row.ingreso > 0 ? THEME_COLORS.ingreso : 'var(--foreground-muted)' }}>
                              {row.ingreso > 0 ? `+ ${formatCurrency(row.ingreso)}` : '$0.00'}
                            </td>
                            <td style={{ padding: '0.85rem 1rem', textAlign: 'right', color: row.egreso > 0 ? THEME_COLORS.egreso : 'var(--foreground-muted)' }}>
                              {row.egreso > 0 ? `- ${formatCurrency(row.egreso)}` : '$0.00'}
                            </td>
                            <td style={{
                              padding: '0.85rem 1rem',
                              textAlign: 'right',
                              fontWeight: 600,
                              color: row.diferencia > 0 ? THEME_COLORS.balancePositive : row.diferencia < 0 ? THEME_COLORS.balanceNegative : 'var(--foreground)',
                            }}>
                              {row.diferencia > 0 ? '+' : ''}{formatCurrency(row.diferencia)}
                            </td>
                          </tr>

                          {/* Acordeón de transacciones del día */}
                          {isExpanded && (
                            <tr style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
                              <td colSpan={4} style={{ padding: '0.75rem 1rem 1.25rem 2.25rem' }}>
                                <div style={{
                                  backgroundColor: 'rgba(0, 0, 0, 0.25)',
                                  border: '1px solid var(--border)',
                                  borderRadius: 'var(--radius-sm)',
                                  padding: '1rem',
                                }}>
                                  <h5 style={{ fontSize: '0.85rem', color: 'var(--foreground-muted)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Desglose de transacciones ({formatDateString(row.date)})
                                  </h5>
                                  <div className="tableResponsiveContainer">
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                      <thead>
                                        <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--foreground-muted)' }}>
                                          <th style={{ padding: '0.4rem 0.6rem', textAlign: 'left', fontWeight: 600 }}>Correlativo</th>
                                          <th style={{ padding: '0.4rem 0.6rem', textAlign: 'left', fontWeight: 600 }}>Concepto</th>
                                          <th style={{ padding: '0.4rem 0.6rem', textAlign: 'left', fontWeight: 600 }}>Tipo</th>
                                          <th style={{ padding: '0.4rem 0.6rem', textAlign: 'right', fontWeight: 600 }}>Monto</th>
                                          <th style={{ padding: '0.4rem 0.6rem', textAlign: 'left', fontWeight: 600 }}>Firma Hash (SHA-256)</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {row.movements.map((mov, idx) => (
                                          <tr key={mov.id || idx} style={{ borderBottom: idx < row.movements.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                                            <td style={{ padding: '0.5rem 0.6rem', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--foreground)' }}>
                                              {mov.correlativo ? (
                                                <span style={{
                                                  padding: '0.15rem 0.4rem',
                                                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                                                  borderRadius: '4px',
                                                  fontWeight: 600,
                                                }}>
                                                  #{mov.correlativo}
                                                </span>
                                              ) : (
                                                <span style={{ color: 'var(--foreground-muted)' }}>—</span>
                                              )}
                                            </td>
                                            <td style={{ padding: '0.5rem 0.6rem', color: 'var(--foreground)' }}>
                                              {mov.concepto}
                                            </td>
                                            <td style={{ padding: '0.5rem 0.6rem' }}>
                                              <span style={{
                                                fontSize: '0.75rem',
                                                padding: '0.2rem 0.5rem',
                                                borderRadius: '4px',
                                                fontWeight: 600,
                                                backgroundColor: mov.tipo === 'ingreso' ? THEME_COLORS.ingresoGlow : THEME_COLORS.egresoGlow,
                                                color: mov.tipo === 'ingreso' ? THEME_COLORS.ingreso : THEME_COLORS.egreso,
                                                border: `1px solid ${mov.tipo === 'ingreso' ? THEME_COLORS.ingreso : THEME_COLORS.egreso}`,
                                                textTransform: 'uppercase',
                                              }}>
                                                {mov.tipo}
                                              </span>
                                            </td>
                                            <td style={{
                                              padding: '0.5rem 0.6rem',
                                              textAlign: 'right',
                                              fontWeight: 600,
                                              color: mov.tipo === 'ingreso' ? THEME_COLORS.ingreso : THEME_COLORS.egreso,
                                            }}>
                                              {mov.tipo === 'ingreso' ? '+' : '-'}{formatCurrency(mov.cantidad)}
                                            </td>
                                            <td style={{ padding: '0.5rem 0.6rem' }}>
                                              {mov.hash ? (
                                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                                                  <code
                                                    title={`Hash Completo: ${mov.hash}\nPrev Hash: ${mov.prev_hash || '(Ninguno)'}`}
                                                    style={{
                                                      fontFamily: 'var(--font-mono)',
                                                      fontSize: '0.75rem',
                                                      backgroundColor: 'rgba(0,0,0,0.4)',
                                                      padding: '0.2rem 0.4rem',
                                                      borderRadius: '4px',
                                                      color: 'var(--foreground-muted)',
                                                      border: '1px solid var(--border)',
                                                      maxWidth: '140px',
                                                      overflow: 'hidden',
                                                      textOverflow: 'ellipsis',
                                                      whiteSpace: 'nowrap',
                                                      display: 'inline-block',
                                                    }}
                                                  >
                                                    {mov.hash.slice(0, 8)}...{mov.hash.slice(-6)}
                                                  </code>
                                                  <button
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      copyHashToClipboard(mov.hash);
                                                    }}
                                                    className="btnSecondary"
                                                    style={{ padding: '0.15rem 0.4rem', fontSize: '0.7rem' }}
                                                    title="Copiar Hash SHA-256"
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
      </main>

      <Footer />
    </>
  );
}
