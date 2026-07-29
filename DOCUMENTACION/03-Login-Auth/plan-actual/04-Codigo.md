# Codigo - Modulo de Login y Autenticacion

## Archivos Involucrados

### src/components/LoginModal.tsx
Modal que pide la contrasena y llama a `onLogin(password)`. Muestra estado de error si la contrasena es incorrecta.

### src/app/api/check-password/route.ts
```typescript
const APP_PASSWORD = process.env.APP_PASSWORD || ''
export async function GET(request: NextRequest) {
  const p = request.nextUrl.searchParams.get('p')
  return Response.json({ ok: p === APP_PASSWORD })
}
```

### src/store/player-store.ts (fragmentos relevantes)
- `isAuthenticated: boolean` y `authPassword: string` en el estado
- `initFromStorage`: carga `authPassword` desde localStorage y establece `isAuthenticated`
- `login(password)`: POST a /api/check-password, si ok guarda en localStorage y setea estado
- `logout()`: limpia localStorage y estado, elimina listas importadas

### src/app/page.tsx (fragmentos relevantes)
- Renderiza `LoginModal` cuando `showLogin` es true
- Pasword a private-lists: `/api/private-lists?password=${encodeURIComponent(authPassword)}`
- Password a sync-lists: `/api/sync-lists?password=${encodeURIComponent(authPassword)}`
- Renderizado condicional: si `!isAuthenticated` muestra mensaje "Inicia sesion" en vez de los componentes de gestion

### Variables de Entorno
- `APP_PASSWORD` — contrasena para acceder a las listas privadas
