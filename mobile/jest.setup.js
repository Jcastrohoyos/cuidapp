// Mocks de módulos nativos para el entorno de pruebas.
// Se ejecuta como setupFile (antes del framework de test).
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(() => Promise.resolve()),
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
  WHEN_UNLOCKED: 'when_unlocked',
}));

// AsyncStorage: mock en memoria (el data-store persiste a través de él).
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
