# 06 - Plan de Testings: Plataforma IPTV de Canales Gratuitos

## 1. Pruebas Unitarias

### 1.1 Parser M3U
| ID | Escenario | Entrada | Resultado Esperado | Estado |
|----|-----------|---------|-------------------|--------|
| U1 | Lista M3U básica con 1 canal | `#EXTM3U\n#EXTINF:-1 tvg-id="test" tvg-name="Test" group-title="News",Test\nhttp://url.com/stream.m3u8` | Array con 1 canal, name="Test", category="News" | ✅ |
| U2 | Lista M3U con múltiples canales | 3 entradas EXTINF + URLs | Array con 3 canales | ✅ |
| U3 | Línea sin #EXTINF antes de URL | URL sin metadata previa | Se ignora la línea | ✅ |
| U4 | EXTINF sin URL después | Metadata sin stream | Se ignora | ✅ |
| U5 | Canal sin tvg-name (usa nombre después de coma) | `#EXTINF:-1,CNN\nhttp://url.com` | name="CNN" | ✅ |
| U6 | Canal sin tvg-logo | Metadata sin logo | Genera placeholder | ✅ |

### 1.2 Store (Zustand)
| ID | Escenario | Acción | Resultado Esperado | Estado |
|----|-----------|--------|-------------------|--------|
| S1 | setChannel | Llamar con un canal | currentChannel = canal, isPlaying = true | ✅ |
| S2 | togglePlay | isPlaying true → false | isPlaying = false | ✅ |
| S3 | toggleFavorite (agregar) | channelId no en favoritos | Se agrega al array y a localStorage | ✅ |
| S4 | toggleFavorite (quitar) | channelId ya en favoritos | Se quita del array y de localStorage | ✅ |
| S5 | toggleDarkMode | false → true | isDarkMode = true, document tiene clase 'dark' | ✅ |
| S6 | initFromStorage | localStorage con datos | Store se inicializa correctamente | ✅ |

## 2. Pruebas de Integración

### 2.1 API Route
| ID | Escenario | Request | Resultado Esperado | Estado |
|----|-----------|---------|-------------------|--------|
| I1 | GET /api/channels | Sin parámetros | Status 200, todos los canales + categorías | ✅ |
| I2 | GET /api/channels?category=Deportes | Con categoría | Solo canales de Deportes | ✅ |
| I3 | GET /api/channels?search=ESPN | Con búsqueda | Canales cuyo nombre contiene "ESPN" | ✅ |
| I4 | GET /api/channels?category=X&search=Y | Ambos filtros | Filtros combinados | ✅ |

### 2.2 Frontend → API
| ID | Escenario | Descripción | Estado |
|----|-----------|-------------|--------|
| I5 | Carga inicial | Fetch a /api/channels en useEffect | ✅ |
| I6 | Error handling | Si API falla, mostrar error en consola | ✅ |
| I7 | Renderizado condicional | Loading skeleton mientras carga | ✅ |

## 3. Pruebas de Componentes

### 3.1 Player (HLS.js)
| ID | Escenario | Resultado Esperado | Estado |
|----|-----------|-------------------|--------|
| P1 | Sin canal seleccionado | Mostrar placeholder "Selecciona un canal" | ✅ |
| P2 | Seleccionar canal con URL HLS | HLS.js carga y reproduce | ✅ |
| P3 | Stream caído/error | Mostrar overlay de error | ✅ |
| P4 | Cambiar de canal | Destruir HLS anterior, crear nuevo | ✅ |
| P5 | Navegador sin soporte HLS | Mostrar mensaje de error | ✅ |

### 3.2 ChannelCard
| ID | Escenario | Resultado Esperado | Estado |
|----|-----------|-------------------|--------|
| C1 | Click en canal | setChannel se ejecuta | ✅ |
| C2 | Canal activo | Estilo azul + escala 1.02 | ✅ |
| C3 | Canal inactivo | Estilo gris por defecto | ✅ |
| C4 | Click en favorito | Se agrega/quita sin propagar click | ✅ |
| C5 | Canal en vivo | Indicador rojo pulsante | ✅ |
| C6 | Logo falla al cargar | Fallback a placeholder con inicial | ✅ |

### 3.3 SearchBar
| ID | Escenario | Resultado Esperado | Estado |
|----|-----------|-------------------|--------|
| B1 | Escribir texto | onChange se dispara con el valor | ✅ |
| B2 | Limpiar con botón X | onChange('') | ✅ |
| B3 | Placeholder visible | "Buscar canales..." | ✅ |

### 3.4 CategoryFilter
| ID | Escenario | Resultado Esperado | Estado |
|----|-----------|-------------------|--------|
| F1 | Click en "Todos" | onSelect(null) | ✅ |
| F2 | Click en categoría | onSelect(categoría) | ✅ |
| F3 | Click en "Favoritos" | onToggleFavorites() | ✅ |
| F4 | Categoría seleccionada | Estilo azul | ✅ |
| F5 | Sin categoría seleccionada | "Todos" en azul | ✅ |

## 4. Pruebas de UX/UI

### 4.1 Responsive Design
| ID | Escenario | Breakpoint | Resultado Esperado | Estado |
|----|-----------|-----------|-------------------|--------|
| R1 | Mobile | < 640px | Lista vertical, búsqueda arriba, filtros en horizontal scroll | ✅ |
| R2 | Tablet | 640-1024px | Sidebar oculto, player ocupa todo | ✅ |
| R3 | Desktop | > 1024px | Sidebar con filtros visible, grid 3 columnas | ✅ |

### 4.2 Modo Oscuro
| ID | Escenario | Resultado Esperado | Estado |
|----|-----------|-------------------|--------|
| D1 | Activar modo oscuro | document.documentElement añade 'dark', UI cambia | ✅ |
| D2 | Persistencia | Al recargar, modo oscuro se mantiene | ✅ |
| D3 | Alternar correctamente | Cada toggle cambia el estado | ✅ |

### 4.3 Favoritos
| ID | Escenario | Resultado Esperado | Estado |
|----|-----------|-------------------|--------|
| FV1 | Agregar favorito | Estrella se llena de amarillo | ✅ |
| FV2 | Quitar favorito | Estrella se vacía | ✅ |
| FV3 | Persistencia | Al recargar, favoritos se mantienen | ✅ |
| FV4 | Filtro "Favoritos" | Muestra solo canales favoritos | ✅ |

## 5. Pruebas de Rendimiento

| ID | Escenario | Métrica | Resultado | Estado |
|----|-----------|---------|-----------|--------|
| L1 | Bundle size | First Load JS | 249 kB (aceptable) | ✅ |
| L2 | Tiempo de build | - | ~15 segundos | ✅ |
| L3 | Memoria HLS.js | Múltiples cambios de canal | Sin leaks (destroy en cleanup) | ✅ |

## 6. Pruebas de Seguridad

| ID | Escenario | Resultado Esperado | Estado |
|----|-----------|-------------------|--------|
| SEC1 | XSS en nombres de canal | React escapa automáticamente | ✅ |
| SEC2 | URLs de streams externos | Solo se pasan a HLS.js, no se ejecutan | ✅ |
| SEC3 | localStorage | Solo datos de UI, no sensible | ✅ |