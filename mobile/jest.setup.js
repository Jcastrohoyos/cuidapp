// Mocks de módulos nativos para el entorno de pruebas.
// Se ejecuta como setupFile (antes del framework de test).
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(() => Promise.resolve()),
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
  WHEN_UNLOCKED: 'when_unlocked',
}));
