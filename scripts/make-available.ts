const admin = require('firebase-admin');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

if (!admin.apps.length) {
    if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY is not defined in .env.local');
    }
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function makeAvailable() {
    console.log("Buscando registros inactivos para ponerlos disponibles (available)...");
    
    // Obtenemos un lote de negocios inactivos
    const snapshot = await db.collection('businesses')
        .where('active', '==', false)
        .limit(500)
        .get();

    if (snapshot.empty) {
        console.log("No se encontraron registros inactivos.");
        return;
    }

    const batch = db.batch();
    let count = 0;

    snapshot.docs.forEach(doc => {
        const data = doc.data();
        // Solo actualizar si no está asignado o no tiene el estado
        if (!data.assignmentStatus || data.assignmentStatus === 'available') {
            batch.update(doc.ref, { assignmentStatus: 'available' });
            count++;
        }
    });

    if (count > 0) {
        await batch.commit();
        console.log(`¡Éxito! ${count} registros ahora están 'available' para los freelancers.`);
    } else {
        console.log("Los registros encontrados ya estaban asignados o disponibles.");
    }
}

makeAvailable()
    .then(() => process.exit(0))
    .catch(error => {
        console.error("Error:", error);
        process.exit(1);
    });
