# 01 - Requerimientos: Fase 3 - Features Avanzadas

## Problema
La plataforma IPTV educativa necesita funcionalidades avanzadas para ser un agregador de streams completo: proxy anti-CORS, actualización automática de listas, múltiples fuentes, carga desde URL y guía de programación electrónica (EPG).

## Objetivos
- ✅ Eliminar problemas CORS al reproducir streams externos
- ✅ Actualizar listas M3U importadas automática y manualmente
- ✅ Gestionar múltiples fuentes de canales de forma independiente
- ✅ Cargar listas M3U desde URL con validación y persistencia
- ✅ Implementar guía de programación (EPG) con información now/next

## Alcance
- Proxy de streams HLS (servidor intermedio)
- Sistema de refresco automático de listas M3U
- Gestor visual de fuentes múltiples
- Mejora del importador M3U con persistencia de URL
- Parser XMLTV y visualizador de programación EPG

## Restricciones
- Sin contenido protegido por derechos de autor
- Las URLs de streams proxy se resuelven en servidor
- EPG usa datos de ejemplo abiertos (Schedules Direct / XMLTV gratuito)
- Proyecto educativo, no comercial
