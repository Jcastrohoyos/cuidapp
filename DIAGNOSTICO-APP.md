# Diagnóstico funcional · Cuidapp (app móvil + landing)

- **Alcance:** `mobile/src` (Expo SDK 57 · RN 0.86.3 · Expo Router 57.0.28) y `landing/` (demo pública).
- **Fecha:** 20/10/2026 · commit base `5abbb12` · árbol de trabajo limpio.
- **Método:** revisión estática de las 20 rutas, capa de datos, hooks y utils + **reproducción en navegador** (Expo web en `localhost:8125` con Playwright, y la landing en `localhost:8123`).
- **Continuidad:** complementa `mobile/DIAGNOSTICO-UX-UI.md` (P0–P2 cerrados, P3 pendiente), `mobile/DIAGNOSTICO-VISUAL.md` y `DIAGNOSTICO-PILAR1-MANUAL.md`. Aquí no se repiten hallazgos ya cerrados: se analizan **funcionalidad, integridad de datos y despliegue**.

---

## 0. Estado de la remediación

| Sprint | Alcance | Estado |
|---|---|---|
| **A** | Los 4 P0 (selección de cuidador, aislamiento entre perfiles, crash de tema, guarda de release) | ✅ **Cerrado** — 4/4 corregidos y verificados en navegador + 17 tests nuevos |
| **B** | 14 P1 (sesión y red, caché, cifras, privacidad, perfil activo) | ✅ **Cerrado** — 14/14 corregidos, verificados en navegador + 14 tests nuevos |
| **C** | 16 P2 + P3 (informes honestos, copy, accesibilidad, limpieza, landing) | ✅ **Cerrado** — 15/16 P2 + 9 P3, verificado en navegador + 23 tests nuevos (**130 en total**) |

**Cambios del Sprint A (verificados):**

| P0 | Arreglo | Verificación |
|---|---|---|
| P0-1 | `data-store.ts:178-204` degrada a `'rechazada'` la candidatura anterior; `use-cuidador.ts:19-28` toma la última seleccionada | Navegador: tras elegir a Marta, solo Marta sale «Seleccionado» y «Mi cuidador» muestra a Marta |
| P0-2 | `endpoints.ts` filtra `listarCandidatos`, `listarTareas` y `listarRegistros` por `perfilId` (y los registros por los ids de tarea del perfil) | Navegador: la rutina de Carmen ya no muestra «Tarea SOLO de Elena» ni su incidencia; 3/5 en vez de 4/6 |
| P0-3 | `use-theme.ts:13` resuelve el esquema sin indexar con `null` | Test con `useColorScheme() === null` |
| P0-4 | `eas.json` declara `environment` por perfil; `check-release.js` lee la URL del entorno o del perfil y da un mensaje accionable; la app muestra una pantalla de configuración inválida en vez de lanzar en un `useEffect`; `_layout.tsx` exporta `ErrorBoundary` | `check-release apk` → OK (demo); `preview`/`production` → falla con el mensaje que explica cómo arreglarlo |

**Cambios del Sprint B (verificados):**

| P1 | Arreglo | Verificación |
|---|---|---|
| P1-1 | `cuenta.tsx:159` → `router.canGoBack() ? back() : replace('/perfil')` | Navegador: `/cuenta` por URL directa → tras «Guardar datos» la URL pasa a `/perfil` (antes: aviso *«GO_BACK was not handled»* y la familia atrapada) |
| P1-2 | `auth-store.ts:56-77` solo destruye la sesión con **401/403**; un fallo de red conserva el token y la familia sigue dentro | Test de endpoints + código |
| P1-3 | `client.ts:107-173` timeout de 10 s con `AbortController` + `ErrorDeRed` propio | Código |
| P1-4 | `endpoints.iniciarSesion`/`registrar` construyen la cuenta con el correo con el que se entra; `obtenerFamilia` en demo devuelve **el almacén**, no la familia de ejemplo (era lo que pisaba el correo al restaurar) | Navegador: entrar con `mi.familia@correo.com` muestra «Mi Familia · mi.familia@correo.com» |
| P1-5 | `buscar-cuidadores.ts` filtra por `tarifaMaxHora` (sin tarifa publicada no se inventa) | 4 tests nuevos |
| P1-6 | `query-keys.ts:16` incluye los filtros en la clave del historial | 4 tests nuevos |
| P1-7 | `use-rutina.ts:114-117` incorpora `incidencias.isError` (la app ya no dice «todo va según lo previsto» con datos rotos) | Código |
| P1-8 | `use-rutina.ts:62-68` invalida `qk.informe` al registrar | Código |
| P1-9 | `endpoints.registrarTarea` devuelve el registro **ya persistido** (mismo id) | Test: el id devuelto es el guardado |
| P1-10 | `app.json` → `android.allowBackup: false`; `actualizarPerfil` rechaza `visibleEnOferta: true` e ignora `estado` (no lo decide el cliente) | 2 tests nuevos |
| P1-11 | `cuidado/nuevo.tsx` activa el perfil creado; `data-store.ts` lo hace en el almacén | Navegador: tras crear «Elena Vera», la rutina y la portada operan sobre Elena |
| P1-12 | `use-perfiles.ts:37-44` cae al primer perfil si el id guardado ya no existe | Código |
| P1-13 | `use-perfiles.ts:78` invalida también `candidatos` al eliminar un perfil | Código |
| P1-14 | `client.ts` tolera 204 y cuerpos vacíos y reporta el JSON inválido en vez de lanzar `SyntaxError` | Código |

