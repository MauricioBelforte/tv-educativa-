import { NextRequest, NextResponse } from 'next/server'
import { parseM3U } from '@/lib/m3u-parser'
import type { Channel } from '@/lib/types'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const url = searchParams.get('url')

    if (!id || !url) {
      return NextResponse.json(
        { success: false, error: 'Faltan parámetros requeridos: id y url' },
        { status: 400 }
      )
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)

    let m3uContent: string

    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        signal: controller.signal,
      })

      if (!response.ok) {
        return NextResponse.json(
          { success: false, error: `Error al descargar la lista M3U: ${response.status} ${response.statusText}` },
          { status: 502 }
        )
      }

      m3uContent = await response.text()
    } catch (fetchError: unknown) {
      if (fetchError instanceof DOMException && fetchError.name === 'AbortError') {
        return NextResponse.json(
          { success: false, error: 'La descarga de la lista M3U excedió el tiempo de espera (10s)' },
          { status: 504 }
        )
      }
      return NextResponse.json(
        { success: false, error: `Error de conexión al descargar la lista M3U: ${fetchError instanceof Error ? fetchError.message : 'Error desconocido'}` },
        { status: 502 }
      )
    } finally {
      clearTimeout(timeout)
    }

    if (!m3uContent.trim().startsWith('#EXTM3U')) {
      return NextResponse.json(
        { success: false, error: 'El contenido descargado no es una lista M3U válida' },
        { status: 400 }
      )
    }

    let channels: Channel[]
    try {
      channels = parseM3U(m3uContent)
    } catch {
      return NextResponse.json(
        { success: false, error: 'Error al parsear el contenido M3U' },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true, channels })
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: `Error interno del servidor: ${error instanceof Error ? error.message : 'Error desconocido'}` },
      { status: 500 }
    )
  }
}
