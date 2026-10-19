/**
 * Filtros de la pestaña Buscar: texto libre + los cuatro chips de la demo de
 * la landing (distancia, disponibilidad, verificados y valoración). Todo se
 * decide con datos registrados del cuidador y las preferencias de la familia
 * —el mismo principio de "nada inventado" que la afinidad— y es puro para
 * poder probarse sin UI.
 */
import type { Cuidador, FranjaDisponibilidad, TipoVerificacion } from '@/types';

/** Valoración media mínima del chip «+4,5» de la demo. */
export const UMBRAL_VALORACION_BUSCADA = 4.5;

/** Etiquetas de franja (mismo mapa que muestra las preferencias en Perfil). */
const FRANJAS_TEXTO: Record<FranjaDisponibilidad, string> = {
  manana: 'mañanas',
  tarde: 'tardes',
  noche: 'noches',
};

export interface CriteriosBusqueda {
  /** Texto libre: nombre, biografía o competencias (ignora acentos y mayúsculas). */
  texto: string;
  /** Chip «Zona · N km»: descarta a quien esté más lejos que `distanciaMaxKm`. */
  cercaDe: boolean;
  distanciaMaxKm: number;
  /** Chip «Disponibilidad»: exige coincidir con alguna franja de la familia. */
  porDisponibilidad: boolean;
  franjas: FranjaDisponibilidad[];
  /** Chip «Verificados»: exige las verificaciones mínimas pedidas por la familia. */
  soloVerificados: boolean;
  verificacionesMinimas: TipoVerificacion[];
  /** Chip «+4,5»: exige esa valoración media mínima. */
  mejorValorados: boolean;
}

/** Marcas combinantes Unicode (resultado de `normalize('NFD')`): se eliminan. */
const CODIGO_COMBINANTE_INICIO = 0x0300;
const CODIGO_COMBINANTE_FIN = 0x036f;

/** Minúsculas y sin acentos: «geriatrica» debe encontrar «geriátrica». */
function normalizar(texto: string): string {
  const sinAcentos = texto
    .normalize('NFD')
    .split('')
    .filter((caracter) => {
      const codigo = caracter.charCodeAt(0);
      return codigo < CODIGO_COMBINANTE_INICIO || codigo > CODIGO_COMBINANTE_FIN;
    })
    .join('');
  return sinAcentos.toLowerCase().trim();
}

/** Aplica texto + chips en el orden declarado. Puro: no muta la lista. */
export function filtrarCuidadores(
  cuidadores: Cuidador[],
  criterios: CriteriosBusqueda,
): Cuidador[] {
  const consulta = normalizar(criterios.texto);
  const franjasTexto = criterios.franjas.map((franja) => normalizar(FRANJAS_TEXTO[franja]));

  return cuidadores.filter((cuidador) => {
    if (consulta) {
      const haystack = normalizar(
        [cuidador.nombre, cuidador.biografia ?? '', ...(cuidador.competencias ?? [])].join(' '),
      );
      if (!haystack.includes(consulta)) return false;
    }

    // Sin distancia registrada no se excluye: se ignora, no se inventa.
    if (
      criterios.cercaDe &&
      cuidador.distanciaKm != null &&
      cuidador.distanciaKm > criterios.distanciaMaxKm
    ) {
      return false;
    }

    // Sin franjas pedidas el chip no descarta a nadie.
    if (criterios.porDisponibilidad && franjasTexto.length > 0) {
      const disponibilidad = normalizar(cuidador.disponibilidad);
      if (!franjasTexto.some((franja) => disponibilidad.includes(franja))) return false;
    }

    // Sin verificaciones mínimas no hay base para juzgar: no se descarta.
    if (criterios.soloVerificados && criterios.verificacionesMinimas.length > 0) {
      const cumple = criterios.verificacionesMinimas.every((tipo) =>
        cuidador.verificaciones.some(
          (verificacion) => verificacion.tipo === tipo && verificacion.estado === 'verificada',
        ),
      );
      if (!cumple) return false;
    }

    if (criterios.mejorValorados && (cuidador.valoracion ?? 0) < UMBRAL_VALORACION_BUSCADA) {
      return false;
    }

    return true;
  });
}
