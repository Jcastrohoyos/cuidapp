import { useMutation, useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query';

import { endpoints } from '@/api/endpoints';
import { qk } from '@/api/query-keys';
import { useCandidatos } from '@/hooks/use-servicios';
import type { Candidatura, ConfigCuidador, Cuidador } from '@/types';

interface Seleccionado {
  cuidador: Cuidador | null;
  candidatura: Candidatura | null;
  isLoading: boolean;
  esError: boolean;
  refetch: () => void;
}

/** Cuidador seleccionado de un perfil (la candidatura en estado 'seleccionada'). */
export function useMiCuidador(perfilId: string): Seleccionado {
  const candidatos = useCandidatos(perfilId);
  const seleccionado =
    (candidatos.data ?? []).find((c) => c.candidatura.estado === 'seleccionada') ?? null;
  return {
    cuidador: seleccionado?.cuidador ?? null,
    candidatura: seleccionado?.candidatura ?? null,
    isLoading: candidatos.isLoading,
    esError: candidatos.isError,
    refetch: () => void candidatos.refetch(),
  };
}

/** Configuración "Mi cuidador" (acuerdos y permisos) del perfil activo. */
export function useConfigCuidador(perfilId: string): UseQueryResult<ConfigCuidador> {
  return useQuery({
    queryKey: qk.configCuidador(perfilId),
    queryFn: () => endpoints.obtenerConfigCuidador(perfilId),
    enabled: Boolean(perfilId),
  });
}

export function useGuardarConfigCuidador(perfilId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (cambios: Partial<Omit<ConfigCuidador, 'perfilId'>>) =>
      endpoints.guardarConfigCuidador(perfilId, cambios),
    onSuccess: (config) => queryClient.setQueryData(qk.configCuidador(perfilId), config),
  });
}
