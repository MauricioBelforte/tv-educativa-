import { Channel, ChannelsResponse } from './types'
import channelsData from '@/data/channels.json'
import { parseM3U } from './m3u-parser'
import { loadLocalM3UFiles } from './local-loader'

/**
 * Obtiene los canales desde la fuente de datos.
 * 
 * En este proyecto educativo:
 * - Usamos channels.json como fuente principal
 * - Los archivos .m3u en local/ se cargan automáticamente
 * - El parser M3U también está disponible para importación manual
 */

interface GetChannelsParams {
  category?: string | null
  search?: string | null
  m3uContent?: string | null
}

export async function getChannels(params: GetChannelsParams = {}): Promise<ChannelsResponse> {
  const { category, search, m3uContent } = params
  
  let channels: Channel[] = []
  
  if (m3uContent) {
    channels = parseM3U(m3uContent)
  } else {
    const defaultChannels = channelsData.channels as Channel[]
    const localChannels = loadLocalM3UFiles()
    const seenIds = new Set<string>()
    channels = [...defaultChannels, ...localChannels].filter(ch => {
      if (seenIds.has(ch.id)) return false
      seenIds.add(ch.id)
      return true
    })
  }
  
  if (category) {
    channels = channels.filter(c => c.category === category)
  }
  
  if (search) {
    const query = search.toLowerCase()
    channels = channels.filter(c => c.name.toLowerCase().includes(query))
  }
  
  const categories = [...new Set(channels.map(c => c.category))].sort()
  
  return { channels, categories }
}