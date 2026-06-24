import { create } from 'zustand'
import type { LocationState } from '../types'

interface LocationStore extends LocationState {
  setLocation: (lat: number, lng: number) => void
  setError: (error: string) => void
}

export const useLocationStore = create<LocationStore>((set) => ({
  lat: 0,
  lng: 0,
  loaded: false,
  error: null,
  setLocation: (lat, lng) => set({ lat, lng, loaded: true, error: null }),
  setError: (error) => set({ error }),
}))
