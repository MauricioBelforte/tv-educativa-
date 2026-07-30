'use client'

import { useRef, useState } from 'react'
import { Channel } from '@/lib/types'
import ChannelCard from './ChannelCard'

interface ChannelListProps {
  channels: Channel[]
  isLoading: boolean
  reorderMode?: boolean
  listId?: string | null
  onReorder?: (listId: string, channelId: string, targetChannelId: string) => void
}

export default function ChannelList({ channels, isLoading, reorderMode, listId, onReorder }: ChannelListProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const dragNode = useRef<HTMLElement | null>(null)

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

  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (!reorderMode) return
    setDragIndex(index)
    dragNode.current = e.currentTarget as HTMLElement
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', String(index))
    setTimeout(() => {
      if (dragNode.current) dragNode.current.style.opacity = '0.5'
    }, 0)
  }

  const handleDragEnd = () => {
    if (dragNode.current) dragNode.current.style.opacity = ''
    setDragIndex(null)
    setDragOverIndex(null)
    dragNode.current = null
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (!reorderMode || dragIndex === null) return
    setDragOverIndex(index)
  }

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (!reorderMode || dragIndex === null || dragIndex === index) {
      setDragIndex(null)
      setDragOverIndex(null)
      return
    }
    if (listId && onReorder) {
      const fromChannel = channels[dragIndex]
      const toChannel = channels[index]
      if (fromChannel && toChannel) {
        onReorder(listId, fromChannel.id, toChannel.id)
      }
    }
    setDragIndex(null)
    setDragOverIndex(null)
  }

  const handleDragLeave = () => {
    setDragOverIndex(null)
  }

  return (
    <div className="space-y-1 select-none">
      {channels.map((channel, index) => {
        const isDragging = dragIndex === index
        const isOver = dragOverIndex === index && dragIndex !== index
        return (
          <div
            key={channel.id}
            draggable={reorderMode}
            onDragStart={(e) => handleDragStart(e, index)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={(e) => handleDrop(e, index)}
            onDragLeave={handleDragLeave}
            className={`transition-all duration-150 ${isDragging ? 'opacity-50' : ''} ${isOver ? 'translate-y-1 border-t-2 border-blue-500' : ''} ${reorderMode ? 'cursor-grab active:cursor-grabbing' : ''}`}
          >
            <ChannelCard channel={channel} />
          </div>
        )
      })}
    </div>
  )
}