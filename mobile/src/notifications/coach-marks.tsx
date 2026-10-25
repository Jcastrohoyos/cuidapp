/**
 * Coach marks / Onboarding para permisos de notificaciones.
 * Versión simplificada que no depende de Tooltip (que requiere targetRef).
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Alert, Platform } from 'react-native';
import { useOnboardingStore } from '@/store/onboarding-store';
import { solicitarPermisos, abrirConfiguracionSistema, configurarCanalAndroid } from './permisos';
import { registrarPushToken } from './push-token';
import { configurarHandlersNotificaciones, configurarCategoriasAcciones } from './handlers';
import { programarTodasLasAlertasDeHoy } from '@/utils/alertas/programar-alertas';

/** Claves de onboarding completado. */
const ONBOARDING_KEYS = {
  NOTIFICACIONES_PERMISOS: 'notificaciones_permisos_v1',
  NOTIFICACIONES_TOKEN: 'notificaciones_token_v1',
};

/** Inicializa todo el sistema de notificaciones al arrancar la app. */
export async function inicializarNotificaciones(): Promise<{ permisos: boolean; token: string | null }> {
  console.log('[Notificaciones] Inicializando...');

  // 1. Configurar canales Android
  await configurarCanalAndroid();

  // 2. Configurar categorías de acciones
  await configurarCategoriasAcciones();

  // 3. Configurar handlers globales
  configurarHandlersNotificaciones();

  // 4. Verificar/solicitar permisos
  const { useOnboardingStore: onboardingStore } = await import('@/store/onboarding-store');
  const onboarding = onboardingStore.getState();
  
  let permisosConcedidos = onboarding.yaVisto(ONBOARDING_KEYS.NOTIFICACIONES_PERMISOS);
  
  if (!permisosConcedidos) {
    permisosConcedidos = await solicitarPermisos();
    if (permisosConcedidos) {
      await onboarding.marcarVisto(ONBOARDING_KEYS.NOTIFICACIONES_PERMISOS);
    }
  }

  // 5. Registrar push token
  let token: string | null = null;
  const tokenGuardado = onboarding.yaVisto(ONBOARDING_KEYS.NOTIFICACIONES_TOKEN);
  
  if (!tokenGuardado && permisosConcedidos) {
    token = await registrarPushToken();
    if (token) {
      await onboarding.marcarVisto(ONBOARDING_KEYS.NOTIFICACIONES_TOKEN);
    }
  }

  console.log('[Notificaciones] Inicialización completa:', { permisosConcedidos, token: !!token });
  return { permisos: permisosConcedidos, token };
}

/** Programa alertas de hoy para todos los perfiles activos. */
export async function programarAlertasDelDia(): Promise<void> {
  try {
    await programarTodasLasAlertasDeHoy();
    console.log('[Notificaciones] Alertas del día programadas');
  } catch (e) {
    console.error('[Notificaciones] Error programando alertas:', e);
  }
}

/** Componente modal simple para solicitar permisos (no usa Tooltip). */
export function ModalPermisosNotificaciones({
  visible,
  onCerrar,
}: {
  visible: boolean;
  onCerrar: () => void;
}) {
  const [cargando, setCargando] = useState(false);

  const handleAceptar = useCallback(async () => {
    setCargando(true);
    try {
      const concedidos = await solicitarPermisos();
      if (concedidos) {
        const { useOnboardingStore: onboardingStore } = await import('@/store/onboarding-store');
        const onboarding = onboardingStore.getState();
        await onboarding.marcarVisto(ONBOARDING_KEYS.NOTIFICACIONES_PERMISOS);
        
        // Registrar token
        await registrarPushToken();
        await onboarding.marcarVisto(ONBOARDING_KEYS.NOTIFICACIONES_TOKEN);
        
        onCerrar();
      } else {
        // Usuario denegó: guiar a settings
        Alert.alert(
          'Permisos necesarios',
          'Para recibir alertas, activa las notificaciones en la configuración del sistema.',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Abrir ajustes', onPress: abrirConfiguracionSistema },
          ]
        );
      }
    } finally {
      setCargando(false);
    }
  }, [onCerrar]);

  if (!visible) return null;

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <View style={styles.modal} pointerEvents="box-none">
        <View style={styles.content}>
          <Text style={styles.title}>Activar notificaciones</Text>
          <Text style={styles.message}>
            Recibe alertas de medicación, control de signos vitales y citas médicas
            aunque la app esté cerrada.
          </Text>
        </View>
        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [
              styles.button,
              styles.buttonSecondary,
              { opacity: pressed ? 0.7 : 1 },
            ]}
            onPress={() => { onCerrar(); }}
            disabled={cargando}
          >
            <Text style={styles.buttonTextSecondary}>Luego</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.button,
              styles.buttonPrimary,
              { opacity: pressed ? 0.7 : 1 },
            ]}
            onPress={handleAceptar}
            disabled={cargando}
          >
            <Text style={styles.buttonTextPrimary}>
              {cargando ? 'Activando...' : 'Activar'}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

/** Hook para usar en componentes que necesiten estado de notificaciones. */
export function useNotificaciones() {
  const onboarding = useOnboardingStore.getState();

  return {
    permisosConcedidos: onboarding.yaVisto(ONBOARDING_KEYS.NOTIFICACIONES_PERMISOS),
    tokenRegistrado: onboarding.yaVisto(ONBOARDING_KEYS.NOTIFICACIONES_TOKEN),
    inicializar: inicializarNotificaciones,
    programarHoy: programarAlertasDelDia,
  };
}

/** Verifica si el onboarding de notificaciones está completo. */
export function notificacionesOnboardingCompleto(): boolean {
  const onboarding = useOnboardingStore.getState();
  return (
    onboarding.yaVisto(ONBOARDING_KEYS.NOTIFICACIONES_PERMISOS) &&
    onboarding.yaVisto(ONBOARDING_KEYS.NOTIFICACIONES_TOKEN)
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modal: {
    margin: 24,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    maxWidth: 320,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  content: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    minHeight: 44,
  },
  buttonPrimary: {
    backgroundColor: '#0F766E',
  },
  buttonSecondary: {
    backgroundColor: '#E5E7EB',
  },
  buttonTextPrimary: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  buttonTextSecondary: {
    color: '#374151',
    fontWeight: '600',
    fontSize: 16,
  },
});