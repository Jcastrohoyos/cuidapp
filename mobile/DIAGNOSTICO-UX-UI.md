# Diagnóstico UX/UI — Cuidapp (app móvil)

**Alcance:** `mobile/src/` (Expo Router · React Native 0.86 · Expo SDK 57)
**Fecha:** 16/10/2026
**Método:** revisión estática de código (pantallas, componentes, tokens, navegación y estado), verificación de contrastes WCAG 2.1 calculados sobre los hex reales del tema, y evaluación contra guías platform (Apple HIG, Material Design 3) y criterios WCAG 2.1 AA.

---

## 1. Resumen ejecutivo

Cuidapp parte de una base **sólida y por encima de la media**: design tokens completos con modo oscuro real, un set de componentes coherente (`Card`, `Button`, `Chip`, `Badge`, `CampoTexto`, `EmptyState`), copy cercano en español, actualización optimista con rollback en la rutina y foco visible en privacidad ("datos sensibles"). No es una app improvisada: se nota una intención de design system.

El problema no es la estética, es la **resiliencia y los estados faltantes**: la app asume que siempre hay red, datos y éxito. Cuando algo falla, el usuario ve un spinner infinito o un mensaje engañoso; cuando algo funciona, no hay confirmación. A eso se suman 3 fallos de accesibilidad (contraste del CTA principal, targets táctiles pequeños) y una navegación sin barra superior visible.

### Scorecard

| Dimensión | Nota | Comentario |
|---|---|---|
| Design system y coherencia visual | **7.5/10** | Tokens buenos y usados, pero con fugas (hex hardcodeados, títulos sobreescritos) |
| Modo oscuro | **8.5/10** | Paleta dark completa y contrastada (6.9–17:1); solo falta el `StatusBar` |
| Accesibilidad (WCAG AA) | **5/10** | CTA principal 3.74:1, badges hasta 2.90:1, targets < 44pt |
| Estados de la interfaz (carga/error/éxito/vacío) | **3/10** | Carga ✅ · vacío inconsistente · **error inexistente** · éxito sin feedback |
| Navegación y arquitectura de información | **5.5/10** | Tabs nativas bien, pero sin back header y "Pasos 03,04,05,07" sin contexto |
| Formularios y entrada de datos | **5.5/10** | Zod + `onBlur` bien; sin autofill, sin recuperar contraseña, error mal ubicado |
| Microcopy y contenido | **7/10** | Tono adecuado; algún typo y textos largos en notas al pie |
| Rendimiento percibido | **5.5/10** | Sin skeletons (token existe y no se usa), listas sin virtualizar, sin pull-to-refresh |

**Veredicto:** lista para demostración, **no lista para producción** sin resolver los 4 hallazgos P0.

---

## 2. Fortalezas (conservar)

1. **Design tokens completos** (`src/constants/theme.ts`): paleta light + dark, `Spacing`, `Radius`, `FontSize`, `MaxContentWidth` (800 para tablets). Los componentes los consumen vía `useTheme()`.
2. **Componentes reutilizables con buenos cimientos:** `Button` (4 variantes, estados `disabled`/`cargando`, `accessibilityState`), `ProgressBar` (`accessibilityRole="progressbar"` + `accessibilityValue`), `TareaItem` (`accessibilityRole="checkbox"` + `checked`), `CampoTexto` (label + error asociado visualmente).
3. **Modo oscuro real y bien resuelto:** todos los pares dark verificados superan holgadamente AA (6.97:1 texto secundario, 8.95:1 enlaces, 8–9:1 badges).
4. **Optimista con rollback** en la rutina (`use-rutina.ts:44-57`): el usuario ve el check al instante y hay revert si falla. Es el patrón correcto.
5. **Confianza y transparencia:** la nota de `seleccion.tsx` explicando que *no* se muestran porcentajes de afinidad ficticios, y la sección de visibilidad de la oferta pública (`publicar.tsx:60-68`), son excelentes para un producto sanitario/familiar.
6. **Copy humano y contextual** en cargas ("Preparando tu espacio familiar…") y confirmación destructiva de logout (`perfil.tsx:24`).
7. **Validación de formularios** con Zod + `mode: 'onBlur'` y errores inline en `cuidado/nuevo` y `registro`.
8. **Safe area + ancho máximo centrado** en `Screen`: correcto en tablets y con Home Indicator.

---

## 3. Hallazgos priorizados

**Severidad:** P0 bloqueante · P1 alta · P2 media · P3 baja.

### Índice

