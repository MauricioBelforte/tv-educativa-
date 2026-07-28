# Diseño Actual - TV Educativa

## Diagrama de Componentes

```
┌───────────────────────────────────────────────────────────────────┐
│                          Layout.tsx                                │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │  Header (logo, SearchBar, modo oscuro, indicador EN VIVO)   │  │
│  ├─────────────────────────────────────────────────────────────┤  │
│  │  Main Content (page.tsx)                                    │  │
│  │  ┌────────────(flex)────────────────────────────────────┐   │  │
│  │  │ Sidebar Izquierdo (w-80 fijo)  │ Zona Player/Derecha │   │  │
│  │  │ ┌─────────────────────┐        │ ┌───────────────┐   │   │  │
│  │  │ │ Barra superior h-12 │        │ │ Player(HLS.js)│   │   │  │
│  │  │ │ ☰ ⭐ ↻             │        │ ├───────────────┤   │   │  │
│  │  │ ├─────────────────────┤        │ │ EPGPanel      │   │   │  │
│  │  │ │ Lists Area (siempre)│        │ ├───────────────┤   │   │  │
│  │  │ │ - M3UImporter      │        │ │ ChannelList   │   │   │  │
│  │  │ │ - ImportedListsMgr │        │ │ + ChannelCard │   │   │  │
│  │  │ │   (drag reorder)   │        │ │ (grid canales)│   │   │  │
│  │  │ ├─────────────────────┤        │ └───────────────┘   │   │  │
│  │  │ │ Channels Overlay   │        │                     │   │  │
│  │  │ │ (absolute, condic.)│        │                     │   │  │
│  │  │ │ - CategoryFilter   │        │                     │   │  │
│  │  │ │ - "Solo activos"   │        │                     │   │  │
│  │  │ │ - ChannelList      │        │                     │   │  │
│  │  │ └─────────────────────┘        │                     │   │  │
│  │  └───────────────────────────────┴──────────────────────┘   │  │
│  └─────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────┘
```

## Flujo de Datos

1. **Inicio**: `useEffect` → `fetch('/api/channels')` → `channels.json` + `local/` → estado local
2. **Selección**: Click en `ChannelCard` → `store.setChannel()` → `Player` usa `getProxyUrl()` → `HLS.js` carga vía proxy
3. **Filtros**: Filtrado en memoria con `useMemo` + `activeSources` para multi-fuente
4. **Persistencia**: `localStorage` para favoritos, modo oscuro, listas, fuentes activas, channelStatus
5. **EPG**: Al seleccionar canal → `fetch('/api/epg?channel=X')` → muestra now/next
6. **Verificación batch**: Al cargar canales → `checkAllChannels()` (2 workers, 15s timeout) sobre `allAvailableChannels`
7. **Escaneo rápido**: Botón en barra superior → `fastRecheckAllChannels()` (20 workers, deep=true) sobre TODAS las listas

## Store (Zustand)
- `currentChannel`, `isPlaying`, `favorites`, `isDarkMode`, `showOnlineOnly`, `categoriesCollapsed`
- `importedLists`, `activeListId`, `activeSources`, `isRefreshing`, `channelStatus`
- `favoriteIds`, `channelListOpen`, `scanAllLists`
- Acciones: gestión de listas (drag reorder), fuentes múltiples, refresco, favoritos
- `checkAllChannels()` — 2 workers, 15s timeout, no deep
- `fastRecheckAllChannels()` — 20 workers, deep=true
- `channelStatus` → persistencia en localStorage (`iptv-channel-status`)

## API
- `GET /api/channels` → Canales por defecto + locales
- `GET /api/stream-proxy` → Proxy de streams HLS (anti-CORS) + rewrite de URLs de segmentos
- `GET /api/refresh-list` → Refresco de listas M3U
- `GET /api/epg` → Guía de programación now/next
- `GET /api/m3u-proxy` → Proxy de descarga de listas
- `GET /api/check-stream` → Verificación de salud (8s timeout, 12s si deep)
  - `deep=false` (default): valida que el .m3u8 responda y contenga #EXTM3U
  - `deep=true`: además parsea y descarga el primer segmento
- `GET /api/private-lists` → Listas desde env vars (base64/URL/auth)
- `GET /api/sync-lists` → Descargar listas desde Supabase
- `POST /api/sync-lists` → Subir listas a Supabase

## Infraestructura Adicional
- **Supabase**: PostgreSQL gratis para sincronización entre local y producción
- **Tabla `sync_data`**: JSONB con las listas serializadas
- **Cliente server-side**: `src/lib/supabase.ts` usa service_role key (nunca expuesta)