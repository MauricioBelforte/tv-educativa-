# Diseno - Modulo de Login y Autenticacion

## Arquitectura

```
LoginModal (cliente)
  |
  v
/api/check-password?p=XXX (servidor)
  |-- compara con process.env.APP_PASSWORD
  |-- devuelve { ok: true/false }
  v
store.login(password) -> isAuthenticated = true
  |-- persiste en localStorage ('iptv-auth-password')
  v
page.tsx condiciona:
  |-- isAuthenticated = true  -> muestra M3UImporter, ImportedListsManager, SyncButton
  |-- isAuthenticated = false -> muestra solo canales por defecto
  v
APIs protegidas:
  |-- /api/private-lists?password=XXX
  |-- /api/sync-lists?password=XXX
  |-- /api/sync-lists POST (via query param password)
```

## Componentes
- **LoginModal**: Modal centrado con campo de contrasena y boton de ingreso
- **store.login/logout**: Acciones de Zustand que manejan el estado de autenticacion
- **check-password route**: API Route que valida la contrasena

## Archivos Involucrados
| Archivo | Rol |
|---------|-----|
| src/components/LoginModal.tsx | Interfaz de login |
| src/app/api/check-password/route.ts | Validacion server-side |
| src/store/player-store.ts | Estado isAuthenticated, login, logout |
| src/app/page.tsx | Renderizado condicional segun auth |
| .env.local | APP_PASSWORD |
