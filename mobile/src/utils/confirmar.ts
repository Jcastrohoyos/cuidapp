import { Alert, Platform } from 'react-native';

interface Confirmacion {
  titulo: string;
  mensaje: string;
  /** Texto del botón que ejecuta la acción (p. ej. "Publicar"). */
  accion: string;
  /** Botón destructivo (rojo en iOS) para acciones de riesgo. */
  destructiva?: boolean;
}

/**
 * Diálogo de confirmación multiplataforma. En nativo usa el `Alert` del
 * sistema; en web, donde react-native-web lo deja vacío (no-op), recurre a
 * `window.confirm` para que la acción no quede muda.
 */
export function confirmar(
  { titulo, mensaje, accion, destructiva }: Confirmacion,
  alConfirmar: () => void,
): void {
  if (Platform.OS === 'web') {
    if (window.confirm(`${titulo}\n\n${mensaje}`)) alConfirmar();
    return;
  }
  Alert.alert(titulo, mensaje, [
    { text: 'Cancelar', style: 'cancel' },
    { text: accion, style: destructiva ? 'destructive' : undefined, onPress: alConfirmar },
  ]);
}
