import { describe, it, expect } from 'vitest';
import { GET } from '@/app/bimi.svg/route';

describe('GET /bimi.svg', () => {
  it('retorna el contenido SVG con encabezados de Content-Type y CORS para BIMI', async () => {
    const res = await GET();
    const text = await res.text();

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('image/svg+xml');
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(text).toContain('<svg');
  });
});
