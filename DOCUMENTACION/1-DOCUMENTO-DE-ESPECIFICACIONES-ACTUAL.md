# Especificaciones Técnicas Actuales - TV Educativa

## Stack Tecnológico
- **Frontend**: Next.js 14 (App Router) + TypeScript
- **Estilos**: Tailwind CSS 3 (modo oscuro con clase 'dark')
- **Reproductor**: HLS.js 1.x (con fallback Safari nativo + proxy CORS)
- **Estado**: Zustand 4.x (persistencia en localStorage)
- **API**: Next.js API Routes

## Arquitectura
```
Cliente (Next.js) → API Routes → channels.ts / M3U Parser / EPG / Stream Proxy
```

## Funcionalidades Implementadas
1. Lista de canales con búsqueda y filtro por categorías
2. Reproductor HLS con proxy anti-CORS y manejo de errores
3. Favoritos con persistencia local
4. Modo oscuro
5. Diseño responsive (móvil + desktop)
6. Parser M3U para listas IPTV
7. Múltiples fuentes de canales con gestor visual
8. Actualización automática y manual de listas M3U
9. Carga de listas desde URL con persistencia
10. EPG (Guía de Programación Electrónica) now/next

## API
- `GET /api/channels` - Lista de canales
- `GET /api/channels?category=X` - Filtro por categoría
- `GET /api/channels?search=X` - Búsqueda por nombre
- `GET /api/stream-proxy?url=X` - Proxy de streams HLS
- `GET /api/refresh-list?id=X&url=Y` - Refresco de listas M3U
- `GET /api/epg?channel=X` - Datos de programación EPG
- `GET /api/m3u-proxy?url=X` - Proxy de descarga de listas