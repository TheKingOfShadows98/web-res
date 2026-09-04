/**
 * @file crypto.ts
 * @description Utilidades de cálculo y encadenamiento criptográfico (SHA-256) para recibos y movimientos financieros.
 */

export interface ReceiptHashPayload {
  correlativo: string;
  concepto: string;
  cantidad: number;
  comprobante: string | null;
  fecha: string;
  prev_hash: string;
}

/**
 * Calcula el hash SHA-256 en formato hexadecimal de un string.
 * Compatible con Web Crypto API en navegadores modernos y Node.js.
 */
export async function calculateSha256(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);

  if (typeof globalThis !== 'undefined' && globalThis.crypto?.subtle) {
    const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  // Fallback asíncrono para entornos Node puros
  const { createHash } = await import('crypto');
  return createHash('sha256').update(data).digest('hex');
}

/**
 * Genera el hash de un recibo a partir de su payload canónico y determinista.
 */
export async function generateReceiptHash(payload: ReceiptHashPayload): Promise<string> {
  const canonicalObject: ReceiptHashPayload = {
    correlativo: String(payload.correlativo || ''),
    concepto: String(payload.concepto || '').trim(),
    cantidad: Number(payload.cantidad) || 0,
    comprobante: payload.comprobante ? String(payload.comprobante).trim() : null,
    fecha: String(payload.fecha || ''),
    prev_hash: String(payload.prev_hash || ''),
  };

  const serialized = JSON.stringify(canonicalObject);
  return calculateSha256(serialized);
}
