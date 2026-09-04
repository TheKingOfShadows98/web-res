'use client';

/**
 * @file QuickStats.tsx
 * @description Componente para mostrar estadísticas e indicadores rápidos de transparencia financiera en el Home,
 * incluyendo el resumen del mes en curso y botón de acceso al portal completo de transparencia.
 * @module components
 */

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { THEME_COLORS } from '@/styles/colors';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export default function QuickStats(): React.ReactElement {
  const supabase = useMemo(() => createClient(), []);
  const [balanceGeneral, setBalanceGeneral] = useState<number | null>(null);
  const [ingresosMesActual, setIngresosMesActual] = useState<number>(0);
  const [gastosMesActual, setGastosMesActual] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  const now = useMemo(() => new Date(), []);
  const currentMonthName = useMemo(() => `${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`, [now]);

  useEffect(() => {
    const fetchFinancialSummary = async () => {
      try {
        // 1. Balance General Histórico
        const { data: ingresosHist, error: errIngHist } = await supabase.from('ingreso').select('cantidad');
        const { data: egresosHist, error: errEgrHist } = await supabase.from('egreso').select('cantidad');

        if (errIngHist) throw errIngHist;
        if (errEgrHist) throw errEgrHist;

        const totalHistIng = (ingresosHist || []).reduce((sum, item) => sum + (Number(item.cantidad) || 0), 0);
        const totalHistEgr = (egresosHist || []).reduce((sum, item) => sum + (Number(item.cantidad) || 0), 0);
        setBalanceGeneral(totalHistIng - totalHistEgr);

        // 2. Movimientos del Mes en Curso
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();
        const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const startIso = new Date(Date.UTC(currentYear, currentMonth, 1, 0, 0, 0, 0)).toISOString();
        const endIso = new Date(Date.UTC(currentYear, currentMonth, lastDayOfMonth, 23, 59, 59, 999)).toISOString();

        const { data: ingresosMes, error: errIngMes } = await supabase
          .from('ingreso')
          .select('cantidad, fecha')
          .gte('fecha', startIso)
          .lte('fecha', endIso);

        const { data: egresosMes, error: errEgrMes } = await supabase
          .from('egreso')
          .select('cantidad, fecha')
          .gte('fecha', startIso)
          .lte('fecha', endIso);

        if (errIngMes) throw errIngMes;
        if (errEgrMes) throw errEgrMes;

        const totalMesIng = (ingresosMes || []).reduce((sum, item) => sum + (Number(item.cantidad) || 0), 0);
        const totalMesEgr = (egresosMes || []).reduce((sum, item) => sum + (Number(item.cantidad) || 0), 0);

        setIngresosMesActual(totalMesIng);
        setGastosMesActual(totalMesEgr);
      } catch (err) {
        console.error('Error al cargar datos de transparencia financiera:', err);
        setBalanceGeneral(0);
      } finally {
        setLoading(false);
      }
    };

    fetchFinancialSummary();
  }, [supabase, now]);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('es-SV', { style: 'currency', currency: 'USD' }).format(val);

  const balanceMesActual = ingresosMesActual - gastosMesActual;

  return (
    <section id="finanzas" className="stats" style={{ padding: '5rem 1.5rem' }}>
      <div className="statsContainer" style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <div className="sectionHeader" style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <span className="sectionLabel" style={{ color: THEME_COLORS.ingreso }}>Rendición de Cuentas</span>
          <h2 className="sectionTitle" style={{ fontSize: '2.25rem', marginTop: '0.25rem' }}>Transparencia Financiera</h2>
          <p style={{ color: 'var(--foreground-muted)', fontSize: '1rem', maxWidth: '600px', margin: '0.5rem auto 0' }}>
            Acceso público e inmutable a los fondos comunitarios y estado financiero de la Residencial México.
          </p>
        </div>

        {/* Tarjeta Principal: Fondo General */}
        <div style={{ maxWidth: '700px', margin: '0 auto 2.5rem' }}>
          <div className="statItem" style={{ padding: '2.5rem 2rem', textAlign: 'center' }}>
            <div className="statValue" style={{ 
              fontSize: '3rem', 
              color: (balanceGeneral ?? 0) >= 0 ? THEME_COLORS.balancePositive : THEME_COLORS.balanceNegative, 
              marginBottom: '0.5rem' 
            }}>
              {loading ? 'Calculando...' : formatCurrency(balanceGeneral ?? 0)}
            </div>
            <div className="statLabel" style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              Fondo Comunitario y Balance Total
            </div>
            <div className="statDesc" style={{ fontSize: '0.9rem', color: 'var(--foreground-muted)' }}>
              Fondos disponibles registrados y conciliados en tiempo real con firma criptográfica.
            </div>
          </div>
        </div>

        {/* Resumen (Summary) del Mes en Curso */}
        <div style={{
          background: 'var(--background-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: '1.75rem 2rem',
          marginBottom: '2.5rem',
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--foreground-muted)', letterSpacing: '0.05em' }}>
              Resumen del Mes en Curso ({currentMonthName})
            </span>
            <span style={{ fontSize: '0.75rem', color: THEME_COLORS.ingreso, fontWeight: 600 }}>
              Actualizado al día de hoy
            </span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1.5rem',
            textAlign: 'center'
          }}>
            {/* Ingresos Mes */}
            <div style={{ padding: '1rem', backgroundColor: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
              <span style={{ fontSize: '0.8rem', color: THEME_COLORS.ingreso, fontWeight: 600, textTransform: 'uppercase' }}>
                Ingresos del Mes
              </span>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: THEME_COLORS.ingreso, marginTop: '0.25rem' }}>
                {loading ? '...' : `+${formatCurrency(ingresosMesActual)}`}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--foreground-muted)' }}>Aportaciones y cuotas</span>
            </div>

            {/* Gastos Mes */}
            <div style={{ padding: '1rem', backgroundColor: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
              <span style={{ fontSize: '0.8rem', color: THEME_COLORS.egreso, fontWeight: 600, textTransform: 'uppercase' }}>
                Gastos del Mes
              </span>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: THEME_COLORS.egreso, marginTop: '0.25rem' }}>
                {loading ? '...' : `-${formatCurrency(gastosMesActual)}`}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--foreground-muted)' }}>Mantenimiento y servicios</span>
            </div>

            {/* Balance Mes */}
            <div style={{ padding: '1rem', backgroundColor: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--foreground-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                Balance del Mes
              </span>
              <div style={{ 
                fontSize: '1.6rem', 
                fontWeight: 800, 
                color: balanceMesActual >= 0 ? THEME_COLORS.balancePositive : THEME_COLORS.balanceNegative, 
                marginTop: '0.25rem' 
              }}>
                {loading ? '...' : `${balanceMesActual >= 0 ? '+' : ''}${formatCurrency(balanceMesActual)}`}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--foreground-muted)' }}>Flujo neto del período</span>
            </div>
          </div>
        </div>

        {/* Botón hacia /finanzas */}
        <div style={{ textAlign: 'center' }}>
          <Link 
            href="/finanzas" 
            className="btnPrimary" 
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '0.6rem', 
              padding: '0.85rem 1.75rem', 
              fontSize: '1rem',
              fontWeight: 700,
              boxShadow: '0 4px 20px rgba(16, 185, 129, 0.3)'
            }}
          >
            <span>Ver Portal Completo de Finanzas</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
