const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Excluir archivos WASM de expo-sqlite web (solo para web, no Android)
config.resolver.assetExts = config.resolver.assetExts.filter((ext) => ext !== 'wasm');

// Configurar plataformas para Android (no web)
config.resolver.platforms = ['ios', 'android', 'native'];

module.exports = config;
