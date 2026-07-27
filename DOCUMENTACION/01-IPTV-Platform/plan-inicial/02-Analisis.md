# 02 - Análisis: Plataforma IPTV de Canales Gratuitos

## Análisis del Dominio

### ¿Cómo funcionan los agregadores de streams IPTV?

1. **Fuente de datos**: Obtienen URLs de streams desde listas M3U, scraping de sitios, o APIs privadas
2. **Procesamiento**: Parsean las listas para extraer {nombre_canal, url_stream, logo, categoría}
3. **Presentación**: Muestran los canales en una web con un reproductor embebido
4. **Actualización**: Los enlaces cambian constantemente, por lo que necesitan actualizarse periódicamente

### Formato M3U (IPTV)

El formato estándar para listas IPTV es una extensión del M3U clásico:

```
#EXTM3U
#EXTINF:-1 tvg-id="cnn.us" tvg-name="CNN" tvg-logo="https://logo.url/logo.png" group-title="News",CNN
http://example.com/stream.m3u8
#EXTINF:-1 tvg-id="espn.us" tvg-name="ESPN" tvg-logo="https://logo.url/logo2.png" group-title="Sports",ESPN
http://example.com/stream2.m3u8
```

### Tecnologías de Streaming

| Tecnología | Descripción | Uso |
|-----------|-------------|-----|
| **HLS** (HTTP Live Streaming) | Protocolo de Apple para streaming adaptativo | El más común en IPTV |
| **MPEG-DASH** | Alternativa abierta a HLS | Menos común en IPTV |
| **RTMP** | Protocolo Flash (obsoleto) | Prácticamente en desuso |
| **WebRTC** | Streaming peer-to-peer | Baja latencia, poco usado en IPTV |

### Decisión Técnica: HLS.js

Elegimos **HLS.js** porque:
- Es el estándar de facto para reproducción HLS en navegadores
- Funciona en todos los navegadores modernos sin plugins
- Soporta reproducción en vivo (live)
- Ampliamente usado y documentado

## Alternativas Consideradas

| Alternativa | Pros | Contras | Decisión |
|------------|------|---------|----------|
| **Video.js + HLS plugin** | Más plugins, skin personalizable | Más pesado, dependencias extras | ❌ Descartado |
| **HLS.js directo** | Ligero, control total, sin dependencias extra | Más código manual | ✅ Elegido |
| **React Player** | Fácil de usar, wrapper React | Menos control sobre HLS | ❌ Descartado |
| **Shaka Player** (Google) | Soporta DASH + HLS | Más complejo, overkill | ❌ Descartado |

## Arquitectura General

```
┌─────────────────────────────────────────────────────────────┐
│                      Cliente (Next.js)                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐  │
│  │ Channel  │  │  Search  │  │Category  │  │  Player    │  │
│  │  List    │  │  Bar     │  │ Filter   │  │ (HLS.js)  │  │
│  └────┬─────┘  └──────────┘  └──────────┘  └─────┬──────┘  │
│       └──────────────────┬───────────────────────┘          │
│                          │                                  │
│                   ┌──────▼──────┐                           │
│                   │  Zustand    │                           │
│                   │   Store     │                           │
│                   └──────┬──────┘                           │
│                          │ fetch /api/channels              │
└──────────────────────────┼──────────────────────────────────┘
                           │
                    ┌──────▼──────┐
                    │  API Route  │
                    │  (Next.js)  │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │  M3U Parser │
                    │   + Fuente  │
                    └─────────────┘
```

## Flujo del Usuario

1. Usuario abre la página → se cargan canales desde la API
2. Puede buscar por nombre o filtrar por categoría
3. Hace clic en un canal → se inicia la reproducción
4. El reproductor HLS.js carga el stream .m3u8
5. Puede agregar canales a favoritos (localStorage)
6. Los favoritos persisten entre sesiones