/**
 * Tests de los textos compartidos: una sola fuente para los nombres de
 * verificación, las franjas y los umbrales de afinidad.
 */

import {
  FRANJAS_OPCION,
  FRANJAS_TEXTO,
  TEXTO_ESTADO_VERIFICACION,
  TEXTOS_VERIFICACION,
  UMBRAL_AFINIDAD_ALTA,
  UMBRAL_AFINIDAD_MEDIA,
  tonoPorAfinidad,
} from './textos';

describe('constants/textos', () => {
  it('cada tipo de verificación tiene un nombre', () => {
    expect(Object.keys(TEXTOS_VERIFICACION).sort()).toEqual([
      'formacion',
      'identidad',
      'penales',
      'referencias',
    ]);
  });

  it('la franja tiene dos formas: en frase y como opción', () => {
    expect(FRANJAS_TEXTO.manana).toBe('mañanas');
    expect(FRANJAS_OPCION.manana).toBe('Mañanas');
  });

  it('los estados de verificación comparten formato', () => {
    expect(TEXTO_ESTADO_VERIFICACION.verificada).toBe('verificada');
    expect(TEXTO_ESTADO_VERIFICACION.pendiente).toBe('pendiente');
    expect(TEXTO_ESTADO_VERIFICACION.no_aplica).toBe('no aplica');
  });

  it('el tono de afinidad respeta los umbrales', () => {
    expect(tonoPorAfinidad(null)).toBe('neutral');
    expect(tonoPorAfinidad(0)).toBe('neutral');
    expect(tonoPorAfinidad(UMBRAL_AFINIDAD_MEDIA)).toBe('primary');
    expect(tonoPorAfinidad(UMBRAL_AFINIDAD_ALTA)).toBe('success');
    expect(tonoPorAfinidad(100)).toBe('success');
  });

  it('sin datos de afinidad no se juzga (nada inventado)', () => {
    expect(tonoPorAfinidad(null)).toBe('neutral');
  });
});
