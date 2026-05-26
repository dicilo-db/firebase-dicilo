const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Cargar variables de entorno desde el .env.local de diciwallet-web
const envPath = path.resolve(__dirname, '.env.local');

let serviceAccountStr = '';
try {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/FIREBASE_SERVICE_ACCOUNT_KEY='({.*?})'/s);
  if (match && match[1]) {
    serviceAccountStr = match[1].replace(/\\\\n/g, '\\n');
  }
} catch (e) {
  console.error("Error reading environment variable file:", e);
}

if (!serviceAccountStr) {
  console.error("Could not find FIREBASE_SERVICE_ACCOUNT_KEY in env file.");
  process.exit(1);
}

const serviceAccount = JSON.parse(serviceAccountStr);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'geosearch-fq4i9',
});

const db = admin.firestore();

// 5 Continentes oficiales
const continents = ['EU', 'LA', 'AF', 'AS', 'OC'];

async function seed() {
  console.log("Starting database seeding for DiciWallet (5 Continents, 100 Coins each)...");

  try {
    // 1. Borrar todas las monedas existentes para empezar con un catálogo limpio
    const coinsSnapshot = await db.collection('dici_coins').get();
    console.log(`Found ${coinsSnapshot.size} existing coins. Deleting...`);
    
    let deleteBatch = db.batch();
    let count = 0;
    for (const doc of coinsSnapshot.docs) {
      deleteBatch.delete(doc.ref);
      count++;
      if (count % 400 === 0) {
        await deleteBatch.commit();
        deleteBatch = db.batch();
      }
    }
    if (count % 400 !== 0) {
      await deleteBatch.commit();
    }
    console.log("Cleared old dici_coins documents.");

    // 2. Generar y escribir 100 monedas para cada continente
    let writeBatch = db.batch();
    let writeCount = 0;

    for (const continent of continents) {
      console.log(`Generating series for ${continent}...`);
      for (let number = 1; number <= 100; number++) {
        // Formato ID: EU-DC0000001 ... OC-DC0000100
        const id = `${continent}-DC${String(number).padStart(7, '0')}`;
        const coinRef = db.collection('dici_coins').doc(id);

        const coinData = {
          id,
          serial: '',
          number,
          continent,
          status: 'available',
          valueEur: 5000,
          reserveAmount: 500,
          paidAmount: 0,
          currentOwnerId: null,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        writeBatch.set(coinRef, coinData);
        writeCount++;

        // Commit cada 400 para no exceder los límites de batch (500)
        if (writeCount % 400 === 0) {
          await writeBatch.commit();
          writeBatch = db.batch();
          console.log(`- Committed batch of 400 coins. Total: ${writeCount}`);
        }
      }
    }

    if (writeCount % 400 !== 0) {
      await writeBatch.commit();
      console.log(`- Committed remaining batch. Total: ${writeCount}`);
    }

    console.log(`Database seeding completed successfully! ${writeCount} DiciCoins registered.`);
    process.exit(0);
  } catch (error) {
    console.error("Database seeding failed:", error);
    process.exit(1);
  }
}

seed();
