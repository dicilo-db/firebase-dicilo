import { NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { createPrivateUserProfile } from '@/lib/private-user-service';

export async function POST(request: Request) {
    try {
        // Query all registrations of type 'private'
        const snapshot = await adminDb.collection('registrations')
            .where('registrationType', '==', 'private')
            .get();

        const results = {
            total: snapshot.size,
            created: 0,
            skipped: 0,
            errors: 0,
        };

        for (const doc of snapshot.docs) {
            const data = doc.data();
            let uid = data.ownerUid;

            // If no ownerUid, try to find user by email
            if (!uid && data.email) {
                try {
                    const userRecord = await adminAuth.getUserByEmail(data.email);
                    uid = userRecord.uid;
                } catch (e) {
                    // User not found in Auth, cannot create profile
                    console.error(`User not found for email ${data.email}`, e);
                }
            }

            if (uid) {
                try {
                    const result = await createPrivateUserProfile(uid, {
                        firstName: data.firstName || '',
                        lastName: data.lastName || '',
                        email: data.email || '',
                        whatsapp: data.whatsapp,
                        phone: data.phone,
                        contactType: data.contactType,
                    });

                    if (result.success) {
                        results.created++;
                    } else {
                        results.skipped++;
                    }
                } catch (err) {
                    console.error(`Error processing registration ${doc.id}`, err);
                    results.errors++;
                }
            } else {
                results.errors++; // Considered error if no UID found
            }
        }

        return NextResponse.json({ success: true, results });

    } catch (error: any) {
        console.error('Sync error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
