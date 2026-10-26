# Diagnóstico · Verificación visual de la app móvil vs. guía de estilo Cuidapp

- **Fuente de referencia:** guía visual del proyecto (landing + "Guía para el desarrollador": paleta, tipografía *Inter / Poppins*, iconografía *lineal y redondeada*, estilo "moderno, cálido, cercano, profesional y limpio").
- **Implementación de referencia secundaria:** `landing/css/tokens.css` (los tokens reales con los que se construyó la landing).
- **Objeto verificado:** `mobile/` — tokens (`src/constants/theme.ts`), componentes UI, tipografía, iconografía, copy y capturas reales de login, inicio, servicios, formulario y detalle.
- **Fecha:** 17/10/2026 · Expo SDK 57 / RN 0.86.3.
- **Estado:** verificación inicial (solo lectura) **+ sprint P0 APLICADO** el mismo día: tipografía Inter e iconografía lineal (ver §4.P0).

---

## 1. Veredicto

**La app móvil ENCAJA con la idea visual** — paleta teal/ámbar idéntica a la landing, superficies redondeadas, tono cálido y cercano, y accesibilidad por contraste AA testada. Las **2 desviaciones claras iniciales (tipografía e iconografía) ya están resueltas** con el sprint P0 (Inter + Lucide, verificado en navegador); quedan **5 menores** (neutrales, tokens matizados, logo, sombras, paleta pastel sin usar) para P1/P2.

## 2. Matriz de verificación

| # | Elemento de la guía | Estado en la app | Evidencia |
|---|---|---|---|
| 1 | Color primario teal | ✅ | `primary: #0F766E` = `--primary-700` de la landing (elegido sobre el 600 por contraste WCAG AA, verificado en `theme.test.ts`). En oscuro: `#2DD4BF` = `--primary-400` |
| 2 | Escala de color + acento | ✅ | Escala primary 50–900 presente en tokens; `accent: #F59E0B` = `--accent-500`; semánticos success/danger/warning propios |
| 3 | Tema claro/oscuro | ✅ | Ambos temas completos (`Colors.light/dark`, `userInterfaceStyle: automatic`) |
| 4 | Estilo redondeado | ✅ | Radios 8/12/16/24/999; botones y tarjetas `Radius.md`; chips, badges y barras pill (`Radius.full`) |
| 5 | Tono cálido y cercano | ✅ | Tuteo en todo el copy ("Hola, Ana", "¿No tienes cuenta?"), avatares, frases tranquilizadoras, nota "Modo demo" transparente; sin porcentajes de afinidad ficticios |
| 6 | Profesionalismo/confianza | ✅ | Contraste AA con tests (`constants/theme.test.ts`), iconos decorativos ocultos a lectores de pantalla, datos sensibles con candado y aviso de privacidad |
| 7 | **Tipografía Inter / Poppins** | ✅ (P0) | **Inter cargada y aplicada**: `useFonts` en `src/app/_layout.tsx` (6 pesos, splash oculto solo cuando fuentes+sesión listas), `fam(peso)` en `theme.ts` (59 estilos de texto con `fontFamily` exacta por peso) y CSS global en `+html.tsx` (`@font-face` familia única `Inter` con pesos 300–800 desde `public/fonts/`, regla `#root *` con exclusión de glifos de iconos). Verificado en navegador: **100 % de nodos de texto en `Inter` (0 ajenos)**, 6 caras cargadas. Poppins/Plus Jakarta no se usa (la landing tampoco: su display es Plus Jakarta Sans, decisión P1) |
| 8 | **Iconografía lineal y redondeada** | ✅ (P0) | Sustituido MaterialIcons (relleno) por **Lucide** (`@react-native-vector-icons/lucide` v13.1.5, 1941 iconos, lineal y redondeado): tabs `house/list-checks/chart-line/user`, servicios `landmark/stethoscope/hospital/graduation-cap`, detalle `lock`. Eliminado `@react-native-vector-icons/material-icons` (paquete + plugin de `app.json`). Verificado: cara `Lucide` cargada y glifos renderizados en login/inicio/servicios/detalle |
| 9 | Marca (logo + lema) | ⚠️ | El login muestra un **placeholder** (cuadrado teal con "Cu") y el lema propio "El cuidado de tu familia, en un solo lugar" en vez del isotipo de la guía + "Cuidamos lo que más importa" |
| 10 | Neutrales (fondo/texto/bordes) | ⚠️ | App: fondos casi idénticos (`#F8FAFA` vs `#f7faf9`), pero **texto `#0F172A` (slate azulado)** y secundario `#5B6B6A` genéricos, mientras la landing usa neutrales **teal-tinted** (`--ink #0b1f1c`, `--ink-2 #3d5450`) → la app se percibe ligeramente más "fría" |
| 11 | Tokens matizados | ⚠️ | `primarySoftStrong #CCF2EC` vs landing `#ccfbf1`; `accentSoft #FEF3E2` vs landing `#fffbeb`; borde `#E2E8E7` vs `#dde8e6`; radio `lg` 16 vs 18. Diferencias mínimas, conviene alinearlas o documentarlas |
| 12 | Paleta pastel de la guía (rosa/azul/durazno) | ⚠️ | Los tonos rosados/azules/durazno de la fila de paleta **no existen como tokens** ni en la landing ni en la app. Si son parte de la identidad (categorías, estados), faltan |
| 13 | Profundidad (sombras) | ⚠️ | La landing usa `--shadow-sm/md` en tarjetas; la app usa solo borde (más plano) — única sombra real: el toast |
| 14 | Consistencia de radios | ⚠️ | Valores hard-coded fuera de tokens: `22` (error-state), `13`/`4` (task-item), `11` (toast) |

