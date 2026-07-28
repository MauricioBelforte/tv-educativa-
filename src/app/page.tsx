'use client'

import { useState, useEffect, useMemo } from 'react'
import { Channel } from '@/lib/types'
import { usePlayerStore } from '@/store/player-store'
import { parseM3U } from '@/lib/m3u-parser'
import channelsData from '@/data/channels.json'
import Header from '@/components/Header'
import Player from '@/components/Player'
import ChannelList from '@/components/ChannelList'
import M3UImporter from '@/components/M3UImporter'
import ImportedListsManager from '@/components/ImportedListsManager'
import EPGPanel from '@/components/EPGPanel'


export default function Home() {
  const [channels, setChannels] = useState<Channel[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [showFavorites, setShowFavorites] = useState(false)
  const [importedListsCollapseKey, setImportedListsCollapseKey] = useState(0)
  const [categoriesCollapsed, setCategoriesCollapsed] = useState(true)

  const [channelListOpen, setChannelListOpen] = useState(true)
  const [showOnlineOnly, setShowOnlineOnly] = useState(true)

  const importedLists = usePlayerStore((state) => state.importedLists)
  const activeListId = usePlayerStore((state) => state.activeListId)
  const activeSources = usePlayerStore((state) => state.activeSources)
  const channelStatus = usePlayerStore((state) => state.channelStatus)
  const favorites = usePlayerStore((state) => state.favorites)
  const checkAllChannels = usePlayerStore((state) => state.checkAllChannels)
  const recheckAllChannels = usePlayerStore((state) => state.recheckAllChannels)
  const fastRecheckAllChannels = usePlayerStore((state) => state.fastRecheckAllChannels)
  const addImportedList = usePlayerStore((state) => state.addImportedList)
  const setActiveList = usePlayerStore((state) => state.setActiveList)

  // Al deployar una lista, abrir la sidebar de canales
  useEffect(() => {
    if (activeListId) setChannelListOpen(true)
  }, [activeListId])

  // Obtener canales activos: los de la lista seleccionada, o los por defecto si está vacía
  const activeChannels = useMemo(() => {
    if (activeListId) {
      const list = importedLists.find(l => l.id === activeListId)
      const listChannels = list?.channels || []
      if (listChannels.length > 0) return listChannels
    }
    return channels
  }, [activeListId, importedLists, channels])

  // Canales favoritos de todas las listas (incluye canales por defecto)
  const favoriteChannels = useMemo(() => {
    const all: Channel[] = []
    const addIfFavorite = (ch: Channel) => {
      if (favorites.includes(ch.id) && !all.some(c => c.id === ch.id)) all.push(ch)
    }
    channels.forEach(addIfFavorite)
    importedLists.forEach(list => list.channels.forEach(addIfFavorite))
    return all
  }, [favorites, channels, importedLists])

  // Consolidar canales por defecto y de las listas activas
  const allAvailableChannels = useMemo(() => {
    const mergedChannels: Channel[] = [...channels]

    importedLists.forEach((list) => {
      if (!activeSources.includes(list.id)) return
      list.channels.forEach((channel) => {
        if (!mergedChannels.some((existing) => existing.id === channel.id)) {
          mergedChannels.push(channel)
        }
      })
    })

    return mergedChannels
  }, [channels, importedLists, activeSources])

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
      }

      // Cargar listas privadas desde variables de entorno (Vercel)
      try {
        const privRes = await fetch('/api/private-lists')
        if (privRes.ok) {
          const privateLists: { name: string; channels: Channel[] }[] = await privRes.json()
          const existing = usePlayerStore.getState().importedLists
          for (const pl of privateLists) {
            const exists = existing.some(l => l.isPrivate && l.name === pl.name)
            if (!exists && pl.channels.length > 0) {
              addImportedList(pl.channels, pl.name, true)
            }
          }
        }
      } catch (error) {
        console.error('Error loading private lists:', error)
      }

      setIsLoading(false)
    }
    loadChannels()
  }, [])

  // Verificar estado de canales en lotes de 5 (solo listas con checkbox)
  useEffect(() => {
    if (isLoading) return
    const pending = allAvailableChannels.filter(c => c.url && !channelStatus[c.id])
    if (pending.length === 0) return
    checkAllChannels(pending.map(c => ({ id: c.id, url: c.url! })))
  }, [allAvailableChannels, isLoading, checkAllChannels])

  // Manejar importación de lista M3U
  const handleM3UImport = (m3uContent: string, sourceUrl?: string) => {
    const importedChannels = parseM3U(m3uContent)
    if (importedChannels.length > 0) {
      addImportedList(importedChannels, sourceUrl, false)
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

    if (showOnlineOnly) {
      result = result.filter(c => {
        const s = channelStatus[c.id]
        return s === 'online' || s === 'checking' || s === undefined
      })
    }

    return result
  }, [displayChannels, selectedCategory, searchQuery, showFavorites, showOnlineOnly, channelStatus])

  // Extraer categorías de los canales disponibles para filtrar
  const activeCategories = useMemo(() => {
    const sourceChannels = showFavorites ? favoriteChannels : allAvailableChannels
    return [...new Set(sourceChannels.map(c => c.category))].sort()
  }, [showFavorites, favoriteChannels, allAvailableChannels])

  return (
    <div className="h-screen bg-gradient-to-b from-slate-900 to-slate-950 text-white flex flex-col">
      <Header searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      <main className="flex-1 w-full min-h-0 flex">
        {/* Área lateral izquierda: barra superior + listas */}
        <div className="h-full w-80 flex-shrink-0 border-r border-gray-800 flex flex-col">
          {/* Barra superior tipo solapas */}
          <div className="h-12 flex-shrink-0 bg-slate-900 border-b border-gray-800 flex items-center px-3 gap-1">
            <button
              onClick={() => setChannelListOpen(!channelListOpen)}
              className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
              title={channelListOpen ? 'Cerrar canales' : 'Abrir canales'}
            >
              <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <button
              onClick={() => { setShowFavorites(!showFavorites); setSelectedCategory(null); collapseImportedLists() }}
              className={`p-2 rounded-lg transition-colors ${showFavorites ? 'text-yellow-400 hover:text-yellow-300' : 'text-gray-500 hover:text-gray-300'}`}
              title={showFavorites ? 'Ver lista actual' : 'Ver favoritos'}
            >
              <svg className="w-5 h-5" fill={showFavorites ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </button>
            <button
              onClick={() => {
                const all: { id: string; url: string }[] = []
                const seen = new Set<string>()
                const add = (id: string, url: string) => { if (url && !seen.has(id)) { seen.add(id); all.push({ id, url }) } }
                channels.forEach(c => add(c.id, c.url))
                importedLists.forEach(l => l.channels.forEach(c => add(c.id, c.url)))
                fastRecheckAllChannels(all)
              }}
              className="p-2 rounded-lg text-gray-500 hover:text-blue-400 transition-colors"
              title="Escanear todos los canales (rápido)"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <div className="flex-1" />
          </div>

          {/* Contenido de listas + overlay de canales */}
          <div className="flex-1 min-h-0 relative overflow-hidden bg-slate-900">
            {channelListOpen && (
              <div className="absolute inset-0 z-30 bg-slate-900 overflow-y-auto">
                <div className="p-4 space-y-4">
                  {!searchQuery && (
                    <div className="bg-gray-900/70 rounded-xl p-4 border border-gray-800 shadow-lg space-y-2">

                      <button onClick={() => { setShowOnlineOnly(!showOnlineOnly); setSelectedCategory(null); setShowFavorites(false) }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${showOnlineOnly ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'}`}>
                        <div className="flex items-center gap-2">
                          <span className={`w-3 h-3 rounded-full ${showOnlineOnly ? 'bg-green-400' : 'bg-gray-500'}`} />
                          Solo activos
                        </div>
                      </button>
                      {activeCategories.length > 0 && !showFavorites && (
                        <><div className="border-t border-gray-700 my-2" />
                          <button onClick={() => setCategoriesCollapsed((v) => !v)}
                            className="w-full flex items-center justify-between px-3 mb-1 text-xs text-gray-500 uppercase tracking-wider hover:text-gray-300 transition-colors">
                            <span>Categorías</span>
                            <svg className={`w-3 h-3 transition-transform ${categoriesCollapsed ? '-rotate-90' : 'rotate-0'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          {!categoriesCollapsed && activeCategories.map((cat) => (
                            <button key={cat} onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${selectedCategory === cat ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'}`}>{cat}</button>
                          ))}
                        </>
                      )}
                    </div>
                  )}
                  <div className="bg-gray-900/70 rounded-xl border border-gray-800 p-4 shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold text-white">{currentSourceName}</h2>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">{filteredChannels.length} canales</span>
                        <button
                          onClick={() => recheckAllChannels(allAvailableChannels.map(c => ({ id: c.id, url: c.url })))}
                          className="p-1 rounded-lg text-gray-500 hover:text-blue-400 transition-colors"
                          title="Escaneo lento sin bloqueo"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <ChannelList channels={filteredChannels} isLoading={isLoading && !activeListId} />
                  </div>
                </div>
              </div>
            )}
            <div className="h-full overflow-y-auto">
              <div className="p-4 space-y-4">
                <h2 className="text-lg font-semibold text-white">Listas</h2>
                <M3UImporter onImport={handleM3UImport} />
                <div className="border-t border-gray-700" />
                <ImportedListsManager collapseTrigger={importedListsCollapseKey} />
              </div>
            </div>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="flex-1 min-h-0 overflow-y-auto"
          onClick={() => { if (channelListOpen) setChannelListOpen(false) }}
        >
          <div className="h-full max-w-7xl mx-auto space-y-6 p-4 lg:p-6">
            <div className="bg-gray-900/70 rounded-xl border border-gray-800 overflow-hidden shadow-lg">
              <Player />
            </div>
            <EPGPanel />

            <div className="lg:hidden space-y-3">
              <div className="flex gap-2 overflow-x-auto pb-2">
                <button onClick={() => { setSelectedCategory(null); setShowFavorites(false); setActiveList(null); setCategoriesCollapsed(true); collapseImportedLists() }}
                  className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors ${!selectedCategory && !showFavorites && !activeListId ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-gray-200'}`}>Todos</button>
                <button onClick={() => { setShowFavorites(!showFavorites); collapseImportedLists() }}
                  className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors ${showFavorites ? 'bg-yellow-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-gray-200'}`}>⭐ Favoritos</button>
                {activeCategories.map((cat) => (
                  <button key={cat} onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                    className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors ${selectedCategory === cat ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-gray-200'}`}>{cat}</button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}