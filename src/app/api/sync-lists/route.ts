import { NextRequest } from 'next/server'
import { getSupabase } from '@/lib/supabase'

/**
 * GET /api/sync-lists
 * Devuelve las listas guardadas en Supabase.
 * Se importan al cargar la app.
 */
export async function GET() {
  const supabase = getSupabase()
  if (!supabase) {
    return Response.json({ error: 'Supabase no configurado' }, { status: 500 })
  }

  const { data, error } = await supabase
    .from('sync_data')
    .select('data')
    .eq('id', 1)
    .single()

  if (error) {
    console.error('[sync-lists] Error al leer:', error)
    return Response.json({ error: 'Error al leer datos' }, { status: 500 })
  }

  return Response.json(data?.data || [])
}

/**
 * POST /api/sync-lists
 * Body: { lists: { name: string; channels: Channel[] }[] }
 * Guarda las listas en Supabase (reemplaza todo).
 * Solo accesible desde el mismo origen.
 */
export async function POST(request: NextRequest) {
  const supabase = getSupabase()
  if (!supabase) {
    return Response.json({ error: 'Supabase no configurado' }, { status: 500 })
  }

  let body: { lists: unknown[] }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'JSON invalido' }, { status: 400 })
  }

  if (!Array.isArray(body?.lists)) {
    return Response.json({ error: 'Se requiere { lists: [...] }' }, { status: 400 })
  }

  const { error } = await supabase
    .from('sync_data')
    .upsert({ id: 1, data: body.lists, updated_at: new Date().toISOString() })

  if (error) {
    console.error('[sync-lists] Error al guardar:', error)
    return Response.json({ error: 'Error al guardar' }, { status: 500 })
  }

  return Response.json({ success: true })
}
