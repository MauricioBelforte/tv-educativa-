# Diseño Actual - TV Libre

## Diagrama de Componentes

```
┌──────────────────────────────────────────────────────────────┐
│                        Layout.tsx                             │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Header (logo, búsqueda, modo oscuro, favoritos)       │  │
│  ├────────────────────────────────────────────────────────┤  │
│  │  Main Content (page.tsx)                               │  │
│  │  ┌──────────────┐  ┌──────────────────────────────┐   │  │
│  │  │ Sidebar/Filter│  │  Player (HLS.js)            │   │  │
│  │  │ (Desktop)     │  ├──────────────────────────────┤   │  │
│  │  │ - Categorías  │  │  ChannelList + ChannelCard  │   │  │
│  │  │ - Favoritos   │  │  (Grid de canales)          │   │  │
│  │  │ - Todos       │  └──────────────────────────────┘   │  │
│  │  └──────────────┘                                      │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

## Flujo de Datos

1. **Inicio**: `useEffect` → `fetch('/api/channels')` → `channels.json` → estado local
2. **Selección**: Click en `ChannelCard` → `store.setChannel()` → `Player` detecta cambio → `HLS.js` carga URL
3. **Filtros**: Filtrado en memoria con `useMemo` (sin llamadas extra a API)
4. **Persistencia**: `localStorage` para favoritos y modo oscuro

## Store (Zustand)
- `currentChannel`: Channel | null
- `isPlaying`: boolean
- `favorites`: string[] (IDs)
- `isDarkMode`: boolean
- Acciones: setChannel, togglePlay, toggleFavorite, toggleDarkMode, initFromStorage

## API
- `GET /api/channels` → `channels.ts` → `channels.json` (o M3U parser)
- Filtros: `?category=X&search=Y`