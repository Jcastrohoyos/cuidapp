/**
 * Design tokens de Cuidapp.
 * Paleta propia (teal Cuidapp) coherente con la landing. Para otros estilados
 * existen librerías como Nativewind, Tamagui o Unistyles; aquí usamos StyleSheet.
 */

export const Colors = {
  light: {
    text: '#0F172A',
    background: '#F8FAFA',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#E6F2F1',
    textSecondary: '#5B6B6A',
    // teal-700 en lugar de teal-600: mantiene la identidad Cuidapp y cumple
    // WCAG AA (4.5:1) con texto blanco y sobre fondos *Soft. Ver theme.test.ts.
    primary: '#0F766E',
    primaryText: '#FFFFFF',
    primarySoft: '#F0FDFA',
    primarySoftStrong: '#CCF2EC',
    border: '#E2E8E7',
    borderStrong: '#CBD5D3',
    accent: '#F59E0B',
    accentSoft: '#FEF3E2',
    success: '#15803D',
    successSoft: '#EAF8EF',
    danger: '#B91C1C',
    dangerSoft: '#FDECEC',
    warning: '#92400E',
    warningSoft: '#FDF3E3',
    overlay: 'rgba(15, 23, 42, 0.45)',
    skeleton: '#EDF1F0',
  },
  dark: {
    text: '#F1F5F5',
    background: '#0B1211',
    backgroundElement: '#16201F',
    backgroundSelected: '#1E2B29',
    textSecondary: '#9BABA8',
    primary: '#2DD4BF',
    primaryText: '#04211D',
    primarySoft: '#12302C',
    primarySoftStrong: '#1D423E',
    border: '#2A3735',
    borderStrong: '#3B4A48',
    accent: '#FBBF24',
    accentSoft: '#3A2E12',
    success: '#4ADE80',
    successSoft: '#14301F',
    danger: '#F87171',
    dangerSoft: '#3A1717',
    warning: '#FBBF24',
    warningSoft: '#3A2E12',
    overlay: 'rgba(0, 0, 0, 0.6)',
    skeleton: '#1D2826',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

/**
 * Familias Inter cargadas con `useFonts` en `src/app/_layout.tsx`.
 *
 * En SDK 57 cada clave del mapa de `useFonts` es una familia independiente
 * (la carga multi-peso bajo un solo nombre es SDK 58+), así que el peso se
 * selecciona con la familia: `fam(700)` → `'Inter_700Bold'`.
 *
 * - Nativo (iOS/Android): se usa el nombre exacto por peso; el TTF ya lleva
 *   el peso escrito, así que no hay síntesis de negrita.
 * - Web: `+html.tsx` declara la familia CSS `Inter` con `@font-face` de pesos
 *   reales (mismos TTF de `public/fonts/`) y la aplica a toda la app; las
 *   familias por peso de aquí quedan cubiertas por esa regla.
 */
export const FAM_PESOS = {
  300: 'Inter_300Light',
  400: 'Inter_400Regular',
  500: 'Inter_500Medium',
  600: 'Inter_600SemiBold',
  700: 'Inter_700Bold',
  800: 'Inter_800ExtraBold',
} as const;

export type PesoFuente = keyof typeof FAM_PESOS;

/** Familia Inter exacta para un peso tipográfico. */
export const fam = (peso: PesoFuente): string => FAM_PESOS[peso];

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
} as const;

export const FontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 22,
  '2xl': 28,
  '3xl': 34,
} as const;

export const MaxContentWidth = 800;
