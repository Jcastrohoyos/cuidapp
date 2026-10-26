/**
 * Motor de Escalado de Alertas (FASE 1).
 * Procesa alertas no respondidas y escala según configuración.
 */

import { queryWithParams, run, insert, getOne } from '@/db';
import { programarNotificacionLocal } from '@/notifications';
import type { AlertaMedica, ConfigEscalado, NivelEscalado, PrioridadAlerta } from '@/types';

/** Estado de escalado persistido en la alerta. */
export interface EstadoEscaladoInterno {
  alertaId: string;
  nivelActual: number;
  proximoNivelEn: Date | null;
  cancelado: boolean;
  historialEnvios: EnvioEscalado[];
}

export interface EnvioEscalado {
  nivel: number;
  tipo: NivelEscalado['tipo'];
  destinatario: NivelEscalado['destinatario'];
  enviadoEn: Date;
  exito: boolean;
  error?: string;
}

/** Inicia el proceso de escalado para una alerta. */
export async function iniciarEscalado(alertaId: string): Promise<void> {
  const alerta = await getOne('SELECT * FROM alertas WHERE id = ?', [alertaId]);
  if (!alerta) {
    console.warn('[Escalado] Alerta no encontrada:', alertaId);
    return;
  }

  if (!alerta.reglaId) return;

  const regla = await getOne('SELECT * FROM reglas_alerta WHERE id = ?', [alerta.reglaId]);
  if (!regla || !regla.escalado) return;

  const escalado = regla.escalado as ConfigEscalado;
  if (!escalado.niveles || escalado.niveles.length === 0) return;

  // Marcar alerta como en escalado
  await run('UPDATE alertas SET escalada = 1, nivel_escalado_actual = 1 WHERE id = ?', [alertaId]);

  const primerNivel = escalado.niveles[0];
  if (primerNivel.retrasoMinutos <= 0) {
    await enviarNivelEscalado(alertaId, 1, primerNivel);
  } else {
    await programarProximoNivel(alertaId, 1, primerNivel.retrasoMinutos);
  }
}

/** Envía un nivel de escalado específico. */
export async function enviarNivelEscalado(
  alertaId: string,
  numeroNivel: number,
  nivel: NivelEscalado
): Promise<boolean> {
  const alerta = await getOne('SELECT * FROM alertas WHERE id = ?', [alertaId]);
  if (!alerta || alerta.leida || alerta.descartada) {
    console.log('[Escalado] Alerta ya leída/descartada, cancelando escalado');
    await cancelarEscalado(alertaId);
    return false;
  }

  if (alerta.nivel_escalado_actual !== numeroNivel) {
    console.log('[Escalado] Nivel no coincide (actual:', alerta.nivel_escalado_actual, 'esperado:', numeroNivel, ')');
    return false;
  }

  let exito = false;
  let error: string | undefined;

  try {
    switch (nivel.tipo) {
      case 'push_local':
        exito = await enviarPushLocal(alerta, nivel);
        break;
      case 'push_familia':
        exito = await enviarPushFamilia(alerta, nivel);
        break;
      case 'contacto_emergencia':
        exito = await notificarContactoEmergencia(alerta, nivel);
        break;
      case 'sms':
        exito = await enviarSMS(alerta, nivel);
        break;
      case 'llamada':
        exito = await iniciarLlamada(alerta, nivel);
        break;
      default:
        error = `Tipo de escalado no implementado: ${nivel.tipo}`;
    }
  } catch (e) {
    error = String(e);
    exito = false;
  }

  await registrarEnvio(alertaId, numeroNivel, nivel, exito, error);

  if (exito) {
    const regla = await getOne('SELECT * FROM reglas_alerta WHERE id = ?', [alerta.reglaId!]);
    if (regla && regla.escalado) {
      const escalado = regla.escalado as ConfigEscalado;
      const siguienteNivel = escalado.niveles[numeroNivel];
      if (siguienteNivel) {
        await programarProximoNivel(alertaId, numeroNivel + 1, siguienteNivel.retrasoMinutos);
      } else {
        await run('UPDATE alertas SET nivel_escalado_actual = ? WHERE id = ?', [escalado.niveles.length, alertaId]);
      }
    }
  }

  return exito;
}

/** Programa el siguiente nivel de escalado. */
async function programarProximoNivel(
  alertaId: string,
  numeroNivel: number,
  retrasoMinutos: number
): Promise<void> {
  const alerta = await getOne('SELECT * FROM alertas WHERE id = ?', [alertaId]);
  if (!alerta) return;

  await run('UPDATE alertas SET nivel_escalado_actual = ? WHERE id = ?', [numeroNivel, alertaId]);

  setTimeout(async () => {
    const regla = await getOne('SELECT * FROM reglas_alerta WHERE id = ?', [alerta.reglaId!]);
    const nivelConfig = regla?.escalado?.niveles?.[numeroNivel - 1];
    if (nivelConfig) {
      enviarNivelEscalado(alertaId, numeroNivel, nivelConfig).catch(console.error);
    }
  }, retrasoMinutos * 60 * 1000);
}

