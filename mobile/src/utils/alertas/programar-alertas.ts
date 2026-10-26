/**
 * Programación inteligente de alertas para notificaciones locales.
 * Decide cuándo y cómo programar notificaciones basado en prioridad, no molestar, etc.
 */

import { queryWithParams } from '@/db';
import { programarNotificacionLocal, cancelarNotificacionesDeAlerta } from '@/notifications/programar';
import { estaEnNoMolestar } from '@/utils/alertas/helpers';
import type { AlertaMedica, PrioridadAlerta, ConfigNotificaciones } from '@/types';
import { getConfigNotificaciones } from '@/api/mock-db';

/** Programa todas las alertas de hoy para un perfil. */
export async function programarAlertasDeHoy(perfilId: string): Promise<number> {
  const ahora = new Date();
  const manana = new Date(ahora.getTime() + 24 * 60 * 60 * 1000);

  const alertas = await queryWithParams(
    `SELECT * FROM alertas 
     WHERE perfil_id = ? 
       AND leida = 0 
       AND descartada = 0 
       AND fecha_hora >= ? 
       AND fecha_hora <= ?`,
    [perfilId, ahora.getTime(), manana.getTime()]
  );

  let programadas = 0;

  for (const alerta of alertas) {
    const alertaTipada = toAlertaMedica(alerta);

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
  const perfiles = await queryWithParams(
    `SELECT * FROM perfiles WHERE estado IN ('con_cuidador', 'en_seleccion')`
  );

  let total = 0;
  for (const perfil of perfiles) {
    total += await programarAlertasDeHoy(perfil.id);
  }
  return total;
}

/** Reprograma alertas de un perfil (tras cambios de config/reglas). */
export async function reprogramarAlertasPerfil(perfilId: string): Promise<number> {
  const alertas = await queryWithParams(
    `SELECT * FROM alertas 
     WHERE perfil_id = ? 
       AND leida = 0 
       AND descartada = 0`,
    [perfilId]
  );

  for (const a of alertas) {
    await cancelarNotificacionesDeAlerta(a.id);
  }

  return programarAlertasDeHoy(perfilId);
}

/** Convierte record de SQLite a AlertaMedica. */
function toAlertaMedica(record: any): AlertaMedica {
  return {
    id: record.id,
    perfilId: record.perfil_id,
    tipo: record.tipo,
    prioridad: record.prioridad,
    titulo: record.titulo,
    mensaje: record.mensaje,
    fechaHora: new Date(record.fecha_hora).toISOString(),
    leida: record.leida,
    descartada: record.descartada,
    accion: record.accion,
    reglaId: record.regla_id,
    creadaEn: record.created_at ? new Date(record.created_at).toISOString() : undefined,
    leidaEn: record.leida_en ? new Date(record.leida_en).toISOString() : undefined,
    escalada: record.escalada,
    nivelEscaladoActual: record.nivel_escalado_actual,
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
  if (!config.sonidoHabilitado && alerta.prioridad !== 'critica') return false;

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
  const alertas = await queryWithParams(
    `SELECT * FROM alertas 
     WHERE perfil_id = ? 
       AND leida = 0 
       AND descartada = 0`,
    [perfilId]
  );

  let canceladas = 0;
  for (const a of alertas) {
    canceladas += await cancelarNotificacionesDeAlerta(a.id);
  }
  return canceladas;
}
