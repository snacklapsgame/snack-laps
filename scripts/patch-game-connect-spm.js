const fs = require('fs');
const path = require('path');
const dest = path.join(__dirname, '..', 'node_modules', 'capacitor-game-connect-8', 'Package.swift');
const src = path.join(__dirname, '..', 'patches', 'capacitor-game-connect-8.Package.swift');
if (fs.existsSync(src) && fs.existsSync(path.dirname(dest))) {
  fs.copyFileSync(src, dest);
  console.log('Patched capacitor-game-connect-8 Package.swift for SPM');
}