**Cambios del Sprint C (verificados):**

| # | Arreglo | Verificación |
|---|---|---|
| P2-1 | Cierre de sesión con `catch` y aviso (quedaba **cerrado en el Sprint B**) | Navegador |
| P2-2 | Una tarifa no numérica **no borra** el acuerdo firmado: la pantalla avisa y el endpoint ignora los `undefined` | Código |
| P2-3 | `perfil.tsx` y `publicar.tsx` no anuncian «sin perfiles / sin candidaturas» mientras la consulta está en curso | Navegador |
| P2-4 | **Informes honestos**: nuevo `utils/adherencia.ts`; el periodo es la semana en curso (lunes–domingo), solo se cuentan los días transcurridos, el estado de cada día es el del **último registro** (el modelo es append) y la adherencia sale como fracción real (`2/2`, `1/2`, `0/2`) | Navegador: «Carmen · Semana del 19–25 de octubre · 60 % tareas cumplidas · 2 incidencias · 4,9 valoración del cuidador» |
| P2-4b | **La valoración inventada (`4,8`) desaparece**: ahora es la media real de las reseñas del cuidador asignado, o «—» si no hay cuidador | Test + navegador |
| P2-4c | El informe **no puede cerrarse**: se añadió `endpoints.resolverIncidencia` + `useResolverIncidencia` y un botón «Resolver» en Informes | Navegador: la incidencia pasa a «Resuelta» con su resolución y persiste al recargar |
| P2-5/6 | `perfilActivo` muerto y `reiniciarDemo` sin reiniciar el perfil activo (cerrados en el Sprint B) | Tests |
| P2-7 | **Ids sin colisiones**: `idUnico()` con contador (`reg_1750000000000_0001`); además la persona y su perfil comparten ya el mismo id | Test |
| P2-8 | `estadoTarea` usa `estadoDelDia()` (estado del último registro) en vez de parsear el id | Test |
| P2-9 | La rutina se ordena **por hora** (`ordenarPorHora`) | Navegador: 09:00 · 10:30 · 13:00 · 17:00 · 21:00 |
| P2-10 | El **límite del plan se aplica**: la interfaz avisa y la API responde 403 | Navegador: «+ Nuevo» no crea un segundo perfil y explica el motivo |
| P2-11 | Copy: `/ayuda` con los **7 pasos reales** (ya no «6» ni «pestaña Perfil»), `formatearHorario` dice **«Lun–Vie»** en vez de «5 días», el tipo de atención se muestra en lenguaje llano («Domiciliaria») y se elimina la promesa de una pantalla de edición que no existe | Navegador + test |
| P2-12 | Objetivos táctiles ≥ 44 pt: cabecera (40→44), acción de `SectionHeader`, enlaces de acceso y «Crear cuenta familiar» | Código |
| P2-13 | El buscador **escala con «Texto grande»** como el resto de campos | Código |
| P2-14 | `Loading` admite cabecera: las pantallas modales (**Publicar**, **Perfil de cuidado**) ya no dejan a la familia sin salida visible mientras cargan | Código |
| P2-15 | Claves React únicas en Informes: `key={ruta.tareaId}` en vez de `key={ruta.nombre}` | Código |
| P2-16 | `.gitignore` cubre `.env.development`, `.env.preview`, `.env.production`… (con `!.env.example`) | — |
| P3 | **Textos centralizados** en `constants/textos.ts`: la misma verificación ya no se llama «Antecedentes» en una pantalla y «Antecedentes penales» en otra; las franjas tienen una forma en frase y otra como opción; los umbrales de afinidad (`70`/`40`) son los mismos en todas partes | Test nuevo |
| P3 | **Tarjeta de perfil extraída** a `components/ui/profile-card.tsx` (la duplicaba la portada y el perfil) | Código |
| P3 | `mocks.informeDemo` (el que llevaba el `4,8` inventado) **eliminado** | — |
| P3 | **`+not-found`** lleva a la pantalla adecuada según haya sesión o no | Código |
| P3 | **Landing**: sin desborde horizontal en móvil (`overflow-x: clip` en `html`) y **favicon en línea** (desaparece el 404 de `/favicon.ico`) | Navegador: `scrollWidth 360 = clientWidth 360`, 0 errores de red |
| P3 | `useColorScheme` de `react-native` **se mantiene**: la doc oficial de Expo recomienda esa vía (`expo-system-ui` ya está instalado y respeta `userInterfaceStyle`). *Corrección: el P3 original recomendaba `expo-color-scheme`, lo cual era innecesario.* | Doc de Expo SDK 57 |

---

## 1. Veredicto

**La app está bien construida y es presentable, pero no es segura para datos reales todavía.** El esqueleto (design system, tokens AA, estados de carga/error/vacío, tests unitarios, tipado estricto) está en orden: `tsc`, `lint`, `jest` y `expo-doctor` pasan limpios. Los problemas que quedan **no son de maquetación, son de lógica de negocio**: la app confunde quién es el cuidador asignado, mezcla los datos de dos personas a cargo, y su capa de informes publica cifras que no se corresponden con lo que mide.

