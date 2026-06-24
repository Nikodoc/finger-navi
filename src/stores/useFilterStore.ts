import { create } from 'zustand'
import type { FilterOptions } from '../types'
import { DEFAULT_FILTER } from '../constants'

interface FilterStore {
  filter: FilterOptions
  setFilter: (partial: Partial<FilterOptions>) => void
  resetFilter: () => void
}

export const useFilterStore = create<FilterStore>((set) => ({
  filter: { ...DEFAULT_FILTER },
  setFilter: (partial) =>
    set((s) => ({ filter: { ...s.filter, ...partial } })),
  resetFilter: () => set({ filter: { ...DEFAULT_FILTER } }),
}))
