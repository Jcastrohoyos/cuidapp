const fs = require('fs');
let content = fs.readFileSync('D:/paginas y programacion/cuidadores/mobile/src/components/alertas/NotificacionesSettings.tsx', 'utf8');
content = content.replace('Romper "no molestar" si prioridad = crítica', "Romper 'no molestar' si prioridad = crítica");
fs.writeFileSync('D:/paginas y programacion/cuidadores/mobile/src/components/alertas/NotificacionesSettings.tsx', content);
console.log('Fixed unescaped entities');