/** Envía push local al dispositivo del cuidador/familia. */
async function enviarPushLocal(alerta: any, nivel: NivelEscalado): Promise<boolean> {
  try {
    const titulo = interpolarPlantilla(nivel.mensajePlantilla, { titulo: alerta.titulo }, alerta);
    const mensaje = `⚠️ ESCALADO (Nivel ${alerta.nivel_escalado_actual}): ${alerta.mensaje}`;

    await programarNotificacionLocal({
      ...alerta,
      id: `${alerta.id}_escalado_${alerta.nivel_escalado_actual}`,
      titulo,
      mensaje,
      prioridad: 'critica' as PrioridadAlerta,
      fechaHora: new Date().toISOString(),
    } as any);

    return true;
  } catch (e) {
    console.error('[Escalado] Error push_local:', e);
    return false;
  }
}

/** Envía push a todos los miembros de la familia (futuro: tokens guardados). */
async function enviarPushFamilia(alerta: any, nivel: NivelEscalado): Promise<boolean> {
  console.log('[Escalado] push_familia simulado para:', alerta.id);
  return enviarPushLocal(alerta, nivel);
}

/** Notifica al contacto de emergencia (simulado v1). */
async function notificarContactoEmergencia(alerta: any, nivel: NivelEscalado): Promise<boolean> {
  console.log('[Escalado] Notificando contacto emergencia para:', alerta.id);
  return enviarPushLocal(alerta, nivel);
}

/** Envía SMS (placeholder para integración Twilio v2). */
async function enviarSMS(alerta: any, nivel: NivelEscalado): Promise<boolean> {
  console.log('[Escalado] SMS simulado para:', alerta.id);
  return true;
}

/** Inicia llamada telefónica (placeholder v2). */
async function iniciarLlamada(alerta: any, nivel: NivelEscalado): Promise<boolean> {
  console.log('[Escalado] Llamada simulada para:', alerta.id);
  return true;
}

/** Registra envío en historial de la alerta. */
async function registrarEnvio(
  alertaId: string,
  nivel: number,
  configNivel: NivelEscalado,
  exito: boolean,
  error?: string
): Promise<void> {
  const alerta = await getOne('SELECT * FROM alertas WHERE id = ?', [alertaId]);
  if (!alerta) return;

  console.log('[Escalado] Registro envío:', {
    alertaId,
    nivel,
    tipo: configNivel.tipo,
    destinatario: configNivel.destinatario,
    exito,
    error,
    timestamp: new Date().toISOString(),
  });
}

/** Interpola plantilla simple. */
function interpolarPlantilla(
  plantilla: string,
  datos: Record<string, any>,
  alerta?: any
): string {
  let resultado = plantilla;
  for (const [key, value] of Object.entries(datos)) {
    resultado = resultado.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
  }
  if (alerta) {
    resultado = resultado.replace(/\{titulo\}/g, alerta.titulo);
    resultado = resultado.replace(/\{mensaje\}/g, alerta.mensaje);
    resultado = resultado.replace(/\{prioridad\}/g, alerta.prioridad);
  }
  return resultado;
}

/** Cancela el escalado de una alerta (usuario leyó/actuó). */
export async function cancelarEscalado(alertaId: string): Promise<void> {
  await run('UPDATE alertas SET escalada = 0, nivel_escalado_actual = 0 WHERE id = ?', [alertaId]);
  console.log('[Escalado] Escalado cancelado para:', alertaId);
}

/** Job periódico: procesar escalados pendientes (llamar cada minuto). */
export async function jobProcesarEscaladosPendientes(): Promise<void> {
  try {
    const alertas = await queryWithParams(
      'SELECT * FROM alertas WHERE escalada = 1 AND leida = 0 AND descartada = 0'
    );

    for (const alerta of alertas) {
      if (alerta.nivel_escalado_actual > 0 && alerta.reglaId) {
        const regla = await getOne('SELECT * FROM reglas_alerta WHERE id = ?', [alerta.reglaId]);
        if (regla && regla.escalado) {
          const escalado = regla.escalado as ConfigEscalado;
          const nivelConfig = escalado.niveles[alerta.nivel_escalado_actual - 1];
          if (nivelConfig && nivelConfig.requiereConfirmacion) {
            // En v1: no reenviar automáticamente
          }
        }
      }
    }
  } catch (e) {
    console.error('[Escalado] Error en job periódico:', e);
  }
}
