import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/text';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ProgressBar } from '@/components/ui/progress-bar';
import { SectionHeader } from '@/components/ui/section-header';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import type { PasoRecorrido } from '@/hooks/use-recorrido';
import { fam, FontSize, Radius, Spacing } from '@/constants/theme';
import { porcentaje } from '@/utils/format';

interface RecorridoProps {
  pasos: PasoRecorrido[];
  completados: number;
  total: number;
  /** Ruta real del paso 02 (perfil existente o creación). */
  rutaPerfil: PasoRecorrido['ruta'];
  onIr: (ruta: PasoRecorrido['ruta']) => void;
}

/**
 * Recorrido de los 7 pasos del producto. Muestra el progreso global y SOLO los
 * pasos pendientes (los completados quedan en el contador), para que la home
 * diga siempre "qué toca ahora" en lugar de números sueltos de pasos que ya
 * se hicieron o todavía no tocan.
 */
export function Recorrido({ pasos, completados, total, rutaPerfil, onIr }: RecorridoProps) {
  const theme = useTheme();
  const pendientes = pasos.filter((paso) => paso.estado !== 'completado');

  if (pendientes.length === 0) {
    return (
      <Card>
        <SectionHeader titulo="Continuar el recorrido" />
        <View style={styles.completado}>
          <Badge texto="Recorrido completado" tono="success" />
          <ThemedText type="small" themeColor="textSecondary">
            Has dado los 7 pasos de Cuidapp. Consulta informes y mantén la rutina al día.
          </ThemedText>
        </View>
      </Card>
    );
  }

  return (
    <>
      <SectionHeader titulo="Continuar el recorrido" />
      <Card>
        <ProgressBar
          valor={porcentaje(completados, total)}
          etiqueta="Pasos completados"
          detalle={`${completados} / ${total}`}
        />
      </Card>
      <View style={styles.lista}>
        {pendientes.map((paso) => {
          const actual = paso.estado === 'actual';
          return (
            <Card
              key={paso.num}
              row
              onPress={() => onIr(paso.num === '02' ? rutaPerfil : paso.ruta)}
              accessibilityHint={`Abre el paso ${paso.num}, ${paso.titulo}`}>
              <View
                style={[
                  styles.num,
                  {
                    backgroundColor: actual ? theme.primary : theme.backgroundSelected,
                    borderColor: actual ? theme.primary : theme.border,
                  },
                ]}>
                <Text
                  style={[styles.numTexto, { color: actual ? theme.primaryText : theme.textSecondary }]}>
                  {paso.num}
                </Text>
              </View>
              <View style={styles.textos}>
                <ThemedText type="smallBold">{paso.titulo}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {paso.sub}
                </ThemedText>
              </View>
              {actual ? (
                <Badge texto="Ahora" tono="primary" />
              ) : (
                <Text style={[styles.flecha, { color: theme.textSecondary }]}>›</Text>
              )}
            </Card>
          );
        })}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  lista: {
    gap: Spacing.two,
  },
  num: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numTexto: {
    fontFamily: fam(800),
    fontSize: FontSize.sm,
    fontWeight: '800',
  },
  textos: {
    flex: 1,
    gap: 2,
  },
  flecha: {
    fontFamily: fam(300),
    fontSize: FontSize.xl,
    fontWeight: '300',
  },
  completado: {
    gap: Spacing.two,
    alignItems: 'flex-start',
  },
});
