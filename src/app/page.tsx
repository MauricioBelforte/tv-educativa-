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
import LoginModal from '@/components/LoginModal'

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
  const [syncing, setSyncing] = useState(false)
  const [syncStatus, setSyncStatus] = useState('')

  const importedLists = usePlayerStore((state) => state.importedLists)
  const currentChannel = usePlayerStore((state) => state.currentChannel)
  const setChannel = usePlayerStore((state) => state.setChannel)
  const activeListId = usePlayerStore((state) => state.activeListId)
  const activeSources = usePlayerStore((state) => state.activeSources)
  const channelStatus = usePlayerStore((state) => state.channelStatus)
  const favorites = usePlayerStore((state) => state.favorites)
  const checkAllChannels = usePlayerStore((state) => state.checkAllChannels)
  const recheckAllChannels = usePlayerStore((state) => state.recheckAllChannels)
  const fastRecheckAllChannels = usePlayerStore((state) => state.fastRecheckAllChannels)
  const addImportedList = usePlayerStore((state) => state.addImportedList)
  const replacePrivateLists = usePlayerStore((state) => state.replacePrivateLists)
  const setActiveList = usePlayerStore((state) => state.setActiveList)
  const isAuthenticated = usePlayerStore((state) => state.isAuthenticated)
  const authPassword = usePlayerStore((state) => state.authPassword)
  const _initialized = usePlayerStore((state) => state._initialized)
  const login = usePlayerStore((state) => state.login)
  const logout = usePlayerStore((state) => state.logout)
  const [showLogin, setShowLogin] = useState(false)

  useEffect(() => {
    if (activeListId) setChannelListOpen(true)
  }, [activeListId])

  const activeChannels = useMemo(() => {
    if (activeListId) {
      const list = importedLists.find(l => l.id === activeListId)
      const listChannels = list?.channels || []
      if (listChannels.length > 0) return listChannels
    }
    return channels
  }, [activeListId, importedLists, channels])

  const favoriteChannels = useMemo(() => {
    const all: Channel[] = []
    const addIfFavorite = (ch: Channel) => {
      if (favorites.includes(ch.id) && !all.some(c => c.id === ch.id)) all.push(ch)
    }
    channels.forEach(addIfFavorite)
    importedLists.forEach(list => list.channels.forEach(addIfFavorite))
    return all
  }, [favorites, channels, importedLists])

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

  useEffect(() => {
    if (!_initialized) return
    async function loadChannels() {
      const fallbackChannels = (channelsData.channels as Channel[]) || []

      try {
        const res = await fetch('/api/channels')
        if (!res.ok) throw new Error('API error')
        const data = await res.json()
        setChannels(Array.isArray(data.channels) ? data.channels : fallbackChannels)
      } catch {
        setChannels(fallbackChannels)
      }

      if (isAuthenticated && authPassword) {
        const nameExists = (name: string) =>
          usePlayerStore.getState().importedLists.some(l => l.name === name)

        try {
          const privRes = await fetch(`/api/private-lists?password=${encodeURIComponent(authPassword)}`)
          if (privRes.ok) {
            const privateLists: { name: string; channels: Channel[] }[] = await privRes.json()
            for (const pl of privateLists) {
              if (!nameExists(pl.name) && pl.channels.length > 0) {
                addImportedList(pl.channels, pl.name, true)
              }
            }
          }
        } catch {
          // ignore
        }

          try {
            const syncRes = await fetch(`/api/sync-lists?password=${encodeURIComponent(authPassword)}`)
            if (syncRes.ok) {
              const syncData: { lists: { name: string; channels: Channel[] }[]; favorites: string[]; activeListNames: string[] } = await syncRes.json()
              if (syncData.lists?.length > 0) {
                replacePrivateLists(syncData.lists)
              }
              if (syncData.favorites) {
                usePlayerStore.getState().setFavorites(syncData.favorites)
              }
              if (syncData.activeListNames) {
                usePlayerStore.getState().replaceActiveSourcesByName(syncData.activeListNames)
              }
            }
          } catch {
          // ignore
        }
      }

      setIsLoading(false)
    }
    loadChannels()
  }, [isAuthenticated, authPassword, _initialized])

  useEffect(() => {
    if (isLoading) return
    const pending = allAvailableChannels.filter(c => c.url && !channelStatus[c.id])
    if (pending.length === 0) return
    checkAllChannels(pending.map(c => ({ id: c.id, url: c.url! })))
  }, [allAvailableChannels, isLoading, checkAllChannels])

  const handleM3UImport = (m3uContent: string, sourceUrl?: string) => {
    const importedChannels = parseM3U(m3uContent)
    if (importedChannels.length > 0) {
      addImportedList(importedChannels, sourceUrl, false)
    }
  }

  const collapseImportedLists = () => {
    setImportedListsCollapseKey((value) => value + 1)
  }

  const currentSourceName = useMemo(() => {
    if (showFavorites) return 'Favoritos'
    if (selectedCategory) return selectedCategory
    if (searchQuery) return 'Resultados de todas las listas'
    if (activeListId) {
      const list = importedLists.find(l => l.id === activeListId)
      return list?.name || 'Lista'
    }
    return 'Canales por Defecto'
  }, [activeListId, importedLists, showFavorites, selectedCategory, searchQuery])

  const displayChannels = useMemo(() => {
    if (showFavorites) return favoriteChannels
    const isFilteringGlobally = Boolean(searchQuery) || Boolean(selectedCategory)
    if (isFilteringGlobally) return allAvailableChannels
    return activeChannels
  }, [showFavorites, favoriteChannels, activeChannels, allAvailableChannels, searchQuery, selectedCategory])

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

  const activeCategories = useMemo(() => {
    const sourceChannels = showFavorites ? favoriteChannels : allAvailableChannels
    return [...new Set(sourceChannels.map(c => c.category))].sort()
  }, [showFavorites, favoriteChannels, allAvailableChannels])

  return (
    <div className="h-screen bg-gradient-to-b from-slate-900 to-slate-950 text-white flex flex-col">
      {showLogin && <LoginModal onLogin={async (pwd) => {
        const ok = await login(pwd)
        if (ok) setShowLogin(false)
        return ok
      }} />}
      <Header searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      <main className="flex-1 w-full min-h-0 flex">
        <div className="h-full w-80 flex-shrink-0 border-r border-gray-800 flex flex-col">
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
            {isAuthenticated && <button
              onClick={() => {
                const all: { id: string; url: string }[] = []
                const seen = new Set<string>()
                const add = (id: string, url: string) => { if (url && !seen.has(id)) { seen.add(id); all.push({ id, url }) } }
                channels.forEach(c => add(c.id, c.url))
                importedLists.forEach(l => l.channels.forEach(c => add(c.id, c.url)))
                fastRecheckAllChannels(all)
              }}
              className="p-2 rounded-lg text-gray-500 hover:text-blue-400 transition-colors"
              title="Escanear todos los canales (rapido)"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>}
            <div className="flex-1" />
            {isAuthenticated ? (
              <button onClick={logout} className="text-xs text-gray-500 hover:text-red-400 transition-colors px-2 py-1 rounded">
                Salir
              </button>
            ) : (
              <button onClick={() => setShowLogin(true)} className="text-xs text-blue-400 hover:text-blue-300 transition-colors px-2 py-1 rounded">
                Acceso Privado
              </button>
            )}
          </div>

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
                            <span>Categorias</span>
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
                        {isAuthenticated && <button
                          onClick={() => recheckAllChannels(allAvailableChannels.map(c => ({ id: c.id, url: c.url })))}
                          className="p-1 rounded-lg text-gray-500 hover:text-blue-400 transition-colors"
                          title="Escaneo lento sin bloqueo"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        </button>}
                      </div>
                    </div>
                    <div className="relative">
                      <ChannelList channels={filteredChannels} isLoading={isLoading && !activeListId} />
                      <div className="sticky bottom-0 left-0 right-0 flex justify-center gap-4 py-3 bg-gradient-to-t from-slate-900 via-slate-900/95 to-transparent">
                        <button
                          onClick={() => {
                            const idx = currentChannel
                              ? filteredChannels.findIndex(c => c.id === currentChannel.id)
                              : -1
                            const prev = idx > 0 ? idx - 1 : filteredChannels.length - 1
                            if (filteredChannels[prev]) setChannel(filteredChannels[prev])
                          }}
                          className="w-12 h-10 rounded-xl bg-gray-800/90 hover:bg-gray-700 border border-gray-700 flex items-center justify-center transition-colors"
                          title="Canal anterior"
                        >
                          <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => {
                            const idx = currentChannel
                              ? filteredChannels.findIndex(c => c.id === currentChannel.id)
                              : -2
                            const next = idx < filteredChannels.length - 1 ? idx + 1 : 0
                            if (filteredChannels[next]) setChannel(filteredChannels[next])
                          }}
                          className="w-12 h-10 rounded-xl bg-gray-800/90 hover:bg-gray-700 border border-gray-700 flex items-center justify-center transition-colors"
                          title="Siguiente canal"
                        >
                          <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div className="h-full overflow-y-auto">
              <div className="p-4 space-y-4">
                <h2 className="text-lg font-semibold text-white">Listas</h2>
                {isAuthenticated ? (
                  <>
                    <M3UImporter onImport={handleM3UImport} />
                    <div className="border-t border-gray-700" />
                    <ImportedListsManager collapseTrigger={importedListsCollapseKey} />
                    <div className="pt-3">
                      <button
                        onClick={async () => {
                          setSyncing(true)
                          setSyncStatus('Subiendo...')
                          try {
                            const state = usePlayerStore.getState()
                            const payload = {
                              lists: state.importedLists.map(l => ({
                                name: l.name,
                                channels: l.channels,
                              })),
                              favorites: state.favorites,
                              activeListNames: state.importedLists
                                .filter(l => state.activeSources.includes(l.id))
                                .map(l => l.name),
                            }
                            const res = await fetch(`/api/sync-lists?password=${encodeURIComponent(state.authPassword)}`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify(payload),
                            })
                            if (res.ok) setSyncStatus('Sincronizado')
                            else setSyncStatus('Error al subir')
                          } catch {
                            setSyncStatus('Error de conexion')
                          }
                          setSyncing(false)
                          setTimeout(() => setSyncStatus(''), 3000)
                        }}
                        disabled={syncing}
                        className="w-full px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm transition-colors flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        {syncing ? 'Subiendo...' : syncStatus || 'Subir listas a la nube'}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="bg-gray-900/70 rounded-xl p-6 border border-gray-800">
                    <p className="text-gray-400 text-sm text-center">
                      Inicia sesion para importar y sincronizar tus listas
                    </p>
                    <button
                      onClick={() => setShowLogin(true)}
                      className="mt-3 w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm transition-colors"
                    >
                      Iniciar sesion
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

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
                  className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors ${showFavorites ? 'bg-yellow-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-gray-200'}`}>Favoritos</button>
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
