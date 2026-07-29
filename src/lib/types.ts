export interface Channel {
  id: string
  name: string
  logo: string
  url: string
  category: string
  isLive: boolean
  playerType?: 'hls' | 'iframe'
}

export interface ChannelsResponse {
  channels: Channel[]
  categories: string[]
}

/**
 * Representa una lista M3U importada por el usuario.
 * Cada lista es independiente y tiene sus propios canales.
 */
export interface ImportedList {
  id: string
  name: string
  description?: string
  channels: Channel[]
  createdAt: string
  sourceUrl?: string
  lastRefreshed?: string
  /** Indica que la lista proviene de variables de entorno (Vercel) y su URL no se expone al cliente */
  isPrivate?: boolean
}

export interface EPGEntry {
  start: string
  stop: string
  title: string
  description?: string
  category?: string
}

export interface ChannelEPG {
  channelId: string
  entries: EPGEntry[]
}

export interface RefreshResult {
  success: boolean
  channels: Channel[]
  error?: string
}