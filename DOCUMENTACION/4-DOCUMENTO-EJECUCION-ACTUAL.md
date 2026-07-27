# Ejecución Actual - TV Educativa

## Comandos

```bash
# Desarrollo
npm run dev

# Build
npm run build

# Producción
npm start

# Linting
npm run lint
```

## Estructura de Archivos

```
src/
├── app/
│   ├── layout.tsx              → Layout raíz
│   ├── page.tsx                → Página principal
│   ├── globals.css             → Estilos globales + Tailwind
│   └── api/
│       ├── channels/
│       │   └── route.ts        → API: GET /api/channels
│       ├── epg/
│       │   └── route.ts        → API: GET /api/epg?channel=X
│       ├── m3u-proxy/
│       │   └── route.ts        → API: GET /api/m3u-proxy?url=X
│       ├── refresh-list/
│       │   └── route.ts        → API: GET /api/refresh-list?id=X&url=Y
│       └── stream-proxy/
│           └── route.ts        → API: GET /api/stream-proxy?url=X
├── components/
│   ├── Player.tsx              → Reproductor HLS.js con proxy
│   ├── ChannelList.tsx         → Lista de canales
│   ├── ChannelCard.tsx         → Tarjeta de canal
│   ├── SearchBar.tsx           → Búsqueda
│   ├── CategoryFilter.tsx      → Filtro categorías
│   ├── Header.tsx              → Header
│   ├── EPGPanel.tsx            → Panel now/next EPG
│   ├── SourceFilter.tsx        → Filtro de fuentes múltiples
│   ├── StoreInitializer.tsx    → Init localStorage
│   ├── M3UImporter.tsx         → Importador M3U con URL
│   └── ImportedListsManager.tsx→ Gestor de listas con refresco
├── lib/
│   ├── types.ts                → Tipos TypeScript
│   ├── m3u-parser.ts           → Parser M3U
│   ├── channels.ts             → Lógica de canales (incluye local/)
│   └── local-loader.ts         → Cargador de archivos M3U locales
├── store/
│   └── player-store.ts         → Estado global (Zustand)
└── data/
    ├── channels.json           → Canales de ejemplo
    └── epg-data.json           → Datos de programación EPG
```

## API

| Endpoint | Descripción | Parámetros |
|----------|-------------|-----------|
| `GET /api/channels` | Canales disponibles | `category`, `search` |
| `GET /api/stream-proxy` | Proxy de streams HLS | `url` |
| `GET /api/refresh-list` | Refrescar lista M3U | `id`, `url` |
| `GET /api/epg` | Guía de programación | `channel` |
| `GET /api/m3u-proxy` | Proxy de descarga M3U | `url` |

## Dependencias Principales
- next@14.2.35
- hls.js@1.5.x
- zustand@4.5.x
- tailwindcss@3.4.x

## Carpetas Locales (No se suben a GitHub)
- `local/` → Archivos .m3u para carga automática
- `.env.local` → Variables de entorno locales