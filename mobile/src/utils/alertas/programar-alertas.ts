/**
 * Programación inteligente de alertas para notificaciones locales.
 * Decide cuándo y cómo programar notificaciones basado en prioridad, no molestar, etc.
 */

import { getDatabase } from '@/db';
import { programarNotificacionLocal, cancelarNotificacionesDeAlerta } from '@/notifications/programar';
import { estaEnNoMolestar } from '@/utils/alertas/helpers';
import type { AlertaMedica, PrioridadAlerta, ConfigNotificaciones } from '@/types';
import { getConfigNotificaciones } from '@/api/mock-db';

/** Programa todas las alertas de hoy para un perfil. */
export async function programarAlertasDeHoy(perfilId: string): Promise<number> {
  const db = getDatabase();
  
  // Obtener alertas pendientes de hoy y próximas 24h
  const ahora = new Date();
  const manana = new Date(ahora.getTime() + 24 * 60 * 60 * 1000);
  
  const alertas = await db.get('alertas')
    .query()
    .where('perfil_id', perfilId)
    .where('leida', false)
    .where('descartada', false)
    .where('fecha_hora', '>=', ahora.getTime())
    .where('fecha_hora', '<=', manana.getTime())
    .fetch();

  let programadas = 0;
  
  for (const alerta of alertas) {
    const alertaTipada = toAlertaMedica(alerta);
    
    // Verificar no molestar
    const config = await getConfigNotificacionesEfectiva(perfilId);
    if (debeSaltarPorNoMolestar(alertaTipada, config)) {
      console.log('[ProgramarAlertas] Saltando por no molestar:', alerta.id);
      continue;
    }

    const id = await programarNotificacionLocal(alertaTipada);
    if (id) programadas++;
  }

  return programadas;
}

/** Programa alertas para TODOS los perfiles activos. */
export async function programarTodasLasAlertasDeHoy(): Promise<number> {
  const db = getDatabase();
  const perfiles = await db.get('perfiles')
    .query()
    .where('estado', 'in', ['con_cuidador', 'en_seleccion'])
    .fetch();

  let total = 0;
  for (const perfil of perfiles) {
    total += await programarAlertasDeHoy(perfil.id);
  }
  return total;
}

/** Reprograma alertas de un perfil (tras cambios de config/reglas). */
export async function reprogramarAlertasPerfil(perfilId: string): Promise<number> {
  // Cancelar existentes
  const db = getDatabase();
  const alertas = await db.get('alertas')
    .query()
    .where('perfil_id', perfilId)
    .where('leida', false)
    .where('descartada', false)
    .fetch();

  for (const a of alertas) {
    await cancelarNotificacionesDeAlerta(a.id);
  }

  // Programar nuevas
  return programarAlertasDeHoy(perfilId);
}

/** Convierte record de WatermelonDB a AlertaMedica. */
function toAlertaMedica(record: any): AlertaMedica {
  return {
    id: record.id,
    perfilId: record.perfilId,
    tipo: record.tipo,
    prioridad: record.prioridad,
    titulo: record.titulo,
    mensaje: record.mensaje,
    fechaHora: new Date(record.fechaHora).toISOString(),
    leida: record.leida,
    descartada: record.descartada,
    accion: record.accion,
    reglaId: record.reglaId,
    creadaEn: record.createdAt.toISOString(),
    leidaEn: record.leidaEn?.toISOString(),
    escalada: record.escalada,
    nivelEscaladoActual: record.nivelEscaladoActual,
  };
}

/** Obtiene config de notificaciones efectiva (global + override por perfil). */
async function getConfigNotificacionesEfectiva(perfilId: string): Promise<ConfigNotificaciones> {
  const global = await getConfigNotificaciones();
  const perfil = (global.porPerfil[perfilId] || {}) as Partial<ConfigNotificaciones>;
  
  return {
    ...global,
    ...perfil,
    noMolestar: { ...global.noMolestar, ...(perfil.noMolestar || {}) },
    sonidoPorPrioridad: { ...global.sonidoPorPrioridad, ...(perfil.sonidoPorPrioridad || {}) },
  };
}

/** Verifica si una alerta debe saltarse por configuración de no molestar. */
function debeSaltarPorNoMolestar(
  alerta: AlertaMedica,
  config: ConfigNotificaciones
): boolean {
  if (!config.pushHabilitado) return true;
  if (!config.sonidoHabilitado && alerta.prioridad !== 'critica') return false; // Solo afecta sonido
  
  const fecha = new Date(alerta.fechaHora);
  return estaEnNoMolestar(fecha, config.noMolestar, alerta.prioridad);
}

/** Programa una alerta individual (para testing/creación manual). */
export async function programarAlertaIndividual(alerta: AlertaMedica): Promise<string | null> {
  const config = await getConfigNotificacionesEfectiva(alerta.perfilId);
  if (debeSaltarPorNoMolestar(alerta, config)) {
    return null;
  }
  return programarNotificacionLocal(alerta);
}

/** Cancela todas las notificaciones de un perfil. */
export async function cancelarNotificacionesPerfil(perfilId: string): Promise<number> {
  const db = getDatabase();
  const alertas = await db.get('alertas')
    .query()
    .where('perfil_id', perfilId)
    .where('leida', false)
    .where('descartada', false)
    .fetch();

  let canceladas = 0;
  for (const a of alertas) {
    canceladas += await cancelarNotificacionesDeAlerta(a.id);
  }
  return canceladas;
}