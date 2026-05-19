const fs = require('fs');
const img = fs.readFileSync('../frontend/src/assets/kusum_farm_premium.png');
const b64 = img.toString('base64');
fs.writeFileSync('logo.js', `export const LOGO_BASE64 = 'data:image/jpeg;base64,${b64}';\n`);
console.log('Generated logo.js. Length:', b64.length);
