# 01 - Requerimientos: Plataforma IPTV de Canales Gratuitos (Estado Actual)

## Problema
Aprender cómo funcionan técnicamente los agregadores de streams de TV en vivo mediante la construcción de una plataforma educativa funcional.

## Objetivos (Cumplidos)
- ✅ Comprender la arquitectura de un agregador de streams de TV
- ✅ Aprender cómo se obtienen y procesan listas M3U
- ✅ Implementar un reproductor HLS en el navegador
- ✅ Construir una UI moderna con Next.js para navegar canales
- ✅ Usar exclusivamente contenido legal/gratuito con fines educativos

## Alcance Implementado
- Frontend en Next.js 14 con App Router + Tailwind CSS
- Reproductor basado en HLS.js
- Parser de listas M3U (formato IPTV)
- API REST para servir canales (GET /api/channels)
- Búsqueda y filtrado por categorías
- Favoritos (persistencia en localStorage)
- Modo oscuro (persistencia en localStorage)
- Diseño responsive (móvil + desktop)

## Restricciones
- Sin contenido protegido por derechos de autor
- Solo fuentes públicas (listas M3U de prueba usan stream demo de Mux)
- Proyecto educativo, no comercial