# Requerimientos - Modulo de Login y Autenticacion

## Problema
Los usuarios que abren la URL del proyecto pueden ver todas las listas privadas y canales sincronizados, lo que expone informacion que deberia ser de acceso exclusivo del propietario.

## Objetivos
1. Proteger el acceso a listas privadas, listas sincronizadas y canales importados mediante una contrasena
2. Permitir que usuarios no autenticados vean solo los canales por defecto (channels.json)
3. Mantener la sesion iniciada entre recargas de pagina (persistencia en localStorage)
4. Proteger las APIs que sirven datos privados (sync-lists, private-lists)

## Alcance
- Login modal con campo de contrasena
- Verificacion de contrasena contra variable de entorno APP_PASSWORD
- Estado de autenticacion persistido en localStorage
- APIs protegidas con parametro password
- Botones de inicio/cierre de sesion en la barra superior del sidebar
- Ocultamiento condicional de componentes de gestion de listas

## Restricciones
- La contrasena se configura via variable de entorno (APP_PASSWORD)
- No hay registro de usuarios ni multiples cuentas
- La contrasena viaja como query param en las APIs (HTTPS la protege en produccion)
