# 06 - Plan de Testings: Fase 3 - Features Avanzadas

## 1. Pruebas de Proxy de Streams

| ID | Escenario | Entrada | Resultado Esperado | Estado |
|----|-----------|---------|-------------------|--------|
| P1 | Proxy URL válida .m3u8 | URL de stream demo Mux | Status 200, Content-Type: application/vnd.apple.mpegurl | ✅ |
| P2 | Proxy URL sin parámetro | Sin url | Status 400, error message | ✅ |
| P3 | Proxy URL inválida | string no-URL | Status 400, "URL inválida" | ✅ |
| P4 | Proxy URL inaccesible | URL que no existe | Status 502, error de conexión | ✅ |
| P5 | Proxy timeout | URL lenta | Status 504, "Tiempo de espera agotado" | ✅ |
| P6 | Reescritura de segmentos | Playlist .m3u8 con URLs .ts | URLs reescritas a /api/stream-proxy?url=... | ✅ |
| P7 | OPTIONS preflight CORS | OPTIONS request | Status 204 con cabeceras CORS | ✅ |

## 2. Pruebas de Refresco de Listas

| ID | Escenario | Entrada | Resultado Esperado | Estado |
|----|-----------|---------|-------------------|--------|
| R1 | Refresh con URL válida | id + url de M3U pública | success: true, channels: Channel[] | ✅ |
| R2 | Refresh sin parámetros | Sin id o url | success: false, error | ✅ |
| R3 | Refresh URL inválida | URL que no es M3U | success: false, error | ✅ |
| R4 | Refresh timeout | URL lenta | success: false, error de timeout | ✅ |
| R5 | Store: refreshList | listId con sourceUrl | importedLists actualizada, lastRefreshed seteado | ✅ |
| R6 | Store: refreshList sin sourceUrl | listId sin sourceUrl | No hace nada, no hay fetch | ✅ |

## 3. Pruebas de EPG

| ID | Escenario | Entrada | Resultado Esperado | Estado |
|----|-----------|---------|-------------------|--------|
| E1 | EPG con channelId válido | ?channel=nasa-tv | Status 200, entries[], now, next[] | ✅ |
| E2 | EPG sin channelId | Sin parámetros | Status 200, epg completo | ✅ |
| E3 | EPG con channelId inexistente | ?channel=no-existe | entries vacío, now null, next vacío | ✅ |
| E4 | EPGPanel sin canal seleccionado | currentChannel = null | Renderiza null | ✅ |
| E5 | EPGPanel con canal | Canal con datos EPG | Muestra now + next entries | ✅ |
| E6 | EPGPanel con canal sin EPG | Canal sin datos | Muestra "No hay información disponible" | ✅ |

## 4. Pruebas de Múltiples Fuentes

| ID | Escenario | Resultado Esperado | Estado |
|----|-----------|-------------------|--------|
| M1 | SourceFilter con < 2 listas | No se renderiza | ✅ |
| M2 | SourceFilter con >= 2 listas | Se renderiza con checkboxes | ✅ |
| M3 | Toggle source activa | activeSources se actualiza, canales se filtran | ✅ |
| M4 | Select All / Deselect All | setAllSources(true/false) funciona | ✅ |
| M5 | Persistencia de fuentes activas | Al recargar, activeSources se mantiene | ✅ |
| M6 | Eliminar lista con sources activas | activeSources se limpia correctamente | ✅ |

## 5. Pruebas de Carga desde URL

| ID | Escenario | Resultado Esperado | Estado |
|----|-----------|-------------------|--------|
| U1 | Importar URL válida | addImportedList con sourceUrl seteado | ✅ |
| U2 | Importar lista sin URL | addImportedList sin sourceUrl | ✅ |
| U3 | LastRefreshed seteado en import | importedList.lastRefreshed tiene timestamp | ✅ |

## 6. Pruebas de Integración

| ID | Escenario | Resultado Esperado | Estado |
|----|-----------|-------------------|--------|
| I1 | Player carga stream vía proxy | HLS.js recibe URL proxeada, reproduce | ✅ |
| I2 | Cambio de canal con proxy | Nueva URL se proxea, HLS se reinicia | ✅ |
| I3 | Refresh + visualización | Lista refrescada se muestra en UI inmediatamente | ✅ |
| I4 | Todas las APIS responden | /api/channels, /api/epg, /api/stream-proxy, /api/refresh-list | ✅ |

## 7. Resultados de Ejecución

| Fecha | Suite | Tests | Pasaron | Fallaron | Estado |
|-------|-------|-------|---------|----------|--------|
| 2026-07-27 | Proxy Streams | 7 | 7 | 0 | ✅ |
| 2026-07-27 | Refresh Listas | 6 | 6 | 0 | ✅ |
| 2026-07-27 | EPG | 6 | 6 | 0 | ✅ |
| 2026-07-27 | Múltiples Fuentes | 6 | 6 | 0 | ✅ |
| 2026-07-27 | Carga URL | 3 | 3 | 0 | ✅ |
| 2026-07-27 | Integración | 4 | 4 | 0 | ✅ |
