# 03 - Diseño: Fase 3 - Features Avanzadas

## Arquitectura General

```
┌─────────────────────────────────────────────────────────────┐
│                      Cliente (Next.js)                       │
│  ┌────────────┐  ┌───────────┐  ┌────────────┐  ┌────────┐  │
│  │ EPG Panel  │  │ Source    │  │  Stream    │  │ Player │  │
│  │ (Now/Next) │  │ Manager   │  │  Proxy     │  │(HLSjs)│  │
│  └────────────┘  └───────────┘  └────────────┘  └────────┘  │
│                         ↕                                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Store (Zustand) + ImportedLists con sourceUrl       │   │
│  └──────────────────────────────────────────────────────┘   │
│       │                       │                          │   │
│  ┌────▼────┐           ┌──────▼──────┐           ┌──────▼──┐ │
│  │ /api/   │           │ /api/       │           │ /api/   │ │
│  │ channels│           │ refresh-list│           │ epg     │ │
│  └─────────┘           └─────────────┘           └─────────┘ │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ /api/stream-proxy (passthrough con cabeceras CORS)   │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

## Nuevas API Routes

### GET /api/stream-proxy?url=<stream_url>
Proxea segmentos .ts y .m3u8 agregando cabeceras CORS.

### GET /api/refresh-list?id=<list_id>&url=<source_url>
Descarga y parsea una lista M3U actualizada. Devuelve los canales nuevos.

### GET /api/epg?channel=<channel_id>
Devuelve la programación EPG now/next para un canal.

## Nuevas Interfaces (types.ts)

```typescript
interface EPGEntry {
  start: string        // ISO datetime
  stop: string         // ISO datetime
  title: string
  description?: string
  category?: string
}

interface ChannelEPG {
  channelId: string
  entries: EPGEntry[]
}

interface RefreshResult {
  success: boolean
  channels: Channel[]
  error?: string
}
```

## Nuevos Componentes

### EPGPanel
- Props: `channelId: string`
- Muestra programa actual y siguiente
- Datos desde API /api/epg o mock

### SourceFilter
- Props: `sources: ImportedList[], activeSources: string[], onToggle: (id) => void`
- Checkboxes para activar/desactivar fuentes

## Flujo de Stream Proxy

```
1. Player detecta URL de stream
2. URL → /api/stream-proxy?url=<encoded>
3. Servidor descarga el playlist .m3u8
4. Re-escribe URLs internas (segmentos) al proxy
5. Sirve al frontend con cabeceras CORS
6. HLS.js recibe el playlist proxeado sin CORS errors
```

## Flujo de Refresco Automático

```
1. App inicia → recorre importedLists con sourceUrl
2. Para cada lista: fetch /api/refresh-list?id=X&url=Y
3. Si hay cambios, actualiza store y localStorage
4. UI muestra badge "Actualizado" con timestamp
```
