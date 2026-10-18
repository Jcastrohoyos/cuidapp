/**
 * Guarda previa de release: falla si un build de distribución se construiría
 * con configuración insegura o incompleta.
 *
 * Uso: node scripts/check-release.js [development|preview|production]
 */

const fs = require('fs');
const path = require('path');

const root = __dirname.replace(/\\scripts$/, '');
const appJson = JSON.parse(fs.readFileSync(path.join(root, 'app.json'), 'utf8'));
const expo = appJson.expo ?? {};
const profile = process.argv[2] ?? 'production';

const errors = [];

// 1. No placeholders en updates.url (OTA rota para siempre en el binario).
const updatesUrl = expo.updates?.url;
if (updatesUrl && /PENDING|EXAMPLE|CHANGE-ME|your-/.test(updatesUrl)) {
  errors.push(`app.json updates.url contiene un placeholder: "${updatesUrl}".`);
}

// 2. Perfil de distribución: exige backend real o modo demo explícito.
const easJsonPath = path.join(root, 'eas.json');
let apiUrl = '';
let esDemo = false;
let esDesarrollo = false;
if (fs.existsSync(easJsonPath)) {
  const eas = JSON.parse(fs.readFileSync(easJsonPath, 'utf8'));
  const buildProfile = eas.build?.[profile];
  const profileEnv = buildProfile?.env ?? {};
  apiUrl = profileEnv.EXPO_PUBLIC_API_URL ?? '';
  esDemo = profileEnv.EXPO_PUBLIC_MODO_DEMO === '1';
  esDesarrollo = buildProfile?.developmentClient === true;
}

if (esDesarrollo) {
  // Dev client: no es un build de distribución → sin exigencias de API.
} else if (esDemo) {
  // Modo demo autorizado: la URL debe ir vacía para que no haya duda de
  // qué mira el binario (el flag manda y fuerza los mocks en runtime).
  if (apiUrl) {
    errors.push(
      `eas.json.build.${profile}: EXPO_PUBLIC_MODO_DEMO=1 pero EXPO_PUBLIC_API_URL está definida ("${apiUrl}"). ` +
        'Deja la URL vacía en un build demo, o retira el flag para usar la API real.',
    );
  }
} else if (!apiUrl) {
  errors.push(
    `eas.json.build.${profile}.env.EXPO_PUBLIC_API_URL no está definida. ` +
      'Define la URL real del backend (o activa EXPO_PUBLIC_MODO_DEMO=1 para un build demo).',
  );
} else {
  try {
    new URL(apiUrl);
  } catch {
    errors.push(`EXPO_PUBLIC_API_URL no es una URL válida: "${apiUrl}".`);
  }
}

if (errors.length) {
  console.error('check-release: fallaron las comprobaciones:');
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

const modo = esDesarrollo ? 'dev-client' : esDemo ? 'demo' : 'API real';
console.log(`check-release: perfil "${profile}" OK (${modo}${apiUrl ? `, API_URL=${apiUrl}` : ''}).`);