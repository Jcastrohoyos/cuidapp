import type { Href } from 'expo-router';

import { useSesion } from '@/hooks/use-auth';
import { useHistorial } from '@/hooks/use-informes';
import { usePerfilActivo } from '@/hooks/use-perfiles';
import { useRutina } from '@/hooks/use-rutina';
import { useServicios } from '@/hooks/use-servicios';
import { fechaHoy } from '@/utils/format';

/** Estado de un paso del recorrido de los 7 pasos (modelo de la landing). */
export type EstadoPaso = 'completado' | 'actual' | 'pendiente';

export interface PasoRecorrido {
  num: string;
  titulo: string;
  sub: string;
  ruta: Href;
  estado: EstadoPaso;
}

/** Los 7 pasos del modelo de producto, en el mismo orden que la landing. */
const PASOS = [
  {
    num: '01',
    titulo: 'Cuenta familiar',
    sub: 'Registro, acceso y suscripción',
    ruta: '/perfil',
  },
  {
    num: '02',
    titulo: 'Perfil de cuidado',
    sub: 'Necesidades, hábitos y preferencias',
    ruta: '/cuidado/nuevo',
  },
  {
    num: '03',
    titulo: 'Publicación y búsqueda',
    sub: 'Oferta pública y candidaturas',
    ruta: '/publicar',
  },
  {
    num: '04',
    titulo: 'Selección del cuidador',
    sub: 'Comparar y decidir con información',
    ruta: '/seleccion',
  },
  {
    num: '05',
    titulo: 'Servicios complementarios',
    sub: 'Gestoría, especialistas y formación',
    ruta: '/servicios',
  },
  {
    num: '06',
    titulo: 'Rutinas y seguimiento',
    sub: 'Tareas diarias e incidencias',
    ruta: '/rutina',
  },
  {
    num: '07',
    titulo: 'Información e informes',
    sub: 'Historial organizado y valoración',
    ruta: '/informes',
  },
] as const;

/**
 * Resuelve en qué punto va la familia del recorrido de 7 pasos. Se deriva del
 * estado real de los datos (no de un contador manual), así la home siempre
 * refleja lo que está hecho y lo que queda por hacer.
 */
export function useRecorrido() {
  const sesion = useSesion();
  const { perfil } = usePerfilActivo();
  const servicios = useServicios();
  const rutina = useRutina(perfil?.id ?? '', fechaHoy());
  const historial = useHistorial(perfil?.id ?? '', { limite: 5 });

  const publicado =
    perfil?.estado === 'publicado' ||
    perfil?.estado === 'en_seleccion' ||
    perfil?.estado === 'con_cuidador';
  const conCuidador = perfil?.estado === 'con_cuidador';
  const contratado = (servicios.data ?? []).some((s) => s.contratado);

  const hechos = [
    Boolean(sesion), // 01 cuenta creada = hay sesión
    Boolean(perfil), // 02 perfil de cuidado existe
    publicado, // 03 oferta publicada
    conCuidador, // 04 cuidador seleccionado
    contratado, // 05 algún servicio contratado
    rutina.tareas.length > 0, // 06 rutina con tareas
    (historial.data ?? []).length > 0, // 07 registros en el historial
  ];

  const primeroPendiente = hechos.findIndex((hecho) => !hecho);

  const pasos: PasoRecorrido[] = PASOS.map((paso, i) => ({
    ...paso,
    ruta: paso.ruta,
    estado: hechos[i]
      ? 'completado'
      : i === primeroPendiente
        ? 'actual'
        : ('pendiente' as EstadoPaso),
  }));

  return {
    pasos,
    completados: hechos.filter(Boolean).length,
    total: PASOS.length,
    /** Ruta dinámica del paso 02: abre el perfil real si ya existe. */
    rutaPerfil: perfil ? (`/cuidado/${perfil.id}` as Href) : '/cuidado/nuevo',
  };
}
