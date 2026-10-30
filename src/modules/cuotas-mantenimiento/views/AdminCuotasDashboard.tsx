'use client';

/**
 * @file AdminCuotasDashboard.tsx
 * @description Vista principal del módulo para el panel de administración de cuotas y recolección.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { IZona, ISubdivision, ICasaCuotaView } from '../domain/entities';
import { QuincenaEnum } from '../domain/enums';
import { getActiveQuincena } from '../domain/rules';
import { cuotasQueryService } from '../services/cuotas-query.service';
import { cuotasCollectorService } from '../services/cuotas-collector.service';
import { authGateway } from '../infrastructure/adapters/auth-context.adapter';
import { CuotasLegend } from '../components/CuotasLegend';
import { CuotasFilterBar } from '../components/CuotasFilterBar';
import { CuotaCasaCard } from '../components/CuotaCasaCard';
import { ModalRegistrarPago } from '../components/ModalRegistrarPago';
import { GestionEstructuraPanel } from '../components/GestionEstructuraPanel';

export function AdminCuotasDashboard(): React.ReactElement {
  const currentDate = useMemo(() => new Date(), []);
  const year = currentDate.getFullYear();
  const mes = currentDate.getMonth() + 1;
  const monthName = currentDate.toLocaleString('es-ES', { month: 'long' });

  // Estados de datos
  const [zonas, setZonas] = useState<IZona[]>([]);
  const [subdivisiones, setSubdivisiones] = useState<ISubdivision[]>([]);
  const [selectedZonaId, setSelectedZonaId] = useState<string>('');
  const [selectedSubdivisionId, setSelectedSubdivisionId] = useState<string>('');
  const [selectedQuincena, setSelectedQuincena] = useState<QuincenaEnum>(() =>
    getActiveQuincena(currentDate)
  );
  const [searchCasa, setSearchCasa] = useState<string>('');

  // Pestañas (Recolección vs Estructura)
  const [currentTab, setCurrentTab] = useState<'cobranza' | 'estructura'>('cobranza');
  const [canManageStructure, setCanManageStructure] = useState<boolean>(false);

  // Estados del listado de casas
  const [casas, setCasas] = useState<ICasaCuotaView[]>([]);
  const [resumen, setResumen] = useState({
    total: 0,
    alDia: 0,
    otraQuincena: 0,
    pendientes: 0,
    totalRecaudado: 0,
  });

  // Estados de permisos y usuario
  const [canCollect, setCanCollect] = useState<boolean>(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Estado del modal de cobro
  const [selectedCasaToPay, setSelectedCasaToPay] = useState<ICasaCuotaView | null>(null);

  // 1. Cargar usuario y permisos
  useEffect(() => {
    async function initAuth() {
      try {
        const user = await authGateway.getCurrentUser();
        if (user) {
          setUserId(user.id);
          const allowedCollect = await authGateway.canCollectFees(user.id);
          const allowedStructure = await authGateway.canManageStructure(user.id);
          setCanCollect(allowedCollect);
          setCanManageStructure(allowedStructure);
        }
      } catch (err) {
        console.error('Error al inicializar sesión:', err);
      }
    }
    initAuth();
  }, []);

  // 2. Cargar Zonas al inicio
  const loadZonas = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const zList = await cuotasQueryService.getZonas();
      setZonas(zList);
      if (zList.length > 0) {
        setSelectedZonaId(zList[0].id);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al consultar las zonas en la base de datos.';
      console.error('Error al cargar zonas:', err);
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadZonas();
  }, [loadZonas]);

  // 3. Cargar Subdivisiones cuando cambia la Zona
  useEffect(() => {
    async function loadSubdivisions() {
      if (!selectedZonaId) {
        setSubdivisiones([]);
        setSelectedSubdivisionId('');
        return;
      }
      try {
        const sList = await cuotasQueryService.getSubdivisiones(selectedZonaId);
        setSubdivisiones(sList);
        if (sList.length > 0) {
          setSelectedSubdivisionId(sList[0].id);
        } else {
          setSelectedSubdivisionId('');
          setCasas([]);
        }
      } catch (err) {
        console.error('Error al cargar subdivisiones:', err);
      }
    }
    loadSubdivisions();
  }, [selectedZonaId]);

  // 4. Cargar Casas y Estado del Tablero
  const reloadBoard = useCallback(async () => {
    if (!selectedSubdivisionId) {
      setCasas([]);
      setResumen({ total: 0, alDia: 0, otraQuincena: 0, pendientes: 0, totalRecaudado: 0 });
      return;
    }
    try {
      setLoading(true);
      const data = await cuotasQueryService.getCasasTablero({
        year,
        mes,
        subdivisionId: selectedSubdivisionId,
        targetQuincena: selectedQuincena,
        zonaId: selectedZonaId,
      });
      setCasas(data.casas);
      setResumen(data.resumen);
    } catch (err) {
      console.error('Error al cargar casas del tablero:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedSubdivisionId, selectedZonaId, selectedQuincena, year, mes]);

  useEffect(() => {
    reloadBoard();
  }, [reloadBoard]);

  // Manejo de pago
  const handlePaymentSubmit = async (params: {
    casaId: string;
    casaNumero: string;
    subdivisionNombre: string;
    correlativoRecibo: string;
    monto: number;
    metodoPago: string;
    observaciones: string;
  }) => {
    if (!userId) {
      throw new Error('No se detectó un usuario autenticado para registrar el cobro.');
    }

    await cuotasCollectorService.recordFeePayment({
      casaId: params.casaId,
      casaNumero: params.casaNumero,
      subdivisionNombre: params.subdivisionNombre,
      year,
      mes,
      quincena: selectedQuincena,
      monto: params.monto,
      correlativoRecibo: params.correlativoRecibo,
      metodoPago: params.metodoPago,
      observaciones: params.observaciones,
      recolectorUserId: userId,
    });

    setActionSuccessMessage(
      `¡Cuota de ${params.casaNumero} registrada con éxito con el recibo ${params.correlativoRecibo}! Ingreso insertado en el balance general.`
    );

    // Ocultar mensaje tras 5 segundos y recargar tablero
    setTimeout(() => setActionSuccessMessage(null), 5000);
    await reloadBoard();
  };

  // Filtrado en vivo de casas por texto
  const filteredCasas = useMemo(() => {
    if (!searchCasa.trim()) return casas;
    const term = searchCasa.toLowerCase().trim();
    return casas.filter((c) => c.casaNumero.toLowerCase().includes(term));
  }, [casas, searchCasa]);

  return (
    <div className="adminContainer" style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      {/* Encabezado y Navegación */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <Link
            href="/admin"
            className="btnSecondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}
          >
            ← Volver al Panel Admin
          </Link>
          <Link
            href="/admin/finanzas"
            className="btnSecondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}
          >
            Módulo Financiero Central
          </Link>
        </div>

        <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: 'var(--foreground)' }}>
          Recolección de Cuotas de Mantenimiento y Seguridad
        </h1>
        <p style={{ color: 'var(--foreground-muted)', margin: 0, fontSize: '0.95rem' }}>
          Control quincenal y voluntario de aportaciones vecinales por Edificio, Pasaje y Calle.
        </p>
      </div>

      {/* Banner de Notificación de Éxito */}
      {actionSuccessMessage && (
        <div
          style={{
            padding: '1rem 1.25rem',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--success-glow)',
            border: '1px solid var(--success)',
            color: 'var(--success)',
            fontSize: '0.9rem',
            marginBottom: '1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>✓ {actionSuccessMessage}</span>
          <button
            type="button"
            onClick={() => setActionSuccessMessage(null)}
            style={{ background: 'none', border: 'none', color: 'var(--success)', cursor: 'pointer', fontSize: '1.2rem' }}
          >
            &times;
          </button>
        </div>
      )}

      {/* Banner de Error */}
      {errorMessage && (
        <div
          style={{
            padding: '1rem 1.25rem',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid var(--danger)',
            color: 'var(--danger)',
            fontSize: '0.9rem',
            marginBottom: '1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>⚠️ {errorMessage}</span>
          <button
            type="button"
            onClick={() => loadZonas()}
            className="btnSecondary"
            style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Navegación por pestañas (Solo visible si tiene permisos de Owner para estructurar) */}
      {canManageStructure && (
        <div style={{ display: 'flex', gap: '0.75rem', borderBottom: '1px solid var(--border)', marginBottom: '1.75rem', paddingBottom: '0.75rem' }}>
          <button
            type="button"
            onClick={() => setCurrentTab('cobranza')}
            className={currentTab === 'cobranza' ? 'btnPrimary' : 'btnSecondary'}
            style={{ fontSize: '0.9rem', padding: '0.5rem 1.25rem' }}
          >
            Cobro de Cuotas (Casas)
          </button>
          <button
            type="button"
            onClick={() => setCurrentTab('estructura')}
            className={currentTab === 'estructura' ? 'btnPrimary' : 'btnSecondary'}
            style={{ fontSize: '0.9rem', padding: '0.5rem 1.25rem' }}
          >
            Gestión Territorial (Zonas y Casas) 👑
          </button>
        </div>
      )}

      {/* PESTAÑA 1: GESTIÓN TERRITORIAL (OWNER) */}
      {currentTab === 'estructura' && canManageStructure && userId && (
        <GestionEstructuraPanel
          userId={userId}
          onStructureUpdated={() => {
            loadZonas();
            reloadBoard();
          }}
        />
      )}

      {/* PESTAÑA 2: COBRANZA Y RECOLECCIÓN */}
      {currentTab === 'cobranza' && (
        <>
          {/* Tarjetas de Métricas Rápidas del Sector */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              marginBottom: '1.5rem',
            }}
          >
            <div className="card" style={{ padding: '1.25rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--foreground-muted)' }}>Total en Sector</span>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--foreground)' }}>{resumen.total}</div>
            </div>

            <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--success)' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--success)' }}>Al Día (Pagadas)</span>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--success)' }}>{resumen.alDia}</div>
            </div>

            <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #3b82f6' }}>
              <span style={{ fontSize: '0.8rem', color: '#60a5fa' }}>Otra Quincena</span>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#60a5fa' }}>{resumen.otraQuincena}</div>
            </div>

            <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--warning)' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--warning)' }}>Pendientes de Cobro</span>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--warning)' }}>{resumen.pendientes}</div>
            </div>

            <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--primary)' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>Recaudado en Corte</span>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--primary)' }}>
                ${resumen.totalRecaudado.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Leyenda y Filtros */}
          <CuotasLegend activeQuincena={selectedQuincena} monthName={monthName} year={year} />

          <CuotasFilterBar
            zonas={zonas}
            subdivisiones={subdivisiones}
            selectedZonaId={selectedZonaId}
            selectedSubdivisionId={selectedSubdivisionId}
            selectedQuincena={selectedQuincena}
            searchCasa={searchCasa}
            onZonaChange={setSelectedZonaId}
            onSubdivisionChange={setSelectedSubdivisionId}
            onQuincenaChange={setSelectedQuincena}
            onSearchChange={setSearchCasa}
            loading={loading}
          />

          {/* Grid de Casas */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--foreground-muted)' }}>
              Cargando viviendas del sector seleccionado...
            </div>
          ) : filteredCasas.length === 0 ? (
            <div
              className="card"
              style={{
                textAlign: 'center',
                padding: '3rem',
                color: 'var(--foreground-muted)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              {zonas.length === 0
                ? 'No hay zonas registradas. Ejecuta la migración inicial o crea una zona.'
                : subdivisiones.length === 0
                ? 'No hay edificios, pasajes o calles asociadas a esta zona.'
                : 'No se encontraron casas que coincidan con la búsqueda.'}
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                gap: '1.25rem',
              }}
            >
              {filteredCasas.map((casa) => (
                <CuotaCasaCard
                  key={casa.casaId}
                  casa={casa}
                  canCollect={canCollect}
                  onOpenPaymentModal={(c) => setSelectedCasaToPay(c)}
                />
              ))}
            </div>
          )}

          {/* Modal de Pago y Contraste de Recibo */}
          {selectedCasaToPay && (
            <ModalRegistrarPago
              casa={selectedCasaToPay}
              year={year}
              mes={mes}
              quincena={selectedQuincena}
              onClose={() => setSelectedCasaToPay(null)}
              onSubmit={handlePaymentSubmit}
            />
          )}
        </>
      )}
    </div>
  );
}