| ID | Sev. | Hallazgo | Archivo |
|---|---|---|---|
| H1 | P0 | Error de red → spinner infinito o mensaje falso | `rutina.tsx:23`, `publicar.tsx:23`, `seleccion.tsx:110`, `informes.tsx:24` |
| H2 | P0 | Mutaciones sin feedback de éxito/error | `use-perfiles.ts`, `nuevo.tsx:79`, `servicios.tsx:76` |
| H3 | P0 | CTA principal incumple AA (3.74:1) | `theme.ts:16`, `button.tsx:42` |
| H4 | P0 | Pantallas apiladas y modales sin back/cierre visible | `_layout.tsx:30,42-43` |
| H5 | P1 | Login sin recuperación de contraseña ni mostrar/ocultar | `login.tsx` |
| H6 | P1 | Registro descarta la contraseña del usuario | `registro.tsx:43`, `endpoints.ts:47` |
| H7 | P1 | Sin `KeyboardAvoidingView` en formularios centrados | `login.tsx:90`, `registro.tsx:97` |
| H8 | P1 | Targets táctiles < 44pt (chips 26px, botones `sm` 36px) | `chip.tsx:49-55`, `button.tsx:87-90` |
| H9 | P1 | Badges de estado por debajo de AA (2.90–3.12:1) | `badge.tsx`, `theme.ts` |
| H10 | P1 | Sin `StatusBar` gestionada (contrast en dark mode) | app en general |
| H11 | P1 | Sin pull-to-refresh en ninguna pantalla | `screen.tsx` |
| H12 | P1 | CTA muerta: "Ver planes" no hace nada | `perfil.tsx:109` |
| H13 | P2 | Estados vacíos inconsistentes (componente vs texto suelto) | `perfil.tsx:97`, `informes.tsx:102`, `seleccion.tsx:143` |
| H14 | P2 | Iconografía con emoji en producción | `servicios.tsx:14-19`, `cuidado/[id].tsx:107` |
| H15 | P2 | Colores hardcodeados fuera de tokens (uno falla contraste) | `index.tsx:174`, `themed-text.tsx:66` |
| H16 | P2 | Token de título "muerto" (48px) y pesos inconsistentes | `themed-text.tsx:49-53` |
| H17 | P2 | Recorrido "Paso 03, 04, 05, 07" sin 01/02/06 ni progreso | `index.tsx:99-121` |
| H18 | P2 | Anchos fijos y fila de 3 stats con riesgo de desborde | `informes.tsx:152-160`, `stat.tsx:32` |
| H19 | P2 | Sin skeletons, sin virtualización de listas | `loading.tsx`, `rutina.tsx:51` |
| H20 | P2 | Acciones de alta consecuencia sin confirmación/deshacer | `seleccion.tsx:92-98` |
| H21 | P2 | Accesibilidad semántica incompleta (headers, hints, doble lectura) | global |
| H22 | P3 | Sin haptics ni micro-animación al completar tareas | `task-item.tsx` |
| H23 | P3 | Duplicación de estilos/mapeos de estado de perfil | `index.tsx`, `perfil.tsx`, `cuidado/[id].tsx` |
| H24 | P3 | Typo y detalles de formato/copy | `servicios.tsx:88`, `rutina.tsx:18` |

---

### P0 — Bloqueantes

#### H1 · Un error de red se muestra como carga infinita (o como "no hay perfiles")
**Evidencia:** 6 pantallas hacen `if (isLoading || !perfil) return <Loading …/>`. Si la query falla, `isLoading` pasa a `false` y `data` queda `undefined` → `!perfil` es siempre `true` → **el spinner nunca desaparece**:
- `rutina.tsx:23`, `publicar.tsx:23`, `seleccion.tsx:110`, `informes.tsx:24`, `cuidado/[id].tsx:31`
- `servicios.tsx:32` falla distinto: sin datos, desaparecen todas las categorías y solo queda la nota al pie (pantalla "vacía" sin explicación).
- `index.tsx:29-40` muestra *"Aún no hay perfiles de cuidado"* — **mensaje falso** si en realidad falló la petición.
- `use-rutina.ts:82` expone `esError` y `refetch`, pero **ninguna pantalla los consume** (verificado por grep).

**Impacto:** el usuario queda bloqueado sin saber qué pasó ni cómo reintentar. En un producto de cuidado, esto es pérdida total de confianza.
**Recomendación:**
1. Crear `components/ui/error-state.tsx` (equivalente a `EmptyState`: título, descripción, botón "Reintentar") usando `theme.danger`/`warning`.
2. En cada pantalla: `if (cargando) …; if (esError) return <ErrorState onPress={refetch} />`.
3. Distinguir *vacío* (0 elementos, dato legítimo) de *error* (no se pudo obtener el dato).

#### H2 · Las acciones importantes no confirman ni informan del fallo
**Evidencia:** `usePublicarPerfil`, `useCrearPerfil`, `useSeleccionarCandidato`, `useContratarServicio` no tienen `onError` ni toast; `nuevo.tsx:79` hace `await crear.mutateAsync()` sin `try/catch` (rechazo no manejado y formulario "congelado" sin mensaje).
**Impacto:** el usuario pulsa *"Publicar oferta"*, no ve nada → piensa que no funcionó y repite la acción (o se va creyendo que sí funcionó).
**Recomendación:** patrón único de feedback — `Toast`/banner inline + `Haptics.notificationAsync` en éxito; en error, mensaje persistente con reintento. Al menos: `onError` global en el `QueryClient` (`query-client.ts`) y feedback visual por mutación.

