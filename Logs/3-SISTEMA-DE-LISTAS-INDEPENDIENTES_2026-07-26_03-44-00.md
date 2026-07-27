# Log 3 - Sistema de Listas Independientes (Carpetas)

**Fecha:** 2026-07-26 03:44 - 03:52
**Tipo:** Mejora de funcionalidad - Gestión de listas importadas

## Descripción
Se rediseñó el sistema de importación para que cada lista M3U sea independiente, organizada como "carpetas" con nombre editable, persistencia en localStorage, y posibilidad de eliminar canales individuales o listas completas.

## Cambios Realizados

### Store (player-store.ts)
- Nuevo tipo `ImportedList` con id, name, channels, createdAt, sourceUrl
- Nuevas funciones: `addImportedList`, `renameList`, `removeList`, `removeChannelFromList`, `setActiveList`, `getListById`
- Persistencia en localStorage bajo clave `iptv-imported-lists`
- Los canales importados ya no se mezclan con los por defecto

### Nuevo Componente: ImportedListsManager
- Muestra las listas como carpetas expandibles
- Cada lista tiene: nombre editable, contador de canales, botón eliminar
- Al expandir una carpeta se ven los canales con opción de eliminar individualmente
- Nombres por defecto: "Lista 1", "Lista 2", etc.
- Edición de nombre con doble clic en el lápiz

### page.tsx
- La UI ahora muestra los canales de la lista activa o los por defecto
- Sidebar con botón "Canales por Defecto" para volver
- Las categorías se actualizan según la fuente activa
- Filtrado funciona sobre los canales activos

## Cómo funciona ahora
1. Importas lista M3U → se crea "Lista 1" en sidebar
2. Haces clic en la lista → se muestran solo sus canales
3. Puedes renombrarla, eliminar canales sueltos, o eliminar la lista completa
4. Todo persiste en localStorage al recargar la página
5. Puedes importar varias listas independientes

## Estado
✅ Build exitoso - 252 kB First Load JS
✅ Nuevas rutas: /api/m3u-proxy (proxy de descarga)