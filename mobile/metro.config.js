const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Excluir archivos WASM de expo-sqlite web (solo para web, no Android)
config.resolver.assetExts = config.resolver.assetExts.filter((ext) => ext !== 'wasm');

// Configurar plataformas para Android (no web)
config.resolver.platforms = ['ios', 'android', 'native'];

// Excluir módulos de Node.js que no funcionan en Android (better-sqlite3, fs)
config.resolver.blockList = config.resolver.blockList || [];
config.resolver.blockList.push(
  /node_modules\/better-sqlite3/,
  /node_modules\/fs/
);

module.exports = config;
