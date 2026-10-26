import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/text';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { CampoTexto } from '@/components/ui/field';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';
import { useToast } from '@/hooks/use-toast';
import { endpoints } from '@/api/endpoints';
import { fam, FontSize, Spacing } from '@/constants/theme';

const esquema = z.object({
  nombre: z.string().min(2, { message: 'Indica tu nombre (mínimo 2 letras).' }),
  email: z.email({ message: 'Introduce un correo electrónico válido.' }),
  contrasena: z.string().min(8, { message: 'La contraseña debe tener al menos 8 caracteres.' }),
});

type Formulario = z.infer<typeof esquema>;

export default function RegistroScreen() {
  const theme = useTheme();
  const toast = useToast();
  const { iniciarSesion } = useAuth();

  const {
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<Formulario>({
    resolver: zodResolver(esquema),
    defaultValues: { nombre: '', email: '', contrasena: '' },
    mode: 'onBlur',
  });

  // React Hook Form sin Controller: binding manual con watch/setValue.
  // eslint-disable-next-line react-hooks/incompatible-library -- RHF watch() no es memoizable por diseño
  const valores = watch();

  const registrar = handleSubmit(async (datos) => {
    try {
      const sesion = await endpoints.registrar(datos);
      await iniciarSesion(sesion);
      router.replace('/(tabs)');
    } catch (error) {
      // El mensaje real (si lo hay) lo pinta el banner global; aquí solo
      // evitamos que la promesa quede sin manejar y el botón se quede fijo.
      toast.errorDe(error, 'No hemos podido crear la cuenta. Inténtalo de nuevo.');
    }
  });

  return (
    <Screen contentStyle={styles.contenido}>
      <ScreenHeader
        titulo="Crea tu cuenta familiar"
        subtitulo="Gestiona los cuidados de tu familia desde un único espacio."
      />

      <View style={styles.formulario}>
        <CampoTexto
          label="Nombre"
          valor={valores.nombre}
          onChangeTexto={(texto) => setValue('nombre', texto, { shouldValidate: true })}
          placeholder="Ana Martínez"
          error={errors.nombre?.message}
          autoComplete="name"
          textContentType="name"
        />
        <CampoTexto
          label="Correo electrónico"
          valor={valores.email}
          onChangeTexto={(texto) => setValue('email', texto, { shouldValidate: true })}
          placeholder="ana@email.com"
          teclado="email-address"
          error={errors.email?.message}
          autoCapitalize="none"
          autoComplete="email"
          textContentType="username"
          autoCorrect={false}
        />
        <CampoTexto
          label="Contraseña"
          valor={valores.contrasena}
          onChangeTexto={(texto) => setValue('contrasena', texto, { shouldValidate: true })}
          placeholder="Mínimo 8 caracteres"
          secure
          mostrarToggle
          error={errors.contrasena?.message}
          autoComplete="new-password"
          textContentType="newPassword"
        />
        <Button
          titulo="Crear cuenta"
          onPress={registrar}
          cargando={isSubmitting}
          fullWidth
        />
        <Text style={[styles.nota, { color: theme.textSecondary }]}>
          Plan gratuito: 1 perfil de cuidado. Podrás ampliarlo cuando lo necesites.
        </Text>
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
  nota: {
    fontFamily: fam(400),
    fontSize: FontSize.xs,
    lineHeight: 18,
    textAlign: 'center',
  },
});
