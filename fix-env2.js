const fs = require('fs');
let content = fs.readFileSync('.env.local', 'utf8');

// Fix the corrupted joined line if it exists
content = content.replace(/}'NEXT_PUBLIC_N8N_REFERRAL_WEBHOOK=/, "}'\nNEXT_PUBLIC_N8N_REFERRAL_WEBHOOK=");

// The issue was that the JSON itself had physical newlines inside the .env.local file.
// Let's extract the FIREBASE_SERVICE_ACCOUNT_KEY, parse it, and stringify it on ONE line.
const match = content.match(/FIREBASE_SERVICE_ACCOUNT_KEY='(\{.*?\})'/s);
if (match) {
    try {
        let jsonStr = match[1];
        // Strip out the physical newlines. The private_key field already has literal \n sequences.
        jsonStr = jsonStr.replace(/\n/g, '');
        // Validate JSON
        const parsed = JSON.parse(jsonStr);
        // Replace in content
        content = content.replace(match[0], `FIREBASE_SERVICE_ACCOUNT_KEY='${JSON.stringify(parsed)}'`);
    } catch (e) {
        console.error("Could not parse extracted JSON:", e);
    }
}

fs.writeFileSync('.env.local', content);
console.log("Fixed .env.local");