#### H3 · El CTA principal incumple WCAG AA (contraste medido)
**Medido sobre los hex del tema:**

| Par | Ratio | Requisito | Estado |
|---|---|---|---|
| Texto blanco / teal `#0D9488` (botón primario, 16px bold) | **3.74:1** | 4.5:1 | ❌ |
| Enlace teal `#0D9488` sobre `#FFFFFF` (14px) | **3.74:1** | 4.5:1 | ❌ |
| Enlace teal sobre fondo app `#F8FAFA` | **3.57:1** | 4.5:1 | ❌ |
| Botón secundario teal sobre `#F0FDFA` | **3.59:1** | 4.5:1 | ❌ |

**Impacto:** todos los botones primarios, los enlaces "Crear cuenta familiar", "Volver a inicio" y las acciones de `SectionHeader` fallan AA para texto normal. Afecta especialmente a la audiencia de la app (familias con personas mayores, posibles problemas visuales).
**Recomendación (verificada):** oscurecer el teal en light — `#0F766E` (teal-700) como `primary` da **5.47:1** con texto blanco y **4.56:1** como badge sobre `#CCF2EC`, manteniendo la identidad y pasando AA. Alternativa: conservar `#0D9488` como color de acento decorativo (iconos, bordes) y usar el teal-700 solo para rellenos con texto. Añadir el script de contraste al CI para que los tokens no regresen.

#### H4 · Navegación sin affordance visible de "atrás"/cerrar
**Evidencia:** `headerShown: false` global (`_layout.tsx:30`) y **ninguna pantalla** dibuja su propia barra:
- `cuidado/nuevo` y `publicar` se presentan como **modal** (`_layout.tsx:42-43`) sin botón de cierre: en iOS solo el swipe-down, en Android solo el botón físico — y `predictiveBackGestureEnabled: false` (`app.json:26`).
- `seleccion.tsx` y `servicios.tsx` **no tienen ninguna salida visible** (ni back ni "volver"): callejón sin salida para quien no conoce los gestos.
- `cuidado/[id].tsx:135` solo ofrece "Volver a inicio" al final del scroll.

**Impacto:** fallo de usabilidad básica; usuarios mayores o poco expertos en gestos se atascan.
**Recomendación:** componente `ScreenHeader` (título + botón atrás/cerrar, `hitSlop`, 44pt) reutilizable en todas las pantallas apiladas y modales; o `Stack.Screen` con `headerShown: true` y header tematizado para rutas apiladas. Activar `predictiveBackGestureEnabled`.

---

### P1 — Alta prioridad

#### H5 · Login incompleto respecto a la expectativa estándar
- Sin **"¿Olvidaste tu contraseña?"** (ninguna ruta de recuperación existe).
- Sin **mostrar/ocultar contraseña** (ojo en el campo `secure`).
- Sin `autoComplete="email"` / `textContentType="username"` ni `autoCapitalize="none"` → el teclado capitaliza el correo y no hay autofill de gestor de contraseñas.
- El error de validación se muestra **siempre bajo "Contraseña"** (`login.tsx:66` pasa `error` a ese campo), aunque el problema sea el correo → lectura errónea del fallo.

#### H6 · El registro descarta la contraseña
`registro.tsx:43` llama a `endpoints.registrar({ nombre, email })`; `endpoints.ts:47` solo acepta esos dos campos. El usuario invierte esfuerzo creando una contraseña de 8+ caracteres que **no se envía ni se guarda**. En backend real, la cuenta quedaría sin contraseña. Inconsistencia grave de confianza/seguridad percibida.

#### H7 · El teclado puede tapar el CTA en los formularios
`login` y `registro` usan `justifyContent: 'center'` sobre un `ScrollView` sin `KeyboardAvoidingView` (no aparece en todo `src/`). En iPhone con Home button y en Android con teclado ajustado al contenido, el botón "Entrar"/"Crear cuenta" queda bajo el teclado.
**Recomendación:** envolver formularios en `KeyboardAvoidingView` (`behavior="padding"` iOS / `height` Android) o pasar `contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}` con `keyboardVerticalOffset`.

#### H8 · Targets táctiles por debajo del mínimo
| Elemento | Altura aprox. | Mínimo recomendado |
|---|---|---|
| `Chip` interactivo (tipo de atención, filtros) | ~26px (`paddingVertical: 6` + 12px) | 44pt (HIG) / 48dp (M3) |
| `Button` tamaño `sm` | 36px | 44pt |
| Acción de `SectionHeader` ("+ Nuevo") | texto 14px + `hitSlop: 8` | 44pt efectivos |

