/**
 * @file date.ts
 * @description Utilidades para manejo determinista de fechas, rangos mensuales y días en la zona horaria GMT-6 (El Salvador / Centroamérica).
 * @module utils/date
 */

const GMT6_OFFSET_HOURS = 6;
const GMT6_OFFSET_MS = GMT6_OFFSET_HOURS * 60 * 60 * 1000;

export interface GMT6MonthRange {
  startIso: string;
  endIso: string;
  lastDay: number;
}

export interface GMT6DateInfo {
  day: number;
  dateString: string; // YYYY-MM-DD
  formattedDisplay: string; // DD/MM/YYYY
}

/**
 * Calcula los límites exactos de inicio (00:00:00.000) y fin (23:59:59.999) de un mes en GMT-6
 * convertidos a marcas de tiempo ISO UTC para consultas deterministas en la base de datos.
 *
 * @param year Año (ej. 2026)
 * @param month Mes base 0 (0 = Enero, 11 = Diciembre)
 */
export function getGMT6MonthRange(year: number, month: number): GMT6MonthRange {
  // Obtener el último día del mes en calendario gregoriano
  const lastDay = new Date(year, month + 1, 0).getDate();

  // Inicio del mes a las 00:00:00.000 en GMT-6 = 06:00:00.000 UTC del día 1
  const startUtc = new Date(Date.UTC(year, month, 1, GMT6_OFFSET_HOURS, 0, 0, 0));

  // Fin del mes a las 23:59:59.999 en GMT-6 = 05:59:59.999 UTC del día siguiente
  const endUtc = new Date(Date.UTC(year, month, lastDay + 1, GMT6_OFFSET_HOURS - 1, 59, 59, 999));

  return {
    startIso: startUtc.toISOString(),
    endIso: endUtc.toISOString(),
    lastDay,
  };
}

/**
 * Convierte cualquier marca de tiempo UTC a su día calendario y fecha local correspondiente en GMT-6.
 *
 * @param isoOrDateStr Marca de tiempo ISO (ej. '2026-10-01T02:00:00.000Z')
 */
export function getGMT6DayAndDate(isoOrDateStr: string): GMT6DateInfo {
  if (!isoOrDateStr) {
    return {
      day: 1,
      dateString: '1970-01-01',
      formattedDisplay: '01/01/1970',
    };
  }

  // Si ya es una fecha plana 'YYYY-MM-DD' (ej. producida por dateString previamente), preservar directamente
  if (/^\d{4}-\d{2}-\d{2}$/.test(isoOrDateStr)) {
    const [year, month, day] = isoOrDateStr.split('-');
    return {
      day: parseInt(day, 10),
      dateString: isoOrDateStr,
      formattedDisplay: `${day}/${month}/${year}`,
    };
  }

  const d = new Date(isoOrDateStr);
  
  if (isNaN(d.getTime())) {
    return {
      day: 1,
      dateString: '1970-01-01',
      formattedDisplay: '01/01/1970',
    };
  }

  // Desplazar fecha restando 6 horas para obtener la fecha exacta en GMT-6
  const gmt6Time = new Date(d.getTime() - GMT6_OFFSET_MS);
  const year = gmt6Time.getUTCFullYear();
  const monthNum = gmt6Time.getUTCMonth() + 1;
  const month = String(monthNum).padStart(2, '0');
  const day = gmt6Time.getUTCDate();
  const dayStr = String(day).padStart(2, '0');

  return {
    day,
    dateString: `${year}-${month}-${dayStr}`,
    formattedDisplay: `${dayStr}/${month}/${year}`,
  };
}
