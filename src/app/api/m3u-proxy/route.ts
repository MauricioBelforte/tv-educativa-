import { NextRequest } from 'next/server'

/**
 * API Route: GET /api/m3u-proxy?url=https://...
 * 
 * Proxy para descargar listas M3U desde URLs externas.
 * El servidor Next.js no tiene restricciones CORS, por lo que
 * puede descargar cualquier lista M3U pública.
 * 
 * El servidor Next.js descarga la lista y la devuelve al frontend,
 * evitando así las restricciones CORS del navegador.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const targetUrl = searchParams.get('url')
  
  if (!targetUrl) {
    return Response.json(
      { error: 'Se requiere el parámetro "url"' },
      { status: 400 }
    )
  }

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': '*/*',
      },
      // Timeout de 10 segundos
      signal: AbortSignal.timeout(10000),
    })

    if (!response.ok) {
      return Response.json(
        { error: `Error HTTP ${response.status}: ${response.statusText}` },
        { status: response.status }
      )
    }

    const content = await response.text()

    // Validar que sea una lista M3U
    if (!content.includes('#EXTM3U')) {
      return Response.json(
        { error: 'El archivo no es una lista M3U válida (no contiene #EXTM3U)' },
        { status: 400 }
      )
    }

    return new Response(content, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (error) {
    console.error('Error fetching M3U:', error)
    
    if (error instanceof DOMException && error.name === 'TimeoutError') {
      return Response.json(
        { error: 'Tiempo de espera agotado al descargar la lista' },
        { status: 504 }
      )
    }

    return Response.json(
      { error: 'Error al descargar la lista M3U. Verifica que la URL sea accesible.' },
      { status: 500 }
    )
  }
}