Los chips selectivos de `cuidado/nuevo.tsx:130-139` son la principal víctima: son la única forma de elegir tipo de atención.
**Recomendación:** chips interactivos con `minHeight: 40` + `hitSlop`; `sm` a 40–44 manteniendo `hitSlop={8}`.

#### H9 · Badges de estado con contraste insuficiente (medido)

| Badge | Ratio | Estado |
|---|---|---|
| Warning `#D97706` / `#FDF3E3` | **2.90:1** | ❌ falla hasta el 3:1 de texto grande (12px bold) |
| Success `#16A34A` / `#EAF8EF` | **3.01:1** | ❌ |
| Primary `#0D9488` / `#CCF2EC` | **3.12:1** | ❌ |
| Neutral `#5B6B6A` / `#E6F2F1` | 4.88:1 | ✅ |

Los badges transmiten estados críticos ("Abierta", "Resuelta", "Con cuidador") a 12px. **Combinación obligatoria:** estado crítico no puede depender solo de color (ver H21).
**Recomendación (verificada):** oscurecer el texto de cada tono — `warning` → `#92400E` da **6.45:1** sobre `#FDF3E3`; `success` → `#15803D` da **4.58:1** sobre `#EAF8EF`. Ambos pasan AA sin tocar el fondo.

#### H10 · Sin `StatusBar` gestionada
No hay `<StatusBar style="auto"/>` de `expo-status-bar` (instalado, sin usar) en `_layout.tsx`. `ThemeProvider` de Expo Router no aplica la barra de estado. Riesgo concreto: en modo oscuro, iconos oscuros sobre fondo `#0B1211` (ilegibles) y al revés según SO.

#### H11 · Sin pull-to-refresh
`Screen` (`screen.tsx`) no expone `RefreshControl` y ningún `ScrollView`/`FlatList` lo usa. En *Informes* y *Rutina*, pantallas donde los datos cambian con la acción de un cuidador en otro dispositivo, no hay forma de actualizar sin matar y reabrir la app.

#### H12 · CTA muerta
`perfil.tsx:109`: `<Button titulo="Ver planes" … onPress={() => {}} />`. Un botón que no hace nada es un error funcional visible; el usuario pulsa repetidamente y asume bug.

---

### P2 — Media prioridad

#### H13 · Estados vacíos inconsistentes
Se usan tres patrones distintos para lo mismo:
- `EmptyState` (bien diseñado): `index.tsx`, `rutina.tsx`, `publicar.tsx`.
- `ThemedText` suelto: `perfil.tsx:97`, `informes.tsx:102-104`, `cuidado/[id].tsx:82`.
- Texto centrado improvisado: `seleccion.tsx:142-146`.

**Recomendación:** obligar `EmptyState` en todos (con ilustración/icono y acción secundaria cuando aplique).

#### H14 · Emoji como iconografía de producto
`servicios.tsx:14-19` (🏛️🩺⚕️🎓) y `cuidado/[id].tsx:107` (🔒). Problemas: render distinto por SO/versión, lectura ruidosa por VoiceOver/TalkBack ("edificio de oficinas, signo médico"), y tamaños ópticos desiguales. La app ya tiene `expo-symbols` e `@expo/ui` en dependencias, y las tabs usan SF Symbols/MD — la app *sí* tiene sistema de iconos, solo no se usa aquí.
**Recomendación:** `SymbolView` (iOS) + `MaterialIcons` (Android), o set vectorial único.

#### H15 · Colores fuera de tokens
- `index.tsx:174` chevron `#94A3A1` → **2.62:1** sobre tarjeta blanca (no llega al 3:1 de elemento gráfico) y no responde al dark mode.
- `themed-text.tsx:66` `linkPrimary: '#3c87f7'` → azul fuera de marca, no tematizado.

#### H16 · Sistema tipográfico con tokens muertos
`ThemedText type="title"` define **48px/52** (`themed-text.tsx:49-53`), pero las 6 pantallas que lo usan lo sobreescriben a 28 (`fontSize: FontSize['2xl']` o literal `fontSize: 28`). Además `servicios.tsx:98` usa `fontWeight: 800` mientras el resto queda en 600 → títulos de pantalla con pesos distintos según la ruta.
**Recomendación:** nuevo tipo `screenTitle` (28/34, 800) en `ThemedText`, eliminar los overrides y sustituir los literales `28` por `FontSize['2xl']`.

#### H17 · Arquitectura de información del "recorrido"
`index.tsx:99-121` presenta "Continuar el recorrido" con **Pasos 03, 04, 05 y 07**. Faltan 01, 02 y 06, no hay indicador de progreso ni explicación del modelo de 7 pasos. El usuario no sabe qué pasó antes ni qué viene después.
**Recomendación:** stepper horizontal con los pasos completos y estado (hecho/actual/pendiente), o eliminar la numeración y usar agrupaciones por objetivo ("Encontrar cuidador", "Seguimiento", "Extras").

