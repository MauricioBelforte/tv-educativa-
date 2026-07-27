# Especificaciones Técnicas Actuales - TV Libre

## Stack Tecnológico
- **Frontend**: Next.js 14 (App Router) + TypeScript
- **Estilos**: Tailwind CSS 3 (modo oscuro con clase 'dark')
- **Reproductor**: HLS.js 1.x (con fallback Safari nativo)
- **Estado**: Zustand 4.x (persistencia en localStorage)
- **API**: Next.js API Routes (GET /api/channels)

## Arquitectura
```
Cliente (Next.js) → API Route → channels.ts → channels.json / M3U Parser
```

## Funcionalidades Implementadas
1. Lista de canales con búsqueda y filtro por categorías
2. Reproductor HLS con manejo de errores
3. Favoritos con persistencia local
4. Modo oscuro
5. Diseño responsive (móvil + desktop)
6. Parser M3U para listas IPTV

## API
- `GET /api/channels` - Lista de canales
- `GET /api/channels?category=X` - Filtro por categoría
- `GET /api/channels?search=X` - Búsqueda por nombre

## Bundle Size
- First Load JS: 249 kB
- Shared: 87.2 kB