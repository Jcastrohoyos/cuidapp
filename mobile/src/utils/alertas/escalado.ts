/**
 * Motor de Escalado de Alertas (FASE 1).
 * Procesa alertas no respondidas y escala según configuración.
 */

import { getDatabase } from '@/db';
import { programarNotificacionLocal } from '@/notifications/programar';
import type { AlertaMedica, ConfigEscalado, NivelEscalado, PrioridadAlerta } from '@/types';

/** Estado de escalado persistido en la alerta. */
export interface EstadoEscaladoInterno {
  alertaId: string;
  nivelActual: number;              // 0 = sin escalar, 1 = primer nivel...
  proximoNivelEn: Date | null;      // Cuándo disparar siguiente nivel
  cancelado: boolean;               // Usuario leyó/actuó
  historialEnvios: EnvioEscalado[]; // Log de envíos
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
  const db = getDatabase();
  
  const alerta = await db.get('alertas').findById(alertaId);
  if (!alerta) {
    console.warn('[Escalado] Alerta no encontrada:', alertaId);
    return;
  }

  // Verificar si la regla tiene configuración de escalado
  if (!alerta.reglaId) return;

  const regla = await db.get('reglas_alerta').findById(alerta.reglaId);
  if (!regla || !regla.escalado) return;

  const escalado = regla.escalado as ConfigEscalado;
  if (!escalado.niveles || escalado.niveles.length === 0) return;

  // Marcar alerta como en escalado
  await db.action(async () => {
    await alerta.update((a: any) => {
      a.escalada = true;
      a.nivelEscaladoActual = 1; // Primer nivel
    });
  });

  // Programar primer nivel si tiene retraso 0, o programar para después
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
  const db = getDatabase();
  
  const alerta = await db.get('alertas').findById(alertaId);
  if (!alerta || alerta.leida || alerta.descartada) {
    console.log('[Escalado] Alerta ya leída/descartada, cancelando escalado');
    await cancelarEscalado(alertaId);
    return false;
  }

  if (alerta.nivelEscaladoActual !== numeroNivel) {
    console.log('[Escalado] Nivel no coincide (actual:', alerta.nivelEscaladoActual, 'esperado:', numeroNivel, ')');
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

  // Registrar envío en historial
  await registrarEnvio(alertaId, numeroNivel, nivel, exito, error);

  if (exito) {
    // Programar siguiente nivel si existe
    const regla = await db.get('reglas_alerta').findById(alerta.reglaId!);
    if (regla && regla.escalado) {
      const escalado = regla.escalado as ConfigEscalado;
      const siguienteNivel = escalado.niveles[numeroNivel]; // 0-indexed
      if (siguienteNivel) {
        await programarProximoNivel(alertaId, numeroNivel + 1, siguienteNivel.retrasoMinutos);
      } else {
        // Escalado completado
        await db.action(async () => {
          await alerta.update((a: any) => {
            a.nivelEscaladoActual = escalado.niveles.length;
          });
        });
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
  const db = getDatabase();
  const alerta = await db.get('alertas').findById(alertaId);
  if (!alerta) return;

  const fechaEnvio = new Date(Date.now() + retrasoMinutos * 60 * 1000);
  
  await db.action(async () => {
    await alerta.update((a: any) => {
      a.nivelEscaladoActual = numeroNivel;
      // Guardar timestamp del próximo nivel en un campo temporal
      // En v2 se añadiría campo 'proximoEscaladoEn'
    });
  });

  // En v1: usar setTimeout simple (en v2 usar background task / job queue)
  setTimeout(async () => {
    const regla = await db.get('reglas_alerta').findById(alerta.reglaId!);
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
    const mensaje = `⚠️ ESCALADO (Nivel ${alerta.nivelEscaladoActual}): ${alerta.mensaje}`;
    
    await programarNotificacionLocal({
      ...alerta,
      id: `${alerta.id}_escalado_${alerta.nivelEscaladoActual}`,
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
  // En v1: simular con push_local al mismo dispositivo
  // En v2: iterar tokens de familia y enviar via Expo push API
  console.log('[Escalado] push_familia simulado para:', alerta.id);
  return enviarPushLocal(alerta, nivel);
}

/** Notifica al contacto de emergencia (simulado v1). */
async function notificarContactoEmergencia(alerta: any, nivel: NivelEscalado): Promise<boolean> {
  console.log('[Escalado] Notificando contacto emergencia para:', alerta.id);
  // En v1: log + push_local
  // En v2: SMS/llamada via Twilio, notificación a app de contacto
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
  const db = getDatabase();
  const alerta = await db.get('alertas').findById(alertaId);
  if (!alerta) return;

  // En v1: log a consola. En v2: campo JSON en alerta o tabla separada
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
  const db = getDatabase();
  const alerta = await db.get('alertas').findById(alertaId);
  if (!alerta) return;

  await db.action(async () => {
    await alerta.update((a: any) => {
      a.escalada = false;
      a.nivelEscaladoActual = 0;
    });
  });

  // Cancelar notificaciones de escalado programadas
  // (en v1 no hay persistencia de timeouts, en v2 cancelar jobs)
  console.log('[Escalado] Escalado cancelado para:', alertaId);
}

/** Job periódico: procesar escalados pendientes (llamar cada minuto). */
export async function jobProcesarEscaladosPendientes(): Promise<void> {
  const db = getDatabase();
  
  try {
    const alertas = await db.get('alertas')
      .query()
      .where('escalada', true)
      .where('leida', false)
      .where('descartada', false)
      .fetch();

    for (const alerta of alertas) {
      // Verificar si toca enviar siguiente nivel
      // En v1: lógica simple basada en nivelEscaladoActual
      // En v2: comparar fecha actual con proximoEscaladoEn
      
      if (alerta.nivelEscaladoActual > 0 && alerta.reglaId) {
        const regla = await db.get('reglas_alerta').findById(alerta.reglaId);
        if (regla && regla.escalado) {
          const escalado = regla.escalado as ConfigEscalado;
          const nivelConfig = escalado.niveles[alerta.nivelEscaladoActual - 1];
          
          if (nivelConfig && nivelConfig.requiereConfirmacion) {
            // Si requiere confirmación y no se ha confirmado, ya se envió
            // Solo programar siguiente si pasó el tiempo
            // En v1 simplificado: no reenviar automáticamente
          }
        }
      }
    }
  } catch (e) {
    console.error('[Escalado] Error en job periódico:', e);
  }
}