const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Configurar plataformas para Android (no web)
config.resolver.platforms = ['ios', 'android', 'native'];
config.resolver.assetExts = config.resolver.assetExts.filter((ext) => ext !== 'wasm');

// Reemplazar módulos de Node.js que no funcionan en Android
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  'better-sqlite3': path.resolve(__dirname, 'empty-module.js'),
  fs: path.resolve(__dirname, 'empty-module.js'),
  process: path.resolve(__dirname, 'process-mock.js'),
  'sqlite-node': path.resolve(__dirname, 'empty-module.js'),
  'expo-sqlite': path.resolve(__dirname, 'empty-module.js'),
};

// Excluir módulos web de expo-sqlite que importan .wasm
config.resolver.blockList = config.resolver.blockList || [];
config.resolver.blockList.push(
  /expo-sqlite[\\/]web/,
  /expo-sqlite[\\/]build[\\/].*web/,
  /expo-sqlite.*wa-sqlite/
);

// Interceptar solicitudes de módulos web de expo-sqlite y devolver módulo vacío
config.resolver.requestInterceptor = (context, moduleName, platform, moduleFormat) => {
  if (moduleName && moduleName.includes('expo-sqlite')) {
    return {
      filePath: path.resolve(__dirname, 'empty-module.js'),
      exists: true,
    };
  }
  return context.requestInterceptor(moduleName, platform, moduleFormat);
};

module.exports = config;
