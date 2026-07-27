# 02 - Análisis: Plataforma IPTV de Canales Gratuitos (Estado Actual)

## Análisis del Dominio (Implementado)

### Arquitectura Implementada

```
┌─────────────────────────────────────────────────────────────┐
│                      Cliente (Next.js 14)                    │
│  ┌────────────┐  ┌──────────┐  ┌────────────┐  ┌────────┐  │
│  │ Header     │  │  Search  │  │  Category  │  │ Player │  │
│  │ (Nav+Dark) │  │  Bar     │  │  Filter    │  │(HLSjs)│  │
│  └────────────┘  └──────────┘  └────────────┘  └────────┘  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  ChannelList + ChannelCard (Grid de canales)         │   │
│  └──────────────────────────────────────────────────────┘   │
│                         ↕ fetch /api/channels               │
└─────────────────────────┼────────────────────────────────────┘
                          │
                   ┌──────▼──────┐
                   │  API Route  │
                   │ (Next.js)   │
                   └──────┬──────┘
                          │
                   ┌──────▼──────┐
                   │  channels.ts│
                   │  + M3U      │
                   │  Parser     │
                   └─────────────┘
```

### Decisión Técnica: HLS.js
Se implementó con HLS.js para navegadores Chrome/Firefox/Edge, con fallback a reproducción nativa en Safari. Los streams de prueba usan el demo de Mux (https://test-streams.mux.dev).

### Store (Zustand)
Se implementó un store global con Zustand que maneja:
- Canal actual y estado de reproducción
- Favoritos con persistencia en localStorage
- Modo oscuro con persistencia en localStorage

### API
Endpoint `GET /api/channels` con soporte para query params `?category=Deportes&search=ESPN`.