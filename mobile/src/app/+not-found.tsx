import { StyleSheet } from 'react-native';
import { Text } from '@/components/text';
import { Link } from 'expo-router';

import { Screen } from '@/components/ui/screen';
import { useEstadoAuth } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';
import { fam, FontSize, Spacing } from '@/constants/theme';

export default function NotFoundScreen() {
  const theme = useTheme();
  const estado = useEstadoAuth();
  // Sin sesión, "volver al inicio" llevaría a una ruta protegida que el
  // guard rebota al login: mejor llevar directamente al acceso.
  const destino = estado === 'autenticado' ? '/(tabs)' : '/(auth)/login';

  return (
    <Screen contentStyle={styles.contenido}>
      <Text style={[styles.titulo, { color: theme.text }]}>Pantalla no encontrada</Text>
      <Text style={[styles.texto, { color: theme.textSecondary }]}>
        La ruta que buscas no existe en Cuidapp.
      </Text>
      <Link href={destino} style={[styles.enlace, { color: theme.primary }]}>
        {estado === 'autenticado' ? 'Volver al inicio' : 'Ir al acceso'}
      </Link>
    </Screen>
  );
}

const styles = StyleSheet.create({
  contenido: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  titulo: {
    fontFamily: fam(800),
    fontSize: FontSize.xl,
    fontWeight: '800',
  },
  texto: {
    fontFamily: fam(400),
    fontSize: FontSize.sm,
  },
  enlace: {
    fontFamily: fam(700),
    fontSize: FontSize.base,
    fontWeight: '700',
    marginTop: Spacing.two,
  },
});