#### H18 · Layout frágil en Informes
- `informes.tsx:152-160`: columnas con `width: 84` y `width: 40` fijos → tareas con nombre largo rompen la fila o se recortan sin elipsis.
- Fila de 3 `Stat` con `minWidth: 96` + gaps: en pantallas < 360dp (320dp) el contenido (3×96 + 2×8 = 304px + padding 32 = 336px) **desborda** el viewport.
- `Stat` recorta etiquetas a 2 líneas → "valoración del servicio" puede cortarse.

#### H19 · Rendimiento percibido
- **Skeletons no usados:** el token `skeleton` existe en `theme.ts:31,54` pero `Loading` siempre es un spinner a pantalla completa → cada navegación "parpadea" en blanco. Los datos demo tardan 220ms (`endpoints.ts:25`) y aun así se ve carga completa.
- **Listas sin virtualizar:** `rutina.tsx:51`, `index.tsx`, `informes.tsx:87`, `servicios.tsx` usan `.map()` dentro de `ScrollView`. Con muchas tareas/servicios se pierde virtualización (hoy tolerable, pero debe migrarse a `FlatList`/`SectionList` en `Screen scroll={false}`).
- `informes.tsx` carga `limite: 20` y pinta 5 → desperdicio menor.

#### H20 · Acciones de alta consecuencia sin confirmación
"Seleccionar" un cuidador (`seleccion.tsx:92-98`) cambia el estado del perfil a `con_cuidador` con un toque y **sin diálogo de confirmación ni deshacer**. Comparar con el logout, que sí confirma. Regla: confirmar lo irreversible (asignar cuidador, publicar oferta), no lo reversible (marcar tarea).

#### H21 · Semántica de accesibilidad incompleta
- Títulos de pantalla son `Text`/`ThemedText` sin `accessibilityRole="header"` → lectores no pueden navegar por encabezados.
- `Avatar` (`avatar.tsx:19`) expone `accessibilityLabel={nombre}` justo al lado del `ThemedText` con el mismo nombre → **lectura doble** en cada tarjeta.
- `TareaItem` anuncia `checked` pero no el estado "incidencia" (solo un punto rojo visual + texto en `meta`).
- `Severidad por color solo` en badges y puntos (ver H9): añadir icono/texto alternativo (ya parcialmente hecho con "✓ Verificado").
- Sin `accessibilityHint` en acciones cuyo efecto no es obvio ("Ver oferta y candidaturas").

---

### P3 — Bajo (pulido)

- **H22** · Sin haptics ni animación al completar una tarea (`task-item.tsx`): en una app de checklist diario, el "gancho" táctil (`Haptics.impactAsync`) y una micro-animación del check elevan mucho la satisfacción. `react-native-reanimated` ya está instalado.
- **H23** · Duplicación: `flex: { flex: 1, gap: 2 }` está repetido en ~8 hojas de estilo; el mapeo `estado → texto/tono del Badge` (Con cuidador/Publicado/Borrador) se repite en `index.tsx:67-70`, `perfil.tsx:78-93` y `cuidado/[id].tsx:49-64` → extraer `PerfilBadge` y `styles.flex` compartido.
- **H24** · Copy/formato: typo **"gesoría"** → "gestoría" (`servicios.tsx:88`); `rutina.tsx:18` con la firma de la función y la primera línea en el mismo sitio (rompe `prettier`); notas al pie de 2–3 líneas en texto secundario 12px (difícil lectura para la audiencia objetivo — subir a 14px/20 de interlínea).
- Tipografía 100% system-ui; `Fonts.rounded` definido y sin usar → oportunidad de personalidad de marca (ej. `ui-rounded` en títulos).

---

## 4. Recomendación de plan de acción

### Sprint 1 — "No romper al usuario" (P0) · ~1 semana
1. `ErrorState` + `esError`/`refetch` en las 6 pantallas (H1).
2. Feedback de éxito/error en mutaciones + `onError` global en `QueryClient` (H2).
3. Ajuste de `primary` a ≥4.5:1 y script de contraste en CI (H3).
4. `ScreenHeader` con atrás/cerrar en apiladas y modales; activar predictive back (H4).

### Sprint 2 — "Formularios y confianza" (P1) · ~1 semana
5. Login: recuperación de contraseña, toggle de visibilidad, autofill, error en su campo (H5).
6. Enviar contraseña en `registrar` (H6) · `KeyboardAvoidingView` (H7).
7. Targets ≥44pt en chips y `Button sm` (H8) · oscurecer textos de badges (H9).
8. `<StatusBar style="auto"/>` (H10) · `RefreshControl` (H11) · eliminar CTA muerta (H12).

