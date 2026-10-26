import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View, Switch } from 'react-native';
import { router } from 'expo-router';
import { fam, FontSize, Radius, Spacing, Color } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SectionHeader } from '@/components/ui/section-header';
import { ModalPermisosNotificaciones, useNotificaciones, notificacionesOnboardingCompleto } from '@/notifications';
import { useDataStore } from '@/store/data-store';
import type { ConfigNotificaciones, PrioridadAlerta } from '@/types';

const PRIORIDADES: PrioridadAlerta[] = ['baja', 'media', 'alta', 'critica'];

export function NotificacionesSettings() {
  const theme = useTheme();
  const { permisosConcedidos, tokenRegistrado, inicializar, programarHoy } = useNotificaciones();
  const [mostrarModalPermisos, setMostrarModalPermisos] = useState(false);
  const [config, setConfig] = useState<ConfigNotificaciones | null>(null);
  const [cargando, setCargando] = useState(true);
  const [perfilConfigs, setPerfilConfigs] = useState<Record<string, Partial<ConfigNotificaciones>> >({});
  const [perfilSeleccionado, setPerfilSeleccionado] = useState<string | null>(null);

  // Obtener perfiles del store
  const perfiles = useDataStore((state) => state.perfiles);

  const cargarConfig = useCallback(async () => {
    setCargando(true);
    try {
      const { getConfigNotificaciones } = await import('@/api/mock-db');
      const global = await getConfigNotificaciones();
      setConfig(global);
      // Cargar configs por perfil
      const perfilesConfig: Record<string, Partial<ConfigNotificaciones>> = {};
      for (const p of perfiles) {
        const { getConfigNotificacionesPerfil } = await import('@/api/mock-db');
        let perfilConfig = await getConfigNotificacionesPerfil(p.id) as Partial<ConfigNotificaciones>;
        // Ensure noMolestar has all required properties
        if (perfilConfig.noMolestar && !('permitirCriticas' in perfilConfig.noMolestar)) {
          const noMolestar = perfilConfig.noMolestar as { activado: boolean; inicio: string; fin: string; permitirCriticas?: boolean };
          perfilConfig = {
            ...perfilConfig,
            noMolestar: { ...noMolestar, permitirCriticas: true }
          };
        }
        perfilesConfig[p.id] = perfilConfig;
      }
      setPerfilConfigs(perfilesConfig);
    } catch (e) {
      console.error('[NotificacionesSettings] Error cargando:', e);
    } finally {
      setCargando(false);
    }
  }, [perfiles]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const timer = setTimeout(() => {
      cargarConfig();
    }, 0);
    return () => clearTimeout(timer);
  }, [cargarConfig]);

  const handleCambiarGlobal = useCallback(async (campo: keyof ConfigNotificaciones, valor: any) => {
    if (!config) return;
    const nueva = { ...config, [campo]: valor };
    try {
      const { setConfigNotificaciones } = await import('@/api/mock-db');
      await setConfigNotificaciones(nueva);
      setConfig(nueva);
    } catch (e) {
      console.error('[NotificacionesSettings] Error:', e);
    }
  }, [config]);

  const handleCambiarPerfil = useCallback(async (perfilId: string, campo: string, valor: any) => {
    const actual = perfilConfigs[perfilId] || {};
    const nueva = { ...actual, [campo]: valor };
    try {
      const { setConfigNotificacionesPerfil } = await import('@/api/mock-db');
      await setConfigNotificacionesPerfil(perfilId, nueva);
      setPerfilConfigs({ ...perfilConfigs, [perfilId]: nueva });
    } catch (e) {
      console.error('[NotificacionesSettings] Error:', e);
    }
  }, [perfilConfigs]);

  const handleSolicitarPermisos = useCallback(async () => {
    setMostrarModalPermisos(true);
  }, []);

  const handleProgramarHoy = useCallback(async () => {
    await programarHoy();
    Alert.alert('Listo', 'Alertas de hoy reprogramadas');
  }, [programarHoy]);

  if (cargando) {
    return (
      <View style={styles.loading}>
        <ThemedText style={styles.loadingText}>Cargando configuración...</ThemedText>
      </View>
    );
  }

  // Helper function to render profile-specific config
  const renderConfigPerfil = (perfilId: string, perfilConfig: Partial<ConfigNotificaciones>) => {
    const base = config!;
    const push = perfilConfig.pushHabilitado ?? base.pushHabilitado;
    const sonido = perfilConfig.sonidoHabilitado ?? base.sonidoHabilitado;

    return (
      <View style={styles.perfilDetalle}>
        <View style={styles.checkboxRow}>
          <Switch
            value={push}
            onValueChange={(v) => handleCambiarPerfil(perfilId, 'pushHabilitado', v)}
          />
          <View style={styles.checkboxInfo}>
            <ThemedText style={styles.checkboxTitle}>Push habilitado</ThemedText>
            <ThemedText style={styles.checkboxDesc}>
              {push ? 'Recibe notificaciones para esta persona' : 'Silenciar notificaciones de esta persona'}
            </ThemedText>
          </View>
        </View>

        <View style={styles.checkboxRow}>
          <Switch
            value={sonido}
            onValueChange={(v) => handleCambiarPerfil(perfilId, 'sonidoHabilitado', v)}
            disabled={!push}
          />
          <View style={styles.checkboxInfo}>
            <ThemedText style={styles.checkboxTitle}>Sonido</ThemedText>
            <ThemedText style={styles.checkboxDesc}>
              Reproducir sonido para alertas de esta persona
            </ThemedText>
          </View>
        </View>

        <Pressable
          style={styles.botonLimpiar}
          onPress={() => {
            const { setConfigNotificacionesPerfil } = require('@/api/mock-db');
            setConfigNotificacionesPerfil(perfilId, {});
            setPerfilConfigs({ ...perfilConfigs, [perfilId]: {} });
          }}
        >
          <ThemedText style={styles.botonLimpiarTexto}>🗑️ Usar configuración global (limpiar overrides)</ThemedText>
        </Pressable>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Estado de onboarding */}
      <Card style={styles.statusCard}>
        <View style={styles.statusRow}>
          <View style={styles.statusItem}>
            <ThemedText style={styles.statusLabel}>Permisos</ThemedText>
            <View style={[
              styles.statusBadge,
              { backgroundColor: permisosConcedidos ? Color.green100 : Color.red50 },
            ]}>
              <ThemedText style={[
                styles.statusText,
                { color: permisosConcedidos ? Color.green700 : Color.red600 },
              ]}>
                {permisosConcedidos ? '✅ Concedidos' : '❌ Pendientes'}
              </ThemedText>
            </View>
          </View>
          <View style={styles.statusItem}>
            <ThemedText style={styles.statusLabel}>Push Token</ThemedText>
            <View style={[
              styles.statusBadge,
              { backgroundColor: tokenRegistrado ? Color.green100 : Color.orange50 },
            ]}>
              <ThemedText style={[
                styles.statusText,
                { color: tokenRegistrado ? Color.green700 : Color.orange600 },
              ]}>
                {tokenRegistrado ? '✅ Registrado' : '⚠️ No registrado'}
              </ThemedText>
            </View>
          </View>
        </View>
        {!permisosConcedidos && (
          <Button
            style={styles.botonPermisos}
            onPress={handleSolicitarPermisos}
            variante="primary"
            titulo="🔔 Activar notificaciones"
          />
        )}
        {permisosConcedidos && !tokenRegistrado && (
          <Button
            style={styles.botonPermisos}
            onPress={inicializar}
            variante="ghost"
            titulo="🔄 Registrar push token"
          />
        )}
      </Card>

      {/* Configuración global */}
      <SectionHeader titulo="Configuración global" />
      {config && (
        <>
          <Card style={styles.configCard}>
            <View style={styles.checkboxRow}>
              <Switch
                value={config.pushHabilitado}
                onValueChange={(v) => handleCambiarGlobal('pushHabilitado', v)}
              />
              <View style={styles.checkboxInfo}>
                <ThemedText style={styles.checkboxTitle}>Notificaciones push</ThemedText>
                <ThemedText style={styles.checkboxDesc}>Recibir alertas aunque la app esté cerrada</ThemedText>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.checkboxRow}>
              <Switch
                value={config.sonidoHabilitado}
                onValueChange={(v) => handleCambiarGlobal('sonidoHabilitado', v)}
                disabled={!config.pushHabilitado}
              />
              <View style={styles.checkboxInfo}>
                <ThemedText style={styles.checkboxTitle}>Sonidos</ThemedText>
                <ThemedText style={styles.checkboxDesc}>Reproducir sonido al recibir alertas</ThemedText>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.checkboxRow}>
              <Switch
                value={config.vibracionHabilitada}
                onValueChange={(v) => handleCambiarGlobal('vibracionHabilitada', v)}
                disabled={!config.pushHabilitado}
              />
              <View style={styles.checkboxInfo}>
                <ThemedText style={styles.checkboxTitle}>Vibración</ThemedText>
                <ThemedText style={styles.checkboxDesc}>Vibrar al recibir alertas</ThemedText>
              </View>
            </View>
          </Card>

          <Card style={styles.configCard}>
            <SectionHeader titulo="Sonidos por prioridad" />
            {PRIORIDADES.map((p) => (
              <View key={p} style={styles.sonidoRow}>
                <ThemedText style={styles.sonidoLabel}>
                  <View style={[styles.prioridadDot, { backgroundColor: obtenerColorPrioridad(p) }]} />
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </ThemedText>
                <ThemedText style={styles.sonidoValor}>
                  {config.sonidoPorPrioridad[p] || 'default'}
                </ThemedText>
              </View>
            ))}
          </Card>

          <Card style={styles.configCard}>
            <SectionHeader titulo="No molestar" />
            <View style={styles.checkboxRow}>
              <Switch
                value={config.noMolestar.activado}
                onValueChange={(v) => handleCambiarGlobal('noMolestar', { ...config.noMolestar, activado: v, permitirCriticas: config.noMolestar.permitirCriticas })}
              />
              <View style={styles.checkboxInfo}>
                <ThemedText style={styles.checkboxTitle}>Activar horario</ThemedText>
                <ThemedText style={styles.checkboxDesc}>
                  Silenciar notificaciones en el rango configurado
                </ThemedText>
              </View>
            </View>

            {config.noMolestar.activado && (
              <>
                <View style={styles.divider} />
                <View style={styles.inputRow}>
                  <Pressable
                    style={styles.timeButton}
                    onPress={() => Alert.alert('Configurar', 'Próximamente: selector de hora nativo')}
                  >
                    <ThemedText style={styles.timeButtonLabel}>Inicio: {config.noMolestar.inicio}</ThemedText>
                  </Pressable>
                  <Pressable
                    style={styles.timeButton}
                    onPress={() => Alert.alert('Configurar', 'Próximamente: selector de hora nativo')}
                  >
                    <ThemedText style={styles.timeButtonLabel}>Fin: {config.noMolestar.fin}</ThemedText>
                  </Pressable>
                </View>
                <View style={styles.checkboxRow}>
                  <Switch
                    value={config.noMolestar.permitirCriticas}
                    onValueChange={(v) => handleCambiarGlobal('noMolestar', { ...config.noMolestar, permitirCriticas: v, activado: config.noMolestar.activado })}
                  />
                  <View style={styles.checkboxInfo}>
                    <ThemedText style={styles.checkboxTitle}>Permitir alertas críticas</ThemedText>
                    {/* eslint-disable-next-line react/no-unescaped-entities */}
                    <ThemedText style={styles.checkboxDesc}>Romper "no molestar" si prioridad = crítica</ThemedText>
                  </View>
                </View>
              </>
            )}
          </Card>
        </>
      )}

      {/* Configuración por perfil */}
      {perfiles.length > 0 && (
        <>
          <SectionHeader titulo="Por perfil">
            <ThemedText style={{ fontSize: 12, color: '#6B7280' }}>Sobreescribe la configuración global para cada persona</ThemedText>
          </SectionHeader>
          <Card style={styles.configCard}>
            {perfiles.map((perfil) => {
              const perfilConfig = perfilConfigs[perfil.id] || {};
              const tieneOverride = Object.keys(perfilConfig).length > 0;

              return (
                <Pressable
                  key={perfil.id}
                  style={styles.perfilRow}
                  onPress={() => setPerfilSeleccionado(perfilSeleccionado === perfil.id ? null : perfil.id)}
                >
                  <View style={styles.perfilInfo}>
                    <View style={[styles.perfilAvatar, { backgroundColor: Color.teal100 }]}>
                      <ThemedText style={styles.perfilInicial}>
                        {perfil.persona?.nombre?.charAt(0)?.toUpperCase() || '?'}
                      </ThemedText>
                    </View>
                    <View style={styles.perfilTextos}>
                      <ThemedText style={styles.perfilNombre}>{perfil.persona?.nombre || 'Sin nombre'}</ThemedText>
                      <ThemedText style={[
                        styles.perfilEstado,
                        { color: tieneOverride ? Color.teal600 : Color.gray500 },
                      ]}>
                        {tieneOverride ? '⚙️ Configuración personalizada' : '📋 Usa configuración global'}
                      </ThemedText>
                    </View>
                  </View>
                  <ThemedText style={[
                    styles.chevron,
                    { color: perfilSeleccionado === perfil.id ? Color.teal600 : Color.gray400 },
                  ]}>
                    {perfilSeleccionado === perfil.id ? '▲' : '▼'}
                  </ThemedText>
                </Pressable>
              );
            })}

            {perfilSeleccionado && (
              <View style={styles.perfilDetalle}>
                {renderConfigPerfil(perfilSeleccionado, perfilConfigs[perfilSeleccionado] || {})}
              </View>
            )}
          </Card>
        </>
      )}

      {/* Acciones */}
      <Card style={styles.accionesCard}>
        <Button
          style={styles.botonAccion}
          onPress={handleProgramarHoy}
          variante="secondary"
          titulo="🔄 Reprogramar alertas de hoy"
        />
        <Button
          style={styles.botonAccion}
          onPress={() => Alert.alert('Próximamente', 'Ver notificaciones programadas')}
          variante="ghost"
          titulo="📋 Ver programadas"
        />
      </Card>
    </View>
  );
}

