import { Tabs } from 'expo-router/js-tabs';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { Platform, useColorScheme } from 'react-native';
import Lucide from '@react-native-vector-icons/lucide';

import { Colors } from '@/constants/theme';

/**
 * Pestañas principales: Inicio, Buscar, Rutina y Mi cuidador — los mismos
 * cuatro tabs que la demo interactiva de la landing, para que la app real
 * se vea igual que la demo.
 *
 * - Nativo: `NativeTabs` (barra nativa con iconos SF Symbols / Material).
 * - Web: `NativeTabs` dibuja solo una píldora flotante fija (sin iconos) que
 *   se superpone al contenido al hacer scroll, así que en web se usa `Tabs`
 *   (JS): barra inferior en el flujo normal —nada fijo que tape la
 *   pantalla— con iconos reales.
 */
/**
 * Pestañas con iconos reales. `icono` = Lucide (lineal, guía visual) para la
 * barra web; `iconoMd` = MaterialIcons para el `md` de `NativeTabs` (solo
 * acepta nombres de esa familia en Android nativo).
 */
const PESTANAS = [
  { name: 'index', titulo: 'Inicio', icono: 'house', iconoMd: 'home' },
  { name: 'buscar', titulo: 'Buscar', icono: 'search', iconoMd: 'search' },
  { name: 'rutina', titulo: 'Rutina', icono: 'calendar', iconoMd: 'event' },
  { name: 'cuidador', titulo: 'Mi cuidador', icono: 'user', iconoMd: 'person' },
] as const;

/** Iconos iOS (SF Symbols) por pestaña, solo para el `NativeTabs` nativo. */
const ICONOS_SF = {
  index: 'house.fill',
  buscar: 'magnifyingglass',
  rutina: 'calendar',
  cuidador: 'person.fill',
} as const;

export default function TabLayout() {
  const scheme = useColorScheme();
  // `useColorScheme` puede devolver null/'unspecified': se cae al tema claro.
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  if (Platform.OS === 'web') {
    return (
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarStyle: { backgroundColor: colors.background, borderTopColor: colors.border },
        }}>
        {PESTANAS.map((p) => (
          <Tabs.Screen
            key={p.name}
            name={p.name}
            options={{
              title: p.titulo,
              tabBarIcon: ({ color, size }) => (
                <Lucide name={p.icono} size={size} color={color} />
              ),
            }}
          />
        ))}
      </Tabs>
    );
  }

  return (
    <NativeTabs
      backgroundColor={colors.background}
      indicatorColor={colors.primarySoftStrong}
      labelStyle={{ selected: { color: colors.primary }}}>
      {PESTANAS.map((p) => (
        <NativeTabs.Trigger key={p.name} name={p.name}>
          <NativeTabs.Trigger.Label>{p.titulo}</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon
            sf={ICONOS_SF[p.name]}
            md={p.iconoMd}
          />
        </NativeTabs.Trigger>
      ))}
    </NativeTabs>
  );
}
