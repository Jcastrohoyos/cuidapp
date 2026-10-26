import { MutationCache, QueryClient } from '@tanstack/react-query';

import { mensajeDeError } from '@/hooks/use-toast';
import { useToastStore } from '@/store/toast-store';

/** Singleton de React Query. Se comparte entre proveedores y stores para
 * limpiar la caché al cambiar de cuenta (evita fugas de datos entre familias
 * en el mismo dispositivo). */
export const queryClient = new QueryClient({
  // Todo fallo de mutación (publicar, seleccionar, contratar, guardar…) avisa
  // en el banner global: ninguna acción queda fallando en silencio. Los errores
  // de *consultas* no usan este canal para evitar doble aviso — cada pantalla
  // muestra su propio `ErrorState` con reintento.
  mutationCache: new MutationCache({
    onError: (error) => {
      useToastStore.getState().mostrar('error', mensajeDeError(error));
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
