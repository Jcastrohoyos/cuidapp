import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { endpoints } from '@/api/endpoints';
import { qk } from '@/api/query-keys';
import type { Cuidador } from '@/types';

/** Directorio de cuidadores de la pestaña Buscar. */
export function useCuidadores(): UseQueryResult<Cuidador[]> {
  return useQuery({ queryKey: qk.cuidadores, queryFn: endpoints.listarCuidadores });
}
