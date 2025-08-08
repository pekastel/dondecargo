'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { FuelType } from '@/lib/types'

interface FuelPreferenceState {
  selectedFuelType: FuelType | null
  setSelectedFuelType: (fuel: FuelType | null) => void
}

export const useFuelPreference = create<FuelPreferenceState>()(
  persist(
    (set) => ({
      selectedFuelType: 'nafta',
      setSelectedFuelType: (fuel) => set({ selectedFuelType: fuel }),
    }),
    {
      name: 'fuel-preference',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ selectedFuelType: state.selectedFuelType }),
    }
  )
)
