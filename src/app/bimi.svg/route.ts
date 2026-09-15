import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Endpoint GET para servir el logotipo oficial de BIMI (SVG Tiny P/S compatible).
 * URL: https://residencialmexico.com/bimi.svg
 */
export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'public', 'residencialMexico.svg');

    if (!fs.existsSync(filePath)) {
      return new NextResponse('Archivo SVG no encontrado', { status: 404 });
    }

    const svgContent = fs.readFileSync(filePath, 'utf8');

    return new NextResponse(svgContent, {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Cache-Control': 'public, max-age=604800, stale-while-revalidate=86400, immutable',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('Error al servir BIMI SVG:', error);
    return new NextResponse('Error interno al servir el SVG', { status: 500 });
  }
}
