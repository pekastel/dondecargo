'use client'

import useSWR from 'swr'

interface UserStationsStatus {
  hasStations: boolean
  loading: boolean
}

export function useUserStations(): UserStationsStatus {
  const { data, isLoading } = useSWR(
    '/api/estaciones/mis-estaciones',
    async (url) => {
      const res = await fetch(url)
      if (!res.ok) return null
      return res.json()
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000, // Cache 1 minuto
    }
  )

  return {
    hasStations: data?.estaciones?.length > 0,
    loading: isLoading,
  }
}

