import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';
import Lucide from '@react-native-vector-icons/lucide';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Loading } from '@/components/ui/loading';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { SectionHeader } from '@/components/ui/section-header';
import { ThemedText } from '@/components/themed-text';
import { useContratarServicio, useServicios } from '@/hooks/use-servicios';
import { useTheme } from '@/hooks/use-theme';
import { useToast } from '@/hooks/use-toast';
import { Spacing } from '@/constants/theme';
import type { CategoriaServicio } from '@/types';

/** Iconos vectoriales (Lucide, lineal y redondeado según la guía visual) en
 * lugar de emoji: mismo tamaño, peso y color en todas las plataformas y
 * localizaciones. Decorativos: el nombre de la categoría ya se anuncia en su
 * sección. */
type IconoNombre = ComponentProps<typeof Lucide>['name'];

const ICONO_CATEGORIA: Record<CategoriaServicio, IconoNombre> = {
  gestoria: 'landmark',
  especialista: 'stethoscope',
  sanitario: 'hospital',
  formacion: 'graduation-cap',
};

const TITULO_CATEGORIA: Record<CategoriaServicio, string> = {
  gestoria: 'Gestión laboral',
  especialista: 'Especialistas',
  sanitario: 'Profesionales sanitarios',
  formacion: 'Formación',
};

export default function ServiciosScreen() {
  const theme = useTheme();
  const toast = useToast();
  const { data: servicios, isLoading, isError, refetch } = useServicios();
  const contratar = useContratarServicio();

  const cabecera = (
    <ScreenHeader
      titulo="Servicios complementarios"
      subtitulo="Paso 05 · Gestoría, especialistas y profesionales autorizados cuando los necesites."
    />
  );

  if (isLoading) return <Loading mensaje="Cargando catálogo…" />;

  if (isError) {
    return (
      <Screen>
        {cabecera}
        <ErrorState accion={{ texto: 'Reintentar', onPress: () => void refetch() }} />
      </Screen>
    );
  }

  const categorias: CategoriaServicio[] = ['gestoria', 'especialista', 'sanitario', 'formacion'];

  return (
    <Screen alRefrescar={() => void refetch()}>
      {cabecera}

      {categorias.map((categoria) => {
        const deCategoria = (servicios ?? []).filter((s) => s.categoria === categoria);
        if (deCategoria.length === 0) return null;
        return (
          <View key={categoria} style={styles.grupo}>
            <SectionHeader titulo={TITULO_CATEGORIA[categoria]} />
            {deCategoria.map((servicio) => (
              <Card key={servicio.id}>
                <View style={styles.cabecera}>
                  <Lucide
                    name={ICONO_CATEGORIA[servicio.categoria]}
                    size={22}
                    color={theme.primary}
                    accessibilityElementsHidden
                    importantForAccessibility="no-hide-descendants"
                  />
                  <View style={styles.flex}>
                    <ThemedText type="smallBold">{servicio.nombre}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {servicio.descripcion}
                    </ThemedText>
                  </View>
                  {servicio.contratado ? <Badge texto="Contratado" tono="success" /> : null}
                </View>
                {servicio.condiciones ? (
                  <ThemedText type="small" themeColor="textSecondary">
                    {servicio.condiciones}
                  </ThemedText>
                ) : null}
                {!servicio.contratado ? (
                  <Button
                    titulo="Añadir"
                    variante="secondary"
                    tamano="sm"
                    cargando={contratar.isPending && contratar.variables === servicio.id}
                    onPress={() =>
                      contratar.mutate(servicio.id, {
                        onSuccess: () => toast.exito(`${servicio.nombre}: añadido a tu espacio.`),
                      })
                    }
                  />
                ) : null}
              </Card>
            ))}
          </View>
        );
      })}

      {(servicios ?? []).length === 0 ? (
        <EmptyState
          titulo="Sin servicios disponibles"
          descripcion="El catálogo se irá ampliando con nuevas gestorías y especialistas."
        />
      ) : null}

      <Card>
        <ThemedText type="small" themeColor="textSecondary" style={styles.nota}>
          Cada servicio define responsabilidades, condiciones, permisos y forma de contratación.
          Los accesos son diferenciados: la gestoría laboral gestiona contratos y nóminas; los
          especialistas trabajan sobre el plan de cuidados acordado con la familia.
        </ThemedText>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  grupo: {
    gap: Spacing.two,
  },
  cabecera: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  flex: {
    flex: 1,
    gap: 2,
  },
  nota: {
    lineHeight: 20,
  },
});
