# 05 - Checklist: Fase 3 - Features Avanzadas

## Estado del Proyecto

### Proxy de Streams (CORS)
- [ ] API Route /api/stream-proxy implementada
- [ ] Player usa proxy para streams externos
- [ ] Manejo de errores (timeout, stream caído)
- [ ] Reescritura de segmentos .ts en playlist

### Actualización Automática de Listas M3U
- [ ] API Route /api/refresh-list implementada
- [ ] Botón "Refrescar" en ImportedListsManager
- [ ] Refresco automático al iniciar la app
- [ ] Timestamp de última actualización visible

### Múltiples Fuentes
- [ ] Vista "Todas las fuentes" combinada
- [ ] Badge de fuente en ChannelCard
- [ ] SourceFilter con checkboxes
- [ ] Persistencia de fuentes activas

### Carga de Listas desde URL (Mejora)
- [ ] Validación de URL antes de importar
- [ ] Persistencia de sourceUrl en ImportedList
- [ ] Indicador de progreso en importación
- [ ] Soporte para URLs .txt con listas M3U

### EPG (Guía de Programación)
- [ ] Parser XMLTV implementado
- [ ] API Route /api/epg implementada
- [ ] Componente EPGPanel (now/next)
- [ ] Datos de ejemplo en epg-data.json
- [ ] Integración con Player y ChannelCard

### Testing y Documentación
- [ ] Plan de testings actualizado
- [ ] Tests de proxy de streams
- [ ] Tests de parser EPG
- [ ] Tests de refresco de listas
- [ ] Documentación actualizada
