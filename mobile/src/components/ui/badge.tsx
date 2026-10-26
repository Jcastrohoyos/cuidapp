import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/text';

import { useTheme } from '@/hooks/use-theme';
import { fam, FontSize, Radius } from '@/constants/theme';
import type { EstadoPerfil } from '@/types';

export type Tono = 'neutral' | 'success' | 'warning' | 'primary';

interface BadgeProps {
  texto: string;
  tono?: Tono;
}

export function Badge({ texto, tono = 'neutral' }: BadgeProps) {
  const theme = useTheme();
  const colores: Record<Tono, { fondo: string; texto: string }> = {
    neutral: { fondo: theme.backgroundSelected, texto: theme.textSecondary },
    success: { fondo: theme.successSoft, texto: theme.success },
    warning: { fondo: theme.warningSoft, texto: theme.warning },
    primary: { fondo: theme.primarySoftStrong, texto: theme.primary },
  };
  const c = colores[tono];

  return (
    <View style={[styles.badge, { backgroundColor: c.fondo }]}>
      <Text style={[styles.texto, { color: c.texto }]} numberOfLines={1}>
        {texto}
      </Text>
    </View>
  );
}

/** Texto y tono del badge para cada estado del perfil de cuidado.
 * `Record` exhaustivo: sumar un estado al modelo obliga a definir su badge. */
const BADGES_ESTADO_PERFIL: Record<EstadoPerfil, { texto: string; tono: Tono }> = {
  borrador: { texto: 'Borrador', tono: 'neutral' },
  publicado: { texto: 'Publicado', tono: 'primary' },
  en_seleccion: { texto: 'En selección', tono: 'warning' },
  con_cuidador: { texto: 'Con cuidador', tono: 'success' },
};

export const badgeEstadoPerfil = (estado: EstadoPerfil): { texto: string; tono: Tono } =>
  BADGES_ESTADO_PERFIL[estado];

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
  },
  texto: {
    fontFamily: fam(700),
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
});
