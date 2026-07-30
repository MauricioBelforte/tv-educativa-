'use client'

import { useState } from 'react'
import { ImportedList, Channel } from '@/lib/types'
import { parseM3U } from '@/lib/m3u-parser'

interface M3UImporterProps {
  onImport: (m3uContent: string, sourceUrl?: string, listName?: string) => void
  onAppendToList: (listId: string, m3uContent: string) => void
  lists: ImportedList[]
}

export default function M3UImporter({ onImport, onAppendToList, lists }: M3UImporterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const [listName, setListName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [batchOpen, setBatchOpen] = useState(false)
  const [batchInput, setBatchInput] = useState('')
  const [batchStatus, setBatchStatus] = useState<string | null>(null)
  const [pendingRename, setPendingRename] = useState<{ channels: Channel[] } | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [batchNewList, setBatchNewList] = useState(false)
  const [batchNewListName, setBatchNewListName] = useState('')

  const handleImportFromUrl = async () => {
    if (!input.trim()) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const res = await fetch(`/api/m3u-proxy?url=${encodeURIComponent(input.trim())}`)
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al descargar la lista')
      }
      
      const content = await res.text()
      onImport(content, input.trim(), listName.trim() || undefined)
      setInput('')
      setListName('')
      setIsOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasteContent = () => {
    if (!input.trim()) return
    
    if (input.includes('#EXTM3U') || input.includes('#EXTINF')) {
      onImport(input, undefined, listName.trim() || undefined)
      setInput('')
      setListName('')
      setIsOpen(false)
    } else {
      setError('El contenido no parece ser una lista M3U válida (debe contener #EXTM3U o #EXTINF)')
    }
  }

  const isUrl = input.trim().startsWith('http://') || input.trim().startsWith('https://')

  const parsePlainUrls = (text: string): { name: string; url: string }[] => {
    const entries = text.split('\n')
      .map(l => l.trim())
      .filter(l => l.startsWith('http://') || l.startsWith('https://'))
      .map(url => {
        try {
          const params = new URLSearchParams(url.split('?')[1] || '')
          const name = decodeURIComponent(params.get('channel') || url.split('/').pop()?.split('?')[0] || 'Canal')
          return { name, url }
        } catch {
          return { name: 'Canal', url }
        }
      })

    const firstOccurrence = new Map<string, number>()
    entries.forEach((e, i) => {
      if (!firstOccurrence.has(e.name)) firstOccurrence.set(e.name, i)
    })
    entries.sort((a, b) => firstOccurrence.get(a.name)! - firstOccurrence.get(b.name)!)

    const nameCounts = new Map<string, number>()
    for (const e of entries) {
      nameCounts.set(e.name, (nameCounts.get(e.name) || 0) + 1)
    }

    const counters = new Map<string, number>()
    return entries.map(e => {
      const count = nameCounts.get(e.name) || 0
      if (count <= 1) return e
      const idx = (counters.get(e.name) || 0) + 1
      counters.set(e.name, idx)
      return { ...e, name: `${e.name} ${idx}` }
    })
  }

  const handleBatchAdd = () => {
    if (!batchInput.trim()) {
      setBatchStatus('Error: pegá URLs o contenido M3U')
      return
    }

    const isPlainUrls = !batchInput.includes('#EXTM3U') && !batchInput.includes('#EXTINF')

    if (isPlainUrls) {
      const channels = parsePlainUrls(batchInput)
      if (channels.length === 0) {
        setBatchStatus('Error: no se encontraron URLs válidas')
        return
      }

      const m3uContent = `#EXTM3U\n${channels.map(c => `#EXTINF:-1,${c.name}\n${c.url}`).join('\n')}`

      if (batchNewList) {
        const name = batchNewListName.trim() || 'Nueva lista'
        onImport(m3uContent, undefined, name)
        setBatchInput('')
        setBatchNewListName('')
        setBatchOpen(false)
        return
      }

      const select = document.querySelector('select') as HTMLSelectElement
      const listId = select?.value
      if (!listId) {
        setBatchStatus('Error: seleccioná una lista o creá una nueva')
        return
      }
      onAppendToList(listId, m3uContent)
      setBatchInput('')
      setBatchStatus(`${channels.length} canales agregados`)
      setTimeout(() => setBatchStatus(''), 3000)
      return
    }

    const select = document.querySelector('select') as HTMLSelectElement
    const listId = select?.value
    if (!listId || !batchInput.trim()) {
      setBatchStatus('Error: seleccioná una lista y pegá contenido')
      return
    }

    const parsed = parseM3U(batchInput)
    if (parsed.length === 0) {
      setBatchStatus('Error: no se pudo parsear ningún canal')
      return
    }

    if (parsed.length === 1) {
      setPendingRename({ channels: parsed })
      setRenameValue(parsed[0].name)
      return
    }

    onAppendToList(listId, batchInput)
    setBatchInput('')
    setBatchStatus(`${parsed.length} canales agregados`)
    setTimeout(() => setBatchStatus(''), 3000)
  }

  const handleConfirmRename = () => {
    if (!pendingRename) return
    const select = document.querySelector('select') as HTMLSelectElement
    const listId = select?.value
    if (!listId) return

    const renamed = [{ ...pendingRename.channels[0], name: renameValue.trim() || pendingRename.channels[0].name }]

    const content = `#EXTM3U\n#EXTINF:-1,${renamed[0].name}\n${renamed[0].url}`
    onAppendToList(listId, content)

    setPendingRename(null)
    setBatchInput('')
    setBatchStatus(`"${renamed[0].name}" agregado`)
    setTimeout(() => setBatchStatus(''), 3000)
  }

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

          <input
            type="text"
            value={listName}
            onChange={(e) => setListName(e.target.value)}
            placeholder="Nombre de la lista (opcional)"
            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-500 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
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

      <div className="border-t border-gray-700 my-2" />

      {/* Agregar a lista existente */}
      <button
        onClick={() => setBatchOpen(!batchOpen)}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Agregar canales a lista
      </button>

      {batchOpen && (
        <div className="mt-2 p-3 bg-gray-800 rounded-lg border border-gray-700 space-y-3">
          <p className="text-xs text-gray-400">
            Pega URLs o contenido M3U para agregar a una lista existente:
          </p>

          <div className="flex gap-2 items-center">
            <button
              onClick={() => setBatchNewList(false)}
              className={`flex-1 px-2 py-1 text-xs rounded-lg transition-colors ${!batchNewList ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400 hover:text-gray-200'}`}
            >
              Lista existente
            </button>
            <button
              onClick={() => setBatchNewList(true)}
              className={`flex-1 px-2 py-1 text-xs rounded-lg transition-colors ${batchNewList ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400 hover:text-gray-200'}`}
            >
              Nueva lista
            </button>
          </div>

          {!batchNewList ? (
            <select
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              defaultValue=""
            >
              <option value="" disabled>Seleccionar lista...</option>
              {lists.map(l => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={batchNewListName}
              onChange={(e) => setBatchNewListName(e.target.value)}
              placeholder="Nombre de la nueva lista"
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-500 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}

          <textarea
            value={batchInput}
            onChange={(e) => { setBatchInput(e.target.value); setBatchStatus(null) }}
            placeholder="https://ejemplo.com/canal1.m3u8&#10;https://ejemplo.com/canal2.php&#10;o URLs sueltas (se autogeneran nombres)"
            rows={4}
            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-500 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono"
          />

          {batchStatus && (
            <div className={`text-xs p-2 rounded ${batchStatus.startsWith('Error') ? 'text-red-400 bg-red-900/20' : 'text-green-400 bg-green-900/20'}`}>
              {batchStatus}
            </div>
          )}

          {pendingRename && (
            <div className="p-3 bg-gray-900 rounded-lg border border-gray-700 space-y-2">
              <p className="text-xs text-gray-400">Se detectó 1 canal. ¿Querés ponerle un nombre?</p>
              <input
                type="text"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nombre del canal"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setPendingRename(null)}
                  className="flex-1 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-200 text-xs rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmRename}
                  className="flex-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs rounded-lg transition-colors"
                >
                  Agregar como &ldquo;{renameValue.trim() || pendingRename.channels[0].name}&rdquo;
                </button>
              </div>
            </div>
          )}

          {!pendingRename && (
            <button
              onClick={handleBatchAdd}
              disabled={!batchInput.trim()}
              className="w-full px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:text-gray-500 text-white text-xs rounded-lg transition-colors"
            >
              {batchNewList ? 'Crear lista' : 'Agregar a lista'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}