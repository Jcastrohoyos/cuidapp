import { useMutation, useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query';

import { endpoints } from '@/api/endpoints';
import { qk } from '@/api/query-keys';
import type { CandidatoComparado, PerfilCuidado, ServicioComplementario } from '@/types';

export function useCandidatos(perfilId: string): UseQueryResult<CandidatoComparado[]> {
  return useQuery({
    queryKey: qk.candidatos(perfilId),
    queryFn: () => endpoints.listarCandidatos(perfilId),
    enabled: Boolean(perfilId),
  });
}

export function useSeleccionarCandidato(perfilId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (candidaturaId: string) => endpoints.seleccionarCandidato(candidaturaId),
    onSuccess: (perfil: PerfilCuidado) => {
      // La familia ahora tiene cuidador: se refleja en el perfil para que
      // aparezca "Con cuidador" y la entrada "Ver rutina de hoy".
      queryClient.setQueryData(qk.perfil(perfilId), perfil);
      queryClient.setQueryData(qk.perfiles, (prev) =>
        (prev as PerfilCuidado[] | undefined)?.map((p) => (p.id === perfil.id ? perfil : p)),
      );
      queryClient.invalidateQueries({ queryKey: qk.candidatos(perfilId) });
    },
  });
}

export function useServicios(): UseQueryResult<ServicioComplementario[]> {
  return useQuery({ queryKey: qk.servicios('catalogo'), queryFn: endpoints.listarServicios });
}

export function useContratarServicio() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => endpoints.contratarServicio(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.servicios('catalogo') }),
  });
}
