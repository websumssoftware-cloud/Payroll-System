const fs = require('fs');
let b64 = fs.readFileSync('logo_base64.txt', 'utf8');
console.log('Has newline before?', b64.includes('\n') || b64.includes('\r'));
b64 = b64.replace(/\s/g, ''); // Remove all whitespaces (including newlines)
const content = `export const LOGO_BASE64 = 'data:image/jpeg;base64,${b64}';\n`;
fs.writeFileSync('constants.js', content);
console.log('Successfully updated constants.js without newlines.');
