import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryResult,
} from '@tanstack/react-query';

import { endpoints } from '@/api/endpoints';
import { qk } from '@/api/query-keys';
import { useAuthStore } from '@/store/auth-store';
import type { PerfilCuidado } from '@/types';

export function usePerfiles(): UseQueryResult<PerfilCuidado[]> {
  return useQuery({ queryKey: qk.perfiles, queryFn: endpoints.listarPerfiles });
}

export function usePerfil(id: string): UseQueryResult<PerfilCuidado> {
  return useQuery({ queryKey: qk.perfil(id), queryFn: () => endpoints.obtenerPerfil(id) });
}

export function useCrearPerfil() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: endpoints.crearPerfil,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.perfiles }),
  });
}

/** Perfil activo: el fijado al abrir /cuidado/[id], o el primero de la lista.
 * Centraliza la resolución para que las pantallas operen siempre sobre el
 * perfil que la familia está viendo, no ciegamente sobre perfiles[0].
 * Expone `esError`/`refetch` para que las pantallas distingan "no hay perfiles"
 * (vacío) de "no se pudo cargar" (error con reintento). */
export function usePerfilActivo() {
  const perfilActivoId = useAuthStore((estado) => estado.perfilActivoId);
  const { data: perfiles, isLoading, isError, refetch } = usePerfiles();
  const id = perfilActivoId ?? perfiles?.[0]?.id ?? null;
  const perfil = perfiles?.find((p) => p.id === id) ?? null;
  return { id, perfil, isLoading, esError: isError, refetch };
}

export function useActualizarPerfil(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (cambios: Partial<PerfilCuidado>) => endpoints.actualizarPerfil(id, cambios),
    onSuccess: (perfil) => {
      queryClient.setQueryData(qk.perfil(id), perfil);
      queryClient.invalidateQueries({ queryKey: qk.perfiles });
    },
  });
}

export function usePublicarPerfil(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => endpoints.publicarPerfil(id),
    onSuccess: (perfil) => {
      queryClient.setQueryData(qk.perfil(id), perfil);
      queryClient.invalidateQueries({ queryKey: qk.perfiles });
      // Publicar puede hacer llegar candidaturas nuevas (demo) → refresca la bandeja.
      queryClient.invalidateQueries({ queryKey: qk.candidatosTodos });
    },
  });
}

export function useEliminarPerfil() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => endpoints.eliminarPerfil(id),
    onSuccess: (_datos, id) => {
      // El detalle ya no existe: se descarta su caché para no servir un 404.
      queryClient.removeQueries({ queryKey: qk.perfil(id) });
      queryClient.invalidateQueries({ queryKey: qk.perfiles });
      // Todo lo que cuelga del perfil desaparece del almacén demo → refrescar
      // por prefijo (['tareas'] alcanza a ['tareas', perfilId], …).
      (
        ['tareas', 'registros', 'incidencias', 'informes', 'historial', 'configCuidador'] as const
      ).forEach((clave) => queryClient.invalidateQueries({ queryKey: [clave] }));
    },
  });
}
