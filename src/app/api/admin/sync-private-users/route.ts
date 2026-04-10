import { NextResponse } from 'next/server';
import { getAdminDb, getAdminAuth } from '@/lib/firebase-admin';
import { createPrivateUserProfile } from '@/lib/private-user-service';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        // Query all registrations of type 'private'
        const snapshot = await getAdminDb().collection('registrations')
            .where('registrationType', '==', 'private')
            .get();

        const results = {
            total: snapshot.size,
            created: 0,
            skipped: 0,
            errors: 0,
            details: [] as string[]
        };

        for (const doc of snapshot.docs) {
            const data = doc.data();
            let uid = data.ownerUid;
            let email = data.email || 'unknown';

            // If no ownerUid, try to find user by email
            if (!uid && data.email) {
                try {
                    const userRecord = await getAdminAuth().getUserByEmail(data.email);
                    uid = userRecord.uid;
                } catch (e: any) {
                    // User not found in Auth, cannot create profile
                    // This is where permission errors or not-found errors will be caught
                    results.details.push(`Skipped ${email}: Auth Lookup Failed (${e.message || e.code})`);
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
                        contactType: data.contactType || 'private',
                    });

                    if (result.success) {
                        results.created++;
                        results.details.push(`Created ${email}`);
                    } else {
                        if (result.message && result.message.includes('already exists')) {
                            results.skipped++;
                        } else {
                            results.errors++;
                            results.details.push(`Failed ${email}: ${result.message || 'Unknown error'}`);
                        }
                    }
                } catch (err: any) {
                    console.error(`Error processing registration ${doc.id}`, err);
                    results.errors++;
                    results.details.push(`Error ${email}: ${err.message}`);
                }
            } else {
                results.errors++;
                if (!results.details.some(d => d.includes(email))) {
                    results.details.push(`Failed ${email}: No UID found & Auth lookup failed.`);
                }
            }
        }

        return NextResponse.json({ success: true, results });
    } catch (error: any) {
        console.error('Sync error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