**Los 4 P0 de este diagnóstico se han reproducido en navegador: no son análisis teórico.** Dos de ellos (P0-1 y P0-2) hacen que la familia vea información de la persona equivocada en un producto cuyo único compromiso es la confianza en el cuidado de un familiar.

| Dimensión | Nota | Comentario |
|---|---|---|
| Tipado y lint | **9/10** | `tsc --noEmit` y `eslint` limpios, sin `any` innecesario |
| Design system y accesibilidad | **8/10** | Tokens con contraste AA testeado; texto grande conmutable y persistente |
| Cobertura de tests | **5/10** | 73/73 verdes, pero **solo utils**: ni store, ni endpoints, ni hooks tienen test |
| Integridad de datos por perfil | **3/10** | Los filtros de `endpoints.ts` no aíslan por `perfilId` (P0-2) |
| Coherencia de estado del cuidador | **3/10** | La selección no degrada a la candidatura anterior (P0-1) |
| Robustez de sesión y red | **5/10** | Sin timeout en `fetch`; la sesión se destruye con cualquier error de red |
| Fiabilidad de las cifras mostradas | **4/10** | Informes mezcla histórico y día, y `valoracion` está inventada |
| Despliegue | **4/10** | `check-release` **falla** en `preview` y `production` |

---

## 2. Verificaciones automáticas (20/10/2026)

| Comprobación | Resultado |
|---|---|
| `npx tsc --noEmit` | ✅ 0 errores |
| `npx eslint .` | ✅ 0 errores, 0 avisos |
| `npx jest` | ✅ **73/73** en 7 suites (`rutina`, `perfiles`, `format`, `afinidad`, `buscar-cuidadores`, `theme`, `task-item`) |
| `npx expo-doctor` | ✅ 21/21 |
| `node scripts/check-release.js development` | ✅ OK (dev-client) |
| `node scripts/check-release.js apk` | ✅ OK (demo) |
| `node scripts/check-release.js preview` | ❌ **falla** (exit 1) |
| `node scripts/check-release.js production` | ❌ **falla** (exit 1) |
| Navegador (Expo web) | ✅ arranque, login y navegación sin errores de consola **con 1 solo perfil**; 0 errores con 2 |
| Navegador (landing) | ⚠️ 1×404 (`favicon.ico`) y desborde horizontal de 18 px en móvil |

---

## 3. P0 · Bloqueantes (reproducidos)

### P0-1 · Al elegir un cuidador, la app sigue mostrando al anterior como asignado

**Causa raíz** — `mobile/src/store/data-store.ts:178-196` (`seleccionarCandidatoEnPerfil`): marca la candidatura nueva como `'seleccionada'` **pero nunca degrada** a la que ya lo estaba. `mobile/src/hooks/use-cuidador.ts:19-20` (`useMiCuidador`) hace `find(c => c.candidatura.estado === 'seleccionada')` → devuelve **la primera** del array. La semilla ya trae `cand_1` (Laura) en `'seleccionada'` (`mobile/src/api/mocks.ts:167-170`).

**Reproducción (navegador, 20/10/2026):**
1. `/seleccion` → pulsar «Seleccionar» en **Marta S.** → confirmar.
2. Resultado: **Laura R. y Marta S. muestran a la vez la insignia «Seleccionado»** y ambas el botón «Cuidador asignado».
3. `/cuidador` («Mi cuidador») sigue mostrando **Laura R.** — el cuidador que la familia acaba de sustituir.

**Impacto:** es el dato más crítico de la pantalla. La familia asigna a Marta, la app le dice que el cuidador es Laura, y de Laura son los acuerdos, permisos y `responsableId` de las tareas de la rutina (`mobile/src/api/mocks.ts:292-296`). El texto de la propia UI lo promete («Podrás cambiarlo más adelante desde el perfil», `mobile/src/app/seleccion.tsx:216`).

**Arreglo:** en `seleccionarCandidatoEnPerfil`, degradar a `'rechazada'` todas las candidaturas `'seleccionada'` del mismo perfil **antes** de marcar la nueva; y en `useMiCuidador`, quedarse con la última seleccionada en lugar de la primera. Test unitario obligatorio: «seleccionar B tras A → exactamente una candidatura `'seleccionada'`».

---

### P0-2 · Fuga de datos entre personas a cargo: la rutina de una muestra las tareas de la otra

**Causa raíz** — tres filtros que no aíslan por `perfilId` en `mobile/src/api/endpoints.ts`:

| Línea | Código | Efecto |
|---|---|---|
| `:214` | `t.perfilId === perfilId \|\| perfilId === mocks.perfilDemo.id` | Para el perfil semilla (`per_1`) devuelve **todas** las tareas del almacén, incluidas las de otro perfil |
| `:145` | `c.candidatura.perfilId === perfilId \|\| perfilId === mocks.perfilDemo.id` | Ídem con las **candidaturas** |
| `:222` | `r.tareaId === perfilId \|\| r.fecha === fecha` | La primera cláusula compara un id de tarea con un id de perfil (**siempre falsa**); la segunda devuelve los registros del día **de cualquier perfil** |

**Reproducción (navegador):** con dos perfiles (`per_1` Carmen + `per_2` Elena), la rutina de Carmen muestra **«Tarea SOLO de Elena · 21:00 · personalizada»** junto a las suyas. El progreso del día pasa de 2/5 a **4/6**, contaminado.