function obtenerColorPrioridad(p: PrioridadAlerta): string {
  switch (p) {
    case 'baja': return '#6B7280';
    case 'media': return '#3B82F6';
    case 'alta': return '#F59E0B';
    case 'critica': return '#EF4444';
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Color.gray50,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.six,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: fam(400),
    fontSize: FontSize.md,
    color: Color.gray500,
  },
  statusCard: {
    marginBottom: Spacing.four,
    gap: Spacing.three,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    flex: 1,
  },
  statusLabel: {
    fontFamily: fam(500),
    fontSize: FontSize.sm,
    color: Color.gray600,
  },
  statusBadge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Radius.full,
  },
  statusText: {
    fontFamily: fam(600),
    fontSize: FontSize.xs,
  },
  botonPermisos: {
    marginTop: Spacing.two,
  },
  configCard: {
    marginBottom: Spacing.three,
    gap: Spacing.three,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  checkboxInfo: {
    flex: 1,
    gap: Spacing.half,
  },
  checkboxTitle: {
    fontFamily: fam(600),
    fontSize: FontSize.md,
    color: Color.gray800,
  },
  checkboxDesc: {
    fontFamily: fam(400),
    fontSize: FontSize.sm,
    color: Color.gray500,
  },
  divider: {
    height: 1,
    backgroundColor: Color.gray100,
    marginVertical: Spacing.two,
  },
  sonidoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: Color.gray100,
  },
  sonidoLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    fontFamily: fam(500),
    fontSize: FontSize.sm,
    color: Color.gray700,
  },
  sonidoValor: {
    fontFamily: 'monospace',
    fontSize: FontSize.sm,
    color: Color.gray500,
  },
  prioridadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  perfilRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: Color.gray100,
  },
  perfilInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    flex: 1,
  },
  perfilAvatar: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  perfilInicial: {
    fontFamily: fam(700),
    fontSize: FontSize.md,
    color: Color.teal700,
  },
  perfilTextos: {
    gap: Spacing.half,
  },
  perfilNombre: {
    fontFamily: fam(600),
    fontSize: FontSize.md,
    color: Color.gray800,
  },
  perfilEstado: {
    fontFamily: fam(400),
    fontSize: FontSize.xs,
  },
  chevron: {
    fontSize: 16,
  },
  perfilDetalle: {
    marginTop: Spacing.three,
    paddingTop: Spacing.three,
    borderTopWidth: 1,
    borderTopColor: Color.gray200,
    gap: Spacing.two,
  },
  botonLimpiar: {
    paddingVertical: Spacing.two,
    alignItems: 'center',
  },
  botonLimpiarTexto: {
    fontFamily: fam(500),
    fontSize: FontSize.sm,
    color: Color.red600,
  },
  accionesCard: {
    marginTop: Spacing.four,
  },
  botonAccion: {
    marginBottom: Spacing.two,
  },
  timeButton: {
    flex: 1,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Color.gray300,
    backgroundColor: '#fff',
  },
  timeButtonLabel: {
    fontFamily: fam(400),
    fontSize: FontSize.sm,
    color: Color.gray700,
    textAlign: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    flexWrap: 'wrap',
  },
});