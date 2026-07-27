# 04 - Código: Fase 3 - Features Avanzadas

## Archivos Nuevos

```
src/
├── app/api/
│   ├── stream-proxy/
│   │   └── route.ts              → Proxy de streams HLS
│   ├── refresh-list/
│   │   └── route.ts              → Refresco de listas M3U
│   └── epg/
│       └── route.ts              → Datos de programación EPG
├── components/
│   ├── EPGPanel.tsx              → Panel now/next de EPG
│   └── SourceFilter.tsx          → Filtro de fuentes múltiples
├── lib/
│   ├── epg-parser.ts             → Parser XMLTV
│   └── stream-proxy.ts           → Lógica de proxy HLS
└── data/
    └── epg-data.json             → Datos de programación mock
```

## Archivos Modificados

- `src/lib/types.ts` → Agregar EPGEntry, ChannelEPG, RefreshResult
- `src/store/player-store.ts` → Agregar refreshList, toggleSource, activeSources
- `src/components/M3UImporter.tsx` → Persistir URL, mejor validación
- `src/components/ImportedListsManager.tsx` → Botón refresh, badge de fuente
- `src/components/Player.tsx` → Envolver URLs con stream-proxy
- `src/app/page.tsx` → Agregar SourceFilter y EPGPanel
- `src/components/ChannelCard.tsx` → Mostrar badge de fuente

## Funciones Clave

### stream-proxy route
```
GET /api/stream-proxy?url=<stream_url>
→ Fetch del .m3u8 original
→ Reemplazar URLs de segmentos con proxys
→ Servir con cabeceras CORS
```

### refresh-list route
```
GET /api/refresh-list?id=<list_id>&url=<source_url>
→ Validar parámetros
→ Descargar M3U desde source_url
→ Parsear con parseM3U()
→ Devolver { success, channels }
```

### EPG route + parser
```
GET /api/epg?channel=<channel_id>
→ Buscar en epg-data.json
→ Filtrar por channel_id
→ Devolver { now: EPGEntry, next: EPGEntry[] }

epg-parser.ts → parseXMLTV(xml: string): ChannelEPG[]
```
