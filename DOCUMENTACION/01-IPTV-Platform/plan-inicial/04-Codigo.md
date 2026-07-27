# 04 - Código: Plataforma IPTV de Canales Gratuitos

## Archivos del Proyecto

```
src/
├── app/
│   ├── layout.tsx              → Layout raíz (providers, head, metadata)
│   ├── page.tsx                → Página principal (orquestación de componentes)
│   └── api/channels/
│       └── route.ts            → API Route: GET /api/channels
├── components/
│   ├── Player.tsx              → Reproductor HLS.js
│   ├── ChannelList.tsx         → Grid de canales
│   ├── ChannelCard.tsx         → Tarjeta individual de canal
│   ├── SearchBar.tsx           → Barra de búsqueda
│   ├── CategoryFilter.tsx      → Filtro por categoría
│   ├── Header.tsx              → Header de la app
│   └── FavoritesButton.tsx     → Botón de favoritos
├── lib/
│   ├── m3u-parser.ts           → Parser de listas M3U
│   ├── channels.ts             → Lógica de obtención de canales
│   └── types.ts                → Definiciones de tipos
├── store/
│   └── player-store.ts         → Estado global (Zustand)
└── data/
    └── channels.json           → Lista de canales por defecto (fallback)
```

## Funciones Clave

### parseM3U (m3u-parser.ts)
- **Input**: string con contenido de archivo M3U
- **Output**: Channel[] 
- **Lógica**: Regex para extraer tags #EXTINF, parsear atributos, asociar URL siguiente

### getChannels (channels.ts)
- **Input**: (opcional) category, search
- **Output**: { channels: Channel[], categories: string[] }
- **Lógica**: 
  1. Intentar leer channels.json
  2. Si existe fuente M3U remota, parsearla
  3. Filtrar por categoría/búsqueda
  4. Extraer lista de categorías únicas

### Player Component
- **Input**: channel: Channel | null
- **Output**: Reproductor de video con controles
- **Lógica**: 
  1. Crear instancia Hls.js cuando cambia channel.url
  2. Adjuntar al elemento <video>
  3. Manejar errores de carga
  4. Limpiar al desmontar

## API Route

```typescript
// src/app/api/channels/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const search = searchParams.get('search');
  
  const result = await getChannels({ category, search });
  return Response.json(result);
}
```

## Store (Zustand)

```typescript
// src/store/player-store.ts
export const usePlayerStore = create<PlayerStore>((set) => ({
  currentChannel: null,
  isPlaying: false,
  favorites: JSON.parse(localStorage.getItem('favorites') || '[]'),
  isDarkMode: JSON.parse(localStorage.getItem('darkMode') || 'false'),
  
  setChannel: (channel) => set({ currentChannel: channel, isPlaying: true }),
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  toggleFavorite: (channelId) => set((state) => {
    const newFavorites = state.favorites.includes(channelId)
      ? state.favorites.filter(id => id !== channelId)
      : [...state.favorites, channelId];
    localStorage.setItem('favorites', JSON.stringify(newFavorites));
    return { favorites: newFavorites };
  }),
  toggleDarkMode: () => set((state) => {
    const newMode = !state.isDarkMode;
    localStorage.setItem('darkMode', JSON.stringify(newMode));
    return { isDarkMode: newMode };
  }),
}));
```

## Dependencias (package.json)

```json
{
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "hls.js": "^1.5.0",
    "zustand": "^4.5.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "@types/node": "^20.0.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0"
  }
}