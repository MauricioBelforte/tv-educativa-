# Ejecucion Actual - TV Educativa

## Comandos

```bash
# Desarrollo
npm run dev

# Build
npm run build

# Produccion
npm start

# Linting
npm run lint
```

## Estructura de Archivos

```
src/
+-- app/
|   +-- layout.tsx              -> Layout raiz
|   +-- page.tsx                -> Pagina principal (sidebar + player + verificacion batch)
|   +-- globals.css             -> Estilos globales + Tailwind
|   +-- api/
|       +-- channels/
|       |   +-- route.ts        -> API: GET /api/channels
|       +-- epg/
|       |   +-- route.ts        -> API: GET /api/epg?channel=X
|       +-- m3u-proxy/
|       |   +-- route.ts        -> API: GET /api/m3u-proxy?url=X
|       +-- refresh-list/
|       |   +-- route.ts        -> API: GET /api/refresh-list?id=X&url=Y
|       +-- stream-proxy/
|       |   +-- route.ts        -> API: GET /api/stream-proxy?url=X (con rewrite de segmentos)
|       +-- check-stream/
|           +-- route.ts        -> API: GET /api/check-stream?url=X&deep=true
+-- components/
|   +-- Player.tsx              -> Reproductor HLS.js con proxy (sin reinicio infinito)
|   +-- ChannelList.tsx         -> Lista de canales
|   +-- ChannelCard.tsx         -> Tarjeta de canal con status dot (verde/rojo/amarillo/gris)
|   +-- SearchBar.tsx           -> Busqueda (en Header)
|   +-- CategoryFilter.tsx      -> Filtro categorias
|   +-- Header.tsx              -> Header sticky con SearchBar + modo oscuro + EN VIVO
|   +-- EPGPanel.tsx            -> Panel now/next EPG
|   +-- StoreInitializer.tsx    -> Init localStorage
|   +-- M3UImporter.tsx         -> Importador M3U con URL o batch (textarea multilinea)
|   +-- ImportedListsManager.tsx-> Gestor de listas con drag reorder, checkbox, descripcion editable
+-- lib/
|   +-- types.ts                -> Tipos TypeScript
|   +-- m3u-parser.ts           -> Parser M3U
|   +-- channels.ts             -> Logica de canales (incluye local/)
|   +-- local-loader.ts         -> Cargador de archivos M3U locales
+-- store/
|   +-- player-store.ts         -> Estado global (Zustand) + channelStatus + verificacion
+-- data/
    +-- channels.json           -> Canales de ejemplo
    +-- epg-data.json           -> Datos de programacion EPG
```

## API

| Endpoint | Descripcion | Parametros |
|----------|-------------|-----------|
| `GET /api/channels` | Canales disponibles | `category`, `search` |
| `GET /api/stream-proxy` | Proxy de streams HLS con rewrite | `url` |
| `GET /api/refresh-list` | Refrescar lista M3U | `id`, `url` |
| `GET /api/epg` | Guia de programacion | `channel` |
| `GET /api/m3u-proxy` | Proxy de descarga M3U | `url` |
| `GET /api/check-stream` | Verificacion de salud del stream | `url`, `deep` (opcional) |
| `GET /api/private-lists` | Listas privadas desde env vars (Vercel) | (ninguno, usa variables de entorno) |

## Store (Zustand) - Acciones Principales

| Accion | Descripcion |
|--------|-------------|
| `setChannel(ch)` | Seleccionar canal y reproducir |
| `togglePlay()` | Pausar/reanudar |
| `toggleFavorite(id)` | Marcar/desmarcar favorito |
| `toggleDarkMode()` | Cambiar modo oscuro |
| `addImportedList(name, url)` | Agregar lista importada |
| `removeImportedList(id)` | Eliminar lista |
| `reorderLists(newOrder)` | Reordenar listas (drag & drop) |
| `toggleSource(listId)` | Activar/desactivar fuente (checkbox) |
| `updateListDescription(id, desc)` | Editar descripcion de lista |
| `checkAllChannels(channels)` | Verificar canales (2 workers, 15s timeout) |
| `fastRecheckAllChannels(channels)` | Verificar canales (20 workers, deep) |
| `initFromStorage()` | Cargar estado desde localStorage |

## Verificacion de Canales

### checkAllChannels (escaneo lento)
- **Workers**: 2 concurrentes
- **Timeout**: 15s por worker
- **Deep**: false
- **Uso**: Al cargar canales, en el header de canales (junto al contador)
- **Alcance**: Solo listas activas (checkbox marcado)

### fastRecheckAllChannels (escaneo rapido)
- **Workers**: 20 concurrentes
- **Timeout**: 8s del servidor (sin timeout extra del cliente)
- **Deep**: true (descarga el primer segmento)
- **Uso**: Boton de flecha en barra superior del sidebar
- **Alcance**: TODAS las listas (ignora checkbox)

### API check-stream
- `deep=false`: Verifica que la URL responda 200 y contenga #EXTM3U (timeout 8s)
- `deep=true`: Ademas parsea el playlist, obtiene la URL del primer segmento y lo descarga (timeout 12s)

## Dependencias Principales
- next@14.2.35
- hls.js@1.5.x
- zustand@4.5.x
- tailwindcss@3.4.x

## Listas Privadas (Vercel)

Para no exponer URLs de listas M3U en el navegador, se pueden configurar como variables de entorno en Vercel:

```env
PRIVATE_LIST_1_URL=https://miservidor.com/lista.m3u
PRIVATE_LIST_1_NAME=Deportes             (opcional)
PRIVATE_LIST_1_AUTH=usuario:contrasenia  (opcional, Basic Auth)
PRIVATE_LIST_2_URL=https://...
# ... incrementar numero
```

- Las URLs y credenciales nunca salen del servidor
- Se cargan automaticamente al iniciar la app via `/api/private-lists`
- Cada lista aparece como una lista importada en el gestor

## Carpetas Locales (No se suben a GitHub)
- `local/` -> Archivos .m3u para carga automatica
- `.env.local` -> Variables de entorno locales
