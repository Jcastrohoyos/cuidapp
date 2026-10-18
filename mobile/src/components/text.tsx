import { createContext, useContext, useMemo } from 'react';
import { Text as RNText, type StyleProp, type TextProps, type TextStyle } from 'react-native';

/**
 * Texto con escala global (ajuste "Texto grande" del perfil).
 *
 * `Text` multiplica `fontSize` y `lineHeight` de los estilos que recibe cuando
 * la familia activa el ajuste, así todo el texto de la app crece sin reescribir
 * estilos (que viven congelados en `StyleSheet.create` a nivel de módulo).
 * El contexto por defecto es "normal", de modo que renderizar `Text` fuera del
 * provider (por ejemplo, en pruebas) no cambia nada.
 */

/** Factor de escala del modo "Texto grande". */
export const FACTOR_TEXTO_GRANDE = 1.3;

interface EstadoTextoGrande {
  textoGrande: boolean;
  setTextoGrande: (valor: boolean) => void;
}

/** Contexto compartido por `AppProviders` y cualquier `Text`. */
export const TextoGrandeContexto = createContext<EstadoTextoGrande>({
  textoGrande: false,
  setTextoGrande: () => undefined,
});

export function useTextoGrande(): EstadoTextoGrande {
  return useContext(TextoGrandeContexto);
}

/** Formas que acepta `style` de `Text` (incluidos arrays y arrays de solo lectura). */
type EstiloText = StyleProp<TextStyle> | readonly (TextStyle | false | null | undefined | '')[];

/** Escala solo `fontSize`/`lineHeight` (los demás números son layout: no se tocan). */
function escalarEstilo(style: EstiloText, factor: number): StyleProp<TextStyle> {
  if (!style || factor === 1) return style as StyleProp<TextStyle>;
  if (Array.isArray(style)) {
    return style.map((item) => escalarEstilo(item, factor)) as StyleProp<TextStyle>;
  }
  if (typeof style !== 'object') return style as StyleProp<TextStyle>; // registrados (number)
  const original = style as TextStyle;
  const escalado: TextStyle = { ...original };
  if (typeof original.fontSize === 'number') escalado.fontSize = original.fontSize * factor;
  if (typeof original.lineHeight === 'number') escalado.lineHeight = original.lineHeight * factor;
  return escalado;
}

/** Drop-in de `Text` de React Native con la escala "Texto grande" aplicada. */
export function Text({ style, ...props }: TextProps) {
  const { textoGrande } = useTextoGrande();
  const factor = textoGrande ? FACTOR_TEXTO_GRANDE : 1;
  const styleEscalado = useMemo(() => escalarEstilo(style, factor), [style, factor]);
  return <RNText style={styleEscalado} {...props} />;
}
