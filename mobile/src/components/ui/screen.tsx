import type { ReactNode } from 'react';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, type EdgeInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/use-theme';
import { MaxContentWidth, Spacing } from '@/constants/theme';

interface ScreenProps {
  children: ReactNode;
  /** Envuelve el contenido en ScrollView (por defecto true). */
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  edges?: readonly (keyof EdgeInsets)[];
  /** Activa el pull-to-refresh de la pantalla. Debe re-lanzar las consultas. */
  alRefrescar?: () => void | Promise<unknown>;
}

/** Contenedor base de todas las pantallas: safe area, teclado y refresh. */
export function Screen({
  children,
  scroll = true,
  contentStyle,
  edges = ['top', 'bottom'],
  alRefrescar,
}: ScreenProps) {
  const theme = useTheme();
  const [refrescando, setRefrescando] = useState(false);

  const refrescar = alRefrescar
    ? async () => {
        setRefrescando(true);
        try {
          await alRefrescar();
        } finally {
          setRefrescando(false);
        }
      }
    : undefined;

  // Fondo opaco en la raíz de la pantalla: en web, las pestañas (Tabs) apilan
  // las escenas inactivas debajo de la activa y sin fondo propio se transparentan.
  const fondo = { backgroundColor: theme.background };

  if (!scroll) {
    return (
      <SafeAreaView style={[styles.safe, fondo]} edges={edges}>
        {/* flex:1 en el contenedor: el hijo (p. ej. un FlatList) necesita
            altura acotada para poder hacer scroll propio. */}
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={[styles.content, styles.flex, contentStyle]}>{children}</View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, fondo]} edges={edges}>
      {/* El formulario nunca queda bajo el teclado (iOS 'padding'; en Android
          ajusta la ventana el `windowSoftInputMode` por defecto de Expo). */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.content, contentStyle]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          refreshControl={
            refrescar ? (
              <RefreshControl
                refreshing={refrescando}
                onRefresh={refrescar}
                tintColor={theme.primary}
                colors={[theme.primary]}
                progressBackgroundColor={theme.backgroundElement}
              />
            ) : undefined
          }>
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  content: {
    padding: Spacing.three,
    paddingBottom: Spacing.six,
    gap: Spacing.three,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
});
