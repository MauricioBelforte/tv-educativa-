# Ejecución Actual - TV Libre

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
│   └── api/channels/
│       └── route.ts            → API: GET /api/channels
├── components/
│   ├── Player.tsx              → Reproductor HLS.js
│   ├── ChannelList.tsx         → Lista de canales
│   ├── ChannelCard.tsx         → Tarjeta de canal
│   ├── SearchBar.tsx           → Búsqueda
│   ├── CategoryFilter.tsx      → Filtro categorías
│   ├── Header.tsx              → Header
│   └── StoreInitializer.tsx    → Init localStorage
├── lib/
│   ├── types.ts                → Tipos TypeScript
│   ├── m3u-parser.ts           → Parser M3U
│   └── channels.ts             → Lógica de canales
├── store/
│   └── player-store.ts         → Estado global (Zustand)
└── data/
    └── channels.json           → Canales de ejemplo
```

## API

**Endpoint:** `GET /api/channels`
**Query params:** `category`, `search`
**Response:** `{ channels: Channel[], categories: string[] }`

## Dependencias Principales
- next@14.2.35
- hls.js@1.5.x
- zustand@4.5.x
- tailwindcss@3.4.x

## Build Output
- First Load JS: 249 kB
- Rutas: / (static), /api/channels (dynamic)