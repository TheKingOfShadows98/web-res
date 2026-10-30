'use client';

/**
 * @file GestionEstructuraPanel.tsx
 * @description Panel administrativo exclusivo para el rol Owner para insertar Zonas,
 * Edificios/Calles/Pasajes y registrar Casas con sus cuotas y quincenas.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { IZona, ISubdivision, ICasa } from '../domain/entities';
import { TipoSubdivisionEnum, QuincenaEnum } from '../domain/enums';
import { cuotasManagementService } from '../services/cuotas-management.service';
import { cuotasQueryService } from '../services/cuotas-query.service';
import { cuotasRepository } from '../infrastructure/cuotas.repository';

interface GestionEstructuraPanelProps {
  userId: string;
  onStructureUpdated?: () => void;
}

export function GestionEstructuraPanel({
  userId,
  onStructureUpdated,
}: GestionEstructuraPanelProps): React.ReactElement {
  // Estados de datos territoriales
  const [zonas, setZonas] = useState<IZona[]>([]);
  const [subdivisiones, setSubdivisiones] = useState<ISubdivision[]>([]);
  const [casas, setCasas] = useState<ICasa[]>([]);
  const [selectedZonaId, setSelectedZonaId] = useState<string>('');
  const [selectedSubdivisionId, setSelectedSubdivisionId] = useState<string>('');

  // Formularios
  const [formZona, setFormZona] = useState({ nombre: '', descripcion: '' });
  const [formSub, setFormSub] = useState({
    zonaId: '',
    tipo: TipoSubdivisionEnum.EDIFICIO,
    nombre: '',
  });
  const [formCasa, setFormCasa] = useState({
    subdivisionId: '',
    numero: '',
    cuota: 10,
    quincena: QuincenaEnum.PRIMERA,
  });

  // Estados UI
  const [activeForm, setActiveForm] = useState<'casa' | 'subdivision' | 'zona'>('casa');
  const [loading, setLoading] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 1. Cargar Zonas
  const loadZonas = useCallback(async () => {
    try {
      const z = await cuotasQueryService.getZonas();
      setZonas(z);
      if (z.length > 0 && !selectedZonaId) {
        setSelectedZonaId(z[0].id);
        setFormSub((prev) => ({ ...prev, zonaId: z[0].id }));
      }
    } catch (err: unknown) {
      console.error(err);
    }
  }, [selectedZonaId]);

  useEffect(() => {
    loadZonas();
  }, [loadZonas]);

  // 2. Cargar Subdivisiones cuando cambia Zona seleccionada
  const loadSubdivisions = useCallback(async () => {
    if (!selectedZonaId) {
      setSubdivisiones([]);
      setSelectedSubdivisionId('');
      return;
    }
    try {
      const s = await cuotasQueryService.getSubdivisiones(selectedZonaId);
      setSubdivisiones(s);
      if (s.length > 0) {
        setSelectedSubdivisionId(s[0].id);
        setFormCasa((prev) => ({ ...prev, subdivisionId: s[0].id }));
      } else {
        setSelectedSubdivisionId('');
        setCasas([]);
      }
    } catch (err: unknown) {
      console.error(err);
    }
  }, [selectedZonaId]);

  useEffect(() => {
    loadSubdivisions();
  }, [loadSubdivisions]);

  // 3. Cargar Casas de la Subdivisión seleccionada
  const loadCasas = useCallback(async () => {
    if (!selectedSubdivisionId) {
      setCasas([]);
      return;
    }
    try {
      const c = await cuotasRepository.getCasas(selectedSubdivisionId);
      setCasas(c);
    } catch (err: unknown) {
      console.error(err);
    }
  }, [selectedSubdivisionId]);

  useEffect(() => {
    loadCasas();
  }, [loadCasas]);

  const notifyChange = () => {
    if (onStructureUpdated) onStructureUpdated();
  };

  // Submit: Crear Zona
  const handleCreateZona = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setErrorMessage(null);
      const newZ = await cuotasManagementService.createZona(userId, formZona);
      setSuccessMessage(`Zona "${newZ.nombre}" creada exitosamente.`);
      setFormZona({ nombre: '', descripcion: '' });
      await loadZonas();
      setSelectedZonaId(newZ.id);
      notifyChange();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Error al crear zona.');
    } finally {
      setLoading(false);
    }
  };

  // Submit: Crear Subdivisión
  const handleCreateSubdivision = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setErrorMessage(null);
      const targetZonaId = formSub.zonaId || selectedZonaId;
      const newSub = await cuotasManagementService.createSubdivision(userId, {
        ...formSub,
        zonaId: targetZonaId,
      });
      setSuccessMessage(`${newSub.tipo} "${newSub.nombre}" registrado exitosamente.`);
      setFormSub((prev) => ({ ...prev, nombre: '' }));
      await loadSubdivisions();
      setSelectedSubdivisionId(newSub.id);
      notifyChange();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Error al crear subdivisión.');
    } finally {
      setLoading(false);
    }
  };

  // Submit: Registrar Casa
  const handleCreateCasa = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setErrorMessage(null);
      const targetSubId = formCasa.subdivisionId || selectedSubdivisionId;
      const newCasa = await cuotasManagementService.createCasa(userId, {
        ...formCasa,
        subdivisionId: targetSubId,
      });
      setSuccessMessage(`Casa/Apto "${newCasa.numero}" registrada con cuota de $${newCasa.cuota}.`);
      setFormCasa((prev) => ({ ...prev, numero: '' }));
      await loadCasas();
      notifyChange();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Error al registrar casa.');
    } finally {
      setLoading(false);
    }
  };

  // Eliminar Casa
  const handleDeleteCasa = async (casaId: string, numero: string) => {
    if (!confirm(`¿Estás seguro de eliminar la vivienda ${numero}?`)) return;
    try {
      setLoading(true);
      await cuotasManagementService.deleteCasa(userId, casaId);
      setSuccessMessage(`Vivienda ${numero} eliminada.`);
      await loadCasas();
      notifyChange();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Error al eliminar vivienda.');
    } finally {
      setLoading(false);
    }
  };

  // Eliminar Zona
  const handleDeleteZona = async (zonaId: string, nombre: string) => {
    if (
      !confirm(
        `¿Estás seguro de eliminar la "${nombre}"? Esta acción se cancelará si aún contiene edificios o casas vinculadas.`
      )
    )
      return;
    try {
      setLoading(true);
      setErrorMessage(null);
      await cuotasManagementService.deleteZona(userId, zonaId);
      setSuccessMessage(`Zona "${nombre}" eliminada exitosamente.`);
      await loadZonas();
      notifyChange();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Error al eliminar zona.');
    } finally {
      setLoading(false);
    }
  };

  // Eliminar Subdivisión
  const handleDeleteSubdivision = async (subId: string, nombre: string, tipo: string) => {
    if (
      !confirm(
        `¿Estás seguro de eliminar ${tipo} "${nombre}"? Esta acción se cancelará si aún contiene casas vinculadas.`
      )
    )
      return;
    try {
      setLoading(true);
      setErrorMessage(null);
      await cuotasManagementService.deleteSubdivision(userId, subId);
      setSuccessMessage(`${tipo} "${nombre}" eliminado exitosamente.`);
      await loadSubdivisions();
      notifyChange();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Error al eliminar subdivisión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: '1.5rem' }}>
      {/* Mensajes de notificación */}
      {successMessage && (
        <div
          style={{
            padding: '0.85rem 1.25rem',
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
          <span>✓ {successMessage}</span>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            style={{ background: 'none', border: 'none', color: 'var(--success)', cursor: 'pointer', fontSize: '1.2rem' }}
          >
            &times;
          </button>
        </div>
      )}

      {errorMessage && (
        <div
          style={{
            padding: '0.85rem 1.25rem',
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
            onClick={() => setErrorMessage(null)}
            style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '1.2rem' }}
          >
            &times;
          </button>
        </div>
      )}

      {/* Selector de Pestaña de Creación */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <button
          type="button"
          className={activeForm === 'casa' ? 'btnPrimary' : 'btnSecondary'}
          onClick={() => setActiveForm('casa')}
          style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
        >
          + Registrar Casa / Apartamento
        </button>
        <button
          type="button"
          className={activeForm === 'subdivision' ? 'btnPrimary' : 'btnSecondary'}
          onClick={() => setActiveForm('subdivision')}
          style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
        >
          + Nuevo Edificio, Pasaje o Calle
        </button>
        <button
          type="button"
          className={activeForm === 'zona' ? 'btnPrimary' : 'btnSecondary'}
          onClick={() => setActiveForm('zona')}
          style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
        >
          + Nueva Zona
        </button>
      </div>

      {/* FORMULARIO 1: REGISTRAR CASA */}
      {activeForm === 'casa' && (
        <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--foreground)' }}>
            Registrar Casa / Apartamento
          </h3>
          <p style={{ color: 'var(--foreground-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
            Asocia una nueva vivienda a un edificio, pasaje o calle indicando su cuota estándar (\$10 por defecto) y quincena de cobro.
          </p>

          <form onSubmit={handleCreateCasa}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
              <div className="formGroup" style={{ margin: 0 }}>
                <label className="formLabel" htmlFor="casaZonaSelect">Zona</label>
                <select
                  id="casaZonaSelect"
                  className="formInput"
                  value={selectedZonaId}
                  onChange={(e) => setSelectedZonaId(e.target.value)}
                  required
                >
                  {zonas.map((z) => (
                    <option key={z.id} value={z.id}>{z.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="formGroup" style={{ margin: 0 }}>
                <label className="formLabel" htmlFor="casaSubSelect">Edificio / Pasaje / Calle</label>
                <select
                  id="casaSubSelect"
                  className="formInput"
                  value={selectedSubdivisionId}
                  onChange={(e) => {
                    setSelectedSubdivisionId(e.target.value);
                    setFormCasa((prev) => ({ ...prev, subdivisionId: e.target.value }));
                  }}
                  required
                >
                  {subdivisiones.map((s) => (
                    <option key={s.id} value={s.id}>{s.tipo}: {s.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="formGroup" style={{ margin: 0 }}>
                <label className="formLabel" htmlFor="casaNumeroInput">Número / Apartamento</label>
                <input
                  id="casaNumeroInput"
                  type="text"
                  className="formInput"
                  placeholder="Ej. Casa 45, Apto 204"
                  value={formCasa.numero}
                  onChange={(e) => setFormCasa((prev) => ({ ...prev, numero: e.target.value }))}
                  required
                />
              </div>

              <div className="formGroup" style={{ margin: 0 }}>
                <label className="formLabel" htmlFor="casaCuotaInput">Cuota Mensual ($)</label>
                <input
                  id="casaCuotaInput"
                  type="number"
                  step="0.01"
                  min="1"
                  className="formInput"
                  value={formCasa.cuota}
                  onChange={(e) => setFormCasa((prev) => ({ ...prev, cuota: parseFloat(e.target.value) || 0 }))}
                  required
                />
              </div>

              <div className="formGroup" style={{ margin: 0 }}>
                <label className="formLabel" htmlFor="casaQuincenaSelect">Quincena de Cobro Habitual</label>
                <select
                  id="casaQuincenaSelect"
                  className="formInput"
                  value={formCasa.quincena}
                  onChange={(e) => setFormCasa((prev) => ({ ...prev, quincena: e.target.value as QuincenaEnum }))}
                >
                  <option value={QuincenaEnum.PRIMERA}>1ª Quincena (Días 1-14)</option>
                  <option value={QuincenaEnum.SEGUNDA}>2ª Quincena (Días 15+)</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btnPrimary" disabled={loading || subdivisiones.length === 0}>
                {loading ? 'Guardando...' : 'Guardar Vivienda'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* FORMULARIO 2: CREAR SUBDIVISIÓN */}
      {activeForm === 'subdivision' && (
        <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--foreground)' }}>
            Crear Edificio, Pasaje o Calle
          </h3>
          <p style={{ color: 'var(--foreground-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
            Define una nueva agrupación habitacional dentro de una zona existente.
          </p>

          <form onSubmit={handleCreateSubdivision}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
              <div className="formGroup" style={{ margin: 0 }}>
                <label className="formLabel" htmlFor="subZonaSelect">Zona Perteneciente</label>
                <select
                  id="subZonaSelect"
                  className="formInput"
                  value={formSub.zonaId || selectedZonaId}
                  onChange={(e) => setFormSub((prev) => ({ ...prev, zonaId: e.target.value }))}
                  required
                >
                  {zonas.map((z) => (
                    <option key={z.id} value={z.id}>{z.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="formGroup" style={{ margin: 0 }}>
                <label className="formLabel" htmlFor="subTipoSelect">Tipo de Subdivisión</label>
                <select
                  id="subTipoSelect"
                  className="formInput"
                  value={formSub.tipo}
                  onChange={(e) => setFormSub((prev) => ({ ...prev, tipo: e.target.value as TipoSubdivisionEnum }))}
                >
                  <option value={TipoSubdivisionEnum.EDIFICIO}>Edificio</option>
                  <option value={TipoSubdivisionEnum.PASAJE}>Pasaje</option>
                  <option value={TipoSubdivisionEnum.CALLE}>Calle</option>
                </select>
              </div>

              <div className="formGroup" style={{ margin: 0 }}>
                <label className="formLabel" htmlFor="subNombreInput">Nombre / Número del Sector</label>
                <input
                  id="subNombreInput"
                  type="text"
                  className="formInput"
                  placeholder="Ej. Edificio B, Pasaje 4, Calle Real"
                  value={formSub.nombre}
                  onChange={(e) => setFormSub((prev) => ({ ...prev, nombre: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btnPrimary" disabled={loading || zonas.length === 0}>
                {loading ? 'Creando...' : 'Crear Subdivisión'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* FORMULARIO 3: CREAR ZONA */}
      {activeForm === 'zona' && (
        <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--foreground)' }}>
            Nueva Zona
          </h3>
          <p style={{ color: 'var(--foreground-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
            Las zonas representan las grandes divisiones territoriales de la residencial (ej. Zona 1, Zona 2, Zona 3).
          </p>

          <form onSubmit={handleCreateZona}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
              <div className="formGroup" style={{ margin: 0 }}>
                <label className="formLabel" htmlFor="zonaNombreInput">Nombre de la Zona</label>
                <input
                  id="zonaNombreInput"
                  type="text"
                  className="formInput"
                  placeholder="Ej. Zona 4"
                  value={formZona.nombre}
                  onChange={(e) => setFormZona((prev) => ({ ...prev, nombre: e.target.value }))}
                  required
                />
              </div>

              <div className="formGroup" style={{ margin: 0 }}>
                <label className="formLabel" htmlFor="zonaDescInput">Descripción (Opcional)</label>
                <input
                  id="zonaDescInput"
                  type="text"
                  className="formInput"
                  placeholder="Ej. Sector poniente colindante con parque"
                  value={formZona.descripcion}
                  onChange={(e) => setFormZona((prev) => ({ ...prev, descripcion: e.target.value }))}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btnPrimary" disabled={loading}>
                {loading ? 'Creando...' : 'Crear Zona'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TABLA SEGÚN LA PESTAÑA ACTIVA */}
      {/* 1. TABLA DE CASAS */}
      {activeForm === 'casa' && (
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--foreground)' }}>
              Casas Registradas en el Sector Seleccionado ({casas.length})
            </h4>
            <span style={{ fontSize: '0.8rem', color: 'var(--foreground-muted)' }}>
              {subdivisiones.find((s) => s.id === selectedSubdivisionId)?.nombre || 'Seleccione un sector'}
            </span>
          </div>

          {casas.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--foreground-muted)', fontSize: '0.9rem' }}>
              No hay casas registradas en esta subdivisión. Usa el formulario superior para añadir viviendas.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--foreground-muted)' }}>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Identificador / Número</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Cuota Acordada</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Quincena Asignada</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Estado</th>
                    <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {casas.map((c) => (
                    <tr key={c.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                      <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600, color: 'var(--foreground)' }}>
                        {c.numero}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', color: 'var(--primary)' }}>
                        ${Number(c.cuota).toFixed(2)}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', color: 'var(--foreground-muted)' }}>
                        {c.quincena === QuincenaEnum.PRIMERA ? '1ª Quincena' : '2ª Quincena'}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <span
                          style={{
                            padding: '0.2rem 0.5rem',
                            borderRadius: '999px',
                            fontSize: '0.75rem',
                            backgroundColor: c.activo ? 'var(--success-glow)' : 'rgba(255, 255, 255, 0.05)',
                            color: c.activo ? 'var(--success)' : 'var(--foreground-muted)',
                          }}
                        >
                          {c.activo ? 'Activa' : 'Inactiva'}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => handleDeleteCasa(c.id, c.numero)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--danger)',
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            padding: '0.25rem 0.5rem',
                          }}
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 2. TABLA DE SUBDIVISIONES (EDIFICIOS, PASAJES, CALLES) */}
      {activeForm === 'subdivision' && (
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--foreground)' }}>
              Edificios, Calles y Pasajes en la Zona Seleccionada ({subdivisiones.length})
            </h4>
            <span style={{ fontSize: '0.8rem', color: 'var(--foreground-muted)' }}>
              {zonas.find((z) => z.id === (formSub.zonaId || selectedZonaId))?.nombre || 'Zona'}
            </span>
          </div>

          {subdivisiones.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--foreground-muted)', fontSize: '0.9rem' }}>
              No hay edificios, calles o pasajes en esta zona. Usa el formulario superior para crear uno.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--foreground-muted)' }}>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Tipo</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Nombre / Número</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Zona</th>
                    <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {subdivisiones.map((s) => (
                    <tr key={s.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                      <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600, color: 'var(--primary)' }}>
                        {s.tipo}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', color: 'var(--foreground)', fontWeight: 600 }}>
                        {s.nombre}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', color: 'var(--foreground-muted)' }}>
                        {zonas.find((z) => z.id === s.zonaId)?.nombre || 'Zona'}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => handleDeleteSubdivision(s.id, s.nombre, s.tipo)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--danger)',
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            padding: '0.25rem 0.5rem',
                          }}
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 3. TABLA DE ZONAS */}
      {activeForm === 'zona' && (
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--foreground)' }}>
              Zonas Registradas en la Residencial ({zonas.length})
            </h4>
          </div>

          {zonas.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--foreground-muted)', fontSize: '0.9rem' }}>
              No hay zonas registradas. Usa el formulario superior para añadir la primera zona.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--foreground-muted)' }}>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Nombre de la Zona</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Descripción</th>
                    <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {zonas.map((z) => (
                    <tr key={z.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                      <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600, color: 'var(--primary)' }}>
                        {z.nombre}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', color: 'var(--foreground-muted)' }}>
                        {z.descripcion || 'Sin descripción'}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => handleDeleteZona(z.id, z.nombre)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--danger)',
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            padding: '0.25rem 0.5rem',
                          }}
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
