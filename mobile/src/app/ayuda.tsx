import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { SectionHeader } from '@/components/ui/section-header';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';

/**
 * Tutorial integrado: el recorrido real de uso de la app, en lenguaje llano.
 * Mismos pasos que el manual de uso (fases 01–08) resumidos a lo esencial.
 */
const PASOS = [
  {
    titulo: 'Crea el perfil de la persona atendida',
    texto: 'Cuéntanos quién es, qué necesita y cómo organiza su día. Los datos de salud solo los ve la familia: nunca aparecen en la oferta pública.',
  },
  {
    titulo: 'Publica la oferta de cuidado',
    texto: 'Con el perfil publicado, cuidadores de tu zona pueden enviar candidaturas. Tú decides cuándo publicar y puedes editarla.',
  },
  {
    titulo: 'Compara las candidaturas',
    texto: 'Cada candidatura explica sus motivos de encaje: experiencia, disponibilidad, verificaciones y afinidad con las necesidades. Sin porcentajes inventados.',
  },
  {
    titulo: 'Elige y configura Mi cuidador',
    texto: 'Al seleccionar a alguien, fija en «Mi cuidador» el horario y la tarifa acordados, y decide qué puede ver y hacer: datos clínicos, informes, incidencias…',
  },
  {
    titulo: 'Organiza la rutina',
    texto: 'Añade tareas a diario o solo para hoy, marca las que se completan y consulta el progreso del día. Cualquier familiar de la cuenta puede ampliar la lista.',
  },
  {
    titulo: 'Sigue los informes',
    texto: 'Adherencia de la rutina, incidencias y historial reciente, para decidir con continuidad y compartirlo con quien haga falta.',
  },
];

export default function AyudaScreen() {
  const theme = useTheme();

  return (
    <Screen>
      <ScreenHeader titulo="Cómo funciona Cuidapp" subtitulo="Guía rápida en 6 pasos" />

      <ThemedText type="small" themeColor="textSecondary">
        Sigue esta guía la primera vez que abras la app y vuelve a consultarla cuando tengas dudas.
      </ThemedText>

      <SectionHeader titulo="Paso a paso" />
      <View style={styles.lista}>
        {PASOS.map((paso, indice) => (
          <Card key={paso.titulo} row>
            <View style={[styles.num, { backgroundColor: theme.primary }]}>
              <ThemedText type="smallBold" style={styles.numTexto}>
                {indice + 1}
              </ThemedText>
            </View>
            <View style={styles.flex}>
              <ThemedText type="smallBold">{paso.titulo}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {paso.texto}
              </ThemedText>
            </View>
          </Card>
        ))}
      </View>

      <SectionHeader titulo="Consejos útiles" />
      <Card>
        <ThemedText type="smallBold">Texto grande</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Si necesitas leer con más comodidad, activa «Texto grande» en la pestaña Perfil →
          Accesibilidad. Cambia todo el tamaño de la app al instante.
        </ThemedText>
      </Card>
      <Card>
        <ThemedText type="smallBold">Tus datos y los de la persona cuidada</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          La información clínica nunca se publica ni se comparte con candidatos. Solo la familia
          decide quién la ve, desde los permisos de «Mi cuidador».
        </ThemedText>
      </Card>
      <Card>
        <ThemedText type="smallBold">¿Necesitas ayuda con la cuenta?</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Desde la pestaña Perfil puedes editar tus datos, ver tu plan o cerrar la sesión. En modo
          demo, todos los datos son de ejemplo y viven en tu dispositivo.
        </ThemedText>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  lista: {
    gap: Spacing.two,
  },
  flex: {
    flex: 1,
    gap: 2,
  },
  num: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numTexto: {
    color: '#fff',
  },
});
