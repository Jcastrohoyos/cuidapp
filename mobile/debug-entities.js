const fs = require('fs');
let content = fs.readFileSync('D:/paginas y programacion/cuidadores/mobile/src/components/alertas/NotificacionesSettings.tsx', 'utf8');
const lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('no molestar')) {
    console.log('Line', i+1, ':', lines[i]);
    // Check character codes
    for (let j = 0; j < lines[i].length; j++) {
      const c = lines[i][j];
      if (c === '"' || c === '"' || c === '"') {
        console.log('  Char at', j, ':', c, 'code:', c.charCodeAt(0));
      }
    }
  }
}