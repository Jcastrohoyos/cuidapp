/**
 * Registro y gestión de push tokens (expo-notifications).
 * Para envío de notificaciones desde backend (futuro).
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

const TOKEN_KEY = 'expo_push_token';

/** Obtiene el push token guardado localmente. */
export async function obtenerPushTokenGuardado(): Promise<string | null> {
  try {
    const { getItemAsync } = await import('expo-secure-store');
    return await getItemAsync(TOKEN_KEY);
  } catch {
    try {
      const storage = await import('@react-native-async-storage/async-storage');
      return await (storage as any).getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  }
}

/** Guarda el push token de forma segura. */
export async function guardarPushToken(token: string): Promise<void> {
  try {
    const { setItemAsync } = await import('expo-secure-store');
    await setItemAsync(TOKEN_KEY, token, {
      keychainAccessible: require('expo-secure-store').WHEN_UNLOCKED,
    });
  } catch {
    try {
      const storage = await import('@react-native-async-storage/async-storage');
      await (storage as any).setItem(TOKEN_KEY, token);
    } catch {
      console.warn('[PushToken] No se pudo guardar token');
    }
  }
}

/** Elimina el push token guardado. */
export async function borrarPushToken(): Promise<void> {
  try {
    const { deleteItemAsync } = await import('expo-secure-store');
    await deleteItemAsync(TOKEN_KEY);
  } catch {
    try {
      const storage = await import('@react-native-async-storage/async-storage');
      await (storage as any).removeItem(TOKEN_KEY);
    } catch {}
  }
}

/** Registra el token de push en el dispositivo y opcionalmente lo envía al backend. */
export async function registrarPushToken(
  opciones?: { enviarAlBackend?: boolean; endpoint?: string }
): Promise<string | null> {
  if (!Device.isDevice) {
    console.warn('[PushToken] No es dispositivo físico, no se puede obtener token');
    return null;
  }

  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') {
    console.warn('[PushToken] Permisos no concedidos');
    return null;
  }

  try {
    // Obtener token de Expo
    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.projectId;
    
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    
    const token = tokenData.data;
    
    // Guardar localmente
    await guardarPushToken(token);
    
    // Opcional: enviar al backend
    if (opciones?.enviarAlBackend && opciones?.endpoint) {
      try {
        await fetch(opciones.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, platform: Platform.OS }),
        });
      } catch (e) {
        console.warn('[PushToken] Error enviando token al backend:', e);
      }
    }
    
    console.log('[PushToken] Token registrado:', token.substring(0, 20) + '...');
    return token;
  } catch (e) {
    console.error('[PushToken] Error obteniendo token:', e);
    return null;
  }
}

/** Verifica si el token actual sigue siendo válido (re-registrar si cambió). */
export async function verificarYActualizarToken(): Promise<string | null> {
  const tokenActual = await obtenerPushTokenGuardado();
  
  // En v1, siempre re-registrar al inicio para asegurar validez
  // En v2, comparar con backend
  return registrarPushToken();
}

/** Tipo de datos para envío al backend. */
export interface PushTokenData {
  token: string;
  platform: 'ios' | 'android' | 'web';
  deviceId?: string;
  appVersion?: string;
}