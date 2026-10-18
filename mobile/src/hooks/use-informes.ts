import { useQuery } from '@tanstack/react-query';

import { endpoints } from '@/api/endpoints';
import { qk } from '@/api/query-keys';
import type { Informe, RegistroHistorial } from '@/types';

export function useInforme(perfilId: string) {
  return useQuery({
    queryKey: qk.informe(perfilId),
    queryFn: () => endpoints.obtenerInforme(perfilId),
    enabled: Boolean(perfilId),
  });
}

export function useHistorial(
  perfilId: string,
  opts?: { desde?: string; hasta?: string; limite?: number },
) {
  return useQuery({
    queryKey: qk.historial(perfilId),
    queryFn: () => endpoints.listarHistorial(perfilId, opts),
    enabled: Boolean(perfilId),
  });
}

export type { Informe, RegistroHistorial };
