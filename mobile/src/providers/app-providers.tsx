import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryClientProvider } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { queryClient } from '@/api/query-client';
import { TextoGrandeContexto } from '@/components/text';
import { ToastHost } from '@/components/ui/toast';
import { useAuthStore } from '@/store/auth-store';
import { initializeDatabase } from '@/db';
import { useDataStore } from '@/store/data-store';
import { inicializarNotificaciones, programarTodasLasAlertasDeHoy } from '@/notifications';
import { jobProcesarEscaladosPendientes } from '@/utils/alertas';

/** Clave de los ajustes de interfaz persistidos en el dispositivo. */
const CLAVE_AJUSTES = 'cuidapp.ajustes.v1';

/** Proveedores globales: React Query + restauración de sesión + aviso global + BD + Notificaciones. */
export function AppProviders({ children }: { children: ReactNode }) {
  const restaurar = useAuthStore((estado) => estado.restaurar);
  const [textoGrande, setTextoGrande] = useState(false);
  const [dbReady, setDbReady] = useState(false);
  const escaladoIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let mounted = true;
    initializeDatabase()
      .then(async () => {
        if (!mounted) return;

        // 1. Inicializar sistema de notificaciones (permisos, token, handlers)
        await inicializarNotificaciones();

        // 2. Programar alertas de hoy para perfiles activos
        await programarTodasLasAlertasDeHoy();

        // 3. Iniciar job de escalado (cada minuto)
        escaladoIntervalRef.current = setInterval(() => {
          jobProcesarEscaladosPendientes().catch(console.error);
        }, 60_000);

        if (mounted) setDbReady(true);
      })
      .catch((e) => {
        console.error('[AppProviders] Error inicializando BD/Notificaciones:', e);
        if (mounted) setDbReady(true);
      });

    return () => {
      mounted = false;
      if (escaladoIntervalRef.current) {
        clearInterval(escaladoIntervalRef.current);
        escaladoIntervalRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    // La configuración del binario se valida en el layout raíz
    void restaurar();

    // Restaura el ajuste "Texto grande"
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
        /* Sin almacenamiento no hay persistencia. */
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
          {dbReady ? children : null}
          <ToastHost />
        </View>
      </TextoGrandeContexto.Provider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  raiz: { flex: 1 },
});
