'use client';

/**
 * @file QuickStats.tsx
 * @description Componente para mostrar estadísticas e indicadores rápidos del estado comunal de Residencial México.
 * @module components
 */

import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';

/**
 * Panel de estado rápido y estadísticas de transparencia del vecindario con balance real.
 * 
 * @returns {React.ReactElement} El panel de estadísticas renderizado.
 */
export default function QuickStats(): React.ReactElement {
  const supabase = useMemo(() => createClient(), []);
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const { data: ingresos, error: errIngresos } = await supabase.from('ingreso').select('cantidad');
        const { data: egresos, error: errEgresos } = await supabase.from('egreso').select('cantidad');

        if (errIngresos) throw errIngresos;
        if (errEgresos) throw errEgresos;

        const totalIng = (ingresos || []).reduce((sum, item) => sum + (Number(item.cantidad) || 0), 0);
        const totalEgr = (egresos || []).reduce((sum, item) => sum + (Number(item.cantidad) || 0), 0);

        setBalance(totalIng - totalEgr);
      } catch (err) {
        console.error('Error al cargar balance para Transparencia:', err);
        setBalance(0);
      } finally {
        setLoading(false);
      }
    };

    fetchBalance();
  }, [supabase]);

  const formattedBalance = useMemo(() => {
    if (balance === null) return '$0.00';
    return new Intl.NumberFormat('es-SV', { style: 'currency', currency: 'USD' }).format(balance);
  }, [balance]);

  return (
    <section id="estadisticas" className="stats">
      <div className="statsContainer">
        <div className="sectionHeader">
          <span className="sectionLabel">Estado de la Residencial</span>
          <h2 className="sectionTitle">Transparencia Financiera</h2>
        </div>

        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div className="statItem" style={{ padding: '2.5rem 2rem', textAlign: 'center' }}>
            <div className="statValue" style={{ fontSize: '2.75rem', color: (balance ?? 0) >= 0 ? 'var(--primary)' : 'var(--danger)', marginBottom: '0.5rem' }}>
              {loading ? 'Calculando...' : formattedBalance}
            </div>
            <div className="statLabel" style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>
              Fondo Comunitario y Balance Actual
            </div>
            <div className="statDesc" style={{ fontSize: '0.9rem' }}>
              Fondos disponibles registrados y conciliados en tiempo real por la administración de la ADESCO.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
