const fs = require('fs');
const content = fs.readFileSync('.env.local', 'utf-8');
const lines = content.split('\n');

let startIdx = lines.findIndex(l => l.startsWith('FIREBASE_SERVICE_ACCOUNT_KEY='));
let endIdx = startIdx;
while (endIdx < lines.length && !lines[endIdx].endsWith("}'")) {
    endIdx++;
}

console.log("Found key from line", startIdx, "to", endIdx);
const keyLines = lines.slice(startIdx, endIdx + 1);
let rawKey = keyLines.join('\n').replace(/^FIREBASE_SERVICE_ACCOUNT_KEY='/, '').replace(/'$/, '');
let singleLine = rawKey.replace(/\n/g, '\\n');

lines.splice(startIdx, endIdx - startIdx + 1, "FIREBASE_SERVICE_ACCOUNT_KEY='" + singleLine + "'");
fs.writeFileSync('.env.local', lines.join('\n'));
console.log("Fixed!");
