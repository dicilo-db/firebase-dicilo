import { getFirestore, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { app } from '@/lib/firebase';

const db = getFirestore(app);

/**
 * Generates a unique code for a private user.
 * Format: DHH + YY + Initials + Last3Phone + Sequence
 * Example: DHH25NE57801
 * 
 * @param firstName User's first name
 * @param lastName User's last name
 * @param phoneNumber User's phone number (WhatsApp or Contact number)
 */
export async function generateUniqueCode(firstName: string, lastName: string, phoneNumber: string): Promise<string> {
    const prefix = 'DHH';

    // Year (YY)
    const year = new Date().getFullYear().toString().slice(-2);

    // Initials
    const firstInitial = firstName.charAt(0).toUpperCase();
    const lastInitial = lastName.charAt(0).toUpperCase();
    const initials = `${firstInitial}${lastInitial}`;

    // Last 3 digits of phone number
    // Remove non-numeric characters first
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    const last3Phone = cleanPhone.length >= 3 ? cleanPhone.slice(-3) : cleanPhone.padEnd(3, '0');

    // Base code without sequence
    const baseCode = `${prefix}${year}${initials}${last3Phone}`;

    // Find the next sequence number
    // We need to query existing codes that start with this base pattern to find the highest sequence
    // Note: This might be expensive if we have many users. 
    // A better approach for scalability might be a distributed counter or a dedicated 'counters' collection.
    // For now, we will query the 'private_profiles' collection.

    // Since we can't easily do a "startsWith" query with sorting on the suffix in Firestore without a specific index strategy,
    // we will use a simpler approach: 
    // 1. Try sequence '01'.
    // 2. If exists, try '02', etc.
    // BUT, to avoid many reads, we can try to query for the latest code created this year/month or similar.

    // Let's try to find the highest sequence for this specific user pattern.
    // Actually, the requirement says "Serie de 2 dígitos incremental por patrón".
    // This implies the sequence is relative to the *other* parts? Or global?
    // "Serie Correlativa" usually means global or per-year.
    // Let's assume it's per-user-pattern to ensure uniqueness if multiple users have same initials/phone-end.

    let sequence = 1;
    let uniqueCode = '';
    let isUnique = false;

    // Safety break to prevent infinite loops
    while (!isUnique && sequence <= 99) {
        const sequenceStr = sequence.toString().padStart(2, '0');
        uniqueCode = `${baseCode}${sequenceStr}`;

        // Check if this code already exists
        const profilesRef = collection(db, 'private_profiles');
        const q = query(profilesRef, where('uniqueCode', '==', uniqueCode));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            isUnique = true;
        } else {
            sequence++;
        }
    }

    if (!isUnique) {
        throw new Error('Could not generate a unique code for this user (sequence limit reached).');
    }

    return uniqueCode;
}
