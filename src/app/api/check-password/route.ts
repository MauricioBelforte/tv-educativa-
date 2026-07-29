import { NextRequest } from 'next/server'

const APP_PASSWORD = process.env.APP_PASSWORD || ''

export async function GET(request: NextRequest) {
  const p = request.nextUrl.searchParams.get('p')
  return Response.json({ ok: p === APP_PASSWORD })
}
