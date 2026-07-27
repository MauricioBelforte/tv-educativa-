# Diseño Actual - TV Educativa

## Diagrama de Componentes

```
┌──────────────────────────────────────────────────────────────┐
│                        Layout.tsx                             │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Header (logo, modo oscuro, favoritos, indicador vivo) │  │
│  ├────────────────────────────────────────────────────────┤  │
│  │  Main Content (page.tsx)                               │  │
│  │  ┌──────────────┐  ┌──────────────────────────────┐   │  │
│  │  │ Sidebar/Filter│  │  Player (HLS.js + Proxy)    │   │  │
│  │  │ - Categorías  │  ├──────────────────────────────┤   │  │
│  │  │ - Favoritos   │  │  EPGPanel (now/next)        │   │  │
│  │  │ - Todos       │  ├──────────────────────────────┤   │  │
│  │  │ - SourceFilter│  │  ChannelList + ChannelCard  │   │  │
│  │  │ - M3UImporter │  │  (Grid de canales)          │   │  │
│  │  │ - Listas      │  └──────────────────────────────┘   │  │
│  │  └──────────────┘                                      │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

## Flujo de Datos

1. **Inicio**: `useEffect` → `fetch('/api/channels')` → `channels.json` + `local/` → estado local
2. **Selección**: Click en `ChannelCard` → `store.setChannel()` → `Player` usa `getProxyUrl()` → `HLS.js` carga vía proxy
3. **Filtros**: Filtrado en memoria con `useMemo` + `activeSources` para multi-fuente
4. **Persistencia**: `localStorage` para favoritos, modo oscuro, listas, fuentes activas
5. **EPG**: Al seleccionar canal → `fetch('/api/epg?channel=X')` → muestra now/next

## Store (Zustand)
- `currentChannel`, `isPlaying`, `favorites`, `isDarkMode`
- `importedLists`, `activeListId`, `activeSources`, `isRefreshing`
- Acciones: gestión de listas, fuentes múltiples, refresco, favoritos

## API
- `GET /api/channels` → Canales por defecto + locales
- `GET /api/stream-proxy` → Proxy de streams HLS (anti-CORS)
- `GET /api/refresh-list` → Refresco de listas M3U
- `GET /api/epg` → Guía de programación now/next
- `GET /api/m3u-proxy` → Proxy de descarga de listas