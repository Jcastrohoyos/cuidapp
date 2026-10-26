import { Stack } from 'expo-router';

/** Stack de autenticación (solo accesible sin sesión). */
export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />;
}
