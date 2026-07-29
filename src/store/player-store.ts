'use client'

import { create } from 'zustand'
import { Channel, ImportedList } from '@/lib/types'

export type ChannelStatus = 'unknown' | 'checking' | 'online' | 'offline'

interface PlayerStore {
  currentChannel: Channel | null
  isPlaying: boolean
  favorites: string[]
  isDarkMode: boolean
  importedLists: ImportedList[]
  activeListId: string | null
  activeSources: string[]
  isRefreshing: Record<string, boolean>
  channelStatus: Record<string, ChannelStatus>
  isAuthenticated: boolean
  authPassword: string
  _initialized: boolean
  
  setChannel: (channel: Channel) => void
  togglePlay: () => void
  toggleFavorite: (channelId: string) => void
  setFavorites: (ids: string[]) => void
  isFavorite: (channelId: string) => boolean
  toggleDarkMode: () => void
  initFromStorage: () => void
  login: (password: string) => Promise<boolean>
  logout: () => void
  
  // Gestión de listas importadas
  addImportedList: (channels: Channel[], sourceUrl?: string, isPrivate?: boolean) => string
  renameList: (listId: string, newName: string) => void
  setListDescription: (listId: string, description: string) => void
  removeList: (listId: string) => void
  removeChannelFromList: (listId: string, channelId: string) => void
  setActiveList: (listId: string | null) => void
  getListById: (listId: string) => ImportedList | undefined
  reorderLists: (fromIndex: number, toIndex: number) => void
  replacePrivateLists: (lists: { name: string; channels: Channel[] }[]) => void
  
  // Mover canales entre listas y cambiar categoría
  moveChannelToList: (fromListId: string, channelId: string, toListId: string) => void
  changeChannelCategory: (listId: string, channelId: string, newCategory: string) => void
  
  // Obtener canales favoritos de todas las listas
  getFavoriteChannels: () => Channel[]
  
  // Fase 3: Múltiples fuentes
  toggleSource: (sourceId: string) => void
  setAllSources: (active: boolean) => void
  
  // Fase 3: Refresco de listas
  refreshList: (listId: string) => Promise<void>
  refreshAllLists: () => Promise<void>
  
  // Verificación de estado de canales
  checkChannelStatus: (channelId: string, url: string) => Promise<void>
  setChannelStatus: (channelId: string, status: ChannelStatus) => void
  checkAllChannels: (channels: { id: string; url: string }[]) => Promise<void>
  recheckAllChannels: (channels: { id: string; url: string }[]) => Promise<void>
  fastRecheckAllChannels: (channels: { id: string; url: string }[]) => Promise<void>
}

function generateId(): string {
  return `list-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`
}

function saveToStorage(key: string, data: unknown) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, JSON.stringify(data))
  }
}

function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(key)
      return stored ? JSON.parse(stored) : fallback
    } catch {
      return fallback
    }
  }
  return fallback
}

