const fs = require('fs');
const content = fs.readFileSync('.env.local', 'utf8');
const lines = content.split('\n');
let newLines = [];
for (let line of lines) {
    if (line.match(/^[A-Z_]+=/)) {
        newLines.push(line);
    } else if (newLines.length > 0 && newLines[newLines.length - 1].startsWith("FIREBASE_SERVICE_ACCOUNT_KEY")) {
        newLines[newLines.length - 1] += line;
    } else {
        newLines.push(line);
    }
}
fs.writeFileSync('.env.local', newLines.join('\n'), 'utf8');
