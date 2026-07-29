import { NextRequest } from 'next/server'
import { supabaseGet, supabaseUpsert } from '@/lib/supabase'

const APP_PASSWORD = process.env.APP_PASSWORD || ''

function isAuthorized(request: NextRequest) {
  return request.nextUrl.searchParams.get('password') === APP_PASSWORD
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) return Response.json([])
  try {
    const data = await supabaseGet()
    if (data === null) return Response.json({ lists: [], favorites: [], activeListNames: [] })
    // Compatibilidad: si es array viejo, convertirlo
    if (Array.isArray(data)) return Response.json({ lists: data, favorites: [], activeListNames: [] })
    // Compatibilidad: si trae activeSources (IDs viejos) ignorarlo
    if (!data.activeListNames) data.activeListNames = []
    return Response.json(data)
  } catch (error) {
    console.error('[sync-lists] Error GET:', error)
    return Response.json({ error: String(error) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) return Response.json({ error: 'No autorizado' }, { status: 401 })
  let body: { lists: unknown[]; favorites?: string[]; activeListNames?: string[] }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'JSON invalido' }, { status: 400 })
  }
  if (!Array.isArray(body?.lists)) {
    return Response.json({ error: 'Se requiere { lists: [...] }' }, { status: 400 })
  }
  try {
    await supabaseUpsert({
      lists: body.lists,
      favorites: body.favorites || [],
      activeListNames: body.activeListNames || [],
    })
    return Response.json({ success: true, favorites: body.favorites || [], activeListNames: body.activeListNames || [] })
  } catch (error) {
    console.error('[sync-lists] Error POST:', error)
    return Response.json({ error: String(error) }, { status: 500 })
  }
}