### Sprint 3 — "Sistema y percepción" (P2–P3) · ~1–2 semanas
9. Unificar `EmptyState` (H13) y `screenTitle` (H16).
10. Iconos vectoriales en vez de emoji (H14) y tokens para los hex sueltos (H15).
11. Stepper del recorrido (H17) · layout Informes responsivo (H18).
12. Skeletons + `FlatList` en listas (H19) · confirmación de selección de cuidador (H20) · headers/hints/doble lectura (H21) · haptics (H22) · duplicación y typos (H23–H24).

---

## 5. Cómo validar (métricas y pruebas)

- **Automatizado:** test de contraste de tokens (Jest ya está configurado), `npx expo lint` + `npx tsc --noEmit` en CI, y test de Render de `ErrorState`/`EmptyState`.
- **Accesibilidad:** prueba con TalkBack (Android) y VoiceOver (iOS) sobre: login, rutina (marcar tarea) y selección de cuidador. Verificar que ninguna pantalla se quede en silencio tras un error.
- **Usabilidad:** test con 5 usuarios de la audiencia real (hijos de personas dependientes, 40–65 años) enfocado en: (1) publicar oferta, (2) marcar 5 tareas, (3) volver atrás desde un modal. Métricas objetivo: tareas completadas sin ayuda ≥ 80%, tiempo en publicar oferta < 2 min.
- **Instrumentación:** eventos de `error_state_shown`, `mutation_failed`, `back_dead_end` (pantallas sin salida) y drop-off por paso del recorrido.

---

## 6. Estado de implementación (actualizado 17/10/2026)

**Resueltos: P0 completo (H1–H4), P1 completo (H5–H12) y P2 completo (H13–H21).** Queda pendiente P3 (H22–H24).

| ID | Cambio realizado |
|---|---|
| H1 | Nuevo `ErrorState` (`components/ui/error-state.tsx`) con reintento; `usePerfilActivo` expone `esError`/`refetch`; estados de error diferenciados de los vacíos en Inicio, Rutina, Informes, Perfil, Publicar, Selección, Servicios y Perfil de cuidado. El "vacío sin perfil" ya no se muestra como error ni queda spinner eterno. |
| H2 | Sistema de avisos propio: `store/toast-store.ts` + `components/ui/toast.tsx` (host con auto-ocultado y `accessibilityRole="alert"`) + `hooks/use-toast.ts`. `MutationCache.onError` en `api/query-client.ts` informa de **todo** fallo de mutación. Toasts de éxito en publicar, guardar perfil, seleccionar cuidador, añadir servicio y "Ver planes". |
| H3 | Tokens light: `primary #0D9488 → #0F766E` (blanco 3.74 → **5.47:1**). Blindado con `constants/theme.test.ts` (30 aserciones WCAG en CI). |
| H4 | Nuevo `ScreenHeader` (`‹` atrás / `✕` cerrar / solo texto en tabs) en todas las pantallas apiladas y modales; eliminado el enlace "Volver a inicio" redundante; `predictiveBackGestureEnabled: true`. |
| H5 | Login: enlace "¿Olvidaste tu contraseña?" + pantalla `/(auth)/recuperar`, mostrar/ocultar contraseña, autofill (`autoComplete`/`textContentType`/`autoCapitalize="none"`), error de correo bajo el correo y error de red sobre el botón. |
| H6 | `endpoints.registrar` ahora envía `contrasena` al API (y no la persiste en el store de demo). |
| H7 | `Screen` envuelve todo en `KeyboardAvoidingView` (`behavior="padding"` en iOS) y los formularios usan `flexGrow: 1` → centrados y visibles con teclado. |
| H8 | `Chip` interactivo 40pt + `hitSlop` (48pt efectivos), `Button sm` 40pt + `hitSlop`, acción de `SectionHeader` con `hitSlop={12}` y `accessibilityLabel`. |
| H9 | Tokens light: `success #15803D` (4.58:1), `warning #92400E` (6.45:1), `danger #B91C1C` (5.66:1) sobre sus fondos *Soft. |
| H10 | `<StatusBar style="auto"/>` montado en la raíz. |
| H11 | `Screen` acepta `alRefrescar` con `RefreshControl`; conectado en Inicio, Rutina, Informes, Perfil, Servicios, Publicar y Perfil de cuidado; `RefreshControl` propio en la `FlatList` de Selección. |
| H12 | "Ver planes" informa en el enlace de aviso en lugar de no hacer nada. |

### P2 (H13–H21) · implementado 17/10/2026

