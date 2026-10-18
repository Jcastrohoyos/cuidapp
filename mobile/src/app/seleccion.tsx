import { useLocalSearchParams, router } from 'expo-router';
import React, { useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { Text } from '@/components/text';

import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Loading } from '@/components/ui/loading';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { ThemedText } from '@/components/themed-text';
import { useCandidatos, useSeleccionarCandidato } from '@/hooks/use-servicios';
import { usePerfilActivo } from '@/hooks/use-perfiles';
import { useTheme } from '@/hooks/use-theme';
import { useToast } from '@/hooks/use-toast';
import { calcularAfinidad } from '@/utils/afinidad';
import { confirmar } from '@/utils/confirmar';
import { formatearDecimal, formatearEuro } from '@/utils/format';
import { fam, FontSize, Spacing } from '@/constants/theme';
import type { CandidatoComparado } from '@/types';

interface CandidatoFilaProps {
  item: CandidatoComparado;
  competenciasRequeridas: string[];
  elegido: boolean;
  destacar: boolean;
  onSelect: (id: string, nombreCuidador: string) => void;
}

const CandidatoFila = React.memo(function CandidatoFila({
  item: { candidatura, cuidador },
  competenciasRequeridas,
  elegido,
  destacar,
  onSelect,
}: CandidatoFilaProps) {
  const theme = useTheme();
  const todasVerificadas =
    cuidador.verificaciones.length > 0 &&
    cuidador.verificaciones.every((v) => v.estado === 'verificada');
  const textoVerificado = todasVerificadas ? '✓ Verificado' : 'Verificación pendiente';
  const colorVerificado = todasVerificadas ? theme.success : theme.warning;
  // % de afinidad: solo si hay competencias que comparar (nada inventado).
  const afinidad = calcularAfinidad(competenciasRequeridas, cuidador.competencias);
  const tonoAfinidad =
    afinidad === null
      ? 'neutral'
      : afinidad >= 70
        ? 'success'
        : afinidad >= 40
          ? 'primary'
          : 'neutral';

  return (
    <Card
      style={destacar && !elegido ? { borderColor: theme.primary, borderWidth: 1.5 } : undefined}>
      <View style={styles.cabecera}>
        <Avatar nombre={cuidador.nombre} />
        <View style={styles.flex}>
          <View style={styles.nombreFila}>
            <ThemedText type="smallBold">{cuidador.nombre}</ThemedText>
            <Text style={[styles.verificado, { color: colorVerificado }]}>
              {textoVerificado}
            </Text>
          </View>
          <ThemedText type="small" themeColor="textSecondary">
            {cuidador.anosExperiencia} años de experiencia
            {cuidador.valoracion
              ? ` · ★ ${formatearDecimal(cuidador.valoracion)} (${cuidador.valoraciones ?? 0})`
              : ''}
            {cuidador.distanciaKm ? ` · a ${cuidador.distanciaKm} km` : ''}
            {cuidador.tarifaHora ? ` · ${formatearEuro(cuidador.tarifaHora)}/h` : ''}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Disponibilidad: {cuidador.disponibilidad}
          </ThemedText>
        </View>
        {elegido ? (
          <Badge texto="Seleccionado" tono="success" />
        ) : afinidad !== null ? (
          <Badge texto={`Afinidad ${afinidad}%`} tono={tonoAfinidad} />
        ) : null}
      </View>

      <View style={styles.chips}>
        {candidatura.motivosAfinidad.map((motivo) => (
          <Chip key={motivo} texto={motivo} seleccionado />
        ))}
      </View>

      <View style={styles.chips}>
        {cuidador.verificaciones.map((verificacion) => (
          <Chip
            key={verificacion.tipo}
            texto={`${TEXTOS_VERIFICACION[verificacion.tipo]}: ${
              verificacion.estado === 'verificada'
                ? 'verificada'
                : verificacion.estado === 'pendiente'
                  ? 'pendiente'
                  : 'no aplica'
            }`}
          />
        ))}
      </View>

      {candidatura.mensaje ? (
        <ThemedText type="small" themeColor="textSecondary">
          “{candidatura.mensaje}”
        </ThemedText>
      ) : null}

      <Button
        titulo={elegido ? 'Cuidador asignado' : 'Seleccionar'}
        variante={elegido ? 'ghost' : 'primary'}
        tamano="sm"
        disabled={elegido}
        onPress={() => onSelect(candidatura.id, cuidador.nombre)}
      />
    </Card>
  );
});

export default function SeleccionScreen() {
  const { destacar } = useLocalSearchParams<{ destacar?: string }>();
  const theme = useTheme();
  const toast = useToast();
  const { perfil, isLoading, esError, refetch } = usePerfilActivo();
  const candidatos = useCandidatos(perfil?.id ?? '');
  const seleccionar = useSeleccionarCandidato(perfil?.id ?? '');
  const [refrescando, setRefrescando] = useState(false);

  const cabecera = (
    <ScreenHeader
      titulo="Selección del cuidador"
      subtitulo="Paso 04 · Compara experiencia, disponibilidad y afinidad para decidir con información."
    />
  );

  const refrescar = async () => {
    setRefrescando(true);
    try {
      await candidatos.refetch();
    } finally {
      setRefrescando(false);
    }
  };

  if (isLoading || candidatos.isLoading) {
    return <Loading mensaje="Comparando candidatos…" />;
  }

  if (esError || candidatos.isError) {
    return (
      <Screen scroll={false}>
        <View style={styles.cuerpo}>
          {cabecera}
          <ErrorState
            accion={{
              texto: 'Reintentar',
              onPress: () => {
                void refetch();
                void candidatos.refetch();
              },
            }}
          />
        </View>
      </Screen>
    );
  }

  if (!perfil) {
    return (
      <Screen scroll={false}>
        <View style={styles.cuerpo}>
          {cabecera}
          <EmptyState
            titulo="Sin perfil de cuidado"
            descripcion="La comparación de candidaturas parte del perfil de cuidado de tu familiar."
            accion={{
              texto: 'Crear perfil de cuidado',
              onPress: () => router.push('/cuidado/nuevo'),
            }}
          />
        </View>
      </Screen>
    );
  }

  const lista = candidatos.data ?? [];

  return (
    <Screen scroll={false}>
      <View style={styles.cuerpo}>
        {cabecera}

        <FlatList
          data={lista}
          keyExtractor={(item) => item.candidatura.id}
          renderItem={({ item }) => (
            <CandidatoFila
              item={item}
              competenciasRequeridas={perfil.competenciasRequeridas}
              elegido={item.candidatura.estado === 'seleccionada'}
              destacar={destacar === item.candidatura.id && item.candidatura.estado !== 'seleccionada'}
              onSelect={(id, nombre) =>
                // Asignar un cuidador reorganiza toda la rutina: se confirma.
                confirmar(
                  {
                    titulo: `Seleccionar a ${nombre}`,
                    mensaje:
                      'Se convertirá en el cuidador de la rutina diaria de tu familiar. Podrás cambiarlo más adelante desde el perfil. ¿Continuar?',
                    accion: 'Seleccionar',
                  },
                  () =>
                    seleccionar.mutate(id, {
                      onSuccess: () =>
                        toast.exito(
                          'Cuidador seleccionado: ya podéis coordinar la rutina desde Inicio.',
                        ),
                    }),
                )
              }
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={refrescando}
              onRefresh={refrescar}
              tintColor={theme.primary}
              colors={[theme.primary]}
              progressBackgroundColor={theme.backgroundElement}
            />
          }
          contentContainerStyle={styles.lista}
        />

        {lista.length === 0 && (
          <EmptyState
            titulo="Sin candidaturas todavía"
            descripcion="Cuando los cuidadores presenten su candidatura aparecerán aquí para compararlas."
          />
        )}

        <Card style={styles.notaCard}>
          <ThemedText type="small" themeColor="textSecondary" style={styles.nota}>
            El % de afinidad y los motivos del encaje salen de datos registrados —competencias
            necesarias y declaradas, ubicación, disponibilidad, experiencia y verificaciones—;
            nunca de estimaciones inventadas. La decisión final es siempre de la familia.
          </ThemedText>
        </Card>
      </View>
    </Screen>
  );
}

const TEXTOS_VERIFICACION: Record<string, string> = {
  identidad: 'Identidad',
  formacion: 'Formación',
  penales: 'Antecedentes',
  referencias: 'Referencias',
};

const styles = StyleSheet.create({
  cuerpo: {
    flex: 1,
    gap: Spacing.three,
  },
  cabecera: {
    flexDirection: 'row',
    gap: Spacing.three,
    alignItems: 'flex-start',
  },
  nombreFila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  verificado: {
    fontFamily: fam(700),
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  flex: {
    flex: 1,
    gap: 2,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  lista: {
    paddingVertical: Spacing.two,
    gap: Spacing.two,
  },
  notaCard: {
    marginTop: Spacing.two,
  },
  nota: {
    lineHeight: 20,
  },
});
