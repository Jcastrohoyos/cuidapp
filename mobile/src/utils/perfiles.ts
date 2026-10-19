/**
 * Lógica pura para quitar a una persona a cargo (eliminar su perfil).
 *
 * Borrar un perfil arrastra todos los datos que cuelgan de él: tareas de la
 * rutina (y sus registros diarios), incidencias, candidaturas, historial y la
 * configuración de "Mi cuidador". La función es pura (no muta la entrada) para
 * que el almacén solo haga `set(...)` con el resultado y los tests puedan
 * cubrirla sin tocar Zustand ni AsyncStorage.
 */

import type {
  CandidatoComparado,
  ConfigCuidador,
  Incidencia,
  PerfilCuidado,
  RegistroHistorial,
  RegistroTarea,
  Tarea,
} from '@/types';

/** Porción de estado cuyo contenido depende del perfil eliminado. */
export interface DatosVinculadosAlPerfil {
  perfiles: PerfilCuidado[];
  tareas: Tarea[];
  registros: RegistroTarea[];
  incidencias: Incidencia[];
  candidatos: CandidatoComparado[];
  historial: RegistroHistorial[];
  configsCuidador: Record<string, ConfigCuidador>;
  perfilActivoId: string | null;
}

/**
 * Devuelve `datos` sin nada del perfil indicado. Cada colección sale en un
 * array nuevo; el resto de perfiles conservan sus datos intactos.
 */
export function depurarDatosDePerfil(
  datos: DatosVinculadosAlPerfil,
  perfilId: string,
): DatosVinculadosAlPerfil {
  const idsTareasDelPerfil = new Set(
    datos.tareas.filter((tarea) => tarea.perfilId === perfilId).map((tarea) => tarea.id),
  );

  const configsCuidador = { ...datos.configsCuidador };
  delete configsCuidador[perfilId];

  return {
    perfiles: datos.perfiles.filter((perfil) => perfil.id !== perfilId),
    tareas: datos.tareas.filter((tarea) => tarea.perfilId !== perfilId),
    // Los registros solo guardan `tareaId`: se depuran contra las tareas borradas.
    registros: datos.registros.filter((registro) => !idsTareasDelPerfil.has(registro.tareaId)),
    incidencias: datos.incidencias.filter((incidencia) => incidencia.perfilId !== perfilId),
    candidatos: datos.candidatos.filter(
      (candidato) => candidato.candidatura.perfilId !== perfilId,
    ),
    historial: datos.historial.filter((registro) => registro.perfilId !== perfilId),
    configsCuidador,
    // Si el perfil activo era el eliminado se despeja: la resolución posterior
    // (usePerfilActivo) caerá en el primer perfil restante o en "vacío".
    perfilActivoId: datos.perfilActivoId === perfilId ? null : datos.perfilActivoId,
  };
}
