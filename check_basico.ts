import * as admin from 'firebase-admin';

// Initialize with application default credentials, which should map to the project on the local machine
// Or use the one from the src/lib/firebase-admin if we can import it
// Let's just create a custom script that we can run with `npx tsx` inside the project folder
import { getAdminDb, getAdminAuth } from './src/lib/firebase-admin';

async function checkUser(email: string) {
    try {
        const auth = getAdminAuth();
        const db = getAdminDb();

        console.log(`Checking Firebase Auth for: ${email}`);
        let user;
        try {
            user = await auth.getUserByEmail(email);
            console.log(`Found User! UID: ${user.uid}`);
            console.log(`Email Verified: ${user.emailVerified}`);
            console.log(`Custom Claims:`, user.customClaims);
            
            // Check 'clients' (empresas)
            const clientsQuery = await db.collection('clients').where('ownerUid', '==', user.uid).get();
            if (!clientsQuery.empty) {
                console.log(`Found ${clientsQuery.size} document(s) in 'clients' collection (Empresa).`);
                clientsQuery.forEach(doc => console.log('Client ID:', doc.id, 'Data:', doc.data().clientName));
            } else {
                console.log(`NO document found in 'clients' collection for ownerUid = ${user.uid}`);
            }

            // Check 'private_profiles'
            const privateDoc = await db.collection('private_profiles').doc(user.uid).get();
            if (privateDoc.exists) {
                console.log(`Found document in 'private_profiles'. Role: ${privateDoc.data()?.role}, Name: ${privateDoc.data()?.firstName}`);
            } else {
                console.log(`NO document found in 'private_profiles' for UID = ${user.uid}`);
            }

            // Check 'registrations'
            const regQuery = await db.collection('registrations').where('ownerUid', '==', user.uid).get();
            if (!regQuery.empty) {
                console.log(`Found ${regQuery.size} document(s) in 'registrations' collection.`);
                regQuery.forEach(doc => console.log('Registration ID:', doc.id, 'Type:', doc.data().registrationType));
            } else {
                console.log(`NO document found in 'registrations' collection for ownerUid = ${user.uid}`);
            }

        } catch (e: any) {
             if (e.code === 'auth/user-not-found') {
                 console.log(`USER NOT FOUND in Firebase Auth with email: ${email}`);
             } else {
                 console.error("Auth Error:", e.message);
             }
        }
    } catch(err) {
        console.error(err);
    }
}

checkUser('basico@dicilo.net').then(() => process.exit(0));
