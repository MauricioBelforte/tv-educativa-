'use client'

import { useEffect, useState } from 'react'
import { usePlayerStore } from '@/store/player-store'
import ChannelCard from './ChannelCard'

interface ImportedListsManagerProps {
  collapseTrigger?: number
}

export default function ImportedListsManager({ collapseTrigger = 0 }: ImportedListsManagerProps) {
  const importedLists = usePlayerStore((state) => state.importedLists)
  const activeListId = usePlayerStore((state) => state.activeListId)
  const setActiveList = usePlayerStore((state) => state.setActiveList)
  const renameList = usePlayerStore((state) => state.renameList)
  const removeList = usePlayerStore((state) => state.removeList)
  const removeChannelFromList = usePlayerStore((state) => state.removeChannelFromList)
  const setChannel = usePlayerStore((state) => state.setChannel)

  const [editingListId, setEditingListId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [expandedListId, setExpandedListId] = useState<string | null>(null)

  useEffect(() => {
    setExpandedListId(null)
  }, [collapseTrigger])

  if (importedLists.length === 0) return null

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

  const activeList = importedLists.find(l => l.id === activeListId)

  return (
    <div className="space-y-2">
      <div className="border-t border-gray-700 pt-2 mt-2">
        <p className="text-xs text-gray-500 px-3 mb-1 uppercase tracking-wider">
          Mis Listas ({importedLists.length})
        </p>
      </div>

      {importedLists.map((list) => (
        <div key={list.id} className="rounded-lg overflow-hidden">
          {/* Header de la lista (carpeta) */}
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-800/50 hover:bg-gray-800 transition-colors rounded-lg">
            <button
              onClick={() => {
                setActiveList(activeListId === list.id ? null : list.id)
                setExpandedListId(expandedListId === list.id ? null : list.id)
              }}
              className="flex items-center gap-2 flex-1 min-w-0 text-left"
            >
              <svg 
                className={`w-4 h-4 text-gray-400 transition-transform ${expandedListId === list.id ? 'rotate-90' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              
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

          {/* Canales de la lista expandidos */}
          {expandedListId === list.id && (
            <div className="ml-4 mt-1 space-y-1 border-l-2 border-gray-700 pl-2">
              {list.channels.length === 0 ? (
                <p className="text-xs text-gray-500 py-2 px-2">Lista vacía</p>
              ) : (
                list.channels.map((channel) => (
                  <div key={channel.id} className="group relative">
                    <ChannelCard 
                      channel={channel} 
                      listId={list.id}
                      allCategories={[...new Set(list.channels.map(c => c.category))].sort()}
                    />
                    {/* Botón eliminar canal individual */}
                    <button
                      onClick={() => {
                        if (confirm(`¿Eliminar "${channel.name}" de la lista?`)) {
                          removeChannelFromList(list.id, channel.id)
                        }
                      }}
                      className="absolute top-1 right-1 p-1 bg-red-900/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700 z-10"
                      title="Eliminar canal"
                    >
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}