| ID | Cambio realizado |
|---|---|
| H13 | `EmptyState` unificado (`components/ui/empty-state.tsx`) en la lista de personas de Perfil, Hábitos y Competencias del perfil de cuidado, e Historial de informes. |
| H14 | Emoji retirados de producción: categorías de Servicios y candado de "Datos sensibles" ahora usan `@react-native-vector-icons/material-icons` (decorativos: `importantForAccessibility="no-hide-descendants"`). Paquete elegido porque Expo deprecó `@expo/vector-icons` (blog, junio 2026) y este solo empaqueta `MaterialIcons.ttf` (357 KB); `@expo/vector-icons` se desinstaló por completo. |
| H15 | `themed-text.tsx` depurado a `default | small | smallBold`: eliminado el azul hardcodeado `#3c87f7` (3.1:1) y el token muerto de 48px. |
| H16 | (incluido en H15: pesos y títulos ahora derivan de los tokens). |
| H17 | Recorrido real de 7 pasos en Inicio (`hooks/use-recorrido.ts` + `components/recorrido.tsx`): barra de progreso "n/7", solo pasos pendientes y enlace a la pantalla de cada paso. |
| H18 | Informes: nombres con `flexShrink` + elipsis, `Stat` con `minWidth: 84`, fila de estadísticas con `flexWrap`. |
| H19 | Skeletons con pulso animado (`components/ui/skeleton.tsx`, respeta Reduce Motion y expone `aria-busy`) en Inicio, Rutina e Informes. La virtualización de FlatList queda pendiente: las listas actuales son cortas. |
| H20 | Confirmación nativa (`Alert.alert`) antes de "Seleccionar cuidador" y "Publicar oferta". |
| H21 | `accessibilityRole="header"` en títulos de pantalla, `accessibilityHint` en tarjetas accionables, `Avatar` decorativo y estado de la tarea incluido en su etiqueta accesible. |

### Hallazgo nuevo (17/10/2026) — Web: barra de pestañas sin iconos que tapaba el contenido

- **Síntoma reportado:** "los tags no se ven y el header cubre partes al hacer scroll" (app vista en el navegador).
- **Causa:** en web, `NativeTabs` usa su fallback (`NativeTabsView.web.js`): una píldora `position: fixed` en `top: 24px` que flota sobre la página, **sin iconos** (el fallback web dibuja solo texto) y con colores por defecto incompatibles con el tema claro.
- **Fix (1):** `(tabs)/_layout.tsx` usa ahora las pestañas JS (`expo-router/js-tabs`) cuando `Platform.OS === 'web'`: barra inferior **en el flujo de la página** (no tapa nada al hacer scroll), iconos MaterialIcons (`home`, `checklist`, `insights`, `person`) y tintes del tema (`primary` activo / `textSecondary` inactivo). Nativo conserva `NativeTabs` (SF Symbols / Material).
- **Fix (2) derivado:** en web `react-native-screens` no está disponible, así que el navegador pinta las escenas de las pestañas apiladas (`absolute` + `z-index`) y la inactiva se transparentaba sobre la activa. `Screen` ahora pinta `backgroundColor: theme.background` en su raíz → al cambiar de pestaña no se ve la pantalla anterior.
- **Fix (3) safe-area (17/10/2026):** en el móvil los iconos quedaban al ras del borde inferior, debajo de la barra de navegación/home indicator del sistema. Causa: el viewport por defecto que inyecta `@expo/router-server` no lleva `viewport-fit=cover`, con lo que `env(safe-area-inset-*)` es siempre 0 en web y la barra calculaba `height = 49px` con `paddingBottom = 0`. Solución: nuevo `src/app/+html.tsx` (honrado porque `expo.web.output` es `static`) que replica el HTML raíz por defecto y añade `viewport-fit=cover`. Con los insets reales, la propia maquinaria existente sube la barra **sin CSS propio**: `react-native-safe-area-context` los mide en web con un elemento sonda (`NativeSafeAreaProvider.web.js`) y el `BottomTabBar` recalcula `height = 49 + insets.bottom` + `paddingBottom = insets.bottom`, dejando los iconos en los 49px superiores y la franja del sistema cubierta por el fondo de la barra; el `SafeAreaView` (web: padding = insets) protege el contenido de cabecera. En escritorio `env()` es 0 → no cambia nada. No se usó CSS de refuerzo (`div:has(> [role="tablist"])`) a propósito: la altura en línea ya incluye el inset, así que un `box-sizing: content-box`/`padding !important` manual contaría la elevación dos veces.
- **Verificado en navegador (localhost):** barra inferior con iconos y colores AA, cambio de pestaña correcto en ambos sentidos, cero elementos `fixed` que se superpongan al contenido, captura de pantalla incluida en la entrega.

**Extras incluidos:** typo "gesoría" → "gestoría", `EmptyState` unificado en las nuevas vistas, `accessibilityRole="header"` en los títulos y `accessibilityLiveRegion` en errores de formulario, y corrección de la altura del contenedor de `Screen scroll={false}` (el `FlatList` de Selección no tenía contenedor acotado).