export const usePlayerStore = create<PlayerStore>((set, get) => ({
  currentChannel: null,
  isPlaying: false,
  favorites: [],
  isDarkMode: false,
  importedLists: [],
  activeListId: null,
  activeSources: [],
  isRefreshing: {},
  channelStatus: {},
  isAuthenticated: false,
  authPassword: '',
  _initialized: false,
  
  setChannel: (channel) => set({ currentChannel: channel, isPlaying: true }),
  
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  
  toggleFavorite: (channelId) => {
    const state = get()
    const newFavorites = state.favorites.includes(channelId)
      ? state.favorites.filter(id => id !== channelId)
      : [...state.favorites, channelId]
    
    saveToStorage('iptv-favorites', newFavorites)
    set({ favorites: newFavorites })
  },
  
  setFavorites: (ids) => {
    saveToStorage('iptv-favorites', ids)
    set({ favorites: ids })
  },

  isFavorite: (channelId) => {
    return get().favorites.includes(channelId)
  },
  
  toggleDarkMode: () => {
    const state = get()
    const newMode = !state.isDarkMode
    
    saveToStorage('iptv-dark-mode', newMode)
    if (typeof window !== 'undefined') {
      if (newMode) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
    
    set({ isDarkMode: newMode })
  },
  
  initFromStorage: () => {
    if (typeof window !== 'undefined') {
      const favorites = loadFromStorage<string[]>('iptv-favorites', [])
      const isDarkMode = loadFromStorage<boolean>('iptv-dark-mode', false)
      const importedLists = loadFromStorage<ImportedList[]>('iptv-imported-lists', [])
      const activeSources = loadFromStorage<string[]>('iptv-active-sources', [])
      const authPassword = loadFromStorage<string>('iptv-auth-password', '')
      
      if (isDarkMode) {
        document.documentElement.classList.add('dark')
      }

      const channelStatus = loadFromStorage<Record<string, ChannelStatus>>('iptv-channel-status', {})

      set({
        favorites,
        isDarkMode,
        importedLists,
        activeSources,
        channelStatus,
        activeListId: importedLists.length > 0 ? importedLists[0].id : null,
        authPassword,
        isAuthenticated: !!authPassword,
        _initialized: true,
      })
    }
  },

  login: async (password) => {
    try {
      const res = await fetch(`/api/check-password?p=${encodeURIComponent(password)}`)
      const data = await res.json()
      if (data.ok) {
        saveToStorage('iptv-auth-password', password)
        set({ isAuthenticated: true, authPassword: password })
        return true
      }
      return false
    } catch {
      return false
    }
  },

  logout: () => {
    saveToStorage('iptv-auth-password', '')
    saveToStorage('iptv-imported-lists', [])
    saveToStorage('iptv-active-sources', [])
    set({ isAuthenticated: false, authPassword: '', importedLists: [], activeListId: null, activeSources: [] })
  },

  // Gestión de listas importadas
  addImportedList: (channels, sourceUrl, isPrivate) => {
    const state = get()
    const listCount = state.importedLists.length + 1
    const name = isPrivate ? (sourceUrl || `Lista Privada ${listCount}`) : `Lista ${listCount}`
    const newList: ImportedList = {
      id: generateId(),
      name,
      channels,
      createdAt: new Date().toISOString(),
      sourceUrl,
      lastRefreshed: sourceUrl ? new Date().toISOString() : undefined,
      isPrivate,
    }
    
    const updatedLists = [...state.importedLists, newList]
    const updatedSources = [...state.activeSources, newList.id]
    saveToStorage('iptv-imported-lists', updatedLists)
    saveToStorage('iptv-active-sources', updatedSources)
    set({ importedLists: updatedLists, activeListId: newList.id, activeSources: updatedSources })
    
    return newList.id
  },

  renameList: (listId, newName) => {
    const state = get()
    const updatedLists = state.importedLists.map(list =>
      list.id === listId ? { ...list, name: newName } : list
    )
    saveToStorage('iptv-imported-lists', updatedLists)
    set({ importedLists: updatedLists })
  },

  setListDescription: (listId, description) => {
    const state = get()
    const updatedLists = state.importedLists.map(list =>
      list.id === listId ? { ...list, description } : list
    )
    saveToStorage('iptv-imported-lists', updatedLists)
    set({ importedLists: updatedLists })
  },

  removeList: (listId) => {
    const state = get()
    const updatedLists = state.importedLists.filter(list => list.id !== listId)
    const updatedSources = state.activeSources.filter(id => id !== listId)
    saveToStorage('iptv-imported-lists', updatedLists)
    saveToStorage('iptv-active-sources', updatedSources)
    set({ 
      importedLists: updatedLists,
      activeSources: updatedSources,
      activeListId: state.activeListId === listId ? null : state.activeListId,
      currentChannel: state.currentChannel?.id.startsWith(listId) ? null : state.currentChannel,
    })
  },

  removeChannelFromList: (listId, channelId) => {
    const state = get()
    const updatedLists = state.importedLists.map(list => {
      if (list.id !== listId) return list
      return {
        ...list,
        channels: list.channels.filter(ch => ch.id !== channelId),
      }
    })
    saveToStorage('iptv-imported-lists', updatedLists)
    set({ 
      importedLists: updatedLists,
      currentChannel: state.currentChannel?.id === channelId ? null : state.currentChannel,
    })
  },

  setActiveList: (listId) => set({ activeListId: listId }),

  getListById: (listId) => {
    return get().importedLists.find(list => list.id === listId)
  },

  reorderLists: (fromIndex, toIndex) => {
    const state = get()
    const updated = [...state.importedLists]
    const [moved] = updated.splice(fromIndex, 1)
    updated.splice(toIndex, 0, moved)
    saveToStorage('iptv-imported-lists', updated)
    set({ importedLists: updated })
  },

  replacePrivateLists: (lists) => {
    const state = get()

    const nonPrivate = state.importedLists.filter(l => !l.isPrivate)

    const newLists: ImportedList[] = lists.map((list, i) => ({
      id: `synced-${Date.now()}-${i}`,
      name: list.name,
      channels: list.channels,
      createdAt: new Date().toISOString(),
      sourceUrl: list.name,
      lastRefreshed: new Date().toISOString(),
      isPrivate: true,
    }))

    const updatedLists = [...nonPrivate, ...newLists]
    saveToStorage('iptv-imported-lists', updatedLists)
    set({ importedLists: updatedLists, activeListId: newLists.length > 0 ? newLists[0].id : state.activeListId })
  },

  // Mover canal de una lista a otra
  moveChannelToList: (fromListId, channelId, toListId) => {
    const state = get()
    let movedChannel: Channel | null = null
    
    const updatedLists = state.importedLists.map(list => {
      if (list.id === fromListId) {
        const channel = list.channels.find(ch => ch.id === channelId)
        if (channel) movedChannel = { ...channel }
        return {
          ...list,
          channels: list.channels.filter(ch => ch.id !== channelId),
        }
      }
      return list
    })
    
    if (movedChannel) {
      const finalLists = updatedLists.map(list => {
        if (list.id === toListId) {
          return {
            ...list,
            channels: [...list.channels, movedChannel!],
          }
        }
        return list
      })
      
      saveToStorage('iptv-imported-lists', finalLists)
      set({ importedLists: finalLists })
    }
  },

  // Cambiar categoría de un canal dentro de su lista
  changeChannelCategory: (listId, channelId, newCategory) => {
    const state = get()
    const updatedLists = state.importedLists.map(list => {
      if (list.id !== listId) return list
      return {
        ...list,
        channels: list.channels.map(ch => 
          ch.id === channelId ? { ...ch, category: newCategory } : ch
        ),
      }
    })
    saveToStorage('iptv-imported-lists', updatedLists)
    set({ importedLists: updatedLists })
  },

  // Obtener canales favoritos de todas las listas
  getFavoriteChannels: () => {
    const state = get()
    const allChannels: Channel[] = []
    
    state.importedLists.forEach(list => {
      list.channels.forEach(ch => {
        if (state.favorites.includes(ch.id) && !allChannels.find(c => c.id === ch.id)) {
          allChannels.push(ch)
        }
      })
    })
    
    return allChannels
  },

  // Fase 3: Múltiples fuentes
  toggleSource: (sourceId) => {
    const state = get()
    const updated = state.activeSources.includes(sourceId)
      ? state.activeSources.filter(id => id !== sourceId)
      : [...state.activeSources, sourceId]
    saveToStorage('iptv-active-sources', updated)
    set({ activeSources: updated })
  },

  setAllSources: (active) => {
    const state = get()
    const updated = active
      ? state.importedLists.map(l => l.id)
      : []
    saveToStorage('iptv-active-sources', updated)
    set({ activeSources: updated })
  },

  // Fase 3: Refresco de listas
  refreshList: async (listId) => {
    const state = get()
    const list = state.importedLists.find(l => l.id === listId)
    if (!list?.sourceUrl) return

    set({ isRefreshing: { ...state.isRefreshing, [listId]: true } })

    try {
      const res = await fetch(`/api/refresh-list?id=${encodeURIComponent(listId)}&url=${encodeURIComponent(list.sourceUrl)}`)
      const result: { success: boolean; channels: Channel[]; error?: string } = await res.json()

      if (result.success) {
        const updatedLists = state.importedLists.map(l =>
          l.id === listId
            ? { ...l, channels: result.channels, lastRefreshed: new Date().toISOString() }
            : l
        )
        saveToStorage('iptv-imported-lists', updatedLists)
        set({ importedLists: updatedLists, isRefreshing: { ...get().isRefreshing, [listId]: false } })
      } else {
        set({ isRefreshing: { ...get().isRefreshing, [listId]: false } })
        console.error('Refresh failed:', result.error)
      }
    } catch (error) {
      set({ isRefreshing: { ...get().isRefreshing, [listId]: false } })
      console.error('Refresh error:', error)
    }
  },

  refreshAllLists: async () => {
    const state = get()
    const refreshable = state.importedLists.filter(l => l.sourceUrl)
    await Promise.all(refreshable.map(l => get().refreshList(l.id)))
  },

  setChannelStatus: (channelId, status) => {
    const updated = { ...get().channelStatus, [channelId]: status }
    saveToStorage('iptv-channel-status', updated)
    set({ channelStatus: updated })
  },

  checkChannelStatus: async (channelId, url) => {
    const state = get()
    if (state.channelStatus[channelId] === 'checking') return
    const checking = { ...state.channelStatus, [channelId]: 'checking' as ChannelStatus }
    saveToStorage('iptv-channel-status', checking)
    set({ channelStatus: checking })

    try {
      const res = await fetch(`/api/check-stream?url=${encodeURIComponent(url)}`)
      const data = await res.json()
      const result = { ...get().channelStatus, [channelId]: data.online ? 'online' as ChannelStatus : 'offline' as ChannelStatus }
      saveToStorage('iptv-channel-status', result)
      set({ channelStatus: result })
    } catch {
      const failed = { ...get().channelStatus, [channelId]: 'offline' as ChannelStatus }
      saveToStorage('iptv-channel-status', failed)
      set({ channelStatus: failed })
    }
  },

  checkAllChannels: async (channels) => {
    const unchecked = channels.filter(ch => ch.url && !get().channelStatus[ch.id])
    if (unchecked.length === 0) return

    const concurrency = 2
    const queue = [...unchecked]

    const save = (id: string, status: ChannelStatus) => {
      const updated = { ...get().channelStatus, [id]: status }
      saveToStorage('iptv-channel-status', updated)
      set({ channelStatus: updated })
    }

    const worker = async () => {
      while (queue.length > 0) {
        const ch = queue.shift()!
        const state = get()
        if (state.channelStatus[ch.id] === 'checking') continue
        save(ch.id, 'checking')

        try {
          const controller = new AbortController()
          const timeout = setTimeout(() => controller.abort(), 15000)
          const res = await fetch(`/api/check-stream?url=${encodeURIComponent(ch.url)}`, {
            signal: controller.signal
          })
          clearTimeout(timeout)
          const data = await res.json()
          save(ch.id, data.online ? 'online' : 'offline')
        } catch {
          save(ch.id, 'offline')
        }
      }
    }

    const workers = Array(concurrency).fill(null).map(() => worker())
    await Promise.all(workers)
  },

  recheckAllChannels: async (channels) => {
    const save = (id: string, status: ChannelStatus) => {
      const updated = { ...get().channelStatus, [id]: status }
      saveToStorage('iptv-channel-status', updated)
      set({ channelStatus: updated })
    }

    const queue = channels.filter(ch => ch.url)
    const concurrency = 2

    const worker = async () => {
      while (queue.length > 0) {
        const ch = queue.shift()!
        save(ch.id, 'checking')
        try {
          const controller = new AbortController()
          const timeout = setTimeout(() => controller.abort(), 15000)
          const res = await fetch(`/api/check-stream?url=${encodeURIComponent(ch.url)}`, {
            signal: controller.signal
          })
          clearTimeout(timeout)
          const data = await res.json()
          save(ch.id, data.online ? 'online' : 'offline')
        } catch {
          save(ch.id, 'offline')
        }
      }
    }

    await Promise.all(Array(concurrency).fill(null).map(() => worker()))
  },

  fastRecheckAllChannels: async (channels) => {
    const save = (id: string, status: ChannelStatus) => {
      const updated = { ...get().channelStatus, [id]: status }
      saveToStorage('iptv-channel-status', updated)
      set({ channelStatus: updated })
    }

    const queue = channels.filter(ch => ch.url)
    const concurrency = 20

    const worker = async () => {
      while (queue.length > 0) {
        const ch = queue.shift()!
        save(ch.id, 'checking')
        try {
          const res = await fetch(`/api/check-stream?deep=true&url=${encodeURIComponent(ch.url)}`)
          const data = await res.json()
          save(ch.id, data.online ? 'online' : 'offline')
        } catch {
          save(ch.id, 'offline')
        }
      }
    }

    await Promise.all(Array(concurrency).fill(null).map(() => worker()))
  },
}))