import { NextRequest, NextResponse } from 'next/server'

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'

const TIMEOUT_MS = 15000

function buildProxyUrl(proxyBase: string, targetUrl: string): string {
  const proxy = new URL('/api/stream-proxy', proxyBase)
  proxy.searchParams.set('url', targetUrl)
  return proxy.toString()
}

function rewritePlaylist(playlist: string, baseUrlStr: string, proxyBase: string): string {
  const base = new URL(baseUrlStr)
  const lines = playlist.split('\n')
  return lines
    .map((line) => {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) return line
      try {
        const resolved = new URL(trimmed, base).toString()
        return buildProxyUrl(proxyBase, encodeURIComponent(resolved))
      } catch {
        return line
      }
    })
    .join('\n')
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const rawUrl = searchParams.get('url')

  if (!rawUrl) {
    return NextResponse.json({ error: 'Falta el parámetro "url"' }, { status: 400 })
  }

  let targetUrl: string
  try {
    targetUrl = decodeURIComponent(rawUrl)
    new URL(targetUrl)
  } catch {
    return NextResponse.json({ error: 'URL inválida' }, { status: 400 })
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const response = await fetch(targetUrl, {
      headers: { 'User-Agent': USER_AGENT },
      signal: controller.signal,
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: `El servidor remoto respondió con estado ${response.status}` },
        { status: response.status },
      )
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream'
    const isM3u8 = targetUrl.endsWith('.m3u8') || contentType.includes('mpegurl') || contentType.includes('x-mpegurl')
    const arrayBuffer = await response.arrayBuffer()

    // La base para reescribir las URLs del playlist: nuestro propio servidor
    const reqUrl = new URL(request.url)
    const proxyBase = `${reqUrl.protocol}//${reqUrl.host}`

    let body: string | ArrayBuffer
    if (isM3u8) {
      const playlist = new TextDecoder().decode(arrayBuffer)
      body = rewritePlaylist(playlist, targetUrl, proxyBase)
    } else {
      body = arrayBuffer
    }

    return new NextResponse(body, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': isM3u8 ? 'application/vnd.apple.mpegurl' : contentType,
        'Cache-Control': 'no-cache',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': '*',
        'X-Proxy-URL': targetUrl,
      },
    })
  } catch (error: unknown) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return NextResponse.json({ error: 'Tiempo de espera agotado' }, { status: 504 })
    }
    return NextResponse.json({ error: 'Error al obtener el stream' }, { status: 502 })
  } finally {
    clearTimeout(timeoutId)
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': '*',
    },
  })
}
