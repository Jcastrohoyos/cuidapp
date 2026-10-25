/**
 * Gestión de permisos de notificaciones (expo-notifications).
 */

import * as Notifications from 'expo-notifications';
import { Platform, Linking, Alert } from 'react-native';
import * as Device from 'expo-device';

/** Verifica el estado actual de permisos. */
export async function obtenerEstadoPermisos(): Promise<Notifications.PermissionStatus> {
  const { status } = await Notifications.getPermissionsAsync();
  return status;
}

/** Solicita permisos de notificación al usuario. */
export async function solicitarPermisos(): Promise<boolean> {
  if (!Device.isDevice) {
    console.warn('[Notificaciones] No es dispositivo físico, saltando solicitud de permisos');
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
        allowCriticalAlerts: false,
      },
      android: {
        channelId: 'alertas-medicas',
        channelName: 'Alertas médicas',
        channelDescription: 'Notificaciones de medicación, signos vitales y citas',
        importance: 'high' as any,
        sound: 'default',
        enableVibrate: true,
        lockscreenVisibility: 'public' as any,
      },
    });
    finalStatus = status;
  }

  return finalStatus === 'granted';
}

/** Verifica y solicita permisos si es necesario. Devuelve true si concedidos. */
export async function asegurarPermisos(): Promise<boolean> {
  const status = await obtenerEstadoPermisos();
  if (status === 'granted') return true;
  
  return solicitarPermisos();
}

/** Abre la configuración del sistema para que el usuario habilite permisos manualmente. */
export async function abrirConfiguracionSistema(): Promise<void> {
  if (Platform.OS === 'ios') {
    await Linking.openURL('app-settings:');
  } else {
    await Linking.openSettings();
  }
}

/** Muestra diálogo guiando al usuario a activar permisos. */
export function mostrarDialogoPermisos(
  onAceptar: () => void,
  onCancelar?: () => void
): void {
  Alert.alert(
    'Notificaciones necesarias',
    'Para recibir alertas de medicación, signos vitales y citas, por favor activa las notificaciones en la configuración.',
    [
      { text: 'Cancelar', style: 'cancel', onPress: onCancelar },
      { text: 'Abrir ajustes', onPress: () => { abrirConfiguracionSistema(); onAceptar(); } },
    ]
  );
}

/** Configura el canal de notificaciones en Android (idempotente). */
export async function configurarCanalAndroid(): Promise<void> {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync('alertas-medicas', {
    name: 'Alertas médicas',
    description: 'Notificaciones de medicación, signos vitales y citas',
    importance: 'high' as any,
    sound: 'default',
    enableVibrate: true,
    lockscreenVisibility: 'public' as any,
    bypassDnd: true,
  });

  await Notifications.setNotificationChannelAsync('alertas-criticas', {
    name: 'Alertas críticas',
    description: 'Alertas de máxima prioridad (rompen no molestar)',
    importance: 'max' as any,
    sound: 'default',
    enableVibrate: true,
    lockscreenVisibility: 'public' as any,
    bypassDnd: true,
  });
}