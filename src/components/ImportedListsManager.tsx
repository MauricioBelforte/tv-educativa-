'use client'

import { useEffect, useState, useRef } from 'react'
import { usePlayerStore } from '@/store/player-store'
import channelsData from '@/data/channels.json'
import { Channel } from '@/lib/types'

interface ImportedListsManagerProps {
  collapseTrigger?: number
}

export default function ImportedListsManager({ collapseTrigger = 0 }: ImportedListsManagerProps) {
  const importedLists = usePlayerStore((state) => state.importedLists)
  const activeListId = usePlayerStore((state) => state.activeListId)
  const activeSources = usePlayerStore((state) => state.activeSources)
  const setActiveList = usePlayerStore((state) => state.setActiveList)
  const toggleSource = usePlayerStore((state) => state.toggleSource)
  const setAllSources = usePlayerStore((state) => state.setAllSources)
  const renameList = usePlayerStore((state) => state.renameList)
  const setListDescription = usePlayerStore((state) => state.setListDescription)
  const removeList = usePlayerStore((state) => state.removeList)
  const reorderLists = usePlayerStore((state) => state.reorderLists)
  const refreshList = usePlayerStore((state) => state.refreshList)
  const isRefreshing = usePlayerStore((state) => state.isRefreshing)

  const [editingListId, setEditingListId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editingDescId, setEditingDescId] = useState<string | null>(null)
  const [editDesc, setEditDesc] = useState('')
  const [expandedListId, setExpandedListId] = useState<string | null>(null)

  const dragIndex = useRef<number | null>(null)
  const dragOverIndex = useRef<number | null>(null)

  useEffect(() => {
    setExpandedListId(null)
  }, [collapseTrigger])



  const formatLastRefreshed = (iso?: string) => {
    if (!iso) return 'Nunca'
    try {
      const d = new Date(iso)
      const now = new Date()
      const diffMs = now.getTime() - d.getTime()
      const diffMin = Math.floor(diffMs / 60000)
      if (diffMin < 1) return 'Ahora'
      if (diffMin < 60) return `Hace ${diffMin} min`
      const diffH = Math.floor(diffMin / 60)
      if (diffH < 24) return `Hace ${diffH}h`
      return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    } catch {
      return '—'
    }
  }

  const handleStartRename = (list: { id: string, name: string }) => {
    setEditingListId(list.id)
    setEditName(list.name)
  }

  const handleSaveRename = (listId: string) => {
    if (editName.trim()) {
      renameList(listId, editName.trim())
    }
    setEditingListId(null)
  }

  const defaultChannels = (channelsData.channels as Channel[]) || []

  return (
    <div className="space-y-2">
      {importedLists.length > 0 && (
        <div className="border-t border-gray-700 pt-2 mt-2">
          <div className="flex items-center justify-between px-3 mb-1">
            <p className="text-xs text-gray-500 uppercase tracking-wider">
              Mis Listas ({importedLists.length})
            </p>
            {importedLists.length >= 2 && (
              <button
                onClick={() => setAllSources(activeSources.length !== importedLists.length)}
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                {activeSources.length === importedLists.length ? 'Deseleccionar todas' : 'Seleccionar todas'}
              </button>
            )}
          </div>
        </div>
      )}

      {importedLists.map((list, index) => {
        const isActive = activeSources.includes(list.id)
        return (
        <div
          key={list.id}
          draggable
          onDragStart={() => { dragIndex.current = index }}
          onDragOver={(e) => {
            e.preventDefault()
            dragOverIndex.current = index
          }}
          onDragEnd={() => {
            if (dragIndex.current !== null && dragOverIndex.current !== null && dragIndex.current !== dragOverIndex.current) {
              reorderLists(dragIndex.current, dragOverIndex.current)
            }
            dragIndex.current = null
            dragOverIndex.current = null
          }}
          className={`rounded-lg overflow-hidden transition-opacity ${dragIndex.current === index ? 'opacity-50' : ''}`}
        >
          {/* Header de la lista (carpeta) */}
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-800/50 hover:bg-gray-800 transition-colors rounded-lg cursor-grab active:cursor-grabbing">
            {/* Checkbox — activar/desactivar fuente */}
            <input
              type="checkbox"
              checked={isActive}
              onChange={() => toggleSource(list.id)}
              onClick={(e) => e.stopPropagation()}
              className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer accent-blue-500 flex-shrink-0"
            />

            {/* Flecha — solo expande/colapsa (no despliega) */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                setExpandedListId(expandedListId === list.id ? null : list.id)
              }}
              className="p-1 rounded hover:bg-gray-700 transition-colors"
              title={expandedListId === list.id ? 'Colapsar' : 'Expandir'}
            >
              <svg 
                className={`w-4 h-4 text-gray-400 transition-transform ${expandedListId === list.id ? 'rotate-90' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Nombre — despliega a la sidebar de canales */}
            <button
              onClick={() => setActiveList(activeListId === list.id ? null : list.id)}
              className="flex items-center gap-2 flex-1 min-w-0 text-left"
            >
              {editingListId === list.id ? (
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onBlur={() => handleSaveRename(list.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveRename(list.id)
                    if (e.key === 'Escape') setEditingListId(null)
                  }}
                  className="flex-1 bg-gray-900 text-white text-sm px-1 py-0.5 rounded border border-blue-500 outline-none"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span className={`text-sm truncate ${
                  activeListId === list.id ? 'text-blue-400 font-medium' : 'text-gray-300'
                }`}>
                  {list.name}
                </span>
              )}
              
              <span className="text-xs text-gray-500 ml-auto">
                {list.channels.length}
              </span>
            </button>

            {/* Botón editar nombre */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleStartRename(list)
              }}
              className="p-1 text-gray-500 hover:text-gray-300 transition-colors"
              title="Renombrar lista"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>

            {/* Botón refrescar lista */}
            {list.sourceUrl && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  refreshList(list.id)
                }}
                disabled={isRefreshing[list.id]}
                className="p-1 text-gray-500 hover:text-blue-400 transition-colors disabled:opacity-50"
                title={list.sourceUrl ? `Refrescar desde URL` : 'Sin URL asociada'}
              >
                <svg className={`w-3.5 h-3.5 ${isRefreshing[list.id] ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            )}

            {/* Botón eliminar lista */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                if (confirm(`¿Eliminar "${list.name}" y todos sus canales?`)) {
                  removeList(list.id)
                }
              }}
              className="p-1 text-gray-500 hover:text-red-400 transition-colors"
              title="Eliminar lista"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>

          {/* Timestamp de última actualización */}
          {list.sourceUrl && list.lastRefreshed && expandedListId === list.id && (
            <div className="px-3 pb-1">
              <p className="text-xs text-gray-600">
                Última actualización: {formatLastRefreshed(list.lastRefreshed)}
              </p>
            </div>
          )}

          {/* Descripción de la lista */}
          {expandedListId === list.id && (
            <div className="px-3 pb-2">
              {editingDescId === list.id ? (
                <div className="space-y-1">
                  <textarea
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    onBlur={() => {
                      setListDescription(list.id, editDesc.trim())
                      setEditingDescId(null)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        setListDescription(list.id, editDesc.trim())
                        setEditingDescId(null)
                      }
                      if (e.key === 'Escape') setEditingDescId(null)
                    }}
                    className="w-full bg-gray-900 text-gray-300 text-xs px-2 py-1.5 rounded border border-blue-500 outline-none resize-none"
                    rows={2}
                    placeholder="Agregar descripción..."
                    autoFocus
                  />
                  <p className="text-[10px] text-gray-600">Enter para guardar • Esc para cancelar</p>
                </div>
              ) : (
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => { setEditingDescId(list.id); setEditDesc(list.description || '') }}
                  onKeyDown={(e) => { if (e.key === 'Enter') { setEditingDescId(list.id); setEditDesc(list.description || '') } }}
                  className="group flex items-start gap-1.5 cursor-text"
                >
                  {list.description ? (
                    <p className="text-xs text-gray-400 flex-1 leading-relaxed">{list.description}</p>
                  ) : (
                    <p className="text-xs text-gray-600 flex-1 italic">Agregar descripción...</p>
                  )}
                  <svg className="w-3 h-3 text-gray-600 group-hover:text-gray-400 mt-0.5 flex-shrink-0 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
              )}
            </div>
          )}

          {/* Canales NO se listan acá — solo van a la sidebar de canales */}
        </div>
      )})}

      {/* Lista de Canales por Defecto — siempre al final */}
      <div className={`rounded-lg overflow-hidden`}>
        <div
          onClick={() => setActiveList(null)}
          className={`flex items-center gap-2 px-3 py-2 bg-gray-800/50 hover:bg-gray-800 transition-colors rounded-lg cursor-pointer ${
            activeListId === null ? 'ring-1 ring-blue-500' : ''
          }`}
        >
          <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </div>
          <span className={`text-sm flex-1 ${activeListId === null ? 'text-blue-400 font-medium' : 'text-gray-300'}`}>
            Canales por Defecto
          </span>
          <span className="text-xs text-gray-500">
            {defaultChannels.length}
          </span>
        </div>
      </div>
    </div>
  )
}
