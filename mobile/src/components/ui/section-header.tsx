import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/text';

import { useTheme } from '@/hooks/use-theme';
import { fam, FontSize, Spacing } from '@/constants/theme';

interface SectionHeaderProps {
  titulo: string;
  accion?: { texto: string; onPress: () => void };
  children?: ReactNode;
}

export function SectionHeader({ titulo, accion, children }: SectionHeaderProps) {
  const theme = useTheme();

  return (
    <View style={styles.contenedor}>
      <View style={styles.textos}>
        <Text style={[styles.titulo, { color: theme.text }]}>{titulo}</Text>
        {children}
      </View>
      {accion ? (
        <Pressable
          accessibilityRole="button"
          onPress={accion.onPress}
          hitSlop={12}
          accessibilityLabel={accion.texto}>
          <Text style={[styles.accion, { color: theme.primary }]}>{accion.texto}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  textos: {
    flex: 1,
    gap: 2,
  },
  titulo: {
    fontFamily: fam(800),
    fontSize: FontSize.lg,
    fontWeight: '800',
  },
  accion: {
    fontFamily: fam(700),
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
});
