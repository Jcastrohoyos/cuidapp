# Diagnóstico · Manual operativo "Pilar 1 · La familia"

- **Fuente:** `Cuidapp_Manual_Operativo_Pilar_Familia.pdf` (versión de trabajo · octubre de 2026, 9 páginas).
- **Objetivo:** verificar que el Pilar 1 está completo, detectar lagunas y dejar constancia de la mejora aplicada al formulario de inscripción de la persona atendida.
- **Fecha del diagnóstico:** 17/10/2026 · **Última actualización:** 18/10/2026 (entrega §3-bis: banda de candidaturas, afinidad y texto grande).

---

## 1. Verificación de completitud del Pilar 1

**Veredicto: el documento está COMPLETO en estructura y cobertura** (propósito, actores, recorrido, fases, privacidad, MVP, entregables, principios y criterio de aceptación), con **6 lagunas puntuales** que se detallan más abajo. Ninguna invalida el documento; todas son completaribles sin rehacerlo.

### Matriz de verificación

| # | Elemento esperado | Estado | Evidencia en el documento |
|---|---|---|---|
| 1 | Propósito y principio rector | ✅ Completo | Portada + "Principio rector" |
| 2 | Visión del módulo y jerarquía de actores | ✅ Completo | §1 (Familia · Persona atendida · Cuidador · Proveedores) |
| 3 | Recorrido operativo de principio a fin (8 pasos) | ✅ Completo | §2 (01 Cuenta → 08 Datos e historial) |
| 4 | Fases funcionales 1–4 (registro, perfil, publicación, selección) | ✅ Completo | §3, con "Resultado esperado" por fase |
| 5 | Fases funcionales 5–6 (servicios, rutinas y seguimiento) | ✅ Completo | §4 |
| 6 | Fases 7–8 (información/informes, datos/historial) | ⚠️ Parcial | El **contenido** está en §5, pero sin bloque numerado "07/08" como las demás fases |
| 7 | Tipos de información y utilidad potencial | ✅ Completo | §5 (tabla área · ejemplos · utilidad) |
| 8 | Arquitectura funcional, privacidad y seguridad | ✅ Completo | §6 (8 entidades + 6 principios mínimos) |
| 9 | Prioridades MVP + decisiones pendientes | ✅ Completo | §7 (4 prioridades + 7 decisiones por validar) |
| 10 | Entregables de diseño/desarrollo + criterio de aceptación | ✅ Completo | §8 (7 entregables + criterio medible) |
| 11 | Principios rectores del producto | ✅ Completo | §9 (7 principios + visión final) |
| 12 | Nota de alcance (propuesta ≠ implementado) | ✅ Presente | Pie del documento |

### Coherencia interna

| Relación | Estado | Observación |
|---|---|---|
| Actores (§1) ↔ Entidades funcionales (§6) | ✅ | Los 4 actores tienen su entidad (cuenta, perfil, oferta/candidatura, proveedor) |
| Recorrido 8 pasos (§2) ↔ Fases numeradas (§3–§5) | ⚠️ | Las fases 7 y 8 no tienen bloque propio (§5 las absorbe) |
| Prioridades MVP (§7) ↔ Entregables (§8) | ✅ | Los entregables cubren las 4 prioridades |
| Privacidad (§6) ↔ principio "Datos con finalidad" (§9) | ✅ | Consistente con el invariante implementado `visibleEnOferta: false` |
| Estados del proceso (§8) ↔ producto actual | ⚠️ | El manual define 7 estados; la app implementa 4 (`borrador`, `publicado`, `en_seleccion`, `con_cuidador`) — brecha de producto, no de documento |

### Lagunas detectadas (y recomendación)

1. **Fases 07 y 08 sin bloque numerado.** Recomendación: añadir en §3/§4 (o una §5.1) los bloques "7. Información e informes" y "8. Datos e historial" con su "Resultado esperado", para que las 8 fases del recorrido tengan todas ficha propia.
2. **Sin especificación del alta de la persona atendida.** El manual dice "describir de forma estructurada" pero no lista campos obligatorios/opcionales (edad, movilidad, autonomía, salud, convivencia…), y §7 deja abierto "qué datos son obligatorios para publicar". **Resuelto parcialmente con esta entrega:** el formulario profesional de `mobile/src/app/cuidado/nuevo.tsx` (ver §3 de este diagnóstico) funciona como propuesta de campos mínimos; conviene anexarlo al manual como ficha de referencia.
3. **Comunicación familia ↔ cuidador.** Aparece solo como decisión pendiente ("cómo se contactan las partes") sin sección de propuesta (mensajería, llamada, estados de contacto).
4. **Notificaciones.** La fase 3 menciona "la familia recibe notificaciones", pero no hay sección de configuración (canal, frecuencia, silencios).
5. **Accesibilidad y soporte.** §9 cita "comprensible, accesible", pero falta un checklist de accesibilidad (contraste, lectores de pantalla, texto grande — relevante dada la persona mayor) y un canal de ayuda. **Resuelto parcialmente:** la app implementa **texto grande conmutable** (Ajustes → Accesibilidad, persistente) y paleta con contraste alto (ver §3-bis); queda el canal de ayuda y la revisión con lector de pantalla.
6. **Métricas de validación del MVP.** Hay criterio de aceptación, pero no KPIs (p. ej. % de familias que completan el alta, tiempo hasta primera candidatura, tasa de selección).

