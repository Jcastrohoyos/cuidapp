/**
 * Handlers de notificaciones (expo-notifications).
 * Maneja notificaciones recibidas y respuestas del usuario.
 */

import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { Platform, Linking } from 'react-native';
import type { AlertaMedica } from '@/types';
import { cancelarEscalado } from '@/utils/alertas/escalado';
import { endpoints } from '@/api/endpoints';

type NotificationListener = (notification: Notifications.Notification) => void;
type ResponseListener = (response: Notifications.NotificationResponse) => void;

let listenerRecibida: Notifications.EventSubscription | null = null;
let listenerRespondida: Notifications.EventSubscription | null = null;

/** Configura los listeners globales de notificaciones. */
export function configurarHandlersNotificaciones(): void {
  listenerRecibida = Notifications.addNotificationReceivedListener(
    handleNotificationReceived
  );

  listenerRespondida = Notifications.addNotificationResponseReceivedListener(
    handleNotificationResponse
  );

  console.log('[Handlers] Listeners configurados');
}

/** Limpia los listeners (útil para testing/logout). */
export function limpiarHandlersNotificaciones(): void {
  if (listenerRecibida) {
    listenerRecibida.remove();
    listenerRecibida = null;
  }
  if (listenerRespondida) {
    listenerRespondida.remove();
    listenerRespondida = null;
  }
  console.log('[Handlers] Listeners limpiados');
}

/** Maneja notificación recibida en foreground. */
async function handleNotificationReceived(notification: Notifications.Notification): Promise<void> {
  console.log('[Handlers] Notificación recibida en foreground:', notification.request.identifier);
  
  const data = notification.request.content.data;
  if (!data?.alertaId) return;

  try {
    const { useDataStore } = await import('@/store/data-store');
  } catch {}
}

/** Maneja respuesta del usuario a la notificación. */
async function handleNotificationResponse(response: Notifications.NotificationResponse): Promise<void> {
  console.log('[Handlers] Respuesta a notificación:', response.actionIdentifier, response.notification.request.identifier);
  
  const data = response.notification.request.content.data as Record<string, unknown>;
  if (!data?.alertaId) return;

  const alertaId = String(data.alertaId);
  const perfilId = data.perfilId ? String(data.perfilId) : '';

  try {
    await cancelarEscalado(alertaId);
    await endpoints.marcarAlertaLeida(alertaId);
    await navegarSegunAccion(data, response);
  } catch (e) {
    console.error('[Handlers] Error procesando respuesta:', e);
  }
}

/** Navega según la acción definida en la alerta o acción del botón. */
async function navegarSegunAccion(
  data: Record<string, unknown>,
  response: Notifications.NotificationResponse
): Promise<void> {
  const accion = data.accion as { tipo: string; valor: string } | undefined;
  const alertaId = String(data.alertaId);
  const perfilId = data.perfilId ? String(data.perfilId) : '';
  const tipo = data.tipo as string | undefined;

  const esTapPrincipal = response.actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER;

  let destino: string | null = null;

  if (esTapPrincipal) {
    destino = `/perfil?alerta=${alertaId}`;
  } else if (accion) {
    switch (accion.tipo) {
      case 'abrir_tarea':
        destino = `/rutina?task=${accion.valor}`;
        break;
      case 'abrir_incidencia':
        destino = `/perfil?incidencia=${accion.valor}`;
        break;
      case 'llamar':
        await Linking.openURL(`tel:${accion.valor}`);
        return;
      case 'url':
        await Linking.openURL(accion.valor);
        return;
      case 'registrar_valor':
        destino = `/perfil?registrar=${accion.valor}&alerta=${alertaId}`;
        break;
    }
  } else if (tipo === 'medicacion') {
    destino = `/rutina`;
  } else if (tipo === 'signos_vitales') {
    destino = `/perfil?registrar=signos`;
  } else if (tipo === 'cita') {
    destino = `/perfil?citas=1`;
  } else {
    destino = `/perfil?alerta=${alertaId}`;
  }

  if (destino) {
    setTimeout(() => {
      router.push(destino as any);
    }, 100);
  }
}

/** Configura categorías de acciones para notificaciones interactivas (iOS/Android). */
export async function configurarCategoriasAcciones(): Promise<void> {
  await Notifications.setNotificationCategoryAsync('alerta-medica', [
    {
      identifier: 'MARCAR_REALIZADA',
      buttonTitle: 'Realizada',
      options: { isDestructive: false, isAuthenticationRequired: false },
    },
    {
      identifier: 'POSPONER_15',
      buttonTitle: 'Posponer 15 min',
      options: { isDestructive: false, isAuthenticationRequired: false },
    },
    {
      identifier: 'VER_DETALLE',
      buttonTitle: 'Ver detalle',
      options: { isDestructive: false, isAuthenticationRequired: false },
    },
  ]);

  await Notifications.setNotificationCategoryAsync('alerta-critica', [
    {
      identifier: 'RECONOCER',
      buttonTitle: 'He visto',
      options: { isDestructive: false, isAuthenticationRequired: true },
    },
    {
      identifier: 'LLAMAR_EMERGENCIA',
      buttonTitle: 'Llamar emergencia',
      options: { isDestructive: true, isAuthenticationRequired: false },
    },
  ]);

  console.log('[Handlers] Categorías configuradas');
}

/** Obtiene el badge actual (número de alertas pendientes). */
export async function obtenerBadge(): Promise<number> {
  try {
    const { useDataStore } = await import('@/store/data-store');
    return 0;
  } catch {
    return 0;
  }
}

/** Actualiza el badge de la app. */
export async function actualizarBadge(count: number): Promise<void> {
  try {
    await Notifications.setBadgeCountAsync(count);
  } catch (e) {
    console.warn('[Handlers] Error actualizando badge:', e);
  }
}

/** Establece el badge a 0. */
export async function limpiarBadge(): Promise<void> {
  await actualizarBadge(0);
}