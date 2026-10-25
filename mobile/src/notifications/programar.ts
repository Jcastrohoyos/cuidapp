/**
 * Programación de notificaciones locales (expo-notifications).
 * Convierte alertas médicas en notificaciones programadas.
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { AlertaMedica, PrioridadAlerta } from '@/types';
import { SONIDOS_POR_PRIORIDAD, obtenerCanalPorPrioridad } from './sonidos';

/** Resultado de programar una notificación. */
export interface NotificacionProgramada {
  notificationId: string;
  alertaId: string;
  trigger: Notifications.NotificationTriggerInput;
}

/** Programa una notificación local para una alerta médica. */
export async function programarNotificacionLocal(
  alerta: AlertaMedica,
  opciones?: { sonido?: string; canal?: string }
): Promise<string | null> {
  try {
    const fechaDisparo = new Date(alerta.fechaHora);
    const ahora = new Date();
    
    // Si la fecha ya pasó, no programar
    if (fechaDisparo <= ahora) {
      console.warn('[Programar] Fecha en el pasado, no se programa:', alerta.id);
      return null;
    }

    // Construir contenido de la notificación
    const contenido: Notifications.NotificationContentInput = {
      title: alerta.titulo,
      body: alerta.mensaje,
      data: {
        alertaId: alerta.id,
        perfilId: alerta.perfilId,
        tipo: alerta.tipo,
        prioridad: alerta.prioridad,
        accion: alerta.accion,
        reglaId: alerta.reglaId,
      },
      sound: opciones?.sonido || SONIDOS_POR_PRIORIDAD[alerta.prioridad] || 'default',
      priority: prioridadAPrioridadNativa(alerta.prioridad),
      badge: 1,
    };

    // Canal específico por prioridad (Android)
    if (Platform.OS === 'android') {
      (contenido as any).channelId = opciones?.canal || obtenerCanalPorPrioridad(alerta.prioridad);
    }

    // iOS: critical alerts para prioridad crítica (requiere entitlement especial)
    if (Platform.OS === 'ios' && alerta.prioridad === 'critica') {
      (contenido as any).interruptionLevel = 'critical';
    }

    // Trigger: fecha exacta
    const trigger: Notifications.DateTriggerInput = {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: fechaDisparo,
    };

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: contenido,
      trigger,
    });

    console.log('[Programar] Notificación programada:', notificationId, 'para', alerta.id, 'a las', fechaDisparo.toISOString());
    return notificationId;
  } catch (e) {
    console.error('[Programar] Error programando notificación:', e);
    return null;
  }
}

/** Convierte prioridad de app a prioridad nativa. */
function prioridadAPrioridadNativa(p: PrioridadAlerta): 'min' | 'low' | 'default' | 'high' | 'max' {
  switch (p) {
    case 'baja': return 'low';
    case 'media': return 'default';
    case 'alta': return 'high';
    case 'critica': return 'max';
  }
}

/** Programa múltiples alertas de una vez (batch). */
export async function programarAlertasBatch(
  alertas: AlertaMedica[]
): Promise<Map<string, string>> {
  const resultados = new Map<string, string>();
  
  for (const alerta of alertas) {
    const id = await programarNotificacionLocal(alerta);
    if (id) resultados.set(alerta.id, id);
  }
  
  return resultados;
}

/** Cancela una notificación programada por su ID. */
export async function cancelarNotificacion(notificationId: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
    console.log('[Programar] Notificación cancelada:', notificationId);
  } catch (e) {
    console.warn('[Programar] Error cancelando notificación:', e);
  }
}

/** Cancela todas las notificaciones de una alerta (por alertaId en data). */
export async function cancelarNotificacionesDeAlerta(alertaId: string): Promise<number> {
  try {
    const programadas = await Notifications.getAllScheduledNotificationsAsync();
    let canceladas = 0;
    
    for (const notif of programadas) {
      if (notif.content.data?.alertaId === alertaId) {
        await Notifications.cancelScheduledNotificationAsync(notif.identifier);
        canceladas++;
      }
    }
    
    console.log('[Programar] Canceladas', canceladas, 'notificaciones de alerta:', alertaId);
    return canceladas;
  } catch (e) {
    console.error('[Programar] Error cancelando notificaciones de alerta:', e);
    return 0;
  }
}

/** Cancela todas las notificaciones programadas (útil para logout). */
export async function cancelarTodasLasNotificaciones(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  console.log('[Programar] Todas las notificaciones canceladas');
}

/** Obtiene todas las notificaciones programadas (debug). */
export async function obtenerNotificacionesProgramadas(): Promise<Array<{
  id: string;
  fecha: Date;
  alertaId?: string;
  titulo: string;
}>> {
  const programadas = await Notifications.getAllScheduledNotificationsAsync();
  
  return programadas.map((n) => ({
    id: n.identifier,
    fecha: n.trigger && 'date' in n.trigger ? new Date(n.trigger.date) : new Date(),
    alertaId: typeof n.content.data?.alertaId === 'string' ? n.content.data.alertaId : undefined,
    titulo: n.content.title || '',
  }));
}

/** Programa recordatorio recurrente (para testing/debug). */
export async function programarRecordatorioPrueba(
  titulo: string,
  mensaje: string,
  enSegundos: number = 10
): Promise<string | null> {
  const trigger: Notifications.TimeIntervalTriggerInput = {
    type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
    seconds: enSegundos,
    repeats: false,
  };

  return Notifications.scheduleNotificationAsync({
    content: {
      title: titulo,
      body: mensaje,
      data: { test: true },
    },
    trigger,
  });
}