---

## 2. Brecha entre el manual y el producto actual

| Fase (manual) | Estado en el producto | Nota |
|---|---|---|
| 01 · Cuenta familiar | ✅ Implementada | Registro, login, plan, `Familia` completa (contacto, miembros, emergencia, preferencias) persistente |
| 02 · Perfil de cuidado | ✅ Implementada | **Con el nuevo formulario profesional** (ver §3); estados `borrador/publicado/en_seleccion/con_cuidador` |
| 03 · Publicación y candidaturas | ✅ Demo funcional | Flujo local: publicar deja la oferta **"En selección"** y **llegan 2 candidaturas simuladas** a la bandeja (`Candidaturas · n`) |
| 04 · Comparación y selección | ✅ Demo funcional | Selección con comparables, confirmación y **badge de Afinidad %** por candidatura (ver §3-bis) |
| 05 · Servicios complementarios | ✅ Demo funcional | Catálogo modular (gestorías, especialistas, formación) |
| 06 · Rutinas y seguimiento | ✅ Implementada | Checklist diario con responsable, incidencias e historial |
| 07 · Información e informes | ✅ Básico | Resumen, historial y datos de ejemplo |
| 08 · Datos e historial | ✅ Básico | Hábitos, actividad y mediciones de ejemplo |
| Estados del proceso (§8) | ⚠️ 4 vs 7 | Faltan: cuidado activo/finalizado, historial de servicios (roadmap) |

---

## 3. Mejora aplicada · Formulario de inscripción de la persona atendida

**Archivo principal:** `mobile/src/app/cuidado/nuevo.tsx` (ruta `/cuidado/nuevo`).

### Antes vs. ahora

| | Antes | Ahora |
|---|---|---|
| Secciones | 4 (persona, tipo, ubicación, hábitos/competencias) | **8** |
| Campos de texto | 7 (sin edad ni salud) | **12** |
| Opciones tipo chips | 4 (solo tipo de atención) | **~64** (género, días, movilidad, autonomía, convivencia, vivienda, cognición, visión, oído, medicación, alimentación, descanso, competencias) |
| Días de atención | Fijos L–V (sin opción) | **7 días seleccionables** (multi) |
| Fecha de nacimiento | No se pedía → la ficha no mostraba la edad | **Obligatoria** `dd/mm/aaaa` con fecha real y rango 1900–hoy |
| Salud / privacidad | Un solo texto de hábitos | Sección sensible completa con nota de no-publicación |
| Validaciones | min. caracteres | + formato de fecha, horas `HH:MM`, fin > inicio, ≥1 día |

### Secciones del formulario nuevo

1. **Persona atendida** — nombre, fecha de nacimiento, relación, género.
2. **Tipo de atención** — domiciliaria / acompañamiento / temporal / residencia.
3. **Ubicación y disponibilidad** — ciudad, zona, **días** (7 chips), desde/hasta con orden validado.
4. **Movilidad, autonomía y convivencia** — movilidad (5), autonomía AVD (4), convivencia (3), vivienda (4).
5. **Salud y cuidados** — cognición (4), visión (3), oído (3), apoyo con la medicación (4), patologías y alergias (texto).
6. **Alimentación, descanso y hábitos** — dietas (6), descanso (4) + hábitos libres (se comas).
7. **Competencias necesarias en el cuidador** — catálogo (8) + otras por texto.
8. **Notas para la familia** — texto privado + recordatorio de privacidad.

### Modelo de datos ( `mobile/src/types/index.ts` )

- `PersonaAtendida.genero?: GeneroPersona` (nuevo tipo `GeneroPersona`).
- `DatosSensibles` ampliado: `autonomia`, `cognicion`, `vision`, `oido`, `medicacion`, `convivencia`, `vivienda`, `patologias`, `alergias` — todos opcionales y bajo el invariante `visibleEnOferta: false` (**los datos clínicos nunca se publican**, alineado con §6 del manual).
- Se reutilizan los huecos existentes: `fechaNacimiento`, `movilidad`, `notas`, `horario.dias`.

