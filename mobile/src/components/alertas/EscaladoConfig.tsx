import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { fam, FontSize, Radius, Spacing, Color } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch';
import { SectionHeader } from '@/components/ui/section-header';
import type { ConfigEscalado, NivelEscalado } from '@/types';

export interface EscaladoConfigProps {
  escalado: ConfigEscalado | undefined;
  onCambiar: (escalado: ConfigEscalado | undefined) => void;
  soloLectura?: boolean;
}

export function EscaladoConfig({ escalado, onCambiar, soloLectura = false }: EscaladoConfigProps) {
  const theme = useTheme();
  const [niveles, setNiveles] = useState<NivelEscalado[]>(escalado?.niveles || []);
  const [tiempoMaximo, setTiempoMaximo] = useState(escalado?.tiempoMaximoSinRespuesta || 30);
  const [activo, setActivo] = useState(!!escalado);

  const actualizarEscalado = useCallback(() => {
    if (!activo) {
      onCambiar(undefined);
      return;
    }
    onCambiar({
      niveles: niveles.map((n, i) => ({ ...n, orden: i + 1 })),
      tiempoMaximoSinRespuesta: tiempoMaximo,
    });
  }, [activo, niveles, tiempoMaximo, onCambiar]);

  const handleToggleActivo = useCallback((v: boolean) => {
    setActivo(v);
    if (v && niveles.length === 0) {
      setNiveles([{
        orden: 1,
        tipo: 'push_local',
        destinatario: 'familia',
        mensajePlantilla: 'ALERTA: {titulo} - {mensaje}',
        retrasoMinutos: 0,
        requiereConfirmacion: true,
      }]);
    }
    actualizarEscalado();
  }, [niveles.length, actualizarEscalado]);

  const handleAñadirNivel = useCallback(() => {
    const nuevoNivel: NivelEscalado = {
      orden: niveles.length + 1,
      tipo: 'push_local',
      destinatario: 'familia',
      mensajePlantilla: 'ALERTA: {titulo} - {mensaje}',
      retrasoMinutos: niveles.length === 0 ? 0 : 30,
      requiereConfirmacion: niveles.length === 0,
    };
    setNiveles([...niveles, nuevoNivel]);
    actualizarEscalado();
  }, [niveles, actualizarEscalado]);

  const handleEliminarNivel = useCallback((index: number) => {
    if (niveles.length <= 1) {
      Alert.alert('Mínimo 1 nivel', 'Debe haber al menos un nivel de escalado');
      return;
    }
    Alert.alert(
      'Eliminar nivel',
      '¿Seguro que quieres eliminar este nivel?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            const nuevos = niveles.filter((_, i) => i !== index);
            setNiveles(nuevos.map((n, i) => ({ ...n, orden: i + 1 })));
            actualizarEscalado();
          },
        },
      ],
    );
  }, [niveles, actualizarEscalado]);

  const handleReordenar = useCallback((from: number, to: number) => {
    const nuevos = [...niveles];
    const [quitado] = nuevos.splice(from, 1);
    nuevos.splice(to, 0, quitado);
    setNiveles(nuevos.map((n, i) => ({ ...n, orden: i + 1 })));
    actualizarEscalado();
  }, [niveles, actualizarEscalado]);

  return (
    <View style={styles.container}>
      {/* Toggle principal */}
      <View style={styles.checkboxRow}>
        <Switch
          value={activo}
          onValueChange={handleToggleActivo}
          disabled={soloLectura}
        />
        <ThemedText style={styles.checkboxLabel}>Activar escalado automático</ThemedText>
      </View>

      {!activo && (
        <ThemedText style={styles.inactivoMensaje}>
          El escalado notifica a otros contactos si la alerta no se responde en el tiempo configurado.
        </ThemedText>
      )}

      {activo && (
        <>
          <View style={styles.inputRow}>
            <Input
              label="Tiempo máximo sin respuesta (minutos)"
              type="numeric"
              value={String(tiempoMaximo)}
              onChangeText={(v) => {
                const val = parseInt(v) || 30;
                setTiempoMaximo(val);
                actualizarEscalado();
              }}
              min={1}
              max={1440}
              disabled={soloLectura}
            />
            {soloLectura && <ThemedText style={styles.ayuda}>Edita la regla para modificar</ThemedText>}
          </View>

          <SectionHeader titulo="Niveles de escalado" />
          <ThemedText style={styles.ayuda}>
            Se ejecutan en orden si no hay respuesta. Arrastra para reordenar (próximamente).
          </ThemedText>

          {niveles.map((nivel, index) => (
            <Card key={index} style={styles.nivelCard}>
              <View style={styles.nivelHeader}>
                <ThemedText style={styles.nivelNumero}>Nivel {nivel.orden}</ThemedText>
                <Pressable
                  style={styles.deleteButton}
                  onPress={() => handleEliminarNivel(index)}
                  disabled={soloLectura || niveles.length <= 1}
                >
                  <ThemedText style={styles.deleteText}>Eliminar</ThemedText>
                </Pressable>
              </View>

              <View style={styles.inputRow}>
                <Select
                  label="Tipo"
                  value={nivel.tipo}
                  options={[
                    { value: 'push_local', label: 'Push local (mismo dispositivo)' },
                    { value: 'push_familia', label: 'Push a familia (futuro)' },
                    { value: 'contacto_emergencia', label: 'Contacto de emergencia' },
                    { value: 'sms', label: 'SMS (requiere Twilio)' },
                    { value: 'llamada', label: 'Llamada (requiere Twilio)' },
                  ]}
                  onChange={(v) => {
                    const nuevos = [...niveles];
                    nuevos[index] = { ...nuevos[index], tipo: v as any };
                    setNiveles(nuevos);
                    actualizarEscalado();
                  }}
                  disabled={soloLectura}
                />
                <Select
                  label="Destinatario"
                  value={nivel.destinatario}
                  options={[
                    { value: 'familia', label: 'Familia' },
                    { value: 'cuidador', label: 'Cuidador' },
                    { value: 'contacto_emergencia', label: 'Contacto emergencia' },
                    { value: 'telefono_personalizado', label: 'Teléfono personalizado' },
                  ]}
                  onChange={(v) => {
                    const nuevos = [...niveles];
                    nuevos[index] = { ...nuevos[index], destinatario: v as any };
                    setNiveles(nuevos);
                    actualizarEscalado();
                  }}
                  disabled={soloLectura}
                />
              </View>

              {nivel.destinatario === 'telefono_personalizado' && (
                <Input
                  label="Teléfono"
                  placeholder="+34 600 000 000"
                  value={nivel.telefono || ''}
                  onChangeText={(v) => {
                    const nuevos = [...niveles];
                    nuevos[index] = { ...nuevos[index], telefono: v };
                    setNiveles(nuevos);
                    actualizarEscalado();
                  }}
                  type="phone-pad"
                  disabled={soloLectura}
                />
              )}

              <View style={styles.inputRow}>
                <Input
                  label="Retraso (minutos)"
                  type="numeric"
                  value={String(nivel.retrasoMinutos)}
                  onChangeText={(v) => {
                    const nuevos = [...niveles];
                    nuevos[index] = { ...nuevos[index], retrasoMinutos: parseInt(v) || 0 };
                    setNiveles(nuevos);
                    actualizarEscalado();
                  }}
                  min={0}
                  max={1440}
                  disabled={soloLectura}
                />
                <Switch
                  label="Requiere confirmación"
                  value={nivel.requiereConfirmacion}
                  onValueChange={(v) => {
                    const nuevos = [...niveles];
                    nuevos[index] = { ...nuevos[index], requiereConfirmacion: v };
                    setNiveles(nuevos);
                    actualizarEscalado();
                  }}
                  disabled={soloLectura}
                />
              </View>

              <Input
                label="Plantilla de mensaje"
                placeholder="ALERTA: {titulo} - {mensaje}"
                value={nivel.mensajePlantilla}
                onChangeText={(v) => {
                  const nuevos = [...niveles];
                  nuevos[index] = { ...nuevos[index], mensajePlantilla: v };
                  setNiveles(nuevos);
                  actualizarEscalado();
                }}
                disabled={soloLectura}
              />

              {/* Variables: {{titulo}}, {{mensaje}}, {{prioridad}}, {{fechaHora} */}
              <ThemedText style={styles.variablesAyuda}>
                Variables disponibles: titulo, mensaje, prioridad, fechaHora
              </ThemedText>
            </Card>
          ))}

          <Pressable
            style={styles.addButton}
            onPress={handleAñadirNivel}
            disabled={soloLectura}
          >
            <ThemedText style={styles.addButtonText}>+ Añadir nivel de escalado</ThemedText>
          </Pressable>

          <ThemedText style={styles.ayuda}>
            {niveles.length} nivel{niveles.length !== 1 ? 'es' : ''} configurado{niveles.length !== 1 ? 's' : ''}. 
            Tiempo total máximo: {niveles.reduce((sum, n) => sum + n.retrasoMinutos, 0)} min.
          </ThemedText>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.three,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  checkboxLabel: {
    fontFamily: fam(500),
    fontSize: FontSize.md,
    color: Color.gray700,
    flex: 1,
  },
  inactivoMensaje: {
    fontFamily: fam(400),
    fontSize: FontSize.sm,
    color: Color.gray500,
    marginBottom: Spacing.two,
  },
  inputRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    flexWrap: 'wrap',
  },
  ayuda: {
    fontFamily: fam(400),
    fontSize: FontSize.xs,
    color: Color.gray500,
    marginBottom: Spacing.two,
  },
  nivelCard: {
    marginBottom: Spacing.three,
    gap: Spacing.two,
  },
  nivelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nivelNumero: {
    fontFamily: fam(700),
    fontSize: FontSize.md,
    color: Color.teal700,
  },
  deleteButton: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Radius.sm,
    backgroundColor: Color.red50,
  },
  deleteText: {
    fontFamily: fam(600),
    fontSize: FontSize.xs,
    color: Color.red600,
  },
  variablesAyuda: {
    fontFamily: fam(400),
    fontSize: FontSize.xs,
    color: Color.gray500,
    marginTop: 4,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.two,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Color.gray400,
  },
  addButtonText: {
    fontFamily: fam(500),
    fontSize: FontSize.sm,
    color: Color.teal600,
  },
});