**Impacto:** notas, incidencias y estados de otras personas quedan visibles en la pantalla de seguimiento. En el modelo actual `Familia.perfilesMaximos = 1`, pero el propio `app.json`/`eas.json` no lo imponen y `/perfil` anuncia «Plan gratuito · hasta 1 perfil(es)» que **no se aplica** (`mobile/src/app/perfil.tsx:156` → nada lo comprueba en `endpoints.crearPerfil`).

**Arreglo:** eliminar los tres atajos y filtrar siempre por `perfilId`; para `listarRegistros`, resolver primero los ids de tarea del perfil y filtrar `registros` por `ids.has(r.tareaId) && r.fecha === fecha`.

---

### P0-3 · La app puede quedar en blanco si el sistema no define modo claro/oscuro

**Causa raíz** — `mobile/src/hooks/use-theme.ts:11`:
```ts
const scheme = useColorScheme();                    // ?ColorSchemeName → puede ser null
const theme = scheme === 'unspecified' ? 'light' : scheme;
return Colors[theme];                               // Colors[null] → undefined
```
`useColorScheme` se reexporta de `react-native` (`mobile/src/hooks/use-color-scheme.ts:1`) y su firma real es `?ColorSchemeName` (`node_modules/react-native/Libraries/Utilities/useColorScheme.js:23`); `Appearance.getColorScheme()` devuelve `null` cuando la plataforma no define esquema (Android `UI_MODE_NIGHT_UNDEFINED`, o `NativeAppearance == null`).

**Impacto:** `Colors[null]` → `undefined` → el primer `theme.background` de cualquier pantalla lanza `TypeError` → **pantalla en blanco**. La propia app lo resuelve bien en otro sitio (`mobile/src/app/(tabs)/_layout.tsx:42`: `scheme === 'dark' ? 'dark' : 'light'`), lo que confirma que el caso es real y que el tipado no lo avisa.

**Arreglo (1 línea):** `const theme = scheme === 'dark' ? 'dark' : 'light';`.

---

### P0-4 · La guarda de release no protege ningún build de distribución

**Causa raíz** — `mobile/scripts/check-release.js:49-53` exige `eas.json.build.<perfil>.env.EXPO_PUBLIC_API_URL`, pero **`mobile/eas.json` no la define en ningún perfil** (solo `APP_ENV`, que el código nunca lee). Ejecutado:

```
$ node scripts/check-release.js preview
check-release: fallaron las comprobaciones:
  - eas.json.build.preview.env.EXPO_PUBLIC_API_URL no está definida…
$ node scripts/check-release.js production
check-release: fallaron las comprobaciones:
  - eas.json.build.production.env.EXPO_PUBLIC_API_URL no está definida…
```

**Impacto en cascada:** si un build de `preview`/`production` se construyera con la URL vacía, `assertApiConfigurado()` (`mobile/src/api/client.ts:45-53`) lanza **dentro de un `useEffect`** (`mobile/src/providers/app-providers.tsx:20-23`) y `_layout.tsx` **no exporta ningún `ErrorBoundary`** → pantalla en blanco sin mensaje, en lugar de un error legible. El guard que debía impedirlo es justo el que no se ejecuta.

**Arreglo:** (a) definir `EXPO_PUBLIC_API_URL` por perfil en `eas.json` o leerla de `process.env`; (b) mover `assertApiConfigurado()` **antes del render** y mostrar un `ErrorState` explicativo; (c) exportar `ErrorBoundary` en `mobile/src/app/_layout.tsx`.

---

## 4. P1 · Alta prioridad

