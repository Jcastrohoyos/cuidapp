/**
 * Test del hook de tema: el sistema puede no definir esquema de color y la
 * app nunca debe romperse en ese caso (pantalla en blanco).
 */

import { renderHook } from '@testing-library/react-native';

import { useTheme } from './use-theme';
import { useColorScheme } from './use-color-scheme';
import { Colors } from '@/constants/theme';

jest.mock('@/hooks/use-color-scheme', () => ({
  useColorScheme: jest.fn(),
}));

// El tipo público de `useColorScheme` no admite null, pero en runtime puede
// devolverlo (Android sin modo noche definido): el mock es deliberadamente
// más laxo que el tipo para poder reproducir ese caso.
const useColorSchemeMock = useColorScheme as unknown as jest.Mock;

describe('useTheme', () => {
  it('devuelve el tema claro cuando el sistema no define esquema', async () => {
    // Android con UI_MODE_NIGHT_UNDEFINED devuelve null.
    useColorSchemeMock.mockReturnValue(null);

    const { result } = await renderHook(() => useTheme());

    expect(result.current).toBe(Colors.light);
    expect(result.current.background).toBeDefined();
  });

  it('devuelve el tema oscuro en modo oscuro', async () => {
    useColorSchemeMock.mockReturnValue('dark');
    const { result } = await renderHook(() => useTheme());
    expect(result.current).toBe(Colors.dark);
  });

  it('devuelve el tema claro en modo claro', async () => {
    useColorSchemeMock.mockReturnValue('light');
    const { result } = await renderHook(() => useTheme());
    expect(result.current).toBe(Colors.light);
  });

  it('trata "unspecified" como tema claro', async () => {
    useColorSchemeMock.mockReturnValue('unspecified');
    const { result } = await renderHook(() => useTheme());
    expect(result.current).toBe(Colors.light);
  });
});
