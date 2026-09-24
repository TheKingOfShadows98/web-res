'use client';

/**
 * @file page.tsx
 * @description Dashboard principal de administración de finanzas con balance general y desglose diario de 30 días.
 * @module app/admin/finanzas
 */

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/client';
import MonthlyFinanceChart from '@/components/finance/MonthlyFinanceChart';
import { THEME_COLORS } from '@/styles/colors';

export interface TransactionMovement {
  id: number | string;
  tipo: 'ingreso' | 'egreso';
  correlativo: string;
  concepto: string;
  cantidad: number;
  comprobante?: string | null;
  hash: string;
  prev_hash?: string;
  fecha: string;
}

export interface DailyActivity {
  date: string;
  ingreso: number;
  egreso: number;
  diferencia: number;
  movements: TransactionMovement[];
}

export default function FinanzasDashboard(): React.ReactElement {
  const supabase = useMemo(() => createClient(), []);

  // Estados de autenticación
  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState<boolean>(true);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [authForm, setAuthForm] = useState({
    email: '',
    password: '',
    nombre: '',
    telefono: '',
  });

  // Estados de datos financieros
  const [loadingData, setLoadingData] = useState<boolean>(true);
  const [balanceGeneral, setBalanceGeneral] = useState<number>(0);
  const [ingresosMes, setIngresosMes] = useState<number>(0);
  const [egresosMes, setEgresosMes] = useState<number>(0);
  const [dailyActivities, setDailyActivities] = useState<DailyActivity[]>([]);
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  // Estados de UI
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 1. Monitorear estado de autenticación de Supabase
  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
      } catch (err) {
        console.error('Error al verificar sesión:', err);
      } finally {
        setCheckingAuth(false);
      }
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  // 2. Cargar y calcular datos financieros si el usuario está autenticado
  useEffect(() => {
    if (!user) return;

    const fetchFinancialData = async () => {
      setLoadingData(true);
      try {
        // A. Cargar datos históricos para Balance General
        const { data: allIngresos, error: errAllIng } = await supabase.from('ingresos').select('cantidad');
        const { data: allEgresos, error: errAllEgr } = await supabase.from('egresos').select('cantidad');

        if (errAllIng) throw errAllIng;
        if (errAllEgr) throw errAllEgr;

        const totalHistIngresos = (allIngresos || []).reduce((sum, item) => sum + (item.cantidad || 0), 0);
        const totalHistEgresos = (allEgresos || []).reduce((sum, item) => sum + (item.cantidad || 0), 0);
        setBalanceGeneral(totalHistIngresos - totalHistEgresos);

        // B. Cargar datos de la ventana de últimos 30 días con correlativo y hash
        const limitDate = new Date();
        limitDate.setDate(limitDate.getDate() - 30);
        const limitStr = limitDate.toISOString();

        const { data: monthlyIngresos, error: errMonIng } = await supabase
          .from('ingresos')
          .select('id, correlativo, concepto, cantidad, comprobante, fecha, hash, prev_hash')
          .gte('fecha', limitStr);

        const { data: monthlyEgresos, error: errMonEgr } = await supabase
          .from('egresos')
          .select('id, correlativo, concepto, cantidad, comprobante, fecha, hash, prev_hash')
          .gte('fecha', limitStr);

        if (errMonIng) throw errMonIng;
        if (errMonEgr) throw errMonEgr;

        const totalMonIngresos = (monthlyIngresos || []).reduce((sum, item) => sum + (item.cantidad || 0), 0);
        const totalMonEgresos = (monthlyEgresos || []).reduce((sum, item) => sum + (item.cantidad || 0), 0);
        setIngresosMes(totalMonIngresos);
        setEgresosMes(totalMonEgresos);

        // C. Agrupar movimientos diarios del último mes
        const dailyMap: { [key: string]: { ingreso: number; egreso: number; movements: TransactionMovement[] } } = {};

        (monthlyIngresos || []).forEach((item) => {
          if (!item.fecha) return;
          const dateStr = new Date(item.fecha).toISOString().split('T')[0];
          if (!dailyMap[dateStr]) dailyMap[dateStr] = { ingreso: 0, egreso: 0, movements: [] };
          dailyMap[dateStr].ingreso += item.cantidad || 0;
          dailyMap[dateStr].movements.push({
            id: item.id,
            tipo: 'ingreso',
            correlativo: item.correlativo || '',
            concepto: item.concepto || 'Ingreso sin concepto',
            cantidad: item.cantidad || 0,
            comprobante: item.comprobante || null,
            hash: item.hash || '',
            prev_hash: item.prev_hash || '',
            fecha: item.fecha,
          });
        });

        (monthlyEgresos || []).forEach((item) => {
          if (!item.fecha) return;
          const dateStr = new Date(item.fecha).toISOString().split('T')[0];
          if (!dailyMap[dateStr]) dailyMap[dateStr] = { ingreso: 0, egreso: 0, movements: [] };
          dailyMap[dateStr].egreso += item.cantidad || 0;
          dailyMap[dateStr].movements.push({
            id: item.id,
            tipo: 'egreso',
            correlativo: item.correlativo || '',
            concepto: item.concepto || 'Egreso sin concepto',
            cantidad: item.cantidad || 0,
            comprobante: item.comprobante || null,
            hash: item.hash || '',
            prev_hash: item.prev_hash || '',
            fecha: item.fecha,
          });
        });

        // Convertir mapa a lista y ordenar descendente por fecha
        const activitiesList: DailyActivity[] = Object.keys(dailyMap).map((date) => {
          const ing = dailyMap[date].ingreso;
          const egr = dailyMap[date].egreso;

          // Ordenar movimientos por fecha e inserción más reciente a más antiguo
          const sortedMovements = [...dailyMap[date].movements].sort((a, b) => {
            const timeA = new Date(a.fecha).getTime();
            const timeB = new Date(b.fecha).getTime();
            if (timeB !== timeA) return timeB - timeA;
            return Number(b.id || 0) - Number(a.id || 0);
          });

          return {
            date,
            ingreso: ing,
            egreso: egr,
            diferencia: ing - egr,
            movements: sortedMovements,
          };
        }).sort((a, b) => b.date.localeCompare(a.date));

        setDailyActivities(activitiesList);

      } catch (err) {
        console.error('Error al obtener datos financieros:', err);
        const errorMsg = err instanceof Error ? err.message : String(err);
        setMessage({ type: 'error', text: `Error al cargar datos del servidor: ${errorMsg}` });
      } finally {
        setLoadingData(false);
      }
    };

    fetchFinancialData();
  }, [user, supabase]);

  // Manejar inputs del login
  const handleAuthInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAuthForm((prev) => ({ ...prev, [name]: value }));
  };

  // Autenticación: Login o Registro
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setMessage(null);

    try {
      if (authMode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email: authForm.email,
          password: authForm.password,
        });
        if (error) throw error;
        setMessage({ type: 'success', text: 'Sesión iniciada.' });
      } else {
        const { error } = await supabase.auth.signUp({
          email: authForm.email,
          password: authForm.password,
          options: {
            data: {
              nombre: authForm.nombre,
              telefono: authForm.telefono,
            },
          },
        });
        if (error) throw error;
        setMessage({ type: 'success', text: 'Registro completado.' });
      }
    } catch (err) {
      console.error(err);
      const errorMsg = err instanceof Error ? err.message : 'Error de autenticación';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setMessage({ type: 'success', text: 'Sesión cerrada.' });
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
    }
  };

  // Formateador de moneda
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'USD' }).format(val);
  };

  // Formateador de fecha
  const formatDateString = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  if (checkingAuth) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid var(--border)', borderTop: '3px solid var(--primary)', borderRadius: '50%', animation: 'pulseGlow 1.5s infinite' }} />
        <p style={{ color: 'var(--foreground-muted)', fontSize: '0.9rem' }}>Verificando credenciales de administrador...</p>
      </div>
    );
  }

  // --- Vista 1: Login de Administrador ---
  if (!user) {
    return (
      <div className="adminContainer" style={{ maxWidth: '480px', margin: '5rem auto', padding: '2rem' }}>
        <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <Link href="/" className="btnSecondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            Volver al Inicio
          </Link>
          <h2 className="heroTitle" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
            Dashboard Administrativo
          </h2>
          <p className="heroSubtitle" style={{ fontSize: '0.95rem', margin: 0 }}>
            Debes iniciar sesión con tu cuenta de administrador para acceder a las finanzas.
          </p>
        </div>

        {message && (
          <div
            style={{
              padding: '1rem',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '1.5rem',
              backgroundColor: message.type === 'success' ? 'var(--success-glow)' : 'rgba(239, 68, 68, 0.15)',
              border: `1px solid ${message.type === 'success' ? 'var(--success)' : 'var(--danger)'}`,
              color: message.type === 'success' ? 'var(--success)' : 'var(--danger)',
              fontSize: '0.9rem',
            }}
          >
            {message.text}
          </div>
        )}

        <div className="card" style={{ cursor: 'default' }}>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
            <button
              className={authMode === 'login' ? 'btnPrimary' : 'btnSecondary'}
              style={{ flex: 1, justifyContent: 'center' }}
              onClick={() => { setAuthMode('login'); setMessage(null); }}
            >
              Iniciar Sesión
            </button>
            <button
              className={authMode === 'register' ? 'btnPrimary' : 'btnSecondary'}
              style={{ flex: 1, justifyContent: 'center' }}
              onClick={() => { setAuthMode('register'); setMessage(null); }}
            >
              Registrarse
            </button>
          </div>

          <form onSubmit={handleAuthSubmit}>
            {authMode === 'register' && (
              <>
                <div className="formGroup">
                  <label className="formLabel" htmlFor="nombre">Nombre Completo</label>
                  <input
                    id="nombre"
                    name="nombre"
                    type="text"
                    className="formInput"
                    placeholder="Ej. Juan Pérez"
                    value={authForm.nombre}
                    onChange={handleAuthInputChange}
                    required
                  />
                </div>
                <div className="formGroup">
                  <label className="formLabel" htmlFor="telefono">Teléfono</label>
                  <input
                    id="telefono"
                    name="telefono"
                    type="tel"
                    className="formInput"
                    placeholder="Ej. 7777-7777"
                    value={authForm.telefono}
                    onChange={handleAuthInputChange}
                  />
                </div>
              </>
            )}

            <div className="formGroup">
              <label className="formLabel" htmlFor="email">Correo Electrónico</label>
              <input
                id="email"
                name="email"
                type="email"
                className="formInput"
                placeholder="ejemplo@correo.com"
                value={authForm.email}
                onChange={handleAuthInputChange}
                required
              />
            </div>

            <div className="formGroup">
              <label className="formLabel" htmlFor="password">Contraseña</label>
              <input
                id="password"
                name="password"
                type="password"
                className="formInput"
                placeholder="••••••••"
                value={authForm.password}
                onChange={handleAuthInputChange}
                required
              />
            </div>

            <button
              type="submit"
              className="btnPrimary"
              disabled={authLoading}
              style={{ width: '100%', justifyContent: 'center', marginTop: '1.5rem' }}
            >
              {authLoading ? 'Procesando...' : authMode === 'login' ? 'Iniciar Sesión' : 'Registrarse'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- Vista 2: Dashboard Financiero (Autenticado) ---
  return (
    <div className="adminContainer" style={{ maxWidth: '1000px', margin: '3rem auto', padding: '0 2rem' }}>
      
      {/* Barra de control superior */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        backgroundColor: 'var(--background-card)', 
        border: '1px solid var(--border)', 
        padding: '0.75rem 1.25rem', 
        borderRadius: 'var(--radius-sm)', 
        marginBottom: '2rem' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--success)' }} />
          <span style={{ fontSize: '0.85rem', color: 'var(--foreground-muted)' }}>
            Sesión activa: <strong>{user.email}</strong>
          </span>
        </div>
        <button 
          onClick={handleLogout} 
          className="btnSecondary" 
          style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
        >
          Cerrar Sesión
        </button>
      </div>

      {/* Título de la Página y Navegación */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div>
          <Link href="/" className="btnSecondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            Volver al Inicio
          </Link>
          <h2 className="heroTitle" style={{ fontSize: '2.25rem', marginBottom: '0.5rem', textCombineUpright: 'none' }}>
            Panel de Finanzas
          </h2>
          <p className="heroSubtitle" style={{ fontSize: '1rem', margin: 0 }}>
            Visualiza el estado de las cuentas de la ADESCO y el desglose de transacciones diarias.
          </p>
        </div>
        <div style={{ alignSelf: 'flex-end' }}>
          <Link href="/admin/finanzas/recivos" className="btnPrimary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Registrar Movimiento
          </Link>
        </div>
      </div>

      {message && (
        <div
          style={{
            padding: '1rem',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '1.5rem',
            backgroundColor: message.type === 'success' ? 'var(--success-glow)' : 'rgba(239, 68, 68, 0.15)',
            border: `1px solid ${message.type === 'success' ? 'var(--success)' : 'var(--danger)'}`,
            color: message.type === 'success' ? 'var(--success)' : 'var(--danger)',
            fontSize: '0.9rem',
          }}
        >
          {message.text}
        </div>
      )}

      {loadingData ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ width: '30px', height: '30px', border: '3px solid var(--border)', borderTop: '3px solid var(--primary)', borderRadius: '50%', animation: 'pulseGlow 1s infinite' }} />
          <p style={{ color: 'var(--foreground-muted)', fontSize: '0.875rem' }}>Cargando métricas de Supabase...</p>
        </div>
      ) : (
        <>
          {/* Módulo de Gráficas Mensuales con Selector de Mes y Año (>= 2025) */}
          <MonthlyFinanceChart />

          {/* Tarjetas de Métricas principales */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', 
            gap: '1.5rem', 
            marginBottom: '3rem' 
          }}>
            {/* Card: Balance General */}
            <div className="card" style={{ cursor: 'default', borderLeft: `4px solid ${balanceGeneral >= 0 ? THEME_COLORS.balancePositive : THEME_COLORS.balanceNegative}` }}>
              <span className="sectionLabel" style={{ fontSize: '0.75rem', marginBottom: '0.5rem' }}>Balance General Histórico</span>
              <h3 className="statValue" style={{ 
                fontSize: '2.25rem', 
                color: balanceGeneral >= 0 ? THEME_COLORS.balancePositive : THEME_COLORS.balanceNegative 
              }}>
                {formatCurrency(balanceGeneral)}
              </h3>
              <p className="statDesc" style={{ marginTop: '0.5rem' }}>Fondos acumulados disponibles</p>
            </div>

            {/* Card: Ingresos del Mes */}
            <div className="card" style={{ cursor: 'default', borderLeft: `4px solid ${THEME_COLORS.ingreso}` }}>
              <span className="sectionLabel" style={{ fontSize: '0.75rem', color: THEME_COLORS.ingreso, marginBottom: '0.5rem' }}>Ingresos (Últimos 30 días)</span>
              <h3 className="statValue" style={{ fontSize: '2.25rem', color: THEME_COLORS.ingreso }}>
                {formatCurrency(ingresosMes)}
              </h3>
              <p className="statDesc" style={{ marginTop: '0.5rem' }}>Entradas de cuotas y aportaciones</p>
            </div>

            {/* Card: Egresos del Mes */}
            <div className="card" style={{ cursor: 'default', borderLeft: `4px solid ${THEME_COLORS.egreso}` }}>
              <span className="sectionLabel" style={{ fontSize: '0.75rem', color: THEME_COLORS.egreso, marginBottom: '0.5rem' }}>Egresos (Últimos 30 días)</span>
              <h3 className="statValue" style={{ fontSize: '2.25rem', color: THEME_COLORS.egreso }}>
                {formatCurrency(egresosMes)}
              </h3>
              <p className="statDesc" style={{ marginTop: '0.5rem' }}>Salidas para servicios e insumos</p>
            </div>
          </div>

          {/* Tabla de Registros Diarios */}
          <div className="card" style={{ cursor: 'default', padding: '2rem 2.5rem' }}>
            <h3 className="cardTitle" style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Flujo de Caja por Día (Últimos 30 días)</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--foreground-muted)', fontWeight: 'normal' }}>
                Mostrando solo días con actividad
              </span>
            </h3>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ 
                width: '100%', 
                borderCollapse: 'collapse', 
                textAlign: 'left', 
                fontSize: '0.9rem' 
              }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--foreground-muted)' }}>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Fecha / Movimientos</th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 600, textAlign: 'right' }}>Ingresos ($)</th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 600, textAlign: 'right' }}>Egresos ($)</th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 600, textAlign: 'right' }}>Diferencia ($)</th>
                  </tr>
                </thead>
                <tbody>
                  {dailyActivities.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: 'var(--foreground-muted)' }}>
                        No se registraron movimientos en los últimos 30 días.
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
                                if (next.has(row.date)) {
                                  next.delete(row.date);
                                } else {
                                  next.add(row.date);
                                }
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
                                    color: 'var(--primary)'
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
                                  color: 'var(--foreground-muted)' 
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
                              color: row.diferencia > 0 ? THEME_COLORS.balancePositive : row.diferencia < 0 ? THEME_COLORS.balanceNegative : 'var(--foreground)'
                            }}>
                              {row.diferencia > 0 ? '+' : ''}{formatCurrency(row.diferencia)}
                            </td>
                          </tr>

                          {/* Sub-tabla desplegable de transacciones */}
                          {isExpanded && (
                            <tr style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
                              <td colSpan={4} style={{ padding: '0.75rem 1rem 1.25rem 2.25rem' }}>
                                <div style={{
                                  backgroundColor: 'rgba(0, 0, 0, 0.25)',
                                  border: '1px solid var(--border)',
                                  borderRadius: 'var(--radius-sm)',
                                  padding: '1rem',
                                  overflowX: 'auto'
                                }}>
                                  <h4 style={{ fontSize: '0.85rem', color: 'var(--foreground-muted)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Desglose de transacciones ({formatDateString(row.date)})
                                  </h4>
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
                                                fontWeight: 600
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
                                              textTransform: 'uppercase'
                                            }}>
                                              {mov.tipo}
                                            </span>
                                          </td>
                                          <td style={{ 
                                            padding: '0.5rem 0.6rem', 
                                            textAlign: 'right', 
                                            fontWeight: 600,
                                            color: mov.tipo === 'ingreso' ? THEME_COLORS.ingreso : THEME_COLORS.egreso 
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
                                                    maxWidth: '160px',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                    display: 'inline-block'
                                                  }}
                                                >
                                                  {mov.hash.slice(0, 8)}...{mov.hash.slice(-6)}
                                                </code>
                                                <button
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigator.clipboard.writeText(mov.hash);
                                                    setCopiedHash(mov.hash);
                                                    setTimeout(() => setCopiedHash(null), 2000);
                                                  }}
                                                  className="btnSecondary"
                                                  style={{ padding: '0.15rem 0.4rem', fontSize: '0.7rem' }}
                                                  title="Copiar Hash SHA-256 completo"
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
        </>
      )}
    </div>
  );
}
