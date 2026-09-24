import React from 'react';
import type { Metadata } from 'next';
import AdminLayout from '@/components/AdminLayout';

export const metadata: Metadata = {
  title: 'Panel Administrativo - Residencial México',
  description: 'Módulo de administración y gestión para la Junta Directiva de la ADESCO.',
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return <AdminLayout>{children}</AdminLayout>;
}
