'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Hls from 'hls.js'
import { usePlayerStore } from '@/store/player-store'

function getProxyUrl(url: string): string {
  if (!url.startsWith('http')) return url
  return `/api/stream-proxy?url=${encodeURIComponent(url)}`
}

export default function Player() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<Hls | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hlsUrl, setHlsUrl] = useState<string | null>(null)
  const [probing, setProbing] = useState(false)

  const currentChannel = usePlayerStore((state) => state.currentChannel)
  const isPlaying = usePlayerStore((state) => state.isPlaying)
  const togglePlay = usePlayerStore((state) => state.togglePlay)

  const destroyHls = useCallback(() => {
    if (hlsRef.current) {
      hlsRef.current.destroy()
      hlsRef.current = null
    }
  }, [])

  function getIsIframe(ch: typeof currentChannel): boolean {
    if (!ch) return false
    return ch.playerType === 'iframe' || (!ch.url.includes('.m3u8') && ch.url.startsWith('http'))
  }

  const setupHls = useCallback((url: string) => {
    const video = videoRef.current
    if (!video) return

    setIsLoading(true)
    const proxyUrl = getProxyUrl(url)

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = proxyUrl
      video.addEventListener('loadedmetadata', () => setIsLoading(false))
      video.addEventListener('error', () => { setError('Error al cargar el stream'); setIsLoading(false) })
    } else if (Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true, lowLatencyMode: true })
      hlsRef.current = hls
      hls.loadSource(proxyUrl)
      hls.attachMedia(video)
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false)
        if (isPlaying) video.play().catch(() => setError('Haz clic para reproducir'))
      })
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          setError(data.type === Hls.ErrorTypes.NETWORK_ERROR ? 'Error de red' : 'Error en el stream')
          setIsLoading(false)
        }
      })
    } else {
      setError('Navegador no soporta HLS')
      setIsLoading(false)
    }
  }, [isPlaying])

  useEffect(() => {
    setHlsUrl(null)
    setError(null)
    destroyHls()

    if (!currentChannel || !getIsIframe(currentChannel)) {
      setProbing(false)
      if (currentChannel && !getIsIframe(currentChannel)) {
        setupHls(currentChannel.url)
      }
      return
    }

    const ch = currentChannel
    setProbing(true)

    async function probe() {
      if (!ch) { setProbing(false); return }
      try {
        const res = await fetch(`/api/probe-iframe?url=${encodeURIComponent(ch.url)}`)
        if (!res.ok) { setProbing(false); return }
        const data = await res.json()
        if (data.found && data.url) {
          setHlsUrl(data.url)
          setProbing(false)
          setupHls(data.url)
        } else {
          setProbing(false)
        }
      } catch {
        setProbing(false)
      }
    }

    probe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentChannel])

  useEffect(() => {
    const video = videoRef.current
    if (!video || !currentChannel) return
    if (getIsIframe(currentChannel) && !hlsUrl) return

    if (isPlaying) {
      video.play().catch(() => {})
    } else {
      video.pause()
    }
  }, [isPlaying, currentChannel, hlsUrl])

  if (!currentChannel) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900 rounded-lg">
        <div className="text-center text-gray-400">
          <svg className="w-16 h-16 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-lg">Selecciona un canal para comenzar</p>
          <p className="text-sm mt-2 text-gray-500">Haz clic en cualquier canal de la lista</p>
        </div>
      </div>
    )
  }

  const channel = currentChannel

  const isIframe = channel.playerType === 'iframe' || (!channel.url.includes('.m3u8') && channel.url.startsWith('http'))
  const showIframe = isIframe && !hlsUrl && !probing
  const showProbing = isIframe && probing

  const iframeUrl = isIframe
    ? channel.url + (channel.url.includes('?') ? '&' : '?') + 'autoplay=1'
    : channel.url

  return (
    <div className="relative bg-black rounded-lg overflow-hidden group">
      {showProbing && (
        <div className="flex items-center justify-center w-full aspect-video bg-black">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-white text-sm">Buscando stream directo...</p>
            <p className="text-gray-500 text-xs mt-2">Si no encuentra, carga en iframe</p>
          </div>
        </div>
      )}
      {showIframe && (
        <iframe
          src={iframeUrl}
          className="w-full aspect-video"
          allow="autoplay; encrypted-media; fullscreen"
          allowFullScreen
        />
      )}
      {!showProbing && !showIframe && (
        <>
          <video
            ref={videoRef}
            className="w-full aspect-video"
            controls
            playsInline
            onClick={togglePlay}
          />
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <div className="text-center">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-white text-sm">Cargando stream...</p>
              </div>
            </div>
          )}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80">
              <div className="text-center px-4">
                <svg className="w-12 h-12 mx-auto mb-3 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <p className="text-white text-sm mb-2">{error}</p>
              </div>
            </div>
          )}
        </>
      )}

      <div className="absolute top-0 left-0 right-0 p-3 bg-gradient-to-b from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <div className="flex items-center gap-2">
          {channel.logo && (
            <img
              src={channel.logo}
              alt={channel.name}
              className="w-8 h-8 rounded"
            />
          )}
          <div>
            <p className="text-white text-sm font-medium">{channel.name}</p>
            <p className="text-gray-300 text-xs">{channel.category}</p>
          </div>
        </div>
      </div>
    </div>
  )
}