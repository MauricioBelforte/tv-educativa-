**Numero:** 9
**Fecha:** 2026-07-29 03:00:00
**Componente:** Sincronizacion (sync-lists, replacePrivateLists, activeSources)

## Descripcion
Se corrigieron multiples bugs en la sincronizacion de listas entre localhost y Vercel:

### 1. Race condition: initFromStorage vs loadChannels
- **Problema:** `loadChannels()` se ejecutaba antes de que `initFromStorage()` restaurara las listas de localStorage.
- **Solucion:** Se agrego flag `_initialized` al store. `loadChannels()` espera a que `_initialized=true` antes de ejecutarse.

### 2. Dedup de listas por nombre (no por isPrivate)
- **Problema:** `nameExists()` solo buscaba listas con `isPrivate: true`. Las listas legacy en localStorage tenian `isPrivate: false`, asi que no las detectaba como duplicadas.
- **Solucion:** Se cambio a buscar por nombre sin importar `isPrivate`.

### 3. replacePrivateLists con dedup interno
- **Problema:** `replacePrivateLists` solo filtraba por `isPrivate`, dejando copias legacy con `isPrivate: false`. Ademas, la data del cloud podia tener duplicados.
- **Solucion:** Ahora elimina TODAS las listas locales cuyo nombre este en el sync (sin importar `isPrivate`), y ademas deduplica la data del cloud por nombre usando un Map.

### 4. IDs estables para listas sincronizadas
- **Problema:** `replacePrivateLists` generaba IDs con `Date.now()`, cambiando en cada descarga y dejando inservible el activeSources guardado.
- **Solucion:** Los IDs ahora se generan a partir del nombre: `sync-${name.replace(/[^a-zA-Z0-9]/g, '_')}`.

### 5. Sync de listas activas por nombre (no por ID)
- **Problema:** activeSources sincronizaba IDs que cambiaban en cada descarga.
- **Solucion:** Se cambio a `activeListNames` (array de nombres). Nueva accion `replaceActiveSourcesByName()` que busca los nombres en `importedLists` y resuelve los IDs correctos.

### 6. Logout limpia localStorage
- **Problema:** logout no borraba `iptv-imported-lists` ni `iptv-active-sources` de localStorage.
- **Solucion:** Ahora `logout()` guarda arrays vacios en esas claves.

### 7. Payload de subida con activeListNames
- **Problema:** La subida enviaba `activeSources` (IDs) que al descargarse no coincidian con los nuevos IDs.
- **Solucion:** La subida ahora deriva `activeListNames` filtrando `importedLists` por `activeSources` y extrayendo los nombres.

## Archivos modificados
- `src/app/page.tsx` - Agregado _initialized, reemplazo completo de private lists, activeListNames
- `src/store/player-store.ts` - _initialized, replacePrivateLists con dedup, replaceActiveSourcesByName, logout mejorado, IDs estables
- `src/app/api/sync-lists/route.ts` - activeListNames en vez de activeSources, compatibilidad hacia atras

## Archivos nuevos
- Ninguno

## Estado
- [x] Compilacion exitosa
- [x] Commit y push a GitHub
- [x] Servidor reiniciado