### Visualización ( `mobile/src/app/cuidado/[id].tsx` )

- Cabecera con **edad calculada** desde la fecha de nacimiento.
- Fila **Días** legible: `L · M · X · J · V · S` (antes solo "5 días / semana").
- Fila **Género** cuando se ha indicado.
- Nueva sección **"Salud y autonomía"** con candado: 9 filas de datos privados + descripcion, y respaldo al texto genérico para perfiles antiguos.

### Semilla demo ( `mobile/src/api/mocks.ts` )

- Carmen actualizada al nuevo registro completo (género, movilidad "Bastón o andador", autonomía, cognición, sentidos, medicación, convivencia, vivienda, patologías, alergias) manteniendo la paridad con la demo de la landing (incl. competencia "Memoria").

### Verificación

- `npx tsc --noEmit` ✅ · `npx expo lint` ✅ (sin avisos) · `npx jest` → **43/43** ✅.
- Navegador (localhost:8125): alta completa del formulario (12 campos + 15 chips) → guardado sin errores → lista muestra "Pilar G., 80 años · Borrador" → detalle con todas las secciones (edad, días `L · M · X · J · V · S`, horario 08:30–14:00, bloque "Salud y autonomía" con las 9 filas privadas, hábitos y competencias fusionados, notas) → **cero errores de consola**.
- Bug encontrado y corregido durante la verificación: la validación de fecha usaba grupos de captura inexistentes en el regex (`exec` sin paréntesis) → todas las fechas se rechazaban; corregido con `split()` y `onBlur` blindado con `getValues`.

---

## 3-bis. Entrega Pilar 1 · Banda de candidaturas, afinidad y texto grande

**Objeto:** las 3 funcionalidades prioritarias del Pilar 1 seleccionadas en la revisión de alcance (reply "123"), con su validación completa.

### ① Estado `en_seleccion` + bandeja de candidaturas

- **Nuevo valor de estado** `en_seleccion` en `EstadoPerfil` (`mobile/src/types/index.ts`).
- **Publicar** (`endpoints.publicarPerfil` → `store.publicarPerfil`): el perfil pasa `borrador → publicado → en_seleccion` y **recibe 2 candidaturas simuladas** (`store.recibirCandidaturas` con `mocks.candidaturasDeEjemplo(perfilId)`: clones de Laura/Marta, estado `nueva`, ids nuevos).
- **Bandeja en `/publicar`**: badge "En selección" + bloque **"Candidaturas · n"** con iniciales, experiencia, antigüedad y estado de cada candidatura + CTA "Comparar y seleccionar cuidador".
- **Detalle `/cuidado/[id]`**: para `en_seleccion`, par de CTAs "Ver y comparar candidaturas" / "Ver oferta y candidaturas".
- **Badge centralizado** `badgeEstadoPerfil` (`Record` exhaustivo en `badge.tsx`) usado por home, lista y detalle — `en_seleccion` en tono *warning*. `publicar.tsx` muestra "En selección".
- Recorrido de ejemplo (`use-recorrido` paso 03) incluye `en_seleccion`; toasts condicionales a modo demo: "Oferta publicada: 2 cuidadores han enviado candidatura."

### ② Afinidad % en la selección

- `Cuidador.competencias?: string[]` + **`calcularAfinidad`** (`mobile/src/utils/afinidad.ts`): `round(coinciden / requeridas × 100)`, insensible a acentos/mayúsculas (normalizador por `charCodeAt`, sin dependencias), **`null`** si el perfil no pide competencias (no se inventan porcentajes).
- Badge en la tarjeta de `/seleccion` (slot derecho): "Seleccionado" si ya es la elegida; si no, `Afinidad n%` en tono success (≥70) / primary (≥40) / neutral.
- Semillas: Carmen pide 4 competencias → **Marta 50 %, Carlos 25 %**; Laura ya seleccionada.
- Nota de la pantalla reescrita para no contradecir el principio "no inventamos porcentajes".

### ③ Texto grande (accesibilidad)

- **`Text` wrapper** (`mobile/src/components/text.tsx`) multiplica `fontSize`/`lineHeight` ×**1,3** (`FACTOR_TEXTO_GRANDE`) según `TextoGrandeContexto` (default `false` → inocuo fuera del provider y en jest).
- Contexto + persistencia (**AsyncStorage `cuidapp.ajustes.v1`**) en `AppProviders`: se restaura en frío (tras recargar, incluso en la pantalla de login).
- `CampoTexto` escala su `input` por separado (`FACTOR_TEXTO_GRANDE`, un `TextInput` no pasa por el `Text` wrapper).
- Interruptor **Accesibilidad → Texto grande** en la pestaña Perfil.
- **Limitación documentada:** las etiquetas de la tab-bar y los glifos de iconos vectoriales no escalan (los controla la librería).

