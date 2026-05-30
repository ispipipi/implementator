# Configuracion Firebase para IMPLEMENTATOR

IMPLEMENTATOR usa Firebase Auth para login/password y Firestore para guardar los cambios compartidos entre usuarios.

## 1. Crear proyecto Firebase

1. Entrar a https://console.firebase.google.com/
2. Crear un proyecto.
3. Agregar una app Web.
4. Copiar la configuracion de Firebase.

## 2. Activar autenticacion

1. Ir a Authentication.
2. Entrar en Sign-in method.
3. Activar Email/Password.
4. Crear los usuarios que podran ingresar.

## 3. Activar Firestore

1. Ir a Firestore Database.
2. Crear base de datos.
3. Usar las reglas de `firestore.rules`.

## 4. Configurar GitHub Pages

En el repositorio GitHub, ir a Settings > Secrets and variables > Actions > New repository secret y crear:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

Luego ejecutar un nuevo deploy con `git push`.

## 5. Primer ingreso

Si todavia no hay emails configurados en el mantenedor de perfiles, el primer usuario autenticado queda como administrador inicial. Luego ese administrador puede entrar a Ajustes > Mantenedor de perfiles y asociar cada email con su rol.
