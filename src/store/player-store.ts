'use client'

import { create } from 'zustand'
import { Channel, ImportedList } from '@/lib/types'

interface PlayerStore {
  currentChannel: Channel | null
  isPlaying: boolean
  favorites: string[]
  isDarkMode: boolean
  importedLists: ImportedList[]
  activeListId: string | null
  activeSources: string[]    // IDs de fuentes activas para vista múltiple
  isRefreshing: Record<string, boolean>
  
  setChannel: (channel: Channel) => void
  togglePlay: () => void
  toggleFavorite: (channelId: string) => void
  isFavorite: (channelId: string) => boolean
  toggleDarkMode: () => void
  initFromStorage: () => void
  
  // Gestión de listas importadas
  addImportedList: (channels: Channel[], sourceUrl?: string) => string
  renameList: (listId: string, newName: string) => void
  setListDescription: (listId: string, description: string) => void
  removeList: (listId: string) => void
  removeChannelFromList: (listId: string, channelId: string) => void
  setActiveList: (listId: string | null) => void
  getListById: (listId: string) => ImportedList | undefined
  
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
      
      if (isDarkMode) {
        document.documentElement.classList.add('dark')
      }
      
      set({ favorites, isDarkMode, importedLists, activeSources })
    }
  },

  // Gestión de listas importadas
  addImportedList: (channels, sourceUrl) => {
    const state = get()
    const listCount = state.importedLists.length + 1
    const newList: ImportedList = {
      id: generateId(),
      name: `Lista ${listCount}`,
      channels,
      createdAt: new Date().toISOString(),
      sourceUrl,
      lastRefreshed: sourceUrl ? new Date().toISOString() : undefined,
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
}))