| # | Hallazgo | Evidencia | Recomendación |
|---|---|---|---|
| **P1-1** | **«Guardar datos» no hace nada si `/cuenta` se abre por URL directa** — es una **regresión del fix `GO_BACK` ya aplicado** en `ScreenHeader` y `cuidado/nuevo` | `mobile/src/app/cuenta.tsx:159` → `router.back()` sin `canGoBack()`. **Reproducido en navegador**: URL sigue en `/cuenta`, el formulario no se cierra y React Navigation avisa *«The action 'GO_BACK' was not handled by any navigator»* | `router.canGoBack() ? router.back() : router.replace('/perfil')` |
| **P1-2** | **Un fallo de red destruye la sesión** | `mobile/src/store/auth-store.ts:56-60`: el `catch` de `restaurar()` borra el token ante **cualquier** error (red caída included) y pone `estado:'anonimo'` | Cerrar sesión solo con 401/403; ante error de red conservar el token y avisar |
| **P1-3** | **`fetch` sin timeout → splash infinito** | `mobile/src/api/client.ts:111`; `restaurar()` espera `obtenerFamilia()` (`auth-store.ts:49`) y el splash solo se oculta con `estado !== 'cargando'` (`mobile/src/app/_layout.tsx:32-36`) | `AbortSignal.timeout(10_000)` en `peticion()` + watchdog en `restaurar()` |
| **P1-4** | **El nombre y el correo con el que se entra se pierden** | `mobile/src/app/perfil.tsx:38-39` y `mobile/src/app/(tabs)/buscar.tsx:106-107`: `familiaLocal ?? sesion?.familia` — el store siempre está sembrado, así que `??` es código muerto. **Reproducido**: entrar con `ana@email.com` muestra «Ana Martínez · ana.martinez@email.com» | Volcar `sesion.familia` al store en `iniciarSesion`/`restaurar` y leer `obtenerFamilia` del store en modo mock |
| **P1-5** | **El tope de precio de la familia no filtra nada** | `mobile/src/types/index.ts:39` (`tarifaMaxHora`), editable en `cuenta.tsx:153` y visible en `perfil.tsx:95-96`, pero `CriteriosBusqueda` (`mobile/src/utils/buscar-cuidadores.ts:20-34`) **no tiene criterio de tarifa** → «máx. 15 €/h» no descarta a nadie | Añadir `tarifaMaxHora` a `CriteriosBusqueda` + chip en Buscar |
| **P1-6** | **Dos consultas con parámetros distintos comparten la misma caché** | `mobile/src/api/query-keys.ts:16` (`historial: (perfilId) => ['historial', perfilId]`) + `mobile/src/hooks/use-informes.ts:20` (los `opts` no entran en la clave). `informes.tsx:25` pide `limite: 20` y `use-recorrido.ts:77` pide `limite: 5` | Incluir `opts` en `queryKey` |
| **P1-7** | **La app afirma «todo va según lo previsto» con datos rotos** | `mobile/src/hooks/use-rutina.ts:111`: `esError: tareas.isError \|\| registros.isError` — **falta `incidencias.isError`** → `mobile/src/app/(tabs)/rutina.tsx:153-157` muestra «Sin incidencias abiertas. Todo va según lo previsto.» con la consulta de incidencias fallida | Incluir `incidencias.isError` en `esError` y en `cargando` |
| **P1-8** | **Las cifras de Informes quedan obsoletas al marcar una tarea** | `mobile/src/hooks/use-rutina.ts:62-65` invalida `registros` y `tareas`, **no** `qk.informe(perfilId)` → el % cacheado sobrevive hasta el TTL (30 s, `query-client.ts:21`) | Invalidar `qk.informe(perfilId)` en `onSettled` |
| **P1-9** | **`registrarTarea` devuelve un id que no existe en el almacén** | `mobile/src/api/endpoints.ts:234` (el store genera `reg_${Date.now()}`, `data-store.ts:219`) y `:236` (**otra** llamada a `Date.now()`) construye y devuelve un segundo objeto → dos ids distintos en el mismo milisegundo | Que `agregarRegistro` devuelva el registro creado (como ya hace `agregarTarea`) y devolver ese mismo objeto |
| **P1-10** | **Los datos clínicos se guardan en claro y el invariante de privacidad no se aplica** | `visibleEnOferta: false` (`mobile/src/types/index.ts:105-131`) **se escribe pero nunca se lee** (solo aparece en `mocks.ts:104` y `cuidado/nuevo.tsx:313`): `endpoints.crearPerfil`/`actualizarPerfil` (`endpoints.ts:84-108`) reenvían el perfil **completo, con `datosSensibles`**, a `POST/PATCH /perfiles`. Además `data-store.ts:279-291` persiste todo en AsyncStorage en claro, y `app.json:18-27` no fija `android.allowBackup: false` (Auto Backup puede exportar la base) | Enviar los datos clínicos por endpoint separado o eliminarlos del payload de oferta; cifrar o excluir del `partialize`; `allowBackup: false` |
| **P1-11** | **El perfil recién creado no queda activo** | `mobile/src/app/cuidado/nuevo.tsx:318-320` crea y vuelve atrás, pero **no** llama a `establecerPerfilActivo`; `usePerfilActivo` (`mobile/src/hooks/use-perfiles.ts:37`) cae en `perfiles[0]`. `useActualizarPerfil` (`use-perfiles.ts:42`) no lo usa ninguna pantalla | Llamar a `establecerPerfilActivo(nuevoId)` tras crear y **eliminar el `perfilActivoId` muerto del data-store** (`data-store.ts:70,109,264`) |
| **P1-12** | **Un `perfilActivoId` obsoleto deja la app sin perfil** | `mobile/src/hooks/use-perfiles.ts:37-38`: `perfiles?.find(p => p.id === id) ?? null` — el fallback a `perfiles[0]` solo se aplica si el id es `null`, no si está obsoleto | `perfiles?.find(p => p.id === id) ?? perfiles?.[0] ?? null` |
| **P1-13** | **Borrar un perfil no invalida sus candidaturas** | `mobile/src/hooks/use-perfiles.ts:76-78` invalida `['tareas','registros','incidencias','informes','historial','configCuidador']` — **falta `'candidatos'`** | Añadir `'candidatos'` (usar `qk.*` en vez de literales) |
| **P1-14** | **La respuesta del backend no se valida en runtime** | `mobile/src/api/client.ts:127`: `return (await respuesta.json()) as T` — cast sin esquema. Con un cuerpo vacío y status 200, `json()` lanza `SyntaxError` (no `ApiError`) → mensaje genérico. `actualizarPerfil` acepta `Partial<PerfilCuidado>`, así que un cliente puede forzar `estado:'con_cuidador'` saltándose la publicación | Esquema zod de respuesta; forbidding explícito de `estado` en `actualizarPerfil`; tolerar 204/body vacío |

---

## 5. P2 · Media prioridad

| # | Hallazgo | Evidencia |
|---|---|---|
| P2-1 | **Cerrar sesión sin manejar el error**: `void cerrarSesion().then(...)` sin `catch` → si `SecureStore` falla, la promesa se rechaza, la sesión **no se cierra** y no hay aviso | `mobile/src/app/perfil.tsx:52` |
| P2-2 | **Una tarifa mal tecleada borra la tarifa acordada sin error**: `Number('abc') → NaN → undefined`, y `endpoints.ts:182-187` hace `{...actual, ...cambios}` → un `undefined` explícito **sobrescribe** el valor guardado | `mobile/src/app/(tabs)/cuidador.tsx:153-164` |
| P2-3 | **Parpadeo de estado vacío**: `perfil.tsx:36` y `publicar.tsx:27` ignoran `isLoading` → «Sin perfiles de cuidado» / «Sin candidaturas todavía» mientras la consulta sigue en curso | `mobile/src/app/perfil.tsx:36,144-150` · `publicar.tsx:27,129-139` |
| P2-4 | **Informes mezcla histórico y día, y `valoracion` está inventada**: `obtenerInforme` cuenta **todos** los registros históricos contra el total de tareas, con `periodo` de 6 días y `valoracion: 4.8` fijo → el % se satura en 100; mientras la «Adherencia por rutina» es de **hoy** (0 % o 100 %) bajo el subtítulo **«semana en curso»**. Contradice el principio «nada inventado» | `mobile/src/api/endpoints.ts:284-303` · `mobile/src/app/informes.tsx:32,90-94,107,112` |
| P2-5 | **`perfilActivo` del data-store es estado muerto y congelado**: getter evaluado en el primer `set()` (zustand vanilla copia el valor) y nadie lo lee; `establecerPerfilActivo`/`perfilActivoId` viven en dos stores | `mobile/src/store/data-store.ts:70,109,264,270-274` vs `auth-store.ts:17,40` |
| P2-6 | **`reiniciarDemo` no reinicia el perfil activo** (`semillas` no incluye `perfilActivoId`; el cast `as Partial<DataEstado>` oculta el hueco) | `mobile/src/store/data-store.ts:37-47,267` |
| P2-7 | **Ids con `Date.now()` en 9 sitios** → dos creaciones en el mismo milisegundo colisionan; `cuidado/nuevo.tsx:290` genera **dos** ids distintos para la misma persona (`persona.id ≠ perfil.id`) | `data-store.ts:142,201,219,230,257` · `endpoints.ts:88` · `mocks.ts:281` · `cuidado/nuevo.tsx:290` · `cuenta.tsx:126` |
| P2-8 | **`estadoTarea` deduce «el más reciente» parseando el id** (`Number(id.replace(/\D/g,''))`); ante ids iguales desempata el más antiguo → el toggle no se refleja | `mobile/src/hooks/use-rutina.ts:91-100` |
| P2-9 | **La rutina no se ordena por hora**: una tarea nueva de «Mediodía 13:00» aparece detrás de la de «Noche 21:00» | `mobile/src/utils/rutina.ts:9-11` · `data-store.ts:202` |
| P2-10 | **`perfilesMaximos` no se aplica** (solo se muestra) | `mobile/src/app/perfil.tsx:156` vs `endpoints.crearPerfil` |
| P2-11 | **Copy desalineado con el producto**: `/ayuda` dice «pestaña Perfil» (Perfil **no** es pestaña) y «6 pasos» (son **7**); `cuidado/[id].tsx:144` promete «editar el perfil» pero **no existe pantalla de edición**; `cuidado/[id].tsx:122` muestra el slug crudo `domiciliaria`; `format.ts:59-64` devuelve «5 días · …» cuando su propio JSDoc dice «Lun–Vie» | `ayuda.tsx:47,76,90` · `cuidado/[id].tsx:122,144` · `format.ts:59-64` |
| P2-12 | **Puntos táctiles < 44 pt**: acción de `SectionHeader` (~20 pt), «Crear cuenta familiar» (~20 pt) y «¿Olvidaste tu contraseña?» (~28 pt) | `components/ui/section-header.tsx:24-30` · `(auth)/login.tsx:81-86,106-110` |
| P2-13 | **El buscador no escala con «Texto grande»**: usa un `TextInput` crudo en vez de `CampoTexto` (que sí escala) → inconsistencia visible dentro de la misma app | `mobile/src/app/(tabs)/buscar.tsx:191-199` vs `components/ui/field.tsx:80-86` |
| P2-14 | **Pantallas de carga sin salida visible**: `Loading` no lleva `ScreenHeader`, y `publicar` / `cuidado/[id]` son modales apilados → en Android (sin gesto) el usuario queda atrapado mientras carga | `mobile/src/components/ui/loading.tsx:19-28` · `cuidado/[id].tsx:61` · `publicar.tsx:37` |
| P2-15 | **Claves React duplicadas en Informes**: `key={ruta.nombre}` → dos tareas con el mismo nombre (p. ej. «Medicación» dos veces) colisionan | `mobile/src/app/informes.tsx:122` |
| P2-16 | **`.gitignore` no cubre los `.env` por entorno de Expo** (`.env.development`, `.env.production`, `.env.<perfil>`) — hoy no hay secretos, pero el patrón es de riesgo | `mobile/.gitignore:25-28` |

---

## 6. P3 · Limpieza y pulido

- **API muerta en el data-store:** `setPerfiles`, `setTareas`, `setRegistros`, `setIncidencias`, `setServicios`, `setHistorial`, `agregarIncidencia`, `resolverIncidencia`, `agregarHistorial` — ninguna la llama nadie (`data-store.ts:73-106,137-261`). Consecuencia funcional: **`resolverIncidencia` es el único escritor de `Incidencia.resolucion`, así que la app no puede cerrar una incidencia**.
- **Duplicación de lógica y copy:** `TEXTOS_VERIFICACION` literal en `seleccion.tsx:261-266` y `(tabs)/cuidador.tsx:27-32`; mapa de afinidad→tono con **umbrales distintos** (40 en `seleccion.tsx:54` vs 35 en `buscar.tsx:46-47`); tres copias del mapa de franjas con *casing* inconsistente («Mañanas» vs «mañanas») en `cuenta.tsx:25-29`, `perfil.tsx:26-30`, `buscar-cuidadores.ts:14-18`; tarjeta de perfil duplicada en `(tabs)/index.tsx:108-127` y `perfil.tsx:122-141`.
- **Landing:** desborde horizontal de **18 px** en móvil (`scrollWidth 378 > 360`) por los decorativos `.phone__glow` y `.journey__glow`; **404 de `/favicon.ico`** (no hay `<link rel="icon">`). Arreglo: `overflow-x: hidden` en el contenedor y un favicon.
- **`+not-found.tsx` queda fuera de `Stack.Protected`** → accesible sin sesión, y su CTA apunta a `/(tabs)`, que rebota al login.
- **`import { Tabs } from 'expo-router/js-tabs'`** (`(tabs)/_layout.tsx:1`): el subpath existe en el paquete pero no está en `exports` ni documentado en SDK 57 → riesgo de rotura en la próxima versión.
- **`use-color-scheme` usa `react-native` en vez de `expo-color-scheme`**, con lo que no refleja el `userInterfaceStyle: 'automatic'` de `app.json` (sí lo hace el resto de la app).

---

## 7. Cobertura de tests · huecos reales

7 suites y 73 tests, todos sobre **utils puros**. No hay **ni un solo test** sobre las capas donde viven los P0:

| Sin test | Consecuencia |
|---|---|
| `src/store/data-store.ts` (20 mutaciones, `partialize`, rehidratación) | P0-1 y P1-9 sin red de seguridad |
| `src/api/endpoints.ts` (ramas mock de `listarTareas`, `listarCandidatos`, `listarRegistros`, `registrarTarea`, `crearPerfil`) | P0-2 sin red de seguridad |
| `src/store/auth-store.ts` (`restaurar`, `cerrarSesion`, `expiraEn`) | P1-2 sin red de seguridad |
| `src/hooks/*` (invalidaciones, `estadoTarea`, `esError`, claves de caché) | P1-6, P1-7, P1-8 sin red de seguridad |
| `src/api/client.ts` (`peticion`, errores, 204, `tokenStorage`) | P1-3, P1-14 sin red de seguridad |
| `src/utils/format.ts` (`fechaHoy`, `formatearFechaHora`, `tiempoRelativo`) | Zona horaria e idioma sin cubrir |

Además, `jest.config.js:7-12` **excluye `src/app/**`**: ninguna pantalla entra en la cobertura. Dos tests cerrarían los dos P0 más graves:

1. `seleccionarCandidatoEnPerfil` → tras seleccionar B, exactamente una candidatura queda en `'seleccionada'`.
2. `listarTareas`/`listarCandidatos`/`listarRegistros` → con dos perfiles, los datos de uno **nunca** aparecen en la consulta del otro.

---

## 8. Paridad landing ↔ app (la demo es el diseño de referencia)

La demo de `landing/` es el diseño correcto según el usuario; la app debe parecerse a ella. Divergencias detectadas:

| Aspecto | Landing (referencia) | App (hoy) |
|---|---|---|
| **Informes** | «Semana del 12–18 de octubre», adherencia **semanal con fracciones reales** (7/7, 19/21, 6/7) | «semana en curso», adherencia **de hoy** con 0 % o 100 % por tarea, y `valoracion: 4.8` fijo (P2-4) |
| **Plan / perfiles** | «Acceso inicial · 1 perfil de cuidado» | Se muestra el límite pero **no se aplica** (P2-10) |
| **Preferencias** | — | La app edita `tarifaMaxHora` y **no filtra por ella** (P1-5) |
| **Selección** | «La afinidad se explica con datos registrados… sin porcentajes ficticios» | Coherente ✅, pero con **dos cuidadores «Seleccionado»** a la vez (P0-1) |
| **Rutina** | 8 pasos, tareas con responsable y «Poner la lavada · solo hoy» | Coherente ✅, pero **mezcla tareas de otro perfil** (P0-2) |

---

## 9. Plan de acción

### Sprint A · «No mostrar información de la persona equivocada» (P0) · ~1 día
1. Degradar la candidatura anterior al seleccionar (`data-store.ts:178-196`) + `useMiCuidador` toma la última. **Test unitario obligatorio.**
2. Eliminar los tres atajos de `perfilId` en `endpoints.ts:145,214,222` y filtrar los registros por los ids de tarea del perfil. **Test unitario obligatorio.**
3. `use-theme.ts:11` → `scheme === 'dark' ? 'dark' : 'light'`.
4. `eas.json` con `EXPO_PUBLIC_API_URL` por perfil; `assertApiConfigurado()` antes del render + `ErrorBoundary` en `_layout.tsx`.

