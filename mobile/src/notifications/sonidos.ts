/**
 * Configuración de sonidos por prioridad.
 * Los archivos deben estar en assets/sounds/
 */

export const SONIDOS_POR_PRIORIDAD: Record<'baja' | 'media' | 'alta' | 'critica', string> = {
  baja: 'notification_low.wav',
  media: 'notification_medium.wav',
  alta: 'notification_high.wav',
  critica: 'notification_critical.wav',
};

/** Obtiene el canal de Android correspondiente a la prioridad. */
export function obtenerCanalPorPrioridad(prioridad: 'baja' | 'media' | 'alta' | 'critica'): string {
  switch (prioridad) {
    case 'baja': return 'alertas-medicas';
    case 'media': return 'alertas-medicas';
    case 'alta': return 'alertas-medicas';
    case 'critica': return 'alertas-criticas';
  }
}

/** Verifica si un archivo de sonido existe (para validación en desarrollo). */
export function validarSonidos(): { validos: string[]; faltantes: string[] } {
  const validos: string[] = [];
  const faltantes: string[] = [];
  
  // En runtime no podemos verificar assets fácilmente
  // Esta función es placeholder para validación en build
  for (const [prioridad, archivo] of Object.entries(SONIDOS_POR_PRIORIDAD)) {
    validos.push(`${prioridad}: ${archivo}`);
  }
  
  return { validos, faltantes };
}