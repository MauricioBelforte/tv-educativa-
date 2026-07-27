'use client'

import { useEffect } from 'react'
import { usePlayerStore } from '@/store/player-store'

/**
 * Componente que inicializa el store desde localStorage.
 * Se ejecuta en el cliente para cargar preferencias guardadas.
 */
export default function StoreInitializer() {
  const initFromStorage = usePlayerStore((state) => state.initFromStorage)

  useEffect(() => {
    initFromStorage()
  }, [initFromStorage])

  return null
}