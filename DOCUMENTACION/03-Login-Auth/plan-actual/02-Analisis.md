# Analisis - Modulo de Login y Autenticacion

## Alternativas Consideradas
1. **Autenticacion completa con Supabase Auth** - Demasiado complejo para un unico usuario
2. **JWT con refresh token** - Sobredimensionado para el caso de uso
3. **Contrasena simple via env var** - Elegida por su simplicidad y cero dependencias

## Decisiones
- Se uso una unica contrasena configurable via APP_PASSWORD
- La verificacion se hace contra un endpoint server-side (/api/check-password)
- El estado de autenticacion se persiste en localStorage para no pedir la contrasena en cada recarga
- Las APIs sensibles (private-lists, sync-lists) aceptan un parametro password opcional; si es incorrecto o falta, devuelven array vacio

## Flujo
1. Usuario abre la app -> ve solo canales por defecto
2. Hace clic en "Acceso Privado" -> aparece LoginModal
3. Ingresa contrasena -> se valida contra /api/check-password
4. Si es correcta -> se guarda en localStorage, se cargan listas privadas y sincronizadas
5. Si es incorrecta -> se muestra mensaje de error
6. Para cerrar sesion -> boton "Salir" -> se limpia localStorage y se ocultan listas