**Datos de ejemplo (17/10/2026)** — `src/api/mocks.ts` ahora replica la demo interactiva de la landing (familias · paso 1): Carmen, 82 años, con "Memoria" entre las competencias requeridas; tercer candidato Carlos D. (cercano, mediodía y noche); valoraciones reales de las cuidadoras (★ 4,9 (27) / 4,8 (19) / 4,7 (12), nuevos campos `valoracion`/`valoraciones` en `Cuidador`, visibles en Selección); tareas de tarde y noche a cargo de Carlos D. como en la demo; servicios ampliados (Logopedia, Enfermería domiciliaria, Curso de demencias) e historial con glucemia y hábitos. La clave de persistencia demo pasó a `cuidapp.demo_data.v2` para que las nuevas semillas sustituyan a los datos guardados en dispositivos con la versión anterior.

**Cuenta familiar completa y persistente (17/10/2026)** — el modelo `Familia` incorpora ahora lo que una familia necesita para organizar los cuidados y buscar al profesional adecuado: teléfono, ubicación, `miembros` (familiares con acceso), `contactoEmergencia` y `preferencias` de búsqueda (distancia máxima, tarifa máxima, franjas del día y verificaciones mínimas). Todo se siembra desde `mocks.ts`, vive en el almacén local (`data-store`, AsyncStorage `cuidapp.demo_data.v2`) y se edita en la nueva pantalla modal `/cuenta` ("Datos de la familia" en Perfil), con validación zod, alta/baja de miembros y chips de franjas/verificaciones. Verificado en navegador: editar → guardar → recarga completa → los datos siguen en el dispositivo.

**Validación:** `npx tsc --noEmit` ✅ · `npx expo lint` ✅ · `npx jest` → 43/43 ✅ · `npx expo export --platform android` → bundle OK (2.297 módulos) ✅ · `npx expo-doctor` → 21/21 ✅ · verificación visual en web (cambio de pestañas e iconos) ✅

**Validación safe-area (17/10/2026):** en navegador — meta `viewport` servida con `viewport-fit=cover` (desde `+html.tsx`) ✅ · una única barra `div:has(> [role="tablist"])`, en escritorio `env()=0` → 49px/`paddingBottom: 0` sin cambios ✅ · sonda de `env()` activa en el `body` ✅ · con insets **simulados** (47px notch / 34px home indicator) la barra pasa en vivo a 83px con los iconos en la franja superior de 49px, 34px de fondo de barra libres sobre la zona del sistema y el contenido de pantalla empujado bajo el notch ✅ · restaurado a `env()` real →49px/0 sin residuales ✅ · cero errores de consola ✅.

---

## Anexo A — Tabla completa de contraste medido (WCAG 2.1)

> Los valores de la paleta **light** corresponden a los tokens originales (antes de la corrección del 16/10/2026). La paleta vigente se verifica automáticamente en `src/constants/theme.test.ts` y supera AA en todos los pares; los ratios de los tokens nuevos están en la sección 6.

| Par de color (hex reales del tema) | Ratio | AA texto normal (4.5:1) |
|---|---|---|
| Blanco / `#0D9488` (botón primario) | 3.74:1 | ❌ |
| `#0D9488` / `#FFFFFF` (enlaces) | 3.74:1 | ❌ |
| `#0D9488` / `#F8FAFA` (enlaces sobre fondo app) | 3.57:1 | ❌ |
| `#0D9488` / `#F0FDFA` (botón secundario) | 3.59:1 | ❌ |
| `#DC2626` / `#FDECEC` (botón danger) | 4.23:1 | ❌ (cerca) |
| `#16A34A` / `#EAF8EF` (badge success) | 3.01:1 | ❌ |
| `#D97706` / `#FDF3E3` (badge warning) | 2.90:1 | ❌ |
| `#0D9488` / `#CCF2EC` (badge primary) | 3.12:1 | ❌ |
| `#94A3A1` / `#FFFFFF` (chevron) | 2.62:1 | ❌ (elemento gráfico 3:1) |
| `#5B6B6A` / `#FFFFFF` (texto secundario) | 5.59:1 | ✅ |
| `#5B6B6A` / `#F8FAFA` | 5.34:1 | ✅ |
| `#5B6B6A` / `#E6F2F1` (badge neutral) | 4.88:1 | ✅ |
| **Modo oscuro:** `#F1F5F5` / `#0B1211` | 17.24:1 | ✅ |
| `#9BABA8` / `#16201F` (texto secundario) | 6.97:1 | ✅ |
| `#2DD4BF` / `#16201F` (enlaces) | 8.95:1 | ✅ |
| `#04211D` / `#2DD4BF` (botón primario) | 9.09:1 | ✅ |
| `#4ADE80` / `#14301F` (badge success) | 8.19:1 | ✅ |
| `#FBBF24` / `#3A2E12` (badge warning) | 7.96:1 | ✅ |

*Nota: las propuestas de H3/H9 están verificadas con el mismo método: `#0F766E`/blanco = 5.47:1, `#15803D`/`#EAF8EF` = 4.58:1, `#92400E`/`#FDF3E3` = 6.45:1, `#0F766E`/`#CCF2EC` = 4.56:1.*
