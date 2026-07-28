const BASE = process.env.SUPABASE_URL
const KEY = process.env.SUPABASE_SERVICE_KEY

function auth() {
  return { 'apikey': KEY!, 'Authorization': `Bearer ${KEY!}`, 'Content-Type': 'application/json' }
}

export async function supabaseGet() {
  if (!BASE || !KEY) return null
  const res = await fetch(`${BASE}/rest/v1/sync_data?id=eq.1&select=data`, { headers: auth() })
  if (!res.ok) throw new Error(`GET error ${res.status}: ${await res.text()}`)
  const rows = await res.json()
  if (!rows || rows.length === 0) return null
  return rows[0].data || []
}

export async function supabaseUpsert(data: unknown) {
  if (!BASE || !KEY) return
  const res = await fetch(`${BASE}/rest/v1/sync_data`, {
    method: 'POST',
    headers: { ...auth(), 'Prefer': 'resolution=merge-duplicates' },
    body: JSON.stringify({ id: 1, data, updated_at: new Date().toISOString() }),
  })
  if (!res.ok) throw new Error(`UPSERT error ${res.status}: ${await res.text()}`)
}
