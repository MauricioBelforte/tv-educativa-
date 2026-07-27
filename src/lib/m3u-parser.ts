import { Channel } from './types'

/**
 * Parsea el contenido de un archivo M3U (formato IPTV) y devuelve un array de canales.
 * 
 * Formato M3U IPTV:
 * #EXTM3U
 * #EXTINF:-1 tvg-id="cnn" tvg-name="CNN" tvg-logo="https://..." group-title="News",CNN
 * http://stream.url/playlist.m3u8
 */
export function parseM3U(content: string): Channel[] {
  const lines = content.split('\n')
  const channels: Channel[] = []
  
  let currentExtInf: string | null = null
  
  for (const line of lines) {
    const trimmed = line.trim()
    
    if (trimmed.startsWith('#EXTINF:')) {
      currentExtInf = trimmed
    } else if (currentExtInf && !trimmed.startsWith('#') && trimmed.length > 0) {
      // La línea después de #EXTINF es la URL del stream
      const channel = parseChannel(currentExtInf, trimmed)
      if (channel) {
        channels.push(channel)
      }
      currentExtInf = null
    }
  }
  
  return channels
}

function parseChannel(extInf: string, url: string): Channel | null {
  try {
    // Extraer tvg-id
    const idMatch = extInf.match(/tvg-id="([^"]*)"/)
    const id = idMatch?.[1] || `channel-${Math.random().toString(36).substr(2, 9)}`
    
    // Extraer tvg-name (o usar el nombre después de la coma)
    const nameMatch = extInf.match(/tvg-name="([^"]*)"/)
    let name = nameMatch?.[1]
    if (!name) {
      const commaIndex = extInf.lastIndexOf(',')
      name = commaIndex !== -1 ? extInf.substring(commaIndex + 1).trim() : 'Unknown'
    }
    
    // Extraer tvg-logo
    const logoMatch = extInf.match(/tvg-logo="([^"]*)"/)
    const logo = logoMatch?.[1] || `https://via.placeholder.com/80x80/3b82f6/ffffff?text=${encodeURIComponent(name.charAt(0))}`
    
    // Extraer group-title (categoría)
    const categoryMatch = extInf.match(/group-title="([^"]*)"/)
    const category = categoryMatch?.[1] || 'General'
    
    return {
      id,
      name,
      logo,
      url: url.trim(),
      category,
      isLive: true,
    }
  } catch {
    return null
  }
}