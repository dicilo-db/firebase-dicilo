import { NextResponse } from 'next/server';
import { getAdminDb, getAdminAuth } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const emails = ['niloescolar.de@gmail.com', 'noseaentrepito@gmail.com'];
    const results: any = {};

    try {
        for (const email of emails) {
            results[email] = {
                auth: null,
                registration: [],
                privateProfile: [],
                manualProfileQuery: []
            };

            // 1. Check Auth
            try {
                const userRecord = await getAdminAuth().getUserByEmail(email);
                results[email].auth = {
                    uid: userRecord.uid,
                    email: userRecord.email,
                    displayName: userRecord.displayName
                };
            } catch (e: any) {
                results[email].auth = 'Not Found: ' + e.message;
            }

            // 2. Check Registrations (by email field)
            const regSnapshot = await getAdminDb().collection('registrations').where('email', '==', email).get();
            results[email].registration = regSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));

            // 3. Check Private Profiles (by email field)
            const profileSnapshot = await getAdminDb().collection('private_profiles').where('email', '==', email).get();
            results[email].manualProfileQuery = profileSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));

            // 4. Check Private Profile by UID (if Auth exists)
            if (results[email].auth && results[email].auth.uid) {
                const uidProfile = await getAdminDb().collection('private_profiles').doc(results[email].auth.uid).get();
                if (uidProfile.exists) {
                    results[email].privateProfile.push({ id: uidProfile.id, ...uidProfile.data(), _source: 'Fetched by Auth UID' });
                }
            }
        }

        return NextResponse.json(results, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
