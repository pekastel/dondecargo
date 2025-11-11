'use client'

import useSWR from 'swr'
import { authClient } from '@/lib/authClient'

interface UserStationsStatus {
  hasStations: boolean
  loading: boolean
}

export function useUserStations(): UserStationsStatus {
  const { data: session } = authClient.useSession()
  
  // Incluir el userId en la key para forzar revalidación cuando cambie la sesión
  const swrKey = session?.user?.id 
    ? `/api/estaciones/mis-estaciones?userId=${session.user.id}` 
    : null

  const { data, isLoading } = useSWR(
    swrKey,
    async (url) => {
      const res = await fetch('/api/estaciones/mis-estaciones')
      if (!res.ok) return null
      return res.json()
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateOnMount: true, // Siempre revalidar al montar
      dedupingInterval: 30000, // Cache reducido a 30 segundos
    }
  )

  return {
    hasStations: data?.estaciones?.length > 0,
    loading: isLoading || !session,
  }
}

