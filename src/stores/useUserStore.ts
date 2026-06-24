import { create } from 'zustand'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { Toilet } from '../types'

const FAVORITES_KEY = 'favorites_v1'
const HISTORY_KEY = 'history_v1'
const MAX_HISTORY = 20

interface UserStore {
  favorites: Toilet[]
  history: Toilet[]
  loaded: boolean

  loadFromStorage: () => Promise<void>
  toggleFavorite: (toilet: Toilet) => void
  addToHistory: (toilet: Toilet) => void
  isFavorite: (id: string) => boolean
}

async function persistFavorites(favorites: Toilet[]) {
  try {
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites))
  } catch {}
}

async function persistHistory(history: Toilet[]) {
  try {
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, MAX_HISTORY)))
  } catch {}
}

export const useUserStore = create<UserStore>((set, get) => ({
  favorites: [],
  history: [],
  loaded: false,

  loadFromStorage: async () => {
    try {
      const [favStr, histStr] = await Promise.all([
        AsyncStorage.getItem(FAVORITES_KEY),
        AsyncStorage.getItem(HISTORY_KEY),
      ])
      set({
        favorites: favStr ? JSON.parse(favStr) : [],
        history: histStr ? JSON.parse(histStr) : [],
        loaded: true,
      })
    } catch {
      set({ loaded: true })
    }
  },

  toggleFavorite: (toilet) => {
    const { favorites } = get()
    const idx = favorites.findIndex((f) => f.id === toilet.id)
    let next: Toilet[]
    if (idx >= 0) {
      next = [...favorites.slice(0, idx), ...favorites.slice(idx + 1)]
    } else {
      next = [toilet, ...favorites]
    }
    set({ favorites: next })
    persistFavorites(next)
  },

  addToHistory: (toilet) => {
    const { history } = get()
    const filtered = history.filter((h) => h.id !== toilet.id)
    const next = [toilet, ...filtered].slice(0, MAX_HISTORY)
    set({ history: next })
    persistHistory(next)
  },

  isFavorite: (id) => {
    return get().favorites.some((f) => f.id === id)
  },
}))