### Bug real encontrado y corregido · `Alert.alert` no-op en web

- **react-native-web** deja `Alert.alert` como **no-op**: los 5 diálogos de confirmación (publicar oferta, eliminar perfil/cuidado, cerrar sesión, quitar miembro) **no aparecían en web** y la acción se ejecutaba sin confirmar o quedaba huérfana.
- Solución: **`mobile/src/utils/confirmar.ts`** → `window.confirm` en web, `Alert.alert` en nativo (con variante `destructiva`). Reemplazados los 5 call sites y eliminados los imports de `Alert`.

### Otros arreglos durante la implementación

- **Id huérfano al crear perfil:** `endpoints.crearPerfil` no pasaba el `id` nuevo al store → la ficha creada no coincidía con la ruta; añadido tipo `NuevoPerfil` con `id` opcional.
- `usePublicarPerfil` también invalida `qk.candidatosTodos` (clave nueva) para refrescar la lista de perfiles.

### Arreglos de sesión (sprint 2)

- **La sesión no se restauraba tras recargar en web (bug real):** `SecureStore` no existe en web (doc SDK 57: solo android/iOS/tvOS), así que `tokenStorage` usaba un `Map` en memoria y cada recarga perdía el token → login obligatorio. La rama web ahora usa **AsyncStorage (localStorage)**; nativo sigue en SecureStore. Flujo validado: login → token en `localStorage` → recarga → "Hola, Ana" sin formulario; logout → token `null`; re-login correcto.
- **Destello de login y pérdida de ruta profunda:** mientras `estado === 'cargando'` el guard pintaba el formulario de login un instante y el router redirigía `/perfil` → `/`. Ahora el `Stack` no se monta hasta salir de `cargando`: contenedor neutro y **la URL original se conserva** (recarga en `/perfil` → se queda en `/perfil`).

### Archivos tocados

`types/index.ts` · `utils/afinidad.ts` (+ `afinidad.test.ts`) · `utils/confirmar.ts` · `components/text.tsx` (codemod de imports en **25 ficheros**, script en `mobile/scripts/codemod-text-grande.js`) · `components/ui/badge.tsx` · `components/ui/field.tsx` · `providers/app-providers.tsx` · `store/data-store.ts` · `api/mocks.ts` · `api/endpoints.ts` · `app/seleccion.tsx` · `app/publicar.tsx` · `app/cuidado/[id].tsx` · `app/(tabs)/perfil.tsx` · `hooks/use-recorrido`.

### Verificación

- `npx tsc --noEmit` ✅ · `npx expo lint` ✅ · `npx jest` → **48/48** (4 suites: +5 tests de `calcularAfinidad`) ✅.
- Navegador (localhost:8125), **cero errores y cero avisos de consola**:
  - **Carmen → `/seleccion`:** `Afinidad 50%` (Marta), `Afinidad 25%` (Carlos), Laura "Seleccionado", nota nueva visible.
  - **Alta de Elena V.** (12 campos + chips) → lista "Borrador" → publicar con confirmación → `/publicar` muestra **badge "En selección"**, **"Candidaturas · 2"** (Laura/Marta, estado "Nueva", "hace menos de un minuto") → "Comparar y seleccionar" → `/seleccion` con **`Afinidad 100% / 100%`** (coherente: Elena pide 1 competencia).
  - **Texto grande ON:** "Hola/Accesibilidad" 28→**36,4 px**, 18→**23,4 px**, botones 16→**20,8 px** (= ×1,3 exacto); persiste en `localStorage` y **se restaura tras recargar**; OFF vuelve a 18/16 px base.
  - Chips de competencias: verificado con el campo "Otras competencias" (los chips `Pressable` de RNW pierden el nodo al re-renderizar en el automatizado — el producto responde bien al toque real).

---

1. Numerar las fases **07 · Información e informes** y **08 · Datos e historial** con su "Resultado esperado".
2. Anexar la **ficha de campos mínimos del alta de la persona atendida** (obligatorios vs. opcionales) basada en el formulario implementado — cierra la decisión pendiente de §7 sobre datos obligatorios.
3. Añadir secciones cortas de **mensajería/notificaciones** (aunque sea como propuesta) y de **accesibilidad + soporte**.
4. Incluir **KPIs de validación** junto al criterio de aceptación del §8.
5. Marcar en §8 qué estados del proceso son MVP y cuáles fase posterior (hoy el producto cubre 4 de 7, con la nueva fase "en selección" + bandeja de candidaturas).
