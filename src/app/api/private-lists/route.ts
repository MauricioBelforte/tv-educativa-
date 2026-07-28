import { parseM3U } from '@/lib/m3u-parser'

/**
 * API Route: GET /api/private-lists
 *
 * Sirve las listas privadas configuradas en variables de entorno.
 * Las URLs y credenciales nunca se exponen al cliente.
 *
 * Variables de entorno esperadas:
 *   PRIVATE_LIST_1_URL=https://...
 *   PRIVATE_LIST_1_NAME=Mi Lista        (opcional)
 *   PRIVATE_LIST_1_AUTH=user:pass       (opcional, Basic Auth)
 *   PRIVATE_LIST_2_URL=...
 *   ... (se incrementa el numero)
 */
export async function GET() {
  const lists: { name: string; channels: ReturnType<typeof parseM3U> }[] = []
  let i = 1

  while (process.env[`PRIVATE_LIST_${i}_URL`]) {
    const url = process.env[`PRIVATE_LIST_${i}_URL`]!
    const name = process.env[`PRIVATE_LIST_${i}_NAME`] || `Lista Privada ${i}`
    const auth = process.env[`PRIVATE_LIST_${i}_AUTH`]

    const headers: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': '*/*',
    }

    if (auth) {
      headers['Authorization'] = `Basic ${Buffer.from(auth).toString('base64')}`
    }

    try {
      const response = await fetch(url, {
        headers,
        signal: AbortSignal.timeout(15000),
      })

      if (!response.ok) {
        console.error(`[private-lists] Error HTTP ${response.status} para ${name}`)
        i++
        continue
      }

      const content = await response.text()

      if (!content.includes('#EXTM3U')) {
        console.error(`[private-lists] ${name} no contiene #EXTM3U`)
        i++
        continue
      }

      const channels = parseM3U(content)
      lists.push({ name, channels })
    } catch (error) {
      console.error(`[private-lists] Error al obtener ${name}:`, error)
    }

    i++
  }

  return Response.json(lists)
}
