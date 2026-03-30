const admin = require("firebase-admin");
try {
  const serviceAccount = require("./firebase-adminsdk.json");
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} catch(e) {
  admin.initializeApp();
}

const db = admin.firestore();

async function run() {
  console.log("Forcing update to module starter...");
  const starterRef = db.collection('system_modules').doc('starter');
  const starterDoc = await starterRef.get();
  
  if (!starterDoc.exists) {
    console.log("Starter module does not exist, creating from scratch is needed via UI.");
    process.exit(0);
  }
  
  let data = starterDoc.data();
  if (!data.fichas) data.fichas = {};
  
  // Apply our new configuration for starter
  data.fichas['cupones'] = { id: 'cupones', name: 'Editor de Cupones', enabled: true, maxLimit: 5 };
  data.fichas['productos'] = { id: 'productos', name: 'Gestión de Productos', enabled: true, maxLimit: 24 };
  data.fichas['inteligencia_mercado'] = { id: 'inteligencia_mercado', name: 'Inteligencia de Mercado', enabled: true };
  data.fichas['redes_sociales'] = { id: 'redes_sociales', name: 'Automatización Redes', enabled: true, maxLimit: 12 };
  data.fichas['geomarketing'] = { id: 'geomarketing', name: 'Geomarketing', enabled: true };
  data.fichas['campanas'] = { id: 'campanas', name: 'Campañas Personalizadas', enabled: true };
  data.fichas['consultas'] = { id: 'consultas', name: 'Consultas Comerciales', enabled: true };
  
  await starterRef.update({ fichas: data.fichas });
  console.log("Starter module updated in DB successfully!");
  process.exit(0);
}

run().catch(console.error);
