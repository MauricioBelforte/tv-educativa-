'use client'

import { Channel } from '@/lib/types'
import ChannelCard from './ChannelCard'

interface ChannelListProps {
  channels: Channel[]
  isLoading: boolean
}

export default function ChannelList({ channels, isLoading }: ChannelListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-3 rounded-lg bg-gray-800 animate-pulse"
          >
            <div className="w-12 h-12 rounded-lg bg-gray-700" />
            <div className="flex-1">
              <div className="h-4 bg-gray-700 rounded w-32 mb-2" />
              <div className="h-3 bg-gray-700 rounded w-20" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (channels.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="w-12 h-12 mx-auto mb-3 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <p className="text-gray-400">No se encontraron canales</p>
        <p className="text-gray-600 text-sm mt-1">Intenta con otra búsqueda o categoría</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {channels.map((channel) => (
        <ChannelCard key={channel.id} channel={channel} />
      ))}
    </div>
  )
}