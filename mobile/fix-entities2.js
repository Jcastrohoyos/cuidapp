const fs = require('fs');
let content = fs.readFileSync('D:/paginas y programacion/cuidadores/mobile/src/components/alertas/NotificacionesSettings.tsx', 'utf8');
const search = 'Romper "no molestar"';
const replace = 'Romper "no molestar"';
if (content.includes(search)) {
  content = content.replace(search, replace);
  fs.writeFileSync('D:/paginas y programacion/cuidadores/mobile/src/components/alertas/NotificacionesSettings.tsx', content);
  console.log('Fixed unescaped entities');
} else {
  console.log('Pattern not found!');
}