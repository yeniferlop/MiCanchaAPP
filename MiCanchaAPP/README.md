# MiCanchaApp

Esta es una aplicación Next.js para reservar canchas de fútbol, creada con Firebase Studio. Utiliza Next.js, React, Tailwind CSS, componentes de ShadCN UI y Firebase para el backend.

## Prerrequisitos

Antes de comenzar, asegúrate de tener instalado lo siguiente:
- [Node.js](https://nodejs.org/) (se recomienda v18 o posterior)
- [npm](https://www.npmjs.com/get-npm), [yarn](https://yarnpkg.com/), o [pnpm](https://pnpm.io/)

## Primeros Pasos

Sigue estos pasos para poner en marcha la aplicación en tu máquina local.

### 1. Clona el repositorio

Primero, clona el repositorio del proyecto en tu máquina local.

### 2. Instala las Dependencias

Navega al directorio del proyecto e instala las dependencias necesarias usando tu gestor de paquetes preferido:

```bash
npm install
# o
yarn install
# o
pnpm install
```

### 3. Configura Firebase

Este proyecto está configurado para funcionar con Firebase.

1.  **Proyecto de Firebase**: Asegúrate de tener un proyecto de Firebase creado. Si no, crea uno en la [Consola de Firebase](https://console.firebase.google.com/).
2.  **Configuración de Firebase**: La configuración de Firebase se encuentra en `src/firebase/config.ts`. La configuración actual está conectada a un proyecto de Firebase Studio. Para conectarte a tu propio proyecto, reemplaza las credenciales con la configuración de tu propia aplicación web de Firebase.
    ```ts
    // src/firebase/config.ts
    export const firebaseConfig = {
      apiKey: "TU_API_KEY",
      authDomain: "TU_AUTH_DOMAIN",
      projectId: "TU_PROJECT_ID",
      storageBucket: "TU_STORAGE_BUCKET",
      messagingSenderId: "TU_MESSAGING_SENDER_ID",
      appId: "TU_APP_ID"
    };
    ```
3.  **Autenticación**: Habilita los proveedores de autenticación que desees usar (p. ej., Correo electrónico/Contraseña, Google) en la Consola de Firebase en **Authentication > Sign-in method**.
4.  **Base de datos Firestore**: Crea una base de datos Firestore en la Consola de Firebase.
5.  **Reglas de Seguridad de Firestore**: Las reglas de seguridad para este proyecto están en `firestore.rules`. Despliégalas en tu proyecto de Firebase usando Firebase CLI o copiándolas en la pestaña **Firestore Database > Rules** en la Consola de Firebase.

### 4. Ejecuta el Servidor de Desarrollo

Una vez que las dependencias estén instaladas y Firebase esté configurado, puedes iniciar el servidor de desarrollo:

```bash
npm run dev
# o
yarn dev
# o
pnpm dev
```

La aplicación estará disponible en [http://localhost:9002](http://localhost:9002).

## Scripts Disponibles

- `dev`: Inicia el servidor de desarrollo de Next.js con Turbopack.
- `build`: Compila la aplicación para producción.
- `start`: Inicia un servidor de producción.
- `lint`: Ejecuta el linter para verificar problemas de calidad de código.
