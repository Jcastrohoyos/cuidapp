import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryClientProvider } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { assertApiConfigurado } from '@/api/client';
import { queryClient } from '@/api/query-client';
import { TextoGrandeContexto } from '@/components/text';
import { ToastHost } from '@/components/ui/toast';
import { useAuthStore } from '@/store/auth-store';

/** Clave de los ajustes de interfaz persistidos en el dispositivo. */
const CLAVE_AJUSTES = 'cuidapp.ajustes.v1';

/** Proveedores globales: React Query + restauración de sesión + aviso global. */
export function AppProviders({ children }: { children: ReactNode }) {
  const restaurar = useAuthStore((estado) => estado.restaurar);
  const [textoGrande, setTextoGrande] = useState(false);

  useEffect(() => {
    // Falla rápido si un build de distribución se construyó sin API URL.
    assertApiConfigurado();
    void restaurar();

    // Restaura el ajuste "Texto grande" persistido en el dispositivo.
    void AsyncStorage.getItem(CLAVE_AJUSTES)
      .then((bruto) => {
        if (!bruto) return;
        try {
          const ajustes = JSON.parse(bruto) as { textoGrande?: unknown };
          if (ajustes.textoGrande === true) setTextoGrande(true);
        } catch {
          /* Ajuste ilegible: se queda el valor por defecto. */
        }
      })
      .catch(() => {
        /* Sin almacenamiento no hay persistencia: la app sigue funcionando. */
      });
  }, [restaurar]);

  const cambiarTextoGrande = useCallback((valor: boolean) => {
    setTextoGrande(valor);
    void AsyncStorage.setItem(CLAVE_AJUSTES, JSON.stringify({ textoGrande: valor })).catch(() => {
      /* Si falla la escritura, el ajuste vale al menos para esta sesión. */
    });
  }, []);

  const valorTextoGrande = useMemo(
    () => ({ textoGrande, setTextoGrande: cambiarTextoGrande }),
    [textoGrande, cambiarTextoGrande],
  );

  return (
    <QueryClientProvider client={queryClient}>
      <TextoGrandeContexto.Provider value={valorTextoGrande}>
        <View style={styles.raiz}>
          {children}
          {/* Banner de avisos superpuesto a toda la app (éxito/error de acciones). */}
          <ToastHost />
        </View>
      </TextoGrandeContexto.Provider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  raiz: { flex: 1 },
});
