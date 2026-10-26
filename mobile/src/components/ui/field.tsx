import { forwardRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type KeyboardTypeOptions,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { FACTOR_TEXTO_GRANDE, Text, useTextoGrande } from '@/components/text';

import { useTheme } from '@/hooks/use-theme';
import { fam, FontSize, Radius, Spacing } from '@/constants/theme';

interface CampoTextoProps extends Omit<TextInputProps, 'style' | 'onChangeText'> {
  label: string;
  valor: string;
  onChangeTexto: (texto: string) => void;
  onBlur?: () => void;
  error?: string;
  placeholder?: string;
  secure?: boolean;
  teclado?: KeyboardTypeOptions;
  multilinea?: boolean;
  estiloContenedor?: StyleProp<ViewStyle>;
  /** Muestra el botón "Ver/Ocultar" (solo tiene sentido con `secure`). */
  mostrarToggle?: boolean;
}

/** Campo de texto con label y error, compatible con React Hook Form. */
export const CampoTexto = forwardRef<TextInput, CampoTextoProps>(function CampoTexto(
  {
    label,
    valor,
    onChangeTexto,
    onBlur,
    error,
    placeholder,
    secure,
    teclado,
    multilinea,
    estiloContenedor,
    mostrarToggle,
    ...rest
  },
  ref,
) {
  const theme = useTheme();
  const [visible, setVisible] = useState(false);
  const { textoGrande } = useTextoGrande();
  const conToggle = Boolean(secure && mostrarToggle);

  return (
    <View style={[styles.contenedor, estiloContenedor]}>
      <Text style={[styles.label, { color: error ? theme.danger : theme.textSecondary }]}>{label}</Text>
      <View style={styles.inputContenedor}>
        <TextInput
          ref={ref}
          value={valor}
          onChangeText={onChangeTexto}
          onBlur={onBlur}
          placeholder={placeholder}
          placeholderTextColor={theme.textSecondary}
          secureTextEntry={secure && !visible}
          keyboardType={teclado}
          multiline={multilinea}
          accessibilityLabel={label}
          style={[
            styles.input,
            multilinea && styles.multilinea,
            conToggle && styles.inputConToggle,
            {
              backgroundColor: theme.backgroundElement,
              borderColor: error ? theme.danger : theme.border,
              color: theme.text,
            },
            // El input no pasa por <Text>: la escala "Texto grande" va aquí.
            ...(textoGrande ? [{ fontSize: FontSize.base * FACTOR_TEXTO_GRANDE }] : []),
          ]}
          {...rest}
        />
        {conToggle ? (
          <Pressable
            onPress={() => setVisible((v) => !v)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            style={styles.toggle}>
            <Text style={[styles.toggleTexto, { color: theme.primary }]}>
              {visible ? 'Ocultar' : 'Ver'}
            </Text>
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <Text
          style={[styles.error, { color: theme.danger }]}
          accessibilityLiveRegion="polite"
          accessibilityRole="alert">
          {error}
        </Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  contenedor: {
    gap: Spacing.one,
  },
  label: {
    fontFamily: fam(700),
    fontSize: FontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  inputContenedor: {
    position: 'relative',
  },
  input: {
    fontFamily: fam(400),
    minHeight: 48,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 2,
    fontSize: FontSize.base,
  },
  inputConToggle: {
    // Deja hueco al "Ver/Ocultar" para que no se solape con el texto.
    paddingRight: 72,
  },
  toggle: {
    position: 'absolute',
    right: Spacing.two,
    top: 0,
    bottom: 0,
    paddingHorizontal: Spacing.one,
    justifyContent: 'center',
  },
  toggleTexto: {
    fontFamily: fam(700),
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  multilinea: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  error: {
    fontFamily: fam(400),
    fontSize: FontSize.xs,
    lineHeight: 16,
  },
});
