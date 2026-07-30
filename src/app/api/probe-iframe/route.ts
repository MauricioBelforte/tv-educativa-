import { NextRequest, NextResponse } from 'next/server'

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'

const TIMEOUT_MS = 15000

const M3U8_RE = /https?:\/\/[^"'\s<>]+\.m3u8[^"'\s<>]*/gi
const HLS_RE = /(?:src|source|file|url|href)\s*[:=]\s*["']([^"']+\.m3u8[^"']*)["']/gi

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const rawUrl = searchParams.get('url')

  if (!rawUrl) {
    return NextResponse.json({ error: 'Falta URL' }, { status: 400 })
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
    const targetOrigin = new URL(targetUrl).origin
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': USER_AGENT,
        'Referer': targetOrigin + '/',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      signal: controller.signal,
      redirect: 'follow',
    })

    if (!response.ok) {
      return NextResponse.json({ found: false, error: `HTTP ${response.status}` })
    }

    const contentType = response.headers.get('content-type') || ''
    const text = await response.text()

    // Si ya es un playlist m3u8, devolver la URL directamente
    if (text.trim().startsWith('#EXTM3U')) {
      return NextResponse.json({ found: true, url: targetUrl, source: 'direct' })
    }

    // Buscar URLs .m3u8 en el HTML
    const directMatches = [...text.matchAll(M3U8_RE)].map(m => m[0])
    const attrMatches = [...text.matchAll(HLS_RE)].map(m => m[1])

    const allMatches = [...new Set([...directMatches, ...attrMatches])]

    if (allMatches.length > 0) {
      return NextResponse.json({ found: true, url: allMatches[0], allUrls: allMatches, source: 'scraped' })
    }

    return NextResponse.json({ found: false, contentType })
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return NextResponse.json({ found: false, error: 'timeout' })
    }
    return NextResponse.json({ found: false, error: 'fetch_error' })
  } finally {
    clearTimeout(timeoutId)
  }
}
