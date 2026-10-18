import { Tabs } from 'expo-router/js-tabs';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { Platform, useColorScheme } from 'react-native';
import Lucide from '@react-native-vector-icons/lucide';

import { Colors } from '@/constants/theme';

/**
 * Pestañas principales: Inicio, Rutina, Informes y Perfil.
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
  { name: 'rutina', titulo: 'Rutina', icono: 'list-checks', iconoMd: 'checklist' },
  { name: 'informes', titulo: 'Informes', icono: 'chart-line', iconoMd: 'insights' },
  { name: 'perfil', titulo: 'Perfil', icono: 'user', iconoMd: 'person' },
] as const;

/** Iconos iOS (SF Symbols) por pestaña, solo para el `NativeTabs` nativo. */
const ICONOS_SF = {
  index: 'house.fill',
  rutina: 'checklist',
  informes: 'chart.bar.fill',
  perfil: 'person.fill',
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
            md={p.iconoMd === 'insights' ? 'monitoring' : p.iconoMd}
          />
        </NativeTabs.Trigger>
      ))}
    </NativeTabs>
  );
}
