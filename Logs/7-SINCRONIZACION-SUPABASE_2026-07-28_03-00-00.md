# Log 7 - Sincronizacion con Supabase

**Fecha:** 2026-07-28 03:00:00

## Cambios Realizados

### Dependencias
- Instalado @supabase/supabase-js

### Archivos Creados
- `src/lib/supabase.ts` — Cliente Supabase server-side (usa service_role key)
- `src/app/api/sync-lists/route.ts` — Endpoint GET (descargar) y POST (subir) listas

### Archivos Modificados
- `src/app/page.tsx` — Carga automatica de listas sincronizadas + boton "Subir listas a la nube"
- `.env.local` — Instrucciones detalladas para configurar Supabase
- `DOCUMENTACION/1-DOCUMENTO-DE-ESPECIFICACIONES-ACTUAL.md`
- `DOCUMENTACION/2-DOCUMENTO-DISENO-ACTUAL.md`
- `DOCUMENTACION/3-DOCUMENTO-TAREAS-ACTUAL.md`
- `DOCUMENTACION/4-DOCUMENTO-EJECUCION-ACTUAL.md`

### Funcionamiento
1. Se agregan listas en local via M3UImporter
2. Se presiona "Subir listas a la nube" → POST /api/sync-lists → guarda en Supabase
3. En Vercel, al cargar la pagina, GET /api/sync-lists → descarga las listas
4. Tambien funciona en sentido inverso (subir desde Vercel, bajar en local)
5. Las listas se marcan como isPrivate para no exponer URLs
