import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

/**
 * Documento HTML raíz para la web (honrado porque `expo.web.output` es
 * `static`). Es la plantilla por defecto de Expo + dos ajustes:
 *
 * 1. `viewport-fit=cover`: el viewport por defecto que inyecta
 *    `@expo/router-server` NO lo incluye, y sin él `env(safe-area-inset-*)`
 *    vale siempre 0 en web. Resultado: la barra de pestañas quedaba pegada al
 *    borde inferior, sus iconos debajo de la barra de navegación/home
 *    indicator del sistema móvil. Con `viewport-fit=cover` la página se dibuja
 *    de borde a borde y los insets se hacen reales.
 *
 *    Una vez reales, la maquinaria existente (sin CSS propio) hace el resto:
 *    - `react-native-safe-area-context` mide `env()` en web con un elemento
 *      sonda (`NativeSafeAreaProvider.web.js`).
 *    - El `BottomTabBar` de expo-router calcula `height = 49 + insets.bottom`
 *      y aplica `paddingBottom: insets.bottom` (border-box), de modo que los
 *      iconos viven siempre en los 49px superiores y la franja inferior la
 *      cubre el fondo de la barra, por encima del sistema.
 *    - El `SafeAreaView` (web: padding = insets) protege el contenido superior
 *      en pantallas y toasts.
 *
 *    No se añade ninguna regla CSS para la barra: la altura ya incluye el
 *    inset, así que un `box-sizing: content-box`/`padding` manual con
 *    `!important` la contaría dos veces, y en escritorio `env()` es 0 con lo
 *    que no cambia nada (la barra mantiene sus 49px).
 *
 * 2. `ScrollViewStyleReset` (idéntico al HTML por defecto): `#root/body/html`
 *    al 100% y `body { overflow: hidden }`, para que la escena en scroll
 *    dentro de flex sea la única que desplaza.
 *
 * 3. `Inter` (tipografía de marca, guía visual: "Inter / Poppins"):
 *    `@font-face` con pesos reales desde `public/fonts/` (mismos TTF que
 *    `useFonts` en nativo). La familia CSS única `Inter` permite elegir el
 *    peso con `fontWeight` sin síntesis (en SDK 57 `useFonts` no puede
 *    agrupar pesos bajo un nombre). La regla `#root *` aplica Inter a toda la
 *    app (RNW fija la fuente del sistema por elemento), excluyendo los glifos
 *    de iconos, que conservan su familia (`Lucide`/`MaterialIcons`).
 */
const CSS_INTER = `
@font-face { font-family: 'Inter'; src: url('/fonts/Inter_300Light.ttf') format('truetype'); font-weight: 300; font-style: normal; font-display: swap; }
@font-face { font-family: 'Inter'; src: url('/fonts/Inter_400Regular.ttf') format('truetype'); font-weight: 400; font-style: normal; font-display: swap; }
@font-face { font-family: 'Inter'; src: url('/fonts/Inter_500Medium.ttf') format('truetype'); font-weight: 500; font-style: normal; font-display: swap; }
@font-face { font-family: 'Inter'; src: url('/fonts/Inter_600SemiBold.ttf') format('truetype'); font-weight: 600; font-style: normal; font-display: swap; }
@font-face { font-family: 'Inter'; src: url('/fonts/Inter_700Bold.ttf') format('truetype'); font-weight: 700; font-style: normal; font-display: swap; }
@font-face { font-family: 'Inter'; src: url('/fonts/Inter_800ExtraBold.ttf') format('truetype'); font-weight: 800; font-style: normal; font-display: swap; }
html, body, #root { font-family: 'Inter', system-ui, sans-serif; }
#root *:not([style*="Lucide"]):not([style*="MaterialIcons"]) { font-family: 'Inter', system-ui !important; }
`;

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover"
        />
        <ScrollViewStyleReset />
        {/* Estilos de marca: ver comentario 3 de la cabecera. */}
        <style dangerouslySetInnerHTML={{ __html: CSS_INTER }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
