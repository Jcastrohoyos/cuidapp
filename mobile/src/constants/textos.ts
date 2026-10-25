/**
 * Textos y umbrales compartidos por varias pantallas.
 *
 * Antes cada pantalla tenía su propia copia: la misma verificación se llamaba
 * «Antecedentes» en un sitio y «Antecedentes penales» en otro, y las franjas
 * cambiaban de mayúscula. Una sola fuente evita que la app se contradiga.
 */

import type { FranjaDisponibilidad, TipoVerificacion } from '@/types';

/** Etiqueta de cada franja de disponibilidad (minúscula: va dentro de frases). */
export const FRANJAS_TEXTO: Record<FranjaDisponibilidad, string> = {
  manana: 'mañanas',
  tarde: 'tardes',
  noche: 'noches',
};

/** Etiqueta de cada franja para selectores (mayúscula: es una opción). */
export const FRANJAS_OPCION: Record<FranjaDisponibilidad, string> = {
  manana: 'Mañanas',
  tarde: 'Tardes',
  noche: 'Noches',
};

/** Nombre de cada tipo de verificación. */
export const TEXTOS_VERIFICACION: Record<TipoVerificacion, string> = {
  identidad: 'Identidad',
  formacion: 'Formación',
  penales: 'Antecedentes penales',
  referencias: 'Referencias',
};

/** Estado de una verificación, en el mismo formato en todas las pantallas. */
export const TEXTO_ESTADO_VERIFICACION: Record<string, string> = {
  verificada: 'verificada',
  pendiente: 'pendiente',
  no_aplica: 'no aplica',
};

/** Umbrales de afinidad (por encima: buena afinidad; media: afinidad parcial). */
export const UMBRAL_AFINIDAD_ALTA = 70;
export const UMBRAL_AFINIDAD_MEDIA = 40;

/**
 * Tono del distintivo de afinidad. `null` = sin datos de preferencias: no se
 * juzga (nada inventado) y se muestra neutro.
 */
export function tonoPorAfinidad(afinidad: number | null): 'success' | 'primary' | 'neutral' {
  if (afinidad === null) return 'neutral';
  if (afinidad >= UMBRAL_AFINIDAD_ALTA) return 'success';
  if (afinidad >= UMBRAL_AFINIDAD_MEDIA) return 'primary';
  return 'neutral';
}
