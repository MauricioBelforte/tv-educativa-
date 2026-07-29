import { NextRequest } from 'next/server'
import { parseM3U } from '@/lib/m3u-parser'

const APP_PASSWORD = process.env.APP_PASSWORD || ''

export async function GET(request: NextRequest) {
  const pwd = request.nextUrl.searchParams.get('password')
  if (pwd !== APP_PASSWORD) return Response.json([])

  const lists: { name: string; channels: ReturnType<typeof parseM3U> }[] = []
  let i = 1

  while (process.env[`PRIVATE_LIST_${i}_URL`] || process.env[`PRIVATE_LIST_${i}_CONTENT`]) {
    const name = process.env[`PRIVATE_LIST_${i}_NAME`] || `Lista Privada ${i}`
    let content: string | null = null

    const url = process.env[`PRIVATE_LIST_${i}_URL`]
    if (url) {
      const auth = process.env[`PRIVATE_LIST_${i}_AUTH`]
      const headers: Record<string, string> = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': '*/*',
      }
      if (auth) {
        headers['Authorization'] = `Basic ${Buffer.from(auth).toString('base64')}`
      }
      try {
        const res = await fetch(url, { headers, signal: AbortSignal.timeout(15000) })
        if (res.ok) content = await res.text()
        else console.error(`[private-lists] Error HTTP ${res.status} para ${name}`)
      } catch (error) {
        console.error(`[private-lists] Error al obtener ${name}:`, error)
      }
    }

    if (!content) {
      const b64 = process.env[`PRIVATE_LIST_${i}_CONTENT`]
      if (b64) {
        try {
          content = Buffer.from(b64, 'base64').toString('utf-8')
        } catch {
          console.error(`[private-lists] Error decodificando base64 para ${name}`)
        }
      }
    }

    if (content && content.includes('#EXTM3U')) {
      const channels = parseM3U(content)
      lists.push({ name, channels })
    } else if (content) {
      console.error(`[private-lists] ${name} no contiene #EXTM3U`)
    }

    i++
  }

  return Response.json(lists)
}
