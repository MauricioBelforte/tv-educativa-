'use client'

import { useState, useEffect, useMemo } from 'react'
import { Channel } from '@/lib/types'
import { usePlayerStore } from '@/store/player-store'
import { parseM3U } from '@/lib/m3u-parser'
import channelsData from '@/data/channels.json'
import Header from '@/components/Header'
import Player from '@/components/Player'
import ChannelList from '@/components/ChannelList'
import SearchBar from '@/components/SearchBar'
import M3UImporter from '@/components/M3UImporter'
import ImportedListsManager from '@/components/ImportedListsManager'

export default function Home() {
  const [channels, setChannels] = useState<Channel[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [showFavorites, setShowFavorites] = useState(false)
  const [importedListsCollapseKey, setImportedListsCollapseKey] = useState(0)
  const [categoriesCollapsed, setCategoriesCollapsed] = useState(false)

  const favorites = usePlayerStore((state) => state.favorites)
  const importedLists = usePlayerStore((state) => state.importedLists)
  const activeListId = usePlayerStore((state) => state.activeListId)
  const addImportedList = usePlayerStore((state) => state.addImportedList)
  const setActiveList = usePlayerStore((state) => state.setActiveList)
  const getFavoriteChannels = usePlayerStore((state) => state.getFavoriteChannels)

  // Obtener canales activos: los de la lista seleccionada o los por defecto
  const activeChannels = useMemo(() => {
    if (activeListId) {
      const list = importedLists.find(l => l.id === activeListId)
      return list?.channels || []
    }
    return channels
  }, [activeListId, importedLists, channels])

  // Canales favoritos de todas las listas
  const favoriteChannels = useMemo(() => {
    return getFavoriteChannels()
  }, [favorites, importedLists, getFavoriteChannels])

  // Consolidar canales por defecto y de todas las listas importadas
  const allAvailableChannels = useMemo(() => {
    const mergedChannels: Channel[] = [...channels]

    importedLists.forEach((list) => {
      list.channels.forEach((channel) => {
        if (!mergedChannels.some((existing) => existing.id === channel.id)) {
          mergedChannels.push(channel)
        }
      })
    })

    return mergedChannels
  }, [channels, importedLists])

  // Cargar canales desde la API
  useEffect(() => {
    async function loadChannels() {
      const fallbackChannels = (channelsData.channels as Channel[]) || []

      try {
        const res = await fetch('/api/channels')
        if (!res.ok) throw new Error('API error')
        const data = await res.json()
        setChannels(Array.isArray(data.channels) ? data.channels : fallbackChannels)
      } catch (error) {
        console.error('Error loading channels:', error)
        setChannels(fallbackChannels)
      } finally {
        setIsLoading(false)
      }
    }
    loadChannels()
  }, [])

  // Manejar importación de lista M3U
  const handleM3UImport = (m3uContent: string) => {
    const importedChannels = parseM3U(m3uContent)
    if (importedChannels.length > 0) {
      addImportedList(importedChannels)
    }
  }

  const collapseImportedLists = () => {
    setImportedListsCollapseKey((value) => value + 1)
  }

  // Obtener nombre de la fuente actual
  const currentSourceName = useMemo(() => {
    if (showFavorites) return '⭐ Favoritos'
    if (selectedCategory) return selectedCategory
    if (searchQuery) return 'Resultados de todas las listas'
    if (activeListId) {
      const list = importedLists.find(l => l.id === activeListId)
      return list?.name || 'Lista'
    }
    return 'Canales por Defecto'
  }, [activeListId, importedLists, showFavorites, selectedCategory, searchQuery])

  // Determinar qué canales mostrar según el estado
  const displayChannels = useMemo(() => {
    if (showFavorites) return favoriteChannels

    const isFilteringGlobally = Boolean(searchQuery) || Boolean(selectedCategory)
    if (isFilteringGlobally) {
      return allAvailableChannels
    }

    return activeChannels
  }, [showFavorites, favoriteChannels, activeChannels, allAvailableChannels, searchQuery, selectedCategory])

  // Filtrar canales en memoria
  const filteredChannels = useMemo(() => {
    let result = [...displayChannels]

    if (selectedCategory && !showFavorites) {
      result = result.filter(c => c.category === selectedCategory)
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(c => c.name.toLowerCase().includes(query))
    }

    return result
  }, [displayChannels, selectedCategory, searchQuery, showFavorites])

  // Extraer categorías de los canales disponibles para filtrar
  const activeCategories = useMemo(() => {
    const sourceChannels = showFavorites ? favoriteChannels : allAvailableChannels
    return [...new Set(sourceChannels.map(c => c.category))].sort()
  }, [showFavorites, favoriteChannels, allAvailableChannels])

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 text-white">
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] gap-6">
          {/* Sidebar */}
          <aside className="order-2 lg:order-1">
            <div className="lg:sticky lg:top-24 space-y-4">
              <SearchBar value={searchQuery} onChange={setSearchQuery} />
              <div className="bg-gray-900/70 rounded-xl p-4 border border-gray-800 shadow-lg space-y-2">
                {/* Favoritos */}
                <button
                  onClick={() => { setShowFavorites(!showFavorites); setSelectedCategory(null); collapseImportedLists() }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    showFavorites ? 'bg-yellow-600 text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill={showFavorites ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                    ⭐ Favoritos ({favoriteChannels.length})
                  </div>
                </button>

                {/* Canales por Defecto */}
                <button
                  onClick={() => {
                    setActiveList(null)
                    setShowFavorites(false)
                    setSelectedCategory(null)
                    setCategoriesCollapsed(true)
                    collapseImportedLists()
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    !activeListId && !showFavorites && !selectedCategory
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                    Canales por Defecto
                  </div>
                </button>

                {/* Categorías */}
                {activeCategories.length > 0 && !showFavorites && (
                  <>
                    <div className="border-t border-gray-700 my-2" />
                    <button
                      onClick={() => setCategoriesCollapsed((value) => !value)}
                      className="w-full flex items-center justify-between px-3 mb-1 text-xs text-gray-500 uppercase tracking-wider hover:text-gray-300 transition-colors"
                      aria-expanded={!categoriesCollapsed}
                    >
                      <span>Categorías</span>
                      <svg
                        className={`w-3 h-3 transition-transform ${categoriesCollapsed ? '-rotate-90' : 'rotate-0'}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {!categoriesCollapsed && activeCategories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                          selectedCategory === cat ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </>
                )}

                <div className="border-t border-gray-700 pt-2">
                  <M3UImporter onImport={handleM3UImport} />
                </div>

                <ImportedListsManager collapseTrigger={importedListsCollapseKey} />
              </div>
            </div>
          </aside>

          {/* Contenido principal */}
          <div className="order-1 lg:order-2 space-y-6">
            <div className="bg-gray-900/70 rounded-xl border border-gray-800 overflow-hidden shadow-lg">
              <Player />
            </div>

            {/* Móvil */}
            <div className="lg:hidden space-y-3">
              <SearchBar value={searchQuery} onChange={setSearchQuery} />
              <div className="flex gap-2 overflow-x-auto pb-2">
                <button
                  onClick={() => { setSelectedCategory(null); setShowFavorites(false); setActiveList(null); setCategoriesCollapsed(true); collapseImportedLists() }}
                  className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors ${
                    !selectedCategory && !showFavorites && !activeListId ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-gray-200'
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => { setShowFavorites(!showFavorites); collapseImportedLists() }}
                  className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors ${
                    showFavorites ? 'bg-yellow-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-gray-200'
                  }`}
                >
                  ⭐ Favoritos
                </button>
                {activeCategories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                    className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors ${
                      selectedCategory === cat ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Lista de canales */}
            <div className="bg-gray-900/70 rounded-xl border border-gray-800 p-4 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">{currentSourceName}</h2>
                <span className="text-sm text-gray-500">{filteredChannels.length} canales</span>
              </div>
              <ChannelList channels={filteredChannels} isLoading={isLoading && !activeListId} />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}