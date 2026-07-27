'use client'

import { useState, useRef, useEffect } from 'react'
import { Channel } from '@/lib/types'
import { usePlayerStore } from '@/store/player-store'

interface ChannelCardProps {
  channel: Channel
  listId?: string
  allCategories?: string[]
}

export default function ChannelCard({ channel, listId, allCategories = [] }: ChannelCardProps) {
  const setChannel = usePlayerStore((state) => state.setChannel)
  const currentChannel = usePlayerStore((state) => state.currentChannel)
  const toggleFavorite = usePlayerStore((state) => state.toggleFavorite)
  const isFavorite = usePlayerStore((state) => state.isFavorite)
  const changeChannelCategory = usePlayerStore((state) => state.changeChannelCategory)
  const moveChannelToList = usePlayerStore((state) => state.moveChannelToList)
  const importedLists = usePlayerStore((state) => state.importedLists)

  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const isActive = currentChannel?.id === channel.id
  const favorite = isFavorite(channel.id)

  const getFallbackLogo = (name: string) => {
    const initial = name?.trim()?.charAt(0)?.toUpperCase() || '?'
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
        <rect width="96" height="96" rx="16" fill="#1d4ed8" />
        <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="38" fill="white">${initial}</text>
      </svg>
    `
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
  }

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

  // Obtener categorías únicas de esta lista + otras listas
  const categories = listId ? [...new Set(allCategories)] : []

  return (
    <div className="relative group">
      <div
        role="button"
        tabIndex={0}
        onClick={() => setChannel(channel)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setChannel(channel)
          }
        }}
        className={`
          relative flex items-center gap-3 p-3 pr-20 rounded-lg transition-all duration-200 text-left w-full cursor-pointer
          ${isActive 
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25 scale-[1.02]' 
            : 'bg-gray-800 hover:bg-gray-700 text-gray-200 hover:scale-[1.02]'
          }
        `}
      >
        {/* Logo del canal */}
        <div className="relative flex-shrink-0">
          <img
            src={channel.logo?.trim() ? channel.logo : getFallbackLogo(channel.name)}
            alt={channel.name}
            className="w-12 h-12 rounded-lg object-cover"
            onError={(e) => {
              const target = e.currentTarget as HTMLImageElement
              target.onerror = null
              target.src = getFallbackLogo(channel.name)
            }}
          />
          {channel.isLive && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          )}
        </div>

        {/* Info del canal */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{channel.name}</p>
          <p className={`text-xs mt-0.5 ${isActive ? 'text-blue-200' : 'text-gray-400'}`}>
            {channel.category}
          </p>
        </div>
      </div>

      <div className="absolute right-2 top-2 flex items-center gap-1 z-10">
        {/* Botón de favorito */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            toggleFavorite(channel.id)
          }}
          className={`
            p-1.5 rounded-full transition-colors flex-shrink-0
            ${favorite 
              ? 'text-yellow-400 hover:text-yellow-300 bg-gray-900/70' 
              : 'text-gray-500 hover:text-gray-300 bg-gray-900/70'
            }
          `}
          title={favorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
        >
          <svg className="w-4 h-4" fill={favorite ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        </button>

        {/* Menú de 3 puntos */}
        {listId && (
          <div ref={menuRef}>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setMenuOpen(!menuOpen)
              }}
              className="p-1.5 rounded-full text-gray-500 hover:text-gray-300 hover:bg-gray-700/50 transition-colors flex-shrink-0 bg-gray-900/70"
              title="Más opciones"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="5" r="2" />
                <circle cx="12" cy="12" r="2" />
                <circle cx="12" cy="19" r="2" />
              </svg>
            </button>

            {/* Dropdown del menú */}
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 py-1">
                <p className="px-3 py-1.5 text-xs text-gray-500 uppercase tracking-wider">Cambiar categoría</p>
                {categories.filter(c => c !== channel.category).map((cat) => (
                  <button
                    key={cat}
                    onClick={(e) => {
                      e.stopPropagation()
                      if (listId) changeChannelCategory(listId, channel.id, cat)
                      setMenuOpen(false)
                    }}
                    className="w-full text-left px-3 py-1.5 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                  >
                    {cat}
                  </button>
                ))}

                {/* Mover a otra lista */}
                {importedLists.length > 1 && (
                  <>
                    <div className="border-t border-gray-700 my-1" />
                    <p className="px-3 py-1.5 text-xs text-gray-500 uppercase tracking-wider">Mover a lista</p>
                    {importedLists.filter(l => l.id !== listId).map((targetList) => (
                      <button
                        key={targetList.id}
                        onClick={(e) => {
                          e.stopPropagation()
                          if (listId) moveChannelToList(listId, channel.id, targetList.id)
                          setMenuOpen(false)
                        }}
                        className="w-full text-left px-3 py-1.5 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                      >
                        {targetList.name}
                      </button>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}