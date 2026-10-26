# Cuidapp · App móvil (Pilar 1 · La familia)

Aplicación React Native (Expo SDK 57 + TypeScript) que implementa el recorrido operativo
del pilar familiar descrito en el manual: desde la cuenta familiar hasta el seguimiento
continuado y el historial de datos.

## Stack

| Área | Elección |
| --- | --- |
| Framework | Expo SDK 57 · React Native 0.86 · React 19 |
| Navegación | Expo Router (rutas en `src/app/`, Stack nativo, Native Tabs) |
| Estado servidor | TanStack Query (caché, invalidaciones, actualizaciones optimistas) |
| Estado cliente | Zustand (sesión de autenticación) |
| Formularios | React Hook Form + Zod |
| Almacenamiento seguro | expo-secure-store (token de sesión en Keychain / Keystore) |
| Fechas | date-fns (locale es) |
| Tests | Jest + jest-expo + Testing Library |
| Build y distribución | EAS Build / Submit / Update (OTA) |

## Estructura

```
src/
  app/                    # Rutas (Expo Router): cada archivo es una pantalla
    (auth)/               #   login, registro — solo sin sesión
    (tabs)/               #   inicio, rutina, informes, perfil — pestañas principales
    cuidado/              #   [id] detalle del perfil · nuevo formulario
    publicar.tsx          #   Paso 03 · oferta pública y candidaturas
    seleccion.tsx         #   Paso 04 · comparación de candidatos
    servicios.tsx         #   Paso 05 · catálogo de servicios complementarios
  api/                    # Cliente HTTP, endpoints, mocks y claves de query
  components/
    ui/                   # Librería propia: Screen, Card, Button, Badge, Chip…
  constants/theme.ts      # Design tokens (paleta teal Cuidapp, claro/oscuro)
  hooks/                  # Hooks de datos (React Query) y de sesión
  providers/              # AppProviders (React Query + restauración de sesión)
  store/auth-store.ts     # Estado global de autenticación
  types/index.ts          # Modelo de dominio tipado
  utils/format.ts         # Formato de fechas, importes, porcentajes…
```

## Recorrido implementado

1. **Cuenta familiar** — registro e inicio de sesión (`(auth)`), plan y perfiles.
2. **Perfil de cuidado** — `cuidado/nuevo` (formulario validado) y `cuidado/[id]` (ficha editable).
3. **Publicación y búsqueda** — `publicar`: estado de la oferta, visibilidad pública controlada y candidaturas recibidas.
4. **Selección del cuidador** — `seleccion`: comparativa con verificaciones y motivos de afinidad explicables (sin porcentajes ficticios).
5. **Servicios complementarios** — `servicios`: catálogo modular (gestoría, especialistas, sanitarios, formación).
6. **Rutinas y seguimiento** — `(tabs)/rutina`: checklist diario interactivo e incidencias.
7. **Información e informes** — `(tabs)/informes`: adherencia, incidencias y valoración.
8. **Datos e historial** — registros continuados por categoría (alimentación, movilidad, mediciones).

## Modo demo (sin backend)

Si no se define `EXPO_PUBLIC_API_URL`, la app arranca con datos de ejemplo coherentes con
la landing (familia Ana · persona atendida Carmen · cuidadora Laura R.). Cualquier correo
válido permite entrar. Para conectar la API real:

```bash
cp .env.example .env
# edita EXPO_PUBLIC_API_URL=https://tu-api/api
```

Los endpoints están centralizados en `src/api/endpoints.ts`: sustituyen los mocks por
llamadas HTTP reales cuando la variable está definida.

## Comandos

```bash
npm start                # Servidor de desarrollo (Expo Go o development build)
npm run ios              # Compilar y ejecutar en simulador iOS (requiere Xcode)
npm run android          # Compilar y ejecutar en emulador Android
npm run lint             # ESLint
npm run format           # Prettier
npm run typecheck        # TypeScript estricto
npm test                 # Jest (pruebas unitarias)
npm test -- --watch      # Jest en modo observación
```

## Build y distribución (EAS)

```bash
npx eas-cli@latest login
npx eas-cli@latest init                 # crea el proyecto y rellena updates.url en app.json
npx eas-cli@latest build -p ios --profile preview
npx eas-cli@latest build -p android --profile preview
npx eas-cli@latest update --branch preview --message "feat: pilar familiar"
```

Perfiles definidos en `eas.json`: `development` (dev client), `preview` (distribución
interna) y `production` (auto-incremento de versión).

## Notas de arquitectura

- **Estado del servidor** vive en React Query; **estado de sesión** en Zustand persistido
  con SecureStore. El root layout (`src/app/_layout.tsx`) restaura la sesión antes de
  renderizar rutas y protege la navegación con `Stack.Protected`.
- **Actualizaciones optimistas** en el registro de tareas (`use-rutina.ts`): la familia ve
  el cambio al instante y se revierte si la petición falla.
- **Sin dependencias nativas extra**: las carpetas `ios/` y `android/` no existen a propósito
  (Continuous Native Generation); no se editan a mano, se configuran en `app.json` y plugins.
- **Native Tabs** (`expo-router/unstable-native-tabs`) usa `SF Symbols` en iOS y Material
  Icons en Android, sin assets de imagen para los iconos de pestañas.
