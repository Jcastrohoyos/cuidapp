/**
 * Afinidad entre el perfil de cuidado y un cuidador candidato.
 *
 * Se calcula SOLO con datos registrados por ambas partes: las competencias que
 * la familia marca como necesarias (`competenciasRequeridas`) y las que el
 * cuidador declara en su perfil (`competencias`). No hay estimaciones ni
 * puntuaciones inventadas: si no hay base para comparar, no se muestra nada.
 */

/** Marcas combinantes Unicode (resultado de `normalize('NFD')`): se eliminan. */
const CODIGO_COMBINANTE_INICIO = 0x0300;
const CODIGO_COMBINANTE_FIN = 0x036f;

/** Normaliza para comparar: sin acentos, minúsculas y sin espacios sobrantes. */
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

/**
 * Porcentaje (0–100, redondeado) de competencias requeridas que declara el
 * cuidador. `null` cuando no hay competencias requeridas o el cuidador no
 * declara ninguna: en ese caso la UI oculta el dato en lugar de inventarlo.
 */
export function calcularAfinidad(requeridas: string[], delCuidador?: string[]): number | null {
  if (requeridas.length === 0 || !delCuidador || delCuidador.length === 0) return null;
  const declaradas = new Set(delCuidador.map(normalizar));
  const coinciden = requeridas.filter((competencia) => declaradas.has(normalizar(competencia))).length;
  return Math.round((coinciden / requeridas.length) * 100);
}
