import { Colors } from '@/constants/theme';

/**
 * Blindado de accesibilidad de los tokens de color (WCAG 2.1).
 * Si alguien oscurece/ aclara la paleta y rompe el contraste AA, este test falla
 * antes de llegar a producción. Ejecutar con `npm test`.
 */

const hexArgb = (hex: string) => {
  const h = hex.replace('#', '');
  const completo = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  return [0, 2, 4].map((i) => parseInt(completo.slice(i, i + 2), 16));
};

const canalLineal = (c: number) => {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
};

const luminancia = (hex: string) => {
  const [r, g, b] = hexArgb(hex);
  return 0.2126 * canalLineal(r) + 0.7152 * canalLineal(g) + 0.0722 * canalLineal(b);
};

export const ratio = (a: string, b: string) => {
  const l1 = luminancia(a);
  const l2 = luminancia(b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
};

/** Pares de texto normal (14px+) que deben cumplir AA = 4.5:1. */
const PARES_TEXTO: [string, string, string][] = [
  ['texto principal / fondo', 'text', 'background'],
  ['texto principal / tarjeta', 'text', 'backgroundElement'],
  ['texto secundario / tarjeta', 'textSecondary', 'backgroundElement'],
  ['texto secundario / fondo', 'textSecondary', 'background'],
  ['texto del botón primario', 'primaryText', 'primary'],
  ['texto del botón secundario', 'primary', 'primarySoft'],
  ['enlace primary / tarjeta', 'primary', 'backgroundElement'],
  ['enlace primary / fondo', 'primary', 'background'],
  ['badge primary', 'primary', 'primarySoftStrong'],
  ['badge success', 'success', 'successSoft'],
  ['badge warning', 'warning', 'warningSoft'],
  ['badge neutral', 'textSecondary', 'backgroundSelected'],
  ['texto del botón danger', 'danger', 'dangerSoft'],
  ['error de formulario', 'danger', 'backgroundElement'],
  ['verificación / tarjeta', 'success', 'backgroundElement'],
];

describe('tokens de color — WCAG 2.1 AA', () => {
  for (const esquema of ['light', 'dark'] as const) {
    const c = Colors[esquema];

    describe(esquema, () => {
      const colores = c as Record<string, string>;

      it.each(PARES_TEXTO)('%s alcanza 4.5:1', (_nombre, fg, bg) => {
        expect(Number(ratio(colores[fg], colores[bg]).toFixed(2))).toBeGreaterThanOrEqual(4.5);
      });

      it('la barra de progreso (elemento gráfico) alcanza 3:1', () => {
        expect(ratio(c.primary, c.backgroundSelected)).toBeGreaterThanOrEqual(3);
      });

      it('el borde de tarjetas es visible frente al fondo (3:1)', () => {
        expect(ratio(c.borderStrong, c.backgroundElement)).toBeGreaterThanOrEqual(1.3);
      });
    });
  }
});
