import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

async function fetchWithTimeout(url: string, timeoutMs = 8000): Promise<Response> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0' },
    })
    return res
  } finally {
    clearTimeout(timeout)
  }
}

function resolveUrl(base: string, relative: string): string {
  if (relative.startsWith('http://') || relative.startsWith('https://')) return relative
  const baseUrl = new URL(base)
  return new URL(relative, baseUrl.origin + baseUrl.pathname.substring(0, baseUrl.pathname.lastIndexOf('/') + 1)).href
}

function parseFirstSegment(playlist: string): string | null {
  const lines = playlist.split('\n')
  let foundExtinf = false
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.startsWith('#EXTINF:')) {
      foundExtinf = true
      continue
    }
    if (foundExtinf && !trimmed.startsWith('#') && trimmed.length > 0) {
      return trimmed
    }
    if (trimmed.startsWith('#EXT-X-STREAM-INF:')) {
      foundExtinf = true
      continue
    }
    if (foundExtinf && !trimmed.startsWith('#') && trimmed.length > 0) {
      return trimmed
    }
  }
  return null
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url')
  const deep = request.nextUrl.searchParams.get('deep') === 'true'
  if (!url) return NextResponse.json({ online: false, error: 'URL requerida' }, { status: 400 })

  try {
    const res = await fetchWithTimeout(url, deep ? 12000 : 8000)
    if (!res.ok) return NextResponse.json({ online: false, status: res.status })

    if (!url.includes('.m3u8')) {
      return NextResponse.json({ online: true, status: res.status })
    }

    const text = await res.text()
    const playlistOk = text.includes('#EXTM3U') || text.includes('#EXTINF')

    if (!playlistOk) return NextResponse.json({ online: false, status: res.status })

    if (!deep) return NextResponse.json({ online: true, status: res.status })

    const segment = parseFirstSegment(text)
    if (!segment) return NextResponse.json({ online: false, error: 'no segments' })

    const segmentUrl = resolveUrl(url, segment)
    const segRes = await fetchWithTimeout(segmentUrl, 8000)
    const segOk = segRes.ok && segRes.status < 400

    return NextResponse.json({ online: segOk, status: res.status })
  } catch {
    return NextResponse.json({ online: false, error: 'timeout' })
  }
}
