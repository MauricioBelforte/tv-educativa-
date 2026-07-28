import { NextRequest } from 'next/server'
import { supabaseGet, supabaseUpsert } from '@/lib/supabase'

export async function GET() {
  try {
    const data = await supabaseGet()
    if (data === null) {
      return Response.json({ error: 'Supabase no configurado' }, { status: 500 })
    }
    return Response.json(data)
  } catch (error) {
    console.error('[sync-lists] Error GET:', error)
    return Response.json({ error: String(error) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  let body: { lists: unknown[] }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'JSON invalido' }, { status: 400 })
  }
  if (!Array.isArray(body?.lists)) {
    return Response.json({ error: 'Se requiere { lists: [...] }' }, { status: 400 })
  }
  try {
    await supabaseUpsert(body.lists)
    return Response.json({ success: true })
  } catch (error) {
    console.error('[sync-lists] Error POST:', error)
    return Response.json({ error: String(error) }, { status: 500 })
  }
}
