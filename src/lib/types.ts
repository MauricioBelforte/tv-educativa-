export interface Channel {
  id: string
  name: string
  logo: string
  url: string
  category: string
  isLive: boolean
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
  channels: Channel[]
  createdAt: string
  sourceUrl?: string
}