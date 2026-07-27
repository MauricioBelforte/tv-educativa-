# 02 - Análisis: Fase 3 - Features Avanzadas

## Análisis del Dominio

### 1. Proxy de Streams (CORS)
Los navegadores bloquean peticiones a dominios que no sirven cabeceras CORS. Muchos CDNs de streaming no incluyen `Access-Control-Allow-Origin: *`. La solución es un proxy inverso en el servidor Next.js que descargue los segmentos .ts y los sirva al frontend desde el mismo origen.

**Decisión:** Usar API Route de Next.js como proxy. El frontend reemplaza la URL original por `/api/stream-proxy?url=<original>`.

### 2. Actualización Automática de Listas M3U
Las listas IPTV cambian frecuentemente. Se necesita un mecanismo que:
- Almacene la URL original de cada lista importada
- Ofrezca refresco manual (botón)
- Ofrezca refresco automático al iniciar la app

**Decisión:** Agregar campos `sourceUrl` y `lastRefreshed` a `ImportedList`. Ruta `/api/refresh-list` para actualizar.

### 3. Múltiples Fuentes
Cada lista importada es una fuente independiente. Se necesita:
- Ver todos los canales de todas las fuentes juntos
- Identificar visualmente la fuente de cada canal
- Activar/desactivar fuentes individualmente

**Decisión:** Vista "Todas las fuentes" con badges por lista. Checkboxes para toggle de visibilidad.

### 4. Carga desde URL (Mejora)
La funcionalidad ya existe pero necesita:
- Validación previa de la URL
- Guardar URL asociada a la lista para refresco posterior
- Indicador de progreso durante la descarga

**Decisión:** Mejorar M3UImporter con estado de carga detallado y persistencia de URL.

### 5. EPG (Guía de Programación)
Formato estándar: XMLTV. Se necesita:
- Parser de XMLTV a estructura interna
- Visualización de programación actual y siguiente
- Datos de ejemplo para canales soportados

**Decisión:** Parser XMLTV ligero. Componente EPG que muestra now/next en el panel del canal activo.

## Alternativas Consideradas

| Feature | Alternativa | Decisión |
|---------|-----------|----------|
| Proxy | Cloudflare Workers vs API Route Next.js | API Route (mismo dominio, sin costo extra) |
| EPG | XMLTV online vs datos mock | XMLTV con fallback a datos mock |
| Refresco | WebSocket vs polling | Polling (simplicidad, no requiere conexión persistente) |
