const fs = require('fs');
let content = fs.readFileSync('D:/paginas y programacion/cuidadores/mobile/src/components/alertas/NotificacionesSettings.tsx', 'utf8');
const lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('no molestar')) {
    console.log('Line', i+1, ':', JSON.stringify(lines[i]));
  }
}