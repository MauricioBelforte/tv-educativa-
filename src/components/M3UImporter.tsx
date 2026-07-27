'use client'

import { useState } from 'react'

interface M3UImporterProps {
  onImport: (m3uContent: string) => void
}

export default function M3UImporter({ onImport }: M3UImporterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Importa desde URL usando el proxy del servidor.
    * El proxy (/api/m3u-proxy) evita problemas de CORS:
    * el backend descarga las listas y las sirve al frontend.
   */
  const handleImportFromUrl = async () => {
    if (!input.trim()) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      // Usar el proxy del servidor para evitar CORS
      const res = await fetch(`/api/m3u-proxy?url=${encodeURIComponent(input.trim())}`)
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al descargar la lista')
      }
      
      const content = await res.text()
      onImport(content)
      setInput('')
      setIsOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Importa contenido M3U pegado directamente.
   * Útil si ya tienes el texto de la lista copiado.
   */
  const handlePasteContent = () => {
    if (!input.trim()) return
    
    if (input.includes('#EXTM3U') || input.includes('#EXTINF')) {
      onImport(input)
      setInput('')
      setIsOpen(false)
    } else {
      setError('El contenido no parece ser una lista M3U válida (debe contener #EXTM3U o #EXTINF)')
    }
  }

  const isUrl = input.trim().startsWith('http://') || input.trim().startsWith('https://')

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        Importar lista M3U
      </button>

      {isOpen && (
        <div className="mt-2 p-3 bg-gray-800 rounded-lg border border-gray-700 space-y-3">
          <p className="text-xs text-gray-400">
            Pega una URL de lista M3U (ej: <span className="text-blue-400">https://ejemplo.com/lista.m3u</span>)
          </p>
          <p className="text-xs text-gray-500">
            O pega el contenido <span className="text-green-400">#EXTM3U</span> directamente
          </p>
          
          <textarea
            value={input}
            onChange={(e) => {
              setInput(e.target.value)
              setError(null)
            }}
            placeholder="https://m3u.cl/lista/AR.m3u"
            rows={2}
            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-500 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono"
          />

          {error && (
            <div className="flex items-start gap-2 text-xs text-red-400 bg-red-900/20 p-2 rounded">
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleImportFromUrl}
              disabled={isLoading || !input.trim() || !isUrl}
              className="flex-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white text-xs rounded-lg transition-colors"
              title={isUrl ? 'Importar desde URL' : 'Esto no parece una URL'}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Descargando...
                </span>
              ) : 'Importar desde URL'}
            </button>
            <button
              onClick={handlePasteContent}
              disabled={!input.trim() || isUrl}
              className="flex-1 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 disabled:text-gray-500 text-gray-200 text-xs rounded-lg transition-colors"
              title={!isUrl ? 'Pegar como contenido M3U' : ''}
            >
              Pegar contenido
            </button>
          </div>
        </div>
      )}
    </div>
  )
}