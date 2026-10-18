import { Inter_300Light, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold, useFonts } from '@expo-google-fonts/inter';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { AppProviders } from '@/providers/app-providers';
import { useEstadoAuth } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const esquema = useColorScheme();
  const estado = useEstadoAuth();
  const theme = useTheme();
  const autenticado = estado === 'autenticado';
  // Inter: familias por peso (ver `fam()` en constants/theme.ts). Si una fuente
  // falla, se oculta igualmente el splash: la app usa fallback de sistema.
  const [fuentesListas, errorFuente] = useFonts({
    Inter_300Light,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  // Oculta el splash nativo cuando la sesión está restaurada y las fuentes
  // están listas: el primer fotograma ya sale con Inter.
  useEffect(() => {
    if (estado !== 'cargando' && (fuentesListas || errorFuente)) {
      void SplashScreen.hideAsync();
    }
  }, [estado, fuentesListas, errorFuente]);

  return (
    <ThemeProvider value={esquema === 'dark' ? DarkTheme : DefaultTheme}>
      {/* 'auto': contraste correcto de la barra de estado en claro y oscuro. */}
      <StatusBar style="auto" />
      <AppProviders>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: theme.background },
          }}>
          {/* Sin sesión: solo autenticación */}
          <Stack.Protected guard={!autenticado}>
            <Stack.Screen name="(auth)" />
          </Stack.Protected>

          {/* Con sesión: experiencia completa */}
          <Stack.Protected guard={autenticado}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="cuidado/[id]" />
            <Stack.Screen name="cuidado/nuevo" options={{ presentation: 'modal' }} />
            <Stack.Screen name="cuenta" options={{ presentation: 'modal' }} />
            <Stack.Screen name="publicar" options={{ presentation: 'modal' }} />
            <Stack.Screen name="seleccion" />
            <Stack.Screen name="servicios" />
          </Stack.Protected>
        </Stack>
      </AppProviders>
    </ThemeProvider>
  );
}