## 3. Capturas verificadas (localhost:8125)

**Post-P0 (17/10/2026):**

- **Login:** campos y copy en Inter (censo: nodos en `Inter`, enlaces 700, logo 800).
- **Inicio:** títulos Inter 800, cuerpo Inter 400/500, tab bar con iconos **lineales Lucide** (house/list-checks/chart-line/user) en teal.
- **Servicios:** iconos de categoría lineales (`landmark` gestoría, `stethoscope` especialistas, `hospital`, `graduation-cap`), 31 nodos Inter / 7 Lucide / 0 ajenos.
- **Formulario (`/cuidado/nuevo`):** labels en versalitas Inter 700, inputs Inter 400, chips Inter 600 (selección teal).
- **Detalle (`/cuidado/per_1`):** fila Días y hábitos en Inter, sección "Salud y autonomía" con **candado Lucide lineal**; 55 nodos Inter / 1 Lucide.
- **Consola sin errores** en toda la sesión (login → inicio → servicios → formulario → detalle).
- **Censo global:** familias en uso = {Inter, Lucide} únicamente; `/fonts/*.ttf` servidos con MIME `font/ttf` (200); caras `Inter` 300–800 y `Lucide` en estado `loaded`.

Pre-P0 (referencia de la desviación ya corregida): tab bar con iconos de relleno y tipografía de sistema.

## 4. Recomendaciones priorizadas

### P0 · Identidad (las 2 desviaciones claras) — ✅ APLICADO (17/10/2026)

1. **Tipografía Inter** — ✅ Implementado: `npx expo install expo-font @expo-google-fonts/inter` (docs v57 consultadas; en SDK 57 `useFonts` no agrupa pesos bajo un nombre → familias por peso). Carga en `src/app/_layout.tsx` con splash gate; token `fam(peso)` en `theme.ts` aplicado a los **59 estilos de texto** de la app; en web, `+html.tsx` declara `@font-face` de la familia CSS única `Inter` (pesos reales 300–800, `font-display: swap`) desde `public/fonts/` y la aplica con `#root *` **excluyendo glifos de iconos**. Fallback nativo: mismas familias por peso (el TTF ya lleva el peso, sin síntesis).
2. **Iconografía lineal** — ✅ Implementado con **Lucide** en vez de Material Symbols Rounded: `@react-native-vector-icons/material-symbols` **no existe en npm (404)**, y Lucide cumple "lineal y redondeada" con los `@react-native-vector-icons/*` ya conocidos. Mapeo: tabs `home→house`, `checklist→list-checks`, `insights→chart-line`, `person→user`; servicios `account-balance→landmark`, `medical-services→stethoscope`, `local-hospital→hospital`, `school→graduation-cap`; `lock→lock`. El `md` de `NativeTabs` (Android nativo) conserva MaterialIcons: esa API solo acepta `sf`/`md` de las familias del sistema — **limitación conocida** (icono lineal garantizado en web; en Android nativo, resuelto con `src` custom cuando se decida).
   - Validación: `npx tsc --noEmit` ✅ · `npx expo lint` ✅ · `npx jest` 43/43 ✅ · navegador ✅ (censo y capturas en §3).

### P1 · Coherencia con la landing
3. Neutrales **teal-tinted** en tema claro: `text → #0b1f1c`, `textSecondary → #3d5450`, `background → #f7faf9`, `border → #dde8e6` (o documentar en `theme.ts` por qué se mantienen los slate).
4. **Isotipo oficial + lema de marca** en login (SVG del logo de la landing) y lema "Cuidamos lo que más importa".
5. Alinear `primarySoftStrong`, `accentSoft` y radio `lg` (18) con los tokens de la landing.

### P2 · Detalle
6. `shadow-sm` sutil en tarjetas para la profundidad cálida de la landing (web/nativo con `elevation`).
7. Radios hard-coded → tokens (`22 → Radius.lg`, `13/11 → Radius.md`, `4 → Radius.sm`).
8. Definir si la paleta pastel de la guía se usa (categorías de cuidado/estados); si no, retirarla de la guía para evitar confusión.

## 5. Nota de alcance y verificación

- **Sprint P0 aplicado y verificado** (17/10/2026): Inter + Lucide con `npx tsc --noEmit` ✅, `npx expo lint` ✅, `npx jest` 43/43 ✅ y revalidación visual en navegador (censo de familias, caras cargadas, capturas de 5 pantallas, 0 errores de consola).
- **Verificado en web** (único entorno de ejecución disponible aquí). Nativo: los cambios son JS/config (mismos `fontFamily`/iconos en todas las plataformas + config plugins autoañadidos); requiere build nativo (`npx expo run:android|ios` o EAS) para revisión visual en dispositivo.
- **Fuera del alcance de P0** (pendiente de aprobación): P1 (neutrales teal-tinted, isotipo oficial + lema, alinear `primarySoftStrong`/`accentSoft`/radio lg) y P2 (sombras, radios → tokens, decisión de la paleta pastel).
