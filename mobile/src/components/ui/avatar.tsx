import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/text';

import { useTheme } from '@/hooks/use-theme';
import { fam, FontSize, Radius } from '@/constants/theme';
import { iniciales } from '@/utils/format';

interface AvatarProps {
  nombre: string;
  tamano?: 'md' | 'lg';
}

export function Avatar({ nombre, tamano = 'md' }: AvatarProps) {
  const theme = useTheme();
  const lado = tamano === 'lg' ? 56 : 40;
  const fuente = tamano === 'lg' ? FontSize.xl : FontSize.sm;

  return (
    <View
      // Decorativo: el nombre ya se lee junto al avatar; las iniciales
      // duplicarían la lectura de VoiceOver.
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.avatar,
        {
          width: lado,
          height: lado,
          borderRadius: lado / 2,
          backgroundColor: theme.primarySoftStrong,
        },
      ]}>
      <Text style={[styles.texto, { color: theme.primary, fontSize: fuente }]}>
        {iniciales(nombre)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  texto: {
    fontFamily: fam(800),
    fontWeight: '800',
    borderRadius: Radius.sm,
  },
});
