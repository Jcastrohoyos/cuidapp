import { useState } from 'react';
import { Link, router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/text';

import { Button } from '@/components/ui/button';
import { CampoTexto } from '@/components/ui/field';
import { Screen } from '@/components/ui/screen';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';
import { endpoints } from '@/api/endpoints';
import { USAR_MOCKS } from '@/api/client';
import { fam, FontSize, Spacing } from '@/constants/theme';

export default function LoginScreen() {
  const theme = useTheme();
  const { iniciarSesion } = useAuth();
  const [email, setEmail] = useState('');
  const [contrasena, setContrasena] = useState('');
  // El error del correo va bajo el correo; el de la petición, sobre el botón:
  // un fallo no debe atribuirse al campo equivocado.
  const [errorEmail, setErrorEmail] = useState<string | undefined>();
  const [errorRed, setErrorRed] = useState<string | undefined>();
  const [enviando, setEnviando] = useState(false);

  const entrar = async () => {
    setErrorEmail(undefined);
    setErrorRed(undefined);
    if (!email.includes('@')) {
      setErrorEmail('Introduce un correo electrónico válido.');
      return;
    }
    setEnviando(true);
    try {
      const sesion = await endpoints.iniciarSesion(email.trim(), contrasena);
      await iniciarSesion(sesion);
      router.replace('/(tabs)');
    } catch {
      setErrorRed('No hemos podido iniciar sesión. Revisa el correo y la contraseña.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Screen contentStyle={styles.contenido}>
      <View style={styles.marca}>
        <View style={[styles.logo, { backgroundColor: theme.primary }]}>
          <Text style={[styles.logoTexto, { color: theme.primaryText }]}>Cu</Text>
        </View>
        <Text style={[styles.nombre, { color: theme.text }]}>Cuidapp</Text>
        <Text style={[styles.lema, { color: theme.textSecondary }]}>
          El cuidado de tu familia, en un solo lugar
        </Text>
      </View>

      <View style={styles.formulario}>
        <CampoTexto
          label="Correo electrónico"
          valor={email}
          onChangeTexto={setEmail}
          placeholder="ana@email.com"
          teclado="email-address"
          error={errorEmail}
          autoCapitalize="none"
          autoComplete="email"
          textContentType="username"
          autoCorrect={false}
        />
        <CampoTexto
          label="Contraseña"
          valor={contrasena}
          onChangeTexto={setContrasena}
          placeholder="••••••••"
          secure
          mostrarToggle
          autoComplete="password"
          textContentType="password"
        />
        <View style={styles.campoOlvidar}>
          <Link href="/(auth)/recuperar" asChild>
            {/* <Slot> exige style aplanado: un array lanza error en desarrollo. */}
            <Text style={StyleSheet.flatten([styles.enlaceOlvidar, { color: theme.primary }])}>
              ¿Olvidaste tu contraseña?
            </Text>
          </Link>
        </View>
        {errorRed ? (
          <Text
            style={[styles.errorRed, { color: theme.danger }]}
            accessibilityLiveRegion="polite"
            accessibilityRole="alert">
            {errorRed}
          </Text>
        ) : null}
        <Button titulo="Entrar" onPress={entrar} cargando={enviando} fullWidth />
        {USAR_MOCKS ? (
          <Text style={[styles.demo, { color: theme.textSecondary }]}>
            Modo demo: introduce cualquier correo válido para explorar el Pilar 1 · La familia.
          </Text>
        ) : null}
      </View>

      <View style={styles.pie}>
        <Text style={[styles.pieTexto, { color: theme.textSecondary }]}>¿No tienes cuenta?</Text>
        <Link href="/(auth)/registro" asChild>
          <Text style={StyleSheet.flatten([styles.enlace, { color: theme.primary }])}>
            Crear cuenta familiar
          </Text>
        </Link>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  contenido: {
    // flexGrow permite centrar verticalmente y seguir scrolleando con el teclado.
    flexGrow: 1,
    justifyContent: 'center',
    gap: Spacing.five,
  },
  marca: {
    alignItems: 'center',
    gap: Spacing.two,
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoTexto: {
    fontFamily: fam(800),
    fontSize: 28,
    fontWeight: '800',
  },
  nombre: {
    fontFamily: fam(800),
    fontSize: FontSize['2xl'],
    fontWeight: '800',
  },
  lema: {
    fontFamily: fam(400),
    fontSize: FontSize.sm,
    textAlign: 'center',
  },
  formulario: {
    gap: Spacing.three,
  },
  campoOlvidar: {
    alignItems: 'flex-end',
    marginTop: -Spacing.one,
  },
  enlaceOlvidar: {
    fontFamily: fam(700),
    fontSize: FontSize.sm,
    fontWeight: '700',
    // Objetivo táctil mínimo de 44 pt (WCAG 2.5.8 / Material).
    minHeight: 44,
    textAlignVertical: 'center',
    paddingVertical: Spacing.two,
  },
  errorRed: {
    fontFamily: fam(400),
    fontSize: FontSize.sm,
    lineHeight: 20,
    textAlign: 'center',
  },
  demo: {
    fontFamily: fam(400),
    fontSize: FontSize.xs,
    textAlign: 'center',
    lineHeight: 18,
  },
  pie: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  pieTexto: {
    fontFamily: fam(400),
    fontSize: FontSize.sm,
  },
  enlace: {
    fontFamily: fam(700),
    fontSize: FontSize.sm,
    fontWeight: '700',
    // Objetivo táctil mínimo de 44 pt (WCAG 2.5.8 / Material).
    minHeight: 44,
    textAlignVertical: 'center',
    paddingVertical: Spacing.two,
  },
});
