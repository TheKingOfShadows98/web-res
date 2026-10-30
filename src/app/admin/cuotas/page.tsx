'use client';

/**
 * @file page.tsx
 * @description Ruta de administración para el seguimiento y recolección de cuotas de mantenimiento y seguridad.
 * @module app/admin/cuotas
 */

import React from 'react';
import { AdminCuotasDashboard } from '@/modules/cuotas-mantenimiento';

export default function CuotasPage(): React.ReactElement {
  return <AdminCuotasDashboard />;
}
