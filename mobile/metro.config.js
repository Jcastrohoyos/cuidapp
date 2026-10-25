const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Excluir archivos WASM de expo-sqlite web (solo para web, no Android)
config.resolver.assetExts = config.resolver.assetExts.filter((ext) => ext !== 'wasm');

// Configurar plataformas para Android (no web)
config.resolver.platforms = ['ios', 'android', 'native'];

// Reemplazar módulos de Node.js que no funcionan en Android
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  'better-sqlite3': path.resolve(__dirname, 'empty-module.js'),
  fs: path.resolve(__dirname, 'empty-module.js'),
};

module.exports = config;
