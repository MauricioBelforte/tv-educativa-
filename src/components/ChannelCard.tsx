'use client'

import { useState, useRef, useEffect } from 'react'
import { Channel } from '@/lib/types'
import { usePlayerStore } from '@/store/player-store'

interface ChannelCardProps {
  channel: Channel
  listId?: string
  allCategories?: string[]
}

export default function ChannelCard({ channel, listId: propListId, allCategories = [] }: ChannelCardProps) {
  const setChannel = usePlayerStore((state) => state.setChannel)
  const currentChannel = usePlayerStore((state) => state.currentChannel)
  const toggleFavorite = usePlayerStore((state) => state.toggleFavorite)
  const isFavorite = usePlayerStore((state) => state.isFavorite)
  const changeChannelCategory = usePlayerStore((state) => state.changeChannelCategory)
  const moveChannelToList = usePlayerStore((state) => state.moveChannelToList)
  const importedLists = usePlayerStore((state) => state.importedLists)
  const channelStatus = usePlayerStore((state) => state.channelStatus)
  const renameChannel = usePlayerStore((state) => state.renameChannel)
  const setDetectedStream = usePlayerStore((state) => state.setDetectedStream)
  const clearDetectedStream = usePlayerStore((state) => state.clearDetectedStream)
  const detectedStreams = usePlayerStore((state) => state.detectedStreams)
  const [detecting, setDetecting] = useState(false)

  // Auto-detectar la lista a la que pertenece este canal
  const ownerList = importedLists.find(l => l.channels.some(c => c.id === channel.id))
  const listId = ownerList?.id || propListId

  const [menuOpen, setMenuOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(channel.name)
  const inputRef = useRef<HTMLInputElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const status = !channel.url ? 'offline' : (channelStatus[channel.id])
  const statusColor = status === 'online' ? 'bg-green-500'
    : status === 'offline' ? 'bg-red-500'
    : status === 'checking' ? 'bg-yellow-500 animate-pulse'
    : 'bg-gray-600'

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

  // Auto-focus al renombrar
  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.select()
    }
  }, [editing])

  const saveRename = () => {
    const trimmed = editName.trim()
    if (trimmed && trimmed !== channel.name && listId) {
      renameChannel(listId, channel.id, trimmed)
    }
    setEditing(false)
  }

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
            loading="lazy"
            className="w-12 h-12 rounded-lg object-cover"
            onError={(e) => {
              const target = e.currentTarget as HTMLImageElement
              target.onerror = null
              target.src = getFallbackLogo(channel.name)
            }}
          />
          <span className={`absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-gray-900 ${statusColor}`}
            title={status === 'online' ? 'Señal activa' : status === 'offline' ? 'Sin señal' : status === 'checking' ? 'Verificando...' : ''}
          />
        </div>

        {/* Info del canal */}
        <div className="flex-1 min-w-0">
          {editing ? (
            <input
              ref={inputRef}
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={saveRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveRename()
                if (e.key === 'Escape') { setEditName(channel.name); setEditing(false) }
                e.stopPropagation()
              }}
              className="w-full px-1 py-0.5 bg-gray-900 border border-blue-500 rounded text-sm text-white font-medium focus:outline-none"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <p className="font-medium text-sm truncate">{channel.name}</p>
          )}
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
                  <div className="absolute right-0 top-full mt-1 w-52 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 py-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditName(channel.name)
                        setEditing(true)
                        setMenuOpen(false)
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Renombrar
                    </button>
                    {channel.playerType === 'iframe' && !channel.url.includes('.m3u8') && (
                      <>
                        <div className="border-t border-gray-700 my-1" />
                        <button
                          onClick={async (e) => {
                            e.stopPropagation()
                            setDetecting(true)
                            setMenuOpen(false)
                            try {
                              const res = await fetch(`/api/probe-iframe?url=${encodeURIComponent(channel.url)}`)
                              const data = await res.json()
                              if (data.found && data.url) {
                                setDetectedStream(channel.id, data.url)
                              }
                            } catch {}
                            setDetecting(false)
                          }}
                          disabled={detecting}
                          className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors disabled:text-gray-600"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          {detecting ? 'Detectando...' : detectedStreams[channel.id] ? 'Redetectar stream' : 'Detectar stream directo'}
                        </button>
                        {detectedStreams[channel.id] && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              clearDetectedStream(channel.id)
                              setMenuOpen(false)
                            }}
                            className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                            Volver a iframe
                          </button>
                        )}
                      </>
                    )}
                    <div className="border-t border-gray-700 my-1" />
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