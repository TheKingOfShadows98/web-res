'use client';

/**
 * @file useFinanzas.ts
 * @description Hook y capa de lógica de negocio para la gestión, agregación y cálculo de datos financieros
 * de la ADESCO Residencial México. Desacopla la lógica de consultas a Supabase, ordenamiento,
 * agregación por conceptos y flujo de caja diario de los componentes de presentación.
 * @module hooks
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { getGMT6MonthRange, getGMT6DayAndDate } from '@/utils/date';

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

export interface ConceptSummary {
  concepto: string;
  totalMonto: number;
  count: number;
}

export const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export const START_YEAR = 2025;

export interface UseFinanzasOptions {
  initialYear?: number;
  initialMonth?: number;
}

export interface UseFinanzasReturn {
  // Estados de selección de período
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  selectedMonth: number;
  setSelectedMonth: (month: number) => void;
  availableYears: number[];
  monthNames: string[];

  // Métricas globales históricas
  balanceTotalHistorico: number | null;
  totalIngresosHistoricos: number;
  totalEgresosHistoricos: number;

  // Datos del período seleccionado
  loadingData: boolean;
  ingresosPeriodo: TransactionMovement[];
  egresosPeriodo: TransactionMovement[];
  totalIngresosMes: number;
  totalEgresosMes: number;
  balanceMes: number;

  // Agrupaciones
  conceptosIngresos: ConceptSummary[];
  conceptosEgresos: ConceptSummary[];
  dailyActivities: DailyActivity[];

  // Estado de UI y utilidades
  conceptosTab: 'todos' | 'ingresos' | 'egresos';
  setConceptosTab: (tab: 'todos' | 'ingresos' | 'egresos') => void;
  expandedDays: Set<string>;
  toggleDayExpansion: (dateStr: string) => void;
  copiedHash: string | null;
  copyHashToClipboard: (hash: string) => void;

  // Formateadores
  formatCurrency: (val: number) => string;
  formatDateString: (dateStr: string) => string;
}

/**
 * Hook central de lógica financiera para el portal público y de auditoría.
 */
export function useFinanzas(options?: UseFinanzasOptions): UseFinanzasReturn {
  const supabase = useMemo(() => createClient(), []);

  // Período seleccionado
  const now = useMemo(() => new Date(), []);
  const [selectedYear, setSelectedYear] = useState<number>(
    options?.initialYear ?? (now.getFullYear() >= START_YEAR ? now.getFullYear() : START_YEAR)
  );
  const [selectedMonth, setSelectedMonth] = useState<number>(
    options?.initialMonth ?? now.getMonth()
  );

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

  // Lista de años disponibles calculada dinámicamente
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
  const formatCurrency = useCallback((val: number): string => {
    return new Intl.NumberFormat('es-SV', { style: 'currency', currency: 'USD' }).format(val);
  }, []);

  const formatDateString = useCallback((dateStr: string): string => {
    return getGMT6DayAndDate(dateStr).formattedDisplay;
  }, []);

  // 1. Cargar métricas globales históricas acumuladas
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
        console.error('Error al cargar métricas globales de finanzas:', err);
      }
    };

    fetchGlobalMetrics();

    return () => {
      isMounted = false;
    };
  }, [supabase]);

  // 2. Cargar y procesar transacciones del mes seleccionado en GMT-6
  useEffect(() => {
    let isMounted = true;

    const fetchPeriodTransactions = async () => {
      setLoadingData(true);
      try {
        const { startIso, endIso } = getGMT6MonthRange(selectedYear, selectedMonth);

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

        // Agrupar movimientos diarios usando fecha en GMT-6
        const dailyMap: { [key: string]: { ingreso: number; egreso: number; movements: TransactionMovement[] } } = {};

        ingMovements.forEach((item) => {
          if (!item.fecha) return;
          const { dateString } = getGMT6DayAndDate(item.fecha);
          if (!dailyMap[dateString]) dailyMap[dateString] = { ingreso: 0, egreso: 0, movements: [] };
          dailyMap[dateString].ingreso += item.cantidad;
          dailyMap[dateString].movements.push(item);
        });

        egrMovements.forEach((item) => {
          if (!item.fecha) return;
          const { dateString } = getGMT6DayAndDate(item.fecha);
          if (!dailyMap[dateString]) dailyMap[dateString] = { ingreso: 0, egreso: 0, movements: [] };
          dailyMap[dateString].egreso += item.cantidad;
          dailyMap[dateString].movements.push(item);
        });

        const activitiesList: DailyActivity[] = Object.keys(dailyMap)
          .map((date) => {
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
          })
          .sort((a, b) => b.date.localeCompare(a.date));

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

  // Cálculos de totales del mes
  const totalIngresosMes = useMemo(() => {
    return ingresosPeriodo.reduce((sum, item) => sum + item.cantidad, 0);
  }, [ingresosPeriodo]);

  const totalEgresosMes = useMemo(() => {
    return egresosPeriodo.reduce((sum, item) => sum + item.cantidad, 0);
  }, [egresosPeriodo]);

  const balanceMes = totalIngresosMes - totalEgresosMes;

  // Agrupación de conceptos de ingresos
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

  // Agrupación de conceptos de egresos
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

  // Toggle de acordeón diario
  const toggleDayExpansion = useCallback((dateStr: string) => {
    setExpandedDays((prev) => {
      const next = new Set(prev);
      if (next.has(dateStr)) next.delete(dateStr);
      else next.add(dateStr);
      return next;
    });
  }, []);

  // Copia de hash
  const copyHashToClipboard = useCallback((hash: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(hash);
      setCopiedHash(hash);
      setTimeout(() => setCopiedHash(null), 2000);
    }
  }, []);

  return {
    selectedYear,
    setSelectedYear,
    selectedMonth,
    setSelectedMonth,
    availableYears,
    monthNames: MONTH_NAMES,

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
  };
}
