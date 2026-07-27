import { NextRequest, NextResponse } from 'next/server'
import epgData from '@/data/epg-data.json'
import type { EPGEntry } from '@/lib/types'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const channelId = searchParams.get('channel')

  const epg = epgData.epg as { channelId: string; entries: EPGEntry[] }[]

  if (channelId) {
    const channelEpg = epg.find(e => e.channelId === channelId)
    if (!channelEpg) {
      return NextResponse.json({ entries: [], now: null, next: [] })
    }

    const now = new Date()
    const nowEntry = channelEpg.entries.find(e => {
      const start = new Date(e.start)
      const stop = new Date(e.stop)
      return now >= start && now < stop
    })

    const nextEntries = channelEpg.entries.filter(e => new Date(e.start) >= now)
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())

    return NextResponse.json({
      entries: channelEpg.entries,
      now: nowEntry || null,
      next: nextEntries.slice(0, 5),
    })
  }

  return NextResponse.json({ epg })
}
