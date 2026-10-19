import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { endpoints } from '@/api/endpoints';
import { qk } from '@/api/query-keys';
import { tareasDelDia } from '@/utils/rutina';
import type { Incidencia, RegistroTarea, Tarea } from '@/types';

/** Datos para crear una tarea desde la familia (sin ids ni flags de origen). */
export type NuevaTarea = Omit<Tarea, 'id' | 'perfilId' | 'personalizada' | 'fechaAplicacion'>;

/** Rutina diaria de un perfil: tareas, registros del día e incidencias. */
export function useRutina(perfilId: string, fecha: string) {
  const queryClient = useQueryClient();

  const tareas = useQuery({
    queryKey: qk.tareas(perfilId),
    queryFn: () => endpoints.listarTareas(perfilId),
    enabled: Boolean(perfilId),
  });

  const registros = useQuery({
    queryKey: qk.registros(perfilId, fecha),
    queryFn: () => endpoints.listarRegistros(perfilId, fecha),
    enabled: Boolean(perfilId),
  });

  const incidencias = useQuery({
    queryKey: qk.incidencias(perfilId),
    queryFn: () => endpoints.listarIncidencias(perfilId),
    enabled: Boolean(perfilId),
  });

  const registrar = useMutation({
    mutationFn: ({
      tareaId,
      estado,
      responsableId,
      nota,
    }: {
      tareaId: string;
      estado: RegistroTarea['estado'];
      responsableId?: string;
      nota?: string;
    }) => endpoints.registrarTarea(tareaId, estado, responsableId, nota),
    // Actualización optimista: la familia ve el cambio al instante.
    // El modelo de persistencia es append (un registro nuevo por cambio), así que
    // añadimos un registro y el estado vigente se deriva del más reciente.
    onMutate: async ({ tareaId, estado, responsableId }) => {
      await queryClient.cancelQueries({ queryKey: qk.registros(perfilId, fecha) });
      const previos = queryClient.getQueryData<RegistroTarea[]>(qk.registros(perfilId, fecha));
      queryClient.setQueryData<RegistroTarea[]>(qk.registros(perfilId, fecha), (actual = []) => [
        ...actual,
        { id: `reg_${Date.now()}`, tareaId, fecha, estado, responsableId },
      ]);
      return { previos };
    },
    onError: (_error, _variables, contexto) => {
      if (contexto?.previos) {
        queryClient.setQueryData(qk.registros(perfilId, fecha), contexto.previos);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: qk.registros(perfilId, fecha) });
      queryClient.invalidateQueries({ queryKey: qk.tareas(perfilId) });
    },
  });

  const agregar = useMutation({
    mutationFn: (datos: NuevaTarea) => endpoints.nuevaTarea(perfilId, datos),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.tareas(perfilId) }),
  });

  const eliminar = useMutation({
    mutationFn: (tareaId: string) => endpoints.eliminarTarea(tareaId),
    onMutate: async (tareaId) => {
      // Actualización optimista: la fila desaparece al instante.
      await queryClient.cancelQueries({ queryKey: qk.tareas(perfilId) });
      const previas = queryClient.getQueryData<Tarea[]>(qk.tareas(perfilId));
      queryClient.setQueryData<Tarea[]>(qk.tareas(perfilId), (actual = []) =>
        actual.filter((t) => t.id !== tareaId),
      );
      return { previas };
    },
    onError: (_error, _tareaId, contexto) => {
      if (contexto?.previas) queryClient.setQueryData(qk.tareas(perfilId), contexto.previas);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: qk.tareas(perfilId) }),
  });

  /** Estado vigente de una tarea: el registro más reciente (por id creciente). */
  const estadoTarea = (tareaId: string): RegistroTarea['estado'] => {
    const regs = (registros.data ?? []).filter((r) => r.tareaId === tareaId);
    if (regs.length === 0) return 'pendiente';
    const ultima = regs.reduce((a, b) => {
      const na = Number(a.id.replace(/\D/g, '')) || 0;
      const nb = Number(b.id.replace(/\D/g, '')) || 0;
      return nb > na ? b : a;
    });
    return ultima.estado;
  };

  return {
    // Solo lo visible hoy: diarias + puntuales cuya fecha coincide.
    tareas: tareasDelDia((tareas.data ?? []) as Tarea[], fecha),
    incidencias: (incidencias.data ?? []) as Incidencia[],
    estadoTarea,
    registrar,
    agregar,
    eliminar,
    cargando: tareas.isLoading || registros.isLoading,
    esError: tareas.isError || registros.isError,
    refetch: () => {
      void tareas.refetch();
      void registros.refetch();
      void incidencias.refetch();
    },
  };
}
