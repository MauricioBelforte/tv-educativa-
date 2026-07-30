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
  let hasExtInf = false
  
  for (const line of lines) {
    const trimmed = line.trim()
    
    if (trimmed.startsWith('#EXTINF:')) {
      hasExtInf = true
      currentExtInf = trimmed
    } else if (currentExtInf && !trimmed.startsWith('#') && trimmed.length > 0) {
      const channel = parseChannel(currentExtInf, trimmed)
      if (channel) channels.push(channel)
      currentExtInf = null
    }
  }
  
  // Si no había #EXTINF, tratar cada línea como URL directa
  if (!hasExtInf) {
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('//')) continue
      try {
        const parsed = new URL(trimmed)
        const name = parsed.searchParams.get('stream') || parsed.searchParams.get('channel') || parsed.pathname.split('/').pop()?.split('.')[0] || parsed.hostname
        channels.push({
          id: `inline-${Math.random().toString(36).substr(2, 9)}`,
          name,
          logo: `https://via.placeholder.com/80x80/3b82f6/ffffff?text=${encodeURIComponent(name.charAt(0).toUpperCase())}`,
          url: trimmed,
          category: 'General',
          isLive: true,
          playerType: trimmed.includes('.m3u8') ? 'hls' : 'iframe',
        })
      } catch {
        // no es URL válida, ignorar
      }
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
      playerType: url.includes('.m3u8') ? 'hls' : 'iframe',
    }
  } catch {
    return null
  }
}