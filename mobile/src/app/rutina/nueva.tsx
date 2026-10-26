import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/text';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CampoTexto } from '@/components/ui/field';
import { Chip } from '@/components/ui/chip';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { ThemedText } from '@/components/themed-text';
import { usePerfilActivo } from '@/hooks/use-perfiles';
import { useRutina } from '@/hooks/use-rutina';
import { useTheme } from '@/hooks/use-theme';
import { useToast } from '@/hooks/use-toast';
import { fechaHoy } from '@/utils/format';
import { esHoraValida, HORA_POR_MOMENTO } from '@/utils/rutina';
import { fam, FontSize, Spacing } from '@/constants/theme';
import type { MomentoDia, RepeticionTarea } from '@/types';

const MOMENTOS: { valor: MomentoDia; texto: string }[] = [
  { valor: 'manana', texto: 'Mañana' },
  { valor: 'mediodia', texto: 'Mediodía' },
  { valor: 'tarde', texto: 'Tarde' },
  { valor: 'noche', texto: 'Noche' },
];

const REPETICIONES: { valor: RepeticionTarea; texto: string }[] = [
  { valor: 'diaria', texto: 'A diario' },
  { valor: 'unica', texto: 'Solo hoy' },
];

export default function NuevaTareaScreen() {
  const theme = useTheme();
  const toast = useToast();
  const { perfil, id } = usePerfilActivo();
  const rutina = useRutina(id ?? '', fechaHoy());

  const [nombre, setNombre] = useState('');
  const [hora, setHora] = useState('');
  const [momento, setMomento] = useState<MomentoDia>('manana');
  const [repeticion, setRepeticion] = useState<RepeticionTarea>('diaria');
  const [errores, setErrores] = useState<{ nombre?: string; hora?: string }>({});

  const guardar = () => {
    const siguiente: { nombre?: string; hora?: string } = {};
    if (nombre.trim().length < 3) siguiente.nombre = 'Escribe un nombre con al menos 3 letras.';
    if (hora.trim() && !esHoraValida(hora)) siguiente.hora = 'Formato de hora: 09:00 (de 00:00 a 23:59).';
    setErrores(siguiente);
    if (Object.keys(siguiente).length > 0) return;

    rutina.agregar.mutate(
      {
        nombre: nombre.trim(),
        momento,
        hora: hora.trim() || HORA_POR_MOMENTO[momento],
        repeticion,
      },
      {
        onSuccess: (tarea) => {
          toast.exito(
            tarea.repeticion === 'unica'
              ? `"${tarea.nombre}" se verá solo hoy en la rutina.`
              : `"${tarea.nombre}" se añadió a la rutina de cada día.`,
          );
          router.back();
        },
      },
    );
  };

  return (
    <Screen>
      <ScreenHeader
        variante="cerrar"
        titulo="Añadir a la rutina"
        subtitulo={
          perfil
            ? `Algo nuevo para el equipo de cuidado de ${personaCorta(perfil.persona.nombre)}.`
            : 'Algo nuevo para el equipo de cuidado.'
        }
      />

      <Card>
        <CampoTexto
          label="¿Qué hay que hacer?"
          valor={nombre}
          onChangeTexto={setNombre}
          error={errores.nombre}
          placeholder="Poner la lavada"
        />

        <View style={styles.bloque}>
          <Text style={[styles.etiqueta, { color: theme.textSecondary }]}>Momento del día</Text>
          <View style={styles.chips}>
            {MOMENTOS.map((m) => (
              <Chip
                key={m.valor}
                texto={m.texto}
                seleccionado={momento === m.valor}
                onPress={() => setMomento(m.valor)}
              />
            ))}
          </View>
        </View>

        <CampoTexto
          label="Hora (opcional)"
          valor={hora}
          onChangeTexto={setHora}
          error={errores.hora}
          placeholder={HORA_POR_MOMENTO[momento]}
          teclado="numbers-and-punctuation"
        />

        <View style={styles.bloque}>
          <Text style={[styles.etiqueta, { color: theme.textSecondary }]}>Repite</Text>
          <View style={styles.chips}>
            {REPETICIONES.map((r) => (
              <Chip
                key={r.valor}
                texto={r.texto}
                seleccionado={repeticion === r.valor}
                onPress={() => setRepeticion(r.valor)}
              />
            ))}
          </View>
          <ThemedText type="small" themeColor="textSecondary">
            {repeticion === 'diaria'
              ? 'Aparecerá cada día en la rutina, como la medicación o el paseo.'
              : 'Solo se verá hoy: mañana desaparece sola de la rutina.'}
          </ThemedText>
        </View>
      </Card>

      <Button
        titulo="Guardar en la rutina"
        fullWidth
        cargando={rutina.agregar.isPending}
        onPress={guardar}
      />
    </Screen>
  );
}

/** "Ana Martínez" → "Ana": la rutina se dirige en día a día, no formal. */
function personaCorta(nombre: string): string {
  return nombre.split(' ')[0] ?? nombre;
}

const styles = StyleSheet.create({
  bloque: {
    gap: Spacing.two,
  },
  etiqueta: {
    fontFamily: fam(700),
    fontSize: FontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
});
