import { useState } from 'react';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/text';

import { Button } from '@/components/ui/button';
import { CampoTexto } from '@/components/ui/field';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { useTheme } from '@/hooks/use-theme';
import { USAR_MOCKS } from '@/api/client';
import { fam, FontSize, Spacing } from '@/constants/theme';

/**
 * Recuperación de contraseña. Envía un enlace de acceso al correo registrado;
 * en modo demo no se envía ningún correo real, se indica abajo.
 */
export default function RecuperarScreen() {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const enviar = async () => {
    setError(undefined);
    if (!email.includes('@')) {
      setError('Introduce un correo electrónico válido.');
      return;
    }
    setEnviando(true);
    // Sin backend de recuperación en demo: simular la espera mantiene el
    // mismo contrato que tendrá cuando exista el endpoint real.
    await new Promise((resolver) => setTimeout(resolver, 600));
    setEnviando(false);
    setEnviado(true);
  };

  if (enviado) {
    return (
      <Screen contentStyle={styles.contenido}>
        <View style={styles.confirmacion}>
          <View style={[styles.icono, { backgroundColor: theme.successSoft, borderColor: theme.success }]}>
            <Text style={[styles.iconoTexto, { color: theme.success }]} accessible={false}>
              ✓
            </Text>
          </View>
          <Text style={[styles.titulo, { color: theme.text }]}>Revisa tu correo</Text>
          <Text style={[styles.texto, { color: theme.textSecondary }]}>
            Si existe una cuenta con {email.trim()}, recibirás un enlace para crear una contraseña
            nueva y volver a entrar.
          </Text>
          <Button titulo="Volver a iniciar sesión" onPress={() => router.replace('/(auth)/login')} fullWidth />
        </View>
      </Screen>
    );
  }

  return (
    <Screen contentStyle={styles.contenido}>
      <ScreenHeader
        titulo="Recupera tu acceso"
        subtitulo="Te enviaremos un enlace al correo de tu cuenta familiar para elegir una contraseña nueva."
      />

      <View style={styles.formulario}>
        <CampoTexto
          label="Correo electrónico"
          valor={email}
          onChangeTexto={setEmail}
          placeholder="ana@email.com"
          teclado="email-address"
          error={error}
          autoCapitalize="none"
          autoComplete="email"
          textContentType="username"
          autoCorrect={false}
        />
        <Button titulo="Enviar enlace" onPress={enviar} cargando={enviando} fullWidth />
        {USAR_MOCKS ? (
          <Text style={[styles.demo, { color: theme.textSecondary }]}>
            Modo demo: no se envían correos reales.
          </Text>
        ) : null}
        <Button titulo="Volver" variante="ghost" onPress={() => router.back()} fullWidth />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  contenido: {
    flexGrow: 1,
    justifyContent: 'center',
    gap: Spacing.five,
  },
  formulario: {
    gap: Spacing.three,
  },
  confirmacion: {
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.five,
  },
  icono: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconoTexto: {
    fontFamily: fam(800),
    fontSize: FontSize.xl,
    fontWeight: '800',
  },
  titulo: {
    fontFamily: fam(800),
    fontSize: FontSize.xl,
    fontWeight: '800',
    textAlign: 'center',
  },
  texto: {
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
});
