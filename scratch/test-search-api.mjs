import dotenv from "dotenv";
import admin from "firebase-admin";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
if (serviceAccount.private_key) {
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
}

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: "geosearch-fq4i9",
});

const db = admin.firestore();

function extractCoords(data) {
  if (!data) return undefined;
  const validate = (lat, lng) => {
    const nLat = Number(lat);
    const nLng = Number(lng);
    if (!isNaN(nLat) && !isNaN(nLng)) return [nLat, nLng];
    return undefined;
  };

  if (data.lat !== undefined && data.lng !== undefined) return validate(data.lat, data.lng);
  if (data.latitude !== undefined && data.longitude !== undefined) return validate(data.latitude, data.longitude);
  if (data._latitude !== undefined && data._longitude !== undefined) return validate(data._latitude, data._longitude);

  const c = data.coords || data.coordinates;
  if (c) {
    if (Array.isArray(c) && c.length === 2) return validate(c[0], c[1]);
  }

  if (Array.isArray(data) && data.length === 2) return validate(data[0], data[1]);

  return undefined;
}

function serializeBusiness(docId, data) {
  const biz = {
    id: docId,
    name: data.clientName || data.name || 'Unbekanntes Unternehmen',
    category: data.category || 'Allgemein',
    description: (data.description || '').substring(0, 500),
    location: data.location || '',
    city: data.city || '',
    zip: data.zip || '',
    address: data.address || '',
    clientType: data.clientType || 'retailer',
    active: data.active !== false,
  };

  const coords = extractCoords(data.coordinates) || extractCoords(data);
  if (coords) biz.coords = coords;

  return biz;
}

function haversineDistance(coords1, coords2) {
  const toRad = (x) => (x * Math.PI) / 180;
  const R = 6371; // Earth radius in km
  const dLat = toRad(coords2[0] - coords1[0]);
  const dLon = toRad(coords2[1] - coords1[1]);
  const lat1 = toRad(coords1[0]);
  const lat2 = toRad(coords2[0]);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const normalizeText = (text) => {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

async function simulateAPI(queryStr, lat, lng) {
  const selectedFields = [
      'name', 'clientName', 'category', 'location', 
      'coordinates', 'coords', 'lat', 'lng', 'latitude', 'longitude', '_latitude', '_longitude',
      'visibility_settings', 'clientType', 'tier_level', 'active', 
      'clientLogoUrl', 'imageUrl', 'headerData', 'coverImage', 
      'address', 'phone', 'email', 'website', 'currentOfferUrl', 
      'slug', 'mapUrl', 'category_key', 'subcategory_key', 'rating',
      'description', 'translations', 'description_translations',
      'city', 'zip'
  ];

  const [businessSnap, clientSnap] = await Promise.all([
    db.collection('businesses').select(...selectedFields).get(),
    db.collection('clients').select(...selectedFields).get()
  ]);

  const businesses = businessSnap.docs.map((doc) => serializeBusiness(doc.id, doc.data()));
  const clients = clientSnap.docs.map((doc) => serializeBusiness(doc.id, doc.data()));
  const allBusinesses = [...businesses, ...clients];

  let filtered = allBusinesses.filter((b) => b.active !== false);

  const query = normalizeText(queryStr);
  if (query.trim().length > 0) {
    filtered = filtered.filter((b) => {
      const searchableText = [b.name, b.description, b.category, b.location, b.address, b.city, b.zip]
        .map(normalizeText)
        .join(' ');
      return searchableText.includes(query);
    });
  }

  if (lat !== null && lng !== null) {
    const userLocation = [lat, lng];
    filtered.sort((a, b) => {
      if (a.clientType === 'premium' && b.clientType !== 'premium') return -1;
      if (a.clientType !== 'premium' && b.clientType === 'premium') return 1;

      if (query.trim()) {
         const aStarts = normalizeText(a.name).startsWith(query) ? -1 : 1;
         const bStarts = normalizeText(b.name).startsWith(query) ? -1 : 1;
         if (aStarts !== bStarts) return aStarts - bStarts;
      }

      if (!a.coords || a.coords.length !== 2) return 1;
      if (!b.coords || b.coords.length !== 2) return -1;
      
      const distA = haversineDistance(userLocation, a.coords);
      const distB = haversineDistance(userLocation, b.coords);
      return distA - distB;
    });
  }

  return filtered;
}

async function run() {
  const userLat = 53.6779511; // Near Ammersbek
  const userLng = 10.1497485;

  console.log("\n--- SIMULATION FOR 'De Fr' ---");
  const resFr = await simulateAPI("De Fr", userLat, userLng);
  console.log(`Results count: ${resFr.length}`);
  resFr.forEach(b => {
    console.log(`- ID: ${b.id}, Name: "${b.name}", Coords: ${JSON.stringify(b.coords)}, ClientType: ${b.clientType}`);
  });

  console.log("\n--- SIMULATION FOR 'De Fritz' ---");
  const resFritz = await simulateAPI("De Fritz", userLat, userLng);
  console.log(`Results count: ${resFritz.length}`);
  resFritz.forEach(b => {
    console.log(`- ID: ${b.id}, Name: "${b.name}"`);
  });

  process.exit(0);
}

run().catch(console.error);
