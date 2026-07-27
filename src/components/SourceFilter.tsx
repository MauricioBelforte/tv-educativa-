'use client'
import { usePlayerStore } from '@/store/player-store'

export default function SourceFilter() {
  const importedLists = usePlayerStore((state) => state.importedLists)
  const activeSources = usePlayerStore((state) => state.activeSources)
  const activeListId = usePlayerStore((state) => state.activeListId)
  const toggleSource = usePlayerStore((state) => state.toggleSource)
  const setAllSources = usePlayerStore((state) => state.setAllSources)

  // Solo se muestra cuando hay 2+ listas y ninguna está activa específicamente
  if (importedLists.length < 2 || activeListId !== null) return null

  const allSelected = activeSources.length === importedLists.length

  return (
    <div className="bg-gray-900 rounded-lg p-3 space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs text-gray-500 uppercase tracking-wider">
          Fuentes activas ({activeSources.length}/{importedLists.length})
        </h3>
        <button
          onClick={() => setAllSources(!allSelected)}
          className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
        >
          {allSelected ? 'Deseleccionar todas' : 'Seleccionar todas'}
        </button>
      </div>

      {/* Lista de fuentes con checkboxes */}
      <div className="space-y-1">
        {importedLists.map((list) => {
          const isActive = activeSources.includes(list.id)
          return (
            <label
              key={list.id}
              className="flex items-center gap-3 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-gray-800 transition-colors group"
            >
              <input
                type="checkbox"
                checked={isActive}
                onChange={() => toggleSource(list.id)}
                className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer accent-blue-500"
              />
              <div className="flex-1 min-w-0">
                <p className={`text-sm truncate ${
                  isActive ? 'text-gray-200' : 'text-gray-500'
                }`}>
                  {list.name}
                </p>
                <p className="text-xs text-gray-600">
                  {list.channels.length} canales
                </p>
              </div>
              {/* Indicador visual de activo */}
              <div className={`w-2 h-2 rounded-full transition-colors ${
                isActive ? 'bg-blue-500' : 'bg-gray-700'
              }`} />
            </label>
          )
        })}
      </div>
    </div>
  )
}
