import { Channel } from './types'
import { parseM3U } from './m3u-parser'
import fs from 'fs'
import path from 'path'

const LOCAL_DIR = path.join(process.cwd(), 'local')

export function loadLocalM3UFiles(): Channel[] {
  try {
    if (!fs.existsSync(LOCAL_DIR)) return []

    const files = fs.readdirSync(LOCAL_DIR).filter(f => f.endsWith('.m3u'))
    const allChannels: Channel[] = []
    const seenIds = new Set<string>()

    for (const file of files) {
      const content = fs.readFileSync(path.join(LOCAL_DIR, file), 'utf-8')
      const channels = parseM3U(content)

      for (const ch of channels) {
        if (!seenIds.has(ch.id)) {
          seenIds.add(ch.id)
          allChannels.push(ch)
        }
      }
    }

    return allChannels
  } catch {
    return []
  }
}
