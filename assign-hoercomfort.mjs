import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { readFile } from 'fs/promises';

const serviceAccount = JSON.parse(await readFile('./service-account.json', 'utf8'));

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();
const auth = getAuth();

async function run() {
  const email = 'dicilo@hoercomfort.de';
  const clientId = 'E6IUdKlV5OMlv2DWlNxE';
  
  let user;
  try {
    // Attempt to fetch existing user
    user = await auth.getUserByEmail(email);
    console.log("El usuario ya existe en Auth:", user.uid);
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      try {
        user = await auth.createUser({
          email: email,
          password: 'Dicilo2026!*',
          displayName: 'HörComfort Services',
          emailVerified: true
        });
        console.log("Usuario de Auth creado existosamente con UID:", user.uid);
      } catch(createError) {
        console.error("Error al crear usuario:", createError);
        return;
      }
    } else {
      console.error("Error buscando usuario:", error);
      return;
    }
  }

  // Update client document
  try {
    const clientRef = db.collection('clients').doc(clientId);
    const doc = await clientRef.get();
    if (!doc.exists) {
      console.error("Error: No se encontró el documento client con el ID:", clientId);
      return;
    }
    
    await clientRef.update({
      email: email,
      ownerUid: user.uid
    });
    
    console.log(`\n¡Éxito! Documento del cliente (ID: ${clientId}) actualizado correctamente con el email ${email} y su respectivo Owner UID.`);
  } catch (e) {
    console.error("Error al actualizar la base de datos:", e);
  }
}

run().catch(console.error);
