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
  
  setChannel: (channel: Channel) => void
  togglePlay: () => void
  toggleFavorite: (channelId: string) => void
  isFavorite: (channelId: string) => boolean
  toggleDarkMode: () => void
  initFromStorage: () => void
  
  // Gestión de listas importadas
  addImportedList: (channels: Channel[], sourceUrl?: string) => string
  renameList: (listId: string, newName: string) => void
  removeList: (listId: string) => void
  removeChannelFromList: (listId: string, channelId: string) => void
  setActiveList: (listId: string | null) => void
  getListById: (listId: string) => ImportedList | undefined
  
  // Mover canales entre listas y cambiar categoría
  moveChannelToList: (fromListId: string, channelId: string, toListId: string) => void
  changeChannelCategory: (listId: string, channelId: string, newCategory: string) => void
  
  // Obtener canales favoritos de todas las listas
  getFavoriteChannels: () => Channel[]
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
      
      if (isDarkMode) {
        document.documentElement.classList.add('dark')
      }
      
      set({ favorites, isDarkMode, importedLists })
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
    }
    
    const updatedLists = [...state.importedLists, newList]
    saveToStorage('iptv-imported-lists', updatedLists)
    set({ importedLists: updatedLists, activeListId: newList.id })
    
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

  removeList: (listId) => {
    const state = get()
    const updatedLists = state.importedLists.filter(list => list.id !== listId)
    saveToStorage('iptv-imported-lists', updatedLists)
    set({ 
      importedLists: updatedLists,
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
}))