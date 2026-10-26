/**
 * Guarda previa de release: falla si un build de distribución se construiría
 * con configuración insegura o incompleta.
 *
 * Uso: node scripts/check-release.js [development|preview|production|apk]
 *
 * Regla: todo perfil que genera un binario instalable necesita O bien la URL
 * del backend (`EXPO_PUBLIC_API_URL`), O bien el permiso explícito de modo
 * demo (`EXPO_PUBLIC_MODO_DEMO=1`, solo para APK de pruebas).
 *
 * La URL puede llegar por dos sitios (ambos válidos):
 *   1. La variable de entorno EXPO_PUBLIC_API_URL del proceso (así la inyecta
 *      EAS Build y así se puede comprobar en CI con `eas env:pull`).
 *   2. El bloque `env` del perfil en eas.json.
 */

const fs = require('fs');
const path = require('path');

const root = __dirname.replace(/\\scripts$/, '');
const appJson = JSON.parse(fs.readFileSync(path.join(root, 'app.json'), 'utf8'));
const expo = appJson.expo ?? {};
const profile = process.argv[2] ?? 'production';

const errors = [];
const avisos = [];

// 1. No placeholders en updates.url (OTA rota para siempre en el binario).
const updatesUrl = expo.updates?.url;
if (updatesUrl && /PENDING|EXAMPLE|CHANGE-ME|your-/.test(updatesUrl)) {
  errors.push(`app.json updates.url contiene un placeholder: "${updatesUrl}".`);
}

// 2. Perfil de distribución: exige backend real o modo demo explícito.
const easJsonPath = path.join(root, 'eas.json');
let apiUrl = '';
let apiUrlPerfil = '';
let esDemo = false;
if (fs.existsSync(easJsonPath)) {
  const eas = JSON.parse(fs.readFileSync(easJsonPath, 'utf8'));
  const buildProfile = eas.build?.[profile];
  if (!buildProfile) {
    errors.push(`eas.json no define el perfil "${profile}".`);
  }
  const profileEnv = buildProfile?.env ?? {};
  // Lo declarado en el perfil es lo que viajará al binario.
  apiUrlPerfil = profileEnv.EXPO_PUBLIC_API_URL ?? '';
  esDemo = profileEnv.EXPO_PUBLIC_MODO_DEMO === '1';
  // El entorno del proceso manda para la comprobación (así se valida en CI
  // con las variables reales que EAS inyectará en el build).
  apiUrl = process.env.EXPO_PUBLIC_API_URL || apiUrlPerfil;

  const tieneEntorno = typeof buildProfile?.environment === 'string';
  if (!tieneEntorno && !esDemo) {
    errors.push(
      `eas.json.build.${profile} no declara "environment": sin él, EAS no inyecta las ` +
        'variables de entorno del proyecto y el binario se construye sin EXPO_PUBLIC_API_URL. ' +
        `Añade "environment": "${profile}" al perfil.`,
    );
  }
}

// El flag de modo demo solo vale si el perfil no lleva una URL propia:
// si el perfil apunta a un backend, no se puede forzar el modo demo.
const demoEfectivo = esDemo && !apiUrlPerfil;

if (esDemo && apiUrlPerfil) {
  errors.push(
    `eas.json.build.${profile}: EXPO_PUBLIC_MODO_DEMO=1 pero EXPO_PUBLIC_API_URL está definida ("${apiUrlPerfil}"). ` +
      'Deja la URL vacía en un build demo, o retira el flag para usar la API real.',
  );
} else if (demoEfectivo) {
  // Build demo autorizado: la app funciona con los datos de ejemplo.
  avisos.push('Build en modo demo: la app usará datos de ejemplo, no un backend real.');
} else if (!apiUrl) {
  errors.push(
    `EXPO_PUBLIC_API_URL no está definida para el perfil "${profile}". ` +
      'Defínela en el entorno de EAS (eas env:set --name EXPO_PUBLIC_API_URL --environment ' +
      `${profile}), en eas.json.build.${profile}.env, o actívala en el proceso antes de ` +
      'ejecutar esta comprobación. Para un build demo: EXPO_PUBLIC_MODO_DEMO=1.',
  );
} else {
  try {
    new URL(apiUrl);
  } catch {
    errors.push(`EXPO_PUBLIC_API_URL no es una URL válida: "${apiUrl}".`);
  }
}

// 3. La app muestra una pantalla de error legible (no un crash) si el binario
//    se construyó sin backend: el guard debe avisar antes, no después.
if (!demoEfectivo && !apiUrl) {
  avisos.push(
    'Sin backend, la app arranca en modo demo y muestra una pantalla de configuración inválida.',
  );
}

if (errors.length) {
  console.error('check-release: fallaron las comprobaciones:');
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

const modo = demoEfectivo ? 'demo' : 'API real';
console.log(
  `check-release: perfil "${profile}" OK (${modo}${apiUrl ? `, API_URL=${apiUrl}` : ''}).`,
);
for (const a of avisos) console.log(`  aviso: ${a}`);
