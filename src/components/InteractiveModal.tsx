'use client';

/**
 * @file InteractiveModal.tsx
 * @description Componente del modal interactivo para simular el acceso vecinal y la generación de pases QR.
 * @module components
 */

import React, { useState } from 'react';

interface InteractiveModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Modal interactivo que permite simular el Portal del Vecino (registro de visitas y generación de QR).
 * 
 * @param {InteractiveModalProps} props - Propiedades del componente modal.
 * @returns {React.ReactElement | null} El modal renderizado o null si está cerrado.
 */
export default function InteractiveModal({ isOpen, onClose }: InteractiveModalProps): React.ReactElement | null {
  const [visitorName, setVisitorName] = useState<string>('');
  const [dui, setDui] = useState<string>('');
  const [generated, setGenerated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  if (!isOpen) return null;

  /**
   * Maneja el envío del formulario para simular la creación de un pase QR.
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitorName.trim()) return;

    setLoading(true);
    // Simular llamada de red
    setTimeout(() => {
      setLoading(false);
      setGenerated(true);
    }, 800);
  };

  /**
   * Reinicia el estado para generar un nuevo pase.
   */
  const handleReset = () => {
    setVisitorName('');
    setDui('');
    setGenerated(false);
  };

  return (
    <div className="modalOverlay" onClick={onClose}>
      <div className="modalContent" onClick={(e) => e.stopPropagation()}>
        <button className="modalClose" onClick={onClose} aria-label="Cerrar modal">
          &times;
        </button>

        {!generated ? (
          <>
            <h3 className="modalTitle">Registro de Visitante Rápido</h3>
            <p className="modalSubtitle">
              Crea un pase de acceso digital para tus invitados. El sistema notificará a la caseta de seguridad automáticamente.
            </p>

            <form onSubmit={handleSubmit}>
              <div className="formGroup">
                <label className="formLabel" htmlFor="visitor-name">
                  Nombre Completo del Invitado
                </label>
                <input
                  id="visitor-name"
                  type="text"
                  className="formInput"
                  placeholder="ej. Juan Carlos Pérez"
                  value={visitorName}
                  onChange={(e) => setVisitorName(e.target.value)}
                  required
                />
              </div>

              <div className="formGroup">
                <label className="formLabel" htmlFor="visitor-id">
                  Documento de Identidad (Opcional)
                </label>
                <input
                  id="visitor-id"
                  type="text"
                  className="formInput"
                  placeholder="ej. 00000000-0"
                  value={dui}
                  onChange={(e) => setDui(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="btnPrimary"
                style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}
                disabled={loading}
              >
                {loading ? 'Generando Pase...' : 'Generar Pase QR'}
              </button>
            </form>
          </>
        ) : (
          <div className="qrContainer">
            <h3 className="modalTitle">¡Pase QR Generado!</h3>
            <p className="modalSubtitle" style={{ marginBottom: '1.5rem' }}>
              Comparte este código con tu invitado para agilizar su ingreso en la portería.
            </p>

            <div className="qrPlaceholder">
              {/* Representación vectorial SVG de un código QR simulado para diseño premium */}
              <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Bordes de posicionamiento */}
                <rect x="5" y="5" width="25" height="25" stroke="#0f172a" strokeWidth="6" fill="none" />
                <rect x="10" y="10" width="15" height="15" fill="#0f172a" />
                
                <rect x="70" y="5" width="25" height="25" stroke="#0f172a" strokeWidth="6" fill="none" />
                <rect x="75" y="10" width="15" height="15" fill="#0f172a" />
                
                <rect x="5" y="70" width="25" height="25" stroke="#0f172a" strokeWidth="6" fill="none" />
                <rect x="10" y="75" width="15" height="15" fill="#0f172a" />

                {/* Bloques de alineación menores */}
                <rect x="75" y="75" width="10" height="10" fill="#0f172a" />

                {/* Patrón binario simulado */}
                <rect x="35" y="5" width="5" height="15" fill="#0f172a" />
                <rect x="45" y="10" width="10" height="5" fill="#0f172a" />
                <rect x="60" y="5" width="5" height="25" fill="#0f172a" />
                <rect x="35" y="25" width="20" height="5" fill="#0f172a" />
                
                <rect x="5" y="35" width="15" height="5" fill="#0f172a" />
                <rect x="25" y="35" width="5" height="10" fill="#0f172a" />
                <rect x="35" y="35" width="10" height="10" fill="#0f172a" />
                <rect x="50" y="35" width="15" height="5" fill="#0f172a" />
                <rect x="70" y="35" width="25" height="5" fill="#0f172a" />

                <rect x="5" y="50" width="5" height="15" fill="#0f172a" />
                <rect x="15" y="55" width="15" height="5" fill="#0f172a" />
                <rect x="35" y="50" width="5" height="25" fill="#0f172a" />
                <rect x="45" y="50" width="20" height="5" fill="#0f172a" />
                <rect x="70" y="45" width="5" height="20" fill="#0f172a" />
                <rect x="80" y="50" width="15" height="10" fill="#0f172a" />

                <rect x="15" y="65" width="15" height="5" fill="#0f172a" />
                <rect x="45" y="60" width="10" height="15" fill="#0f172a" />
                <rect x="60" y="65" width="5" height="15" fill="#0f172a" />
                <rect x="70" y="70" width="20" height="5" fill="#0f172a" />
                
                <rect x="45" y="80" width="15" height="5" fill="#0f172a" />
                <rect x="5" y="90" width="90" height="5" fill="#0f172a" />
              </svg>
            </div>

            <h4 className="qrTitle">{visitorName}</h4>
            <p className="qrMeta">
              {dui ? `DUI: ${dui}` : 'Pase temporal sin documento'}
            </p>
            <p className="qrMeta" style={{ color: 'var(--success)', fontWeight: '600', marginTop: '0.25rem' }}>
              Válido por 24 horas • Caseta Notificada
            </p>

            <button
              onClick={handleReset}
              className="btnSecondary"
              style={{ width: '100%', marginTop: '1.5rem' }}
            >
              Registrar Otro Invitado
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
