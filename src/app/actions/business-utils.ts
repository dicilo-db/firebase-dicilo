import { getAdminDb } from '@/lib/firebase-admin';

/**
 * Normalizes a string for comparison (lowercase, trimmed, removed multiple spaces)
 */
const normalize = (text: string | null | undefined) => {
  if (!text) return '';
  return text.trim().toLowerCase().replace(/\s+/g, ' ');
};

/**
 * Checks if a business already exists based on Name, Address, and Phone.
 * According to user rules:
 * - If Name, Address, and Phone are identical -> Duplicate (Already registered).
 * - If Address is different -> Branch (Allowed).
 * 
 * Returns { isDuplicate: boolean, type: 'registration' | 'business' | 'recommendation' | null }
 */
export async function checkBusinessDuplicate(
  name: string,
  address: string | null | undefined,
  phone: string | null | undefined
) {
  const db = getAdminDb();
  const normalizedName = normalize(name);
  const normalizedAddress = normalize(address);
  const normalizedPhone = normalize(phone);

  if (!normalizedName) return { isDuplicate: false, type: null };

  // Collections to check
  const collections = ['businesses', 'registrations', 'recommendations'];
  
  for (const collectionName of collections) {
    let nameField = 'businessName';
    if (collectionName === 'businesses') nameField = 'name';
    if (collectionName === 'recommendations') nameField = 'companyName';

    // Query by name first (most common factor)
    const snapshot = await db.collection(collectionName)
      .where(nameField, '==', name) // We try exact match first for indexed query
      .get();
      
    for (const doc of snapshot.docs) {
      const data = doc.data();
      if (isFullMatch(data, normalizedName, normalizedAddress, normalizedPhone)) {
        return { isDuplicate: true, type: collectionName };
      }
    }
  }

  return { isDuplicate: false, type: null };
}

function isFullMatch(data: any, nName: string, nAddress: string, nPhone: string) {
  const name = normalize(data.businessName || data.companyName || data.name);
  const address = normalize(data.address || data.location || data.neighborhood || data.city); // Map location/neighborhood/city if address is missing
  const phone = normalize(data.phone || data.companyPhone);

  let addressMatches = false;
  if (!nAddress && !address) {
      addressMatches = true;
  } else if (nAddress && address) {
      addressMatches = address === nAddress || address.includes(nAddress) || nAddress.includes(address);
  }

  // User Rule: If Name + Address + Phone match -> Duplicate.
  // If Address is different, it's a branch.
  return name === nName && addressMatches && phone === nPhone;
}
