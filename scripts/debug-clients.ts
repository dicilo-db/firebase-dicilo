import { doc, getDoc, getFirestore } from 'firebase/firestore';
import { app } from '../src/lib/firebase'; // Adjust path as needed

async function fetchAndLog(id: string, name: string) {
    const db = getFirestore(app);
    const docRef = doc(db, 'clients', id);
    const snap = await getDoc(docRef);

    if (snap.exists()) {
        const data = snap.data();
        console.log(`\n--- DATA FOR ${name} (${id}) ---`);
        console.log("description:", data.description);
        console.log("bodyData:", JSON.stringify(data.bodyData, null, 2));
        console.log("headerData:", JSON.stringify(data.headerData, null, 2));
    } else {
        console.log(`\nDocument ${name} (${id}) not found!`);
    }
}

async function main() {
    await fetchAndLog('E6IUdKlV5OMlv2DWlNxE', 'HörCOMFORT');
    await fetchAndLog('p7HxaWiQqgrXGMx1wD12', 'Angel Cleaning');
    process.exit(0);
}

main().catch(console.error);
