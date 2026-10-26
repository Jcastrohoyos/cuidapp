import { StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/ui/avatar';
import { Badge, badgeEstadoPerfil } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ThemedText } from '@/components/themed-text';
import { calcularEdad, formatearHorario } from '@/utils/format';
import { Spacing } from '@/constants/theme';
import type { PerfilCuidado } from '@/types';

interface TarjetaPerfilProps {
  perfil: PerfilCuidado;
  /** Muestra el horario pactado debajo de la ubicación. */
  mostrarHorario?: boolean;
  onPress?: () => void;
  accessibilityHint?: string;
}

/**
 * Tarjeta de una persona a cargo: avatar, nombre y edad, ubicación y estado.
 * La usan la portada (perfil activo) y la lista de perfiles: si solo viviera
 * en una pantalla, las dos se irían desincronizando.
 */
export function TarjetaPerfil({
  perfil,
  mostrarHorario = false,
  onPress,
  accessibilityHint,
}: TarjetaPerfilProps) {
  return (
    <Card row onPress={onPress} accessibilityHint={accessibilityHint}>
      <Avatar nombre={perfil.persona.nombre} tamano="lg" />
      <View style={styles.flex}>
        <ThemedText type="smallBold">
          {perfil.persona.nombre}
          {perfil.persona.fechaNacimiento
            ? `, ${calcularEdad(perfil.persona.fechaNacimiento)} años`
            : ''}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {perfil.ubicacion.zona}, {perfil.ubicacion.ciudad}
        </ThemedText>
        {mostrarHorario ? (
          <ThemedText type="small" themeColor="textSecondary">
            {formatearHorario(perfil.horario.dias, perfil.horario.desde, perfil.horario.hasta)}
          </ThemedText>
        ) : null}
      </View>
      <Badge {...badgeEstadoPerfil(perfil.estado)} />
    </Card>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    gap: 2,
  },
  separador: {
    height: Spacing.two,
  },
});
