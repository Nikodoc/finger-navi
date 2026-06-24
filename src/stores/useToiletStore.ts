import { create } from 'zustand'
import type { Toilet, ToiletSubmission } from '../types'

interface ToiletStore {
  toilets: Toilet[]
  userToilets: Toilet[]
  selectedToilet: Toilet | null
  loading: boolean

  setToilets: (toilets: Toilet[]) => void
  addUserToilet: (submission: ToiletSubmission) => void
  selectToilet: (toilet: Toilet | null) => void
  setLoading: (loading: boolean) => void
}

export const useToiletStore = create<ToiletStore>((set, get) => ({
  toilets: [],
  userToilets: [],
  selectedToilet: null,
  loading: false,

  setToilets: (toilets) => set({ toilets, loading: false }),

  addUserToilet: (submission) => {
    const newToilet: Toilet = {
      id: `user_${Date.now()}`,
      ...submission,
      rating: 0,
      ratingCount: 0,
      source: 'user',
      tags: [],
    }
    set((s) => ({
      userToilets: [...s.userToilets, newToilet],
      toilets: [...s.toilets, newToilet],
    }))
  },

  selectToilet: (toilet) => set({ selectedToilet: toilet }),
  setLoading: (loading) => set({ loading }),
}))
