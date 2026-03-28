const admin = require('firebase-admin');

// Ensure you have an app initialized
if (!admin.apps.length) {
    admin.initializeApp();
}

async function getDoc() {
    const db = admin.firestore();
    const doc = await db.collection('emailTemplates').doc('9NZAP74oNGLwtZrgiJIT').get();
    const fs = require('fs');
    fs.writeFileSync('./template.html', doc.data().versions['es'].body);
    console.log("Template saved to template.html");
}

getDoc().catch(console.error);
