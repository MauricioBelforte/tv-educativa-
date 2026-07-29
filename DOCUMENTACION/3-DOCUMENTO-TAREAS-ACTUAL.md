# Tareas Actuales - TV Educativa

## Estado General: COMPLETADO

### Fase 1 - Core (Completada)
- [x] Setup del proyecto Next.js + Tailwind + TypeScript
- [x] Tipos e interfaces (Channel, ChannelsResponse, EPGEntry, etc.)
- [x] Datos de ejemplo (channels.json con 12 canales)
- [x] Parser M3U (m3u-parser.ts)
- [x] API Route (/api/channels)
- [x] Store global (Zustand con persistencia)
- [x] Componente Player (HLS.js con proxy)
- [x] Componente ChannelCard
- [x] Componente ChannelList
- [x] Componente SearchBar
- [x] Componente CategoryFilter
- [x] Componente Header
- [x] Pagina principal (page.tsx)
- [x] Layout global (layout.tsx)

### Fase 2 - UX (Completada)
- [x] Modo oscuro con persistencia
- [x] Favoritos con persistencia
- [x] Diseno responsive (movil + desktop)
- [x] Loading skeletons
- [x] Manejo de errores de stream
- [x] Busqueda en vivo
- [x] Filtro por categorias

### Fase 3 - Features Avanzadas (Completada)
- [x] Proxy de streams para evitar CORS (/api/stream-proxy)
- [x] Actualizacion automatica y manual de listas M3U (/api/refresh-list)
- [x] Multiples fuentes de canales (SourceFilter, activeSources)
- [x] Carga de listas M3U desde URL con persistencia
- [x] EPG - Guia de Programacion Electronica (/api/epg + EPGPanel)
- [x] Documentacion del componente 02-Fase3-Features-Avanzadas
- [x] Plan de testings actualizado

### Fase 4 - Verificacion y UX Final (Completada)
- [x] Eliminacion de referencias a sitios de streaming no educativos
- [x] Verificacion de salud de canales (/api/check-stream)
- [x] Verificacion deep (descarga de primer segmento HLS)
- [x] Dos modos de escaneo: rapido (20 workers, deep) y lento (2 workers, sin deep)
- [x] Estado de canales persistido en localStorage
- [x] Rediseno layout: sidebar con barra superior tipo pestanas
- [x] Overlay de canales como absolute dentro del sidebar
- [x] SourceFilter eliminado, checkboxes integrados en ImportedListsManager
- [x] SearchBar movida al Header
- [x] Filtro "Solo activos" con toggle (activo por defecto)
- [x] Categorias colapsadas por defecto
- [x] Favoritos movido a la barra superior del sidebar
- [x] Reordenamiento drag & drop de listas
- [x] Importacion batch de listas (textarea multilinea)
- [x] Descripciones editables en listas importadas
- [x] "Canales por Defecto" como ultimo item en el gestor de listas
- [x] Escaneo rapido escanea TODAS las listas (no solo activas)
- [x] Primer build exitoso con todos los cambios
- [x] Commit y push a GitHub

### Fase 5 - Deploy y Listas Privadas (Completada)
- [x] Creacion de vercel.json para configuracion de deploy
- [x] API /api/private-lists para servir listas desde variables de entorno
- [x] Endpoint privado que oculta URLs y credenciales del navegador
- [x] Soporte de contenido base64 directo (PRIVATE_LIST_N_CONTENT) — no requiere servidor externo
- [x] Soporte de URL (PRIVATE_LIST_N_URL) y URL con Basic Auth (PRIVATE_LIST_N_AUTH)
- [x] Carga automatica de listas privadas al iniciar la app
- [x] Campo isPrivate en ImportedList para evitar duplicados
- [x] Actualizacion de .env.local con instrucciones para Vercel
- [x] Build de prueba exitoso
- [x] Documentacion actualizada

### Fase 6 - Sincronizacion con Supabase (Completada)
- [x] Instalacion de @supabase/supabase-js
- [x] Creacion de cliente Supabase server-side (src/lib/supabase.ts)
- [x] API /api/sync-lists (GET: descargar, POST: subir)
- [x] Carga automatica de listas sincronizadas al iniciar la app
- [x] Boton "Subir listas a la nube" en la sidebar
- [x] SQL de creacion de tabla sync_data documentado
- [x] Actualizacion de .env.local con instrucciones de configuracion
- [x] Documentacion actualizada

### Fase 7 - Login y Autenticacion (Completada)
- [x] Componente LoginModal con campo de contrasena
- [x] API /api/check-password para validacion server-side
- [x] Estado isAuthenticated en store de Zustand
- [x] Persistencia de auth en localStorage
- [x] Boton "Acceso Privado" / "Salir" en barra superior del sidebar
- [x] APIs private-lists y sync-lists protegidas con parametro password
- [x] Usuarios no autenticados ven solo canales por defecto
- [x] Creacion de DOCUMENTACION/03-Login-Auth con plan-inicial y plan-actual
- [x] Documentacion del componente con 5 archivos (01 al 05)

### Fase 8 - Correcciones de Sincronización (Completada)
- [x] Flag _initialized para evitar race condition entre initFromStorage y loadChannels
- [x] Dedup de listas por nombre (no por isPrivate) en nameExists
- [x] replacePrivateLists elimina todas las listas locales cuyo nombre coincide con el sync
- [x] replacePrivateLists deduplica la data del cloud por nombre usando Map
- [x] IDs estables para listas sincronizadas (basados en nombre sanitizado)
- [x] activeListNames sincroniza checkboxes por nombre (no por ID)
- [x] replaceActiveSourcesByName resuelve nombres a IDs en importedLists
- [x] Logout limpia localStorage (iptv-imported-lists, iptv-active-sources)
- [x] Payload de subida deriva activeListNames desde importedLists + activeSources
- [x] API sync-lists actualizada para activeListNames con compatibilidad hacia atras
- [x] Documentacion y log actualizados
