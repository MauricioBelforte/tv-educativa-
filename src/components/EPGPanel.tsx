'use client'
import { useState, useEffect } from 'react'
import { usePlayerStore } from '@/store/player-store'
import { EPGEntry } from '@/lib/types'

// Determina si un programa está en vivo ahora
function isCurrent(entry: EPGEntry): boolean {
  const now = new Date()
  const start = new Date(entry.start)
  const stop = new Date(entry.stop)
  return now >= start && now < stop
}

// Formatea fecha ISO a hora HH:MM
function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
  } catch {
    return '--:--'
  }
}

export default function EPGPanel() {
  const currentChannel = usePlayerStore((state) => state.currentChannel)

  const [entries, setEntries] = useState<EPGEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!currentChannel) return

    let cancelled = false
    setLoading(true)
    setError(null)
    setEntries([])

    fetch(`/api/epg?channel=${encodeURIComponent(currentChannel.id)}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Error ${res.status}`)
        return res.json()
      })
      .then((data: EPGEntry[]) => {
        if (!cancelled) {
          setEntries(Array.isArray(data) ? data : [])
          setLoading(false)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || 'Error al cargar la guía EPG')
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [currentChannel])

  if (!currentChannel) return null

  const nowEntry = entries.find(isCurrent)
  const nextEntries = entries.filter(
    (e) => new Date(e.start) >= new Date() && e !== nowEntry
  )

  return (
    <div className="bg-gray-900 rounded-lg p-3 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wider">
          Guía de Programación
        </h3>
        <span className="text-xs text-gray-500">{currentChannel.name}</span>
      </div>

      {/* Estado: cargando */}
      {loading && (
        <div className="flex items-center gap-2 py-3">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-400">Cargando EPG...</span>
        </div>
      )}

      {/* Estado: error */}
      {error && !loading && (
        <div className="text-sm text-red-400 py-2">
          {error}
        </div>
      )}

      {/* Estado: sin datos */}
      {!loading && !error && entries.length === 0 && (
        <div className="text-sm text-gray-500 py-2">
          No hay información de programación disponible para este canal.
        </div>
      )}

      {/* Programa actual */}
      {nowEntry && (
        <div className="bg-green-900/30 border border-green-700/50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="flex items-center gap-1 text-xs text-green-400 font-semibold uppercase">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              En Vivo
            </span>
            <span className="text-xs text-gray-500">
              {formatTime(nowEntry.start)} - {formatTime(nowEntry.stop)}
            </span>
          </div>
          <p className="text-sm text-white font-medium">{nowEntry.title}</p>
          {nowEntry.description && (
            <p className="text-xs text-gray-400 mt-1 line-clamp-2">
              {nowEntry.description}
            </p>
          )}
        </div>
      )}

      {/* Próximos programas */}
      {nextEntries.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Próximos</p>
          {nextEntries.slice(0, 5).map((entry, idx) => (
            <div
              key={`${entry.start}-${idx}`}
              className="flex items-start gap-2 px-2 py-1.5 rounded hover:bg-gray-800 transition-colors"
            >
              <span className="text-xs text-gray-500 whitespace-nowrap min-w-[48px]">
                {formatTime(entry.start)}
              </span>
              <div className="min-w-0">
                <p className="text-sm text-gray-300 truncate">{entry.title}</p>
                {entry.description && (
                  <p className="text-xs text-gray-600 truncate">{entry.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