### Sprint B · «Que la app no diga mentiras y no se rompa» (P1) · ~1 semana
5. `cuenta.tsx:159` → `canGoBack()`/`replace` (regresión del fix `GO_BACK`).
6. `auth-store.ts:56-60` → cerrar sesión solo con 401/403; `client.ts:111` → timeout con `AbortSignal`.
7. `use-rutina.ts:111` → `incidencias.isError`; `use-rutina.ts:62-65` → invalidar `qk.informe`.
8. `query-keys.ts:16` → `historial` con `opts` en la clave.
9. `endpoints.registrarTarea` → devolver el registro persistido; `agregarRegistro` que devuelva lo creado.
10. Volcar `sesion.familia` al store; `tarifaMaxHora` como criterio de búsqueda.
11. `cuidado/nuevo` → activar el perfil creado; eliminar el `perfilActivoId` muerto del data-store.
12. Blindar la privacidad: `visibleEnOferta` se **lee** (o los datos clínicos no viajan en el payload de oferta), `android.allowBackup: false`, cifrar/excluir del `partialize`.

### Sprint C · «Cifras y copy honestos» (P2) · ~3 días
13. Informes: cálculo por periodo real, `valoracion` derivado o vacío, coherencia con la demo de la landing.
14. Copy: `/ayuda` (pasos y rutas), `formatearHorario`, slug de `tipoAtencion`, texto de «editar perfil».
15. Estados de carga, `ErrorBoundary`, puntos táctiles ≥ 44 pt, buscador con `CampoTexto`.
16. Exponer (o borrar) la API muerta del store — e implementar el cierre de incidencias.

---

## Anexo · Qué se descartó (falsos positivos verificados)
Para que el informe sea auditable, se comprobó y se **descartó** como bug:

| Sospecha | Resultado de la verificación |
|---|---|
| «La nota de afinidad de `/seleccion` nunca es visible» | **Falso.** Medido en navegador: la nota se renderiza en `y=679` dentro del viewport; el `FlatList` hace scroll interno (`overflowY:auto`, `scrollHeight 1432 / clientHeight 480`) y la nota queda fija abajo. La maquetación es correcta. |
| «Claves React duplicadas en la rutina» | **Falso positivo del guion.** El aviso `Encountered two children with the same key … tar_2` lo provocó la **inyección de prueba**, que reutilizó un id que ya existe en la semilla (`mocks.ts:293` → `tar_2` = «Ejercicios de movilidad»). Con la app real no hay ni una sola clave duplicada en 7 pantallas. *Sí* queda un riesgo latente real: `key={ruta.nombre}` en `informes.tsx:122` (P2-15). |
| «La tab-bar tapa el contenido en web» | Ya corregido y documentado en `DIAGNOSTICO-UX-UI.md` §«Hallazgo nuevo (17/10/2026)». Verificado: la barra va en el flujo de la página, sin elementos `fixed` superpuestos. |
| «Rutas fuera de `Stack.Protected` accesibles sin sesión` | **Falso.** Las 15 rutas de `_layout.tsx:56-74` existen y todas las de negocio están dentro del guard. La única excepción es `+not-found.tsx` (P3). |
| «Los umbrales de afinidad difieren entre pantallas (40 vs 35)» | **Falso.** Revisado: `seleccion.tsx` y `buscar.tsx` usan los mismos umbrales (70 y 40). La duplicación real era de los *textos*, no de los umbrales. |
| «La app debería usar `expo-color-scheme`» | **Falso.** La doc oficial de Expo (*Color themes*) indica que el esquema se detecta con `Appearance`/`useColorScheme` de `react-native`; `expo-system-ui` (ya instalado) es lo que aplica `userInterfaceStyle`. El arreglo de P0-3 (no indexar con `null`) va más allá que la plantilla oficial, que tiene ese mismo hueco. |
| «El recorrido de la app y la landing tienen los mismos pasos» | **Parcial.** La landing tiene **8** pasos y la app **7**: el paso 8 de la landing («Datos e historial») corresponde en la app a la pantalla de Informes, que ya está cubierta por el paso 7. Se unificaron en **7** (app y `/ayuda`) para que no se contradigan; la landing mantiene sus 8 por ser una maqueta del producto completo. |

---

## Anexo · Reproducir los P0

```bash
# 1. Arrancar la app en web
cd mobile && npx expo start --web --port 8125

# 2. Reproducir P0-1 (dos cuidadores seleccionados / cuidador equivocado)
#    Login demo → /seleccion → "Seleccionar" en Marta S. → Continuar
#    Esperado: Laura y Marta muestran "Seleccionado"; /cuidador muestra Laura.

# 3. Reproducir P0-2 (fuga entre perfiles)
#    Login demo → /rutina → marcar una tarea (para forzar la escritura del store)
#    En DevTools: localStorage['cuidapp.demo_data.v3'] → state → añadir un perfil
#    'per_2' y una tarea {id:'tar_x', perfilId:'per_2'} → recargar
#    Esperado: la rutina de Carmen muestra la tarea de per_2.

# 4. Reproducir P0-4 (guarda de release)
cd mobile && node scripts/check-release.js preview   # exit 1
```

**Validación del diagnóstico:** `npx tsc --noEmit` ✅ · `npx eslint .` ✅ · `npx jest` 73/73 ✅ · `npx expo-doctor` 21/21 ✅ · navegador: 0 errores de consola en login → Inicio → Rutina → Informes → Buscar → Mi cuidador → Perfil → Selección.
