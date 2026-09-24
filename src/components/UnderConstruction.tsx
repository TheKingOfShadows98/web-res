'use client';

/**
 * @file UnderConstruction.tsx
 * @description Componente reutilizable y modular para indicar que una página, sección o módulo se encuentra en construcción o desarrollo.
 * @module components
 */

import React from 'react';
import Link from 'next/link';
import styles from './UnderConstruction.module.css';

export interface ActionButtonConfig {
  text: string;
  href: string;
  onClick?: () => void;
  isExternal?: boolean;
}

export interface UnderConstructionProps {
  /** Título principal */
  title?: string;
  /** Mensaje o descripción secundaria */
  subtitle?: string;
  /** Texto del badge superior con indicador */
  badgeText?: string;
  /** Fecha estimada de disponibilidad o fase del proyecto */
  estimatedDate?: string;
  /** Variante visual según el contexto donde se incruste */
  variant?: 'page' | 'card' | 'banner';
  /** Determina si se muestra el botón de regreso */
  showBackButton?: boolean;
  /** Destino del botón de regreso (por defecto: '/') */
  backUrl?: string;
  /** Texto del botón de regreso */
  backText?: string;
  /** Botón de acción adicional o secundario opcional */
  actionButton?: ActionButtonConfig;
  /** Lista de funcionalidades planeadas a destacar */
  features?: string[];
  /** Icono personalizado para reemplazar el icono por defecto */
  icon?: React.ReactNode;
  /** Clases CSS adicionales */
  className?: string;
  /** Elementos hijos complementarios */
  children?: React.ReactNode;
}

/**
 * Icono de construcción por defecto con cono de tráfico y herramientas.
 */
function DefaultConstructionIcon({ size = 48 }: { size?: number }): React.ReactElement {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* Cono y herramientas de construcción */}
      <path d="M2 22h20" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-1a2 2 0 0 1 2-2h2" />
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
      <path d="M18 10l-4-4" />
    </svg>
  );
}

/**
 * Componente `UnderConstruction` (también exportado como `EnConstruccion`).
 * Diseñado para integrarse en páginas completas, paneles administrativos, tarjetas de módulos y banners informativos.
 */
export default function UnderConstruction({
  title = 'Módulo en Construcción',
  subtitle = 'Estamos trabajando en esta sección para brindarte la mejor experiencia dentro del portal de Residencial México.',
  badgeText = 'En Desarrollo',
  estimatedDate,
  variant = 'page',
  showBackButton,
  backUrl = '/',
  backText = 'Volver al Inicio',
  actionButton,
  features,
  icon,
  className = '',
  children,
}: UnderConstructionProps): React.ReactElement {
  // Por defecto el botón de regreso se activa en modo 'page', pero puede ser sobreescrito
  const shouldShowBack = showBackButton ?? (variant === 'page');

  const variantClass =
    variant === 'page'
      ? styles.pageVariant
      : variant === 'card'
      ? styles.cardVariant
      : styles.bannerVariant;

  const iconSize = variant === 'banner' ? 28 : 44;

  return (
    <section className={`${styles.wrapper} ${variantClass} ${className}`} aria-label={title}>
      {variant === 'page' && <div className={styles.glowAmbient} aria-hidden="true" />}

      {/* Contenedor de Icono */}
      <div className={styles.iconContainer}>
        <div className={styles.iconBg} aria-hidden="true" />
        <div className={styles.iconInner}>
          {icon ?? <DefaultConstructionIcon size={iconSize} />}
        </div>
      </div>

      <div className={styles.content}>
        {/* Badge de Estado */}
        {badgeText && (
          <div className={styles.badge} role="status">
            <span className={styles.badgeDot} aria-hidden="true" />
            <span>{badgeText}</span>
          </div>
        )}

        {/* Título y Subtítulo */}
        <h2 className={styles.title}>{title}</h2>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}

        {/* Fecha o Fase Estimada */}
        {estimatedDate && (
          <div className={styles.metaBox}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span>{estimatedDate}</span>
          </div>
        )}

        {/* Lista de Funcionalidades Planeadas */}
        {features && features.length > 0 && (
          <div className={styles.featuresBox}>
            <div className={styles.featuresHeading}>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
              Próximas funcionalidades
            </div>
            <ul className={styles.featuresList}>
              {features.map((feat, index) => (
                <li key={index} className={styles.featureItem}>
                  <span className={styles.featureBullet} aria-hidden="true" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Botones de Navegación / Acción */}
        {(shouldShowBack || actionButton) && (
          <div className={styles.actions}>
            {shouldShowBack && (
              <Link href={backUrl} className={styles.btnPrimary}>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <line x1="19" y1="12" x2="5" y2="12" />
                  <polyline points="12 19 5 12 12 5" />
                </svg>
                {backText}
              </Link>
            )}

            {actionButton && (
              actionButton.isExternal ? (
                <a
                  href={actionButton.href}
                  className={styles.btnSecondary}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={actionButton.onClick}
                >
                  {actionButton.text}
                </a>
              ) : (
                <Link
                  href={actionButton.href}
                  className={styles.btnSecondary}
                  onClick={actionButton.onClick}
                >
                  {actionButton.text}
                </Link>
              )
            )}
          </div>
        )}

        {/* Contenido Extra Inyectado */}
        {children && <div style={{ width: '100%', marginTop: '1.5rem' }}>{children}</div>}
      </div>
    </section>
  );
}

/** Alias en español para facilidad de uso */
export { UnderConstruction as EnConstruccion };
