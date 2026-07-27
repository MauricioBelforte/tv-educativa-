# 03 - Diseño: Plataforma IPTV de Canales Gratuitos

## Arquitectura del Sistema

### Stack Tecnológico

| Componente | Tecnología | Versión |
|-----------|-----------|---------|
| Framework | Next.js | 14.x (App Router) |
| Lenguaje | TypeScript | 5.x |
| Estilos | Tailwind CSS | 3.x |
| Reproductor | HLS.js | 1.x |
| Estado | Zustand | 4.x |
| Fuente de datos | Listas M3U públicas | - |

### Diagrama de Componentes

```
┌──────────────────────────────────────────────────────────────┐
│                        Layout.tsx                             │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Header (logo, búsqueda, modo oscuro, favoritos)       │  │
│  ├────────────────────────────────────────────────────────┤  │
│  │  Main Content                                          │  │
│  │  ┌──────────────┐  ┌──────────────────────────────┐   │  │
│  │  │ Sidebar/Filter│  │  Channel Grid               │   │  │
│  │  │ - Categorías  │  │  ┌────┐ ┌────┐ ┌────┐      │   │  │
│  │  │ - Favoritos   │  │  │Ch1 │ │Ch2 │ │Ch3 │      │   │  │
│  │  │ - Todos       │  │  └────┘ └────┘ └────┘      │   │  │
│  │  └──────────────┘  │  ┌────┐ ┌────┐ ┌────┐      │   │  │
│  │                     │  │Ch4 │ │Ch5 │ │Ch6 │      │   │  │
│  │                     │  └────┘ └────┘ └────┘      │   │  │
│  │                     └──────────────────────────────┘   │  │
│  ├────────────────────────────────────────────────────────┤  │
│  │  Player (HLS.js) - Se muestra al seleccionar canal     │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

### Diseño de la API

**Endpoint:** `GET /api/channels`

**Respuesta:**
```json
{
  "channels": [
    {
      "id": "cnn-us",
      "name": "CNN",
      "logo": "https://logo.url/cnn.png",
      "url": "https://stream.url/cnn.m3u8",
      "category": "News",
      "isLive": true
    }
  ],
  "categories": ["News", "Sports", "Entertainment", "Music"]
}
```

**Endpoint:** `GET /api/channels?category=Sports&search=ESPN`

**Parámetros:**
- `category` (opcional): Filtrar por categoría
- `search` (opcional): Buscar por nombre

### Diseño del Store (Zustand)

```typescript
interface PlayerStore {
  currentChannel: Channel | null;
  isPlaying: boolean;
  favorites: string[]; // IDs de canales
  isDarkMode: boolean;
  
  // Acciones
  setChannel: (channel: Channel) => void;
  togglePlay: () => void;
  toggleFavorite: (channelId: string) => void;
  toggleDarkMode: () => void;
}
```

### Diseño del Parser M3U

```typescript
interface M3UEntry {
  id: string;
  name: string;
  logo: string;
  category: string;
  url: string;
}

function parseM3U(content: string): M3UEntry[] {
  // 1. Dividir por líneas
  // 2. Buscar líneas #EXTINF: (metadata)
  // 3. Extraer tvg-id, tvg-name, tvg-logo, group-title
  // 4. La siguiente línea no-comentario es la URL
  // 5. Retornar array de M3UEntry
}
```

### Flujo de Datos Detallado

```
1. Inicio:
   - App carga → useEffect fetch /api/channels
   - API Route lee channels.json o parsea M3U
   - Store se actualiza con los canales

2. Selección de canal:
   - Usuario hace clic en ChannelCard
   - Store.setChannel(canal)
   - Player detecta cambio → HLS.js carga nueva URL
   - Si el stream está caído → mostrar error

3. Búsqueda/Filtro:
   - SearchBar actualiza query en estado local
   - ChannelList filtra en memoria (sin nueva petición)
   - CategoryFilter similar

4. Favoritos:
   - toggleFavorite(channelId) → actualiza store
   - Store persiste en localStorage
   - Al recargar, se leen favoritos de localStorage
```

### Diseño Responsive

| Breakpoint | Layout |
|-----------|--------|
| < 640px (móvil) | Lista vertical, player ocupa toda la pantalla |
| 640-1024px (tablet) | Grid 2 columnas, player abajo |
| > 1024px (desktop) | Grid 3-4 columnas, sidebar + player lateral |