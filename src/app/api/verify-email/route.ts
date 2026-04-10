import { NextResponse } from 'next/server';
import { getAdminDb, getAdminAuth } from '@/lib/firebase-admin';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, code } = body;

        if (!email || !code) {
            return NextResponse.json({ message: 'Email and code are required.' }, { status: 400 });
        }

        const db = getAdminDb();
        const auth = getAdminAuth();

        let userVerified = false;
        let errorMessage = 'Código inválido o expirado.';

        // 1. Check in private_profiles first
        const profilesSnapshot = await db.collection('private_profiles').where('email', '==', email).limit(1).get();
        if (!profilesSnapshot.empty) {
            const profileDoc = profilesSnapshot.docs[0];
            const data = profileDoc.data();
            
            if (data.emailVerificationCode === code) {
                await profileDoc.ref.update({
                    isEmailVerified: true,
                    emailVerificationCode: null // consume the code
                });
                // Also update Firebase Auth if UID exists
                if (data.uid) {
                    try {
                        import('firebase-admin').then(admin => {
                             auth.updateUser(data.uid, { emailVerified: true });
                        }).catch(e => console.error(e));
                    } catch(e) {}
                }
                userVerified = true;
            } else if (data.isEmailVerified) {
                userVerified = true; // Already verified
            }
        }

        // 2. Check in registrations (for retailers, donors, premiums)
        if (!userVerified) {
            const registrationsSnapshot = await db.collection('registrations').where('email', '==', email).limit(1).get();
            if (!registrationsSnapshot.empty) {
                const regDoc = registrationsSnapshot.docs[0];
                const data = regDoc.data();
                
                if (data.emailVerificationCode === code) {
                    await regDoc.ref.update({
                        isEmailVerified: true,
                        emailVerificationCode: null
                    });
                     // Also update Firebase Auth if ownerUid exists
                     if (data.ownerUid) {
                        try {
                            import('firebase-admin').then(admin => {
                                 auth.updateUser(data.ownerUid, { emailVerified: true });
                            }).catch(e => console.error(e));
                        } catch(e) {}
                    }
                    userVerified = true;
                } else if (data.isEmailVerified) {
                    userVerified = true;
                }
            }
        }

        if (userVerified) {
            return NextResponse.json({ success: true, message: 'Email verified successfully.' }, { status: 200 });
        } else {
            return NextResponse.json({ success: false, message: errorMessage }, { status: 400 });
        }
        
    } catch (error: any) {
        console.error('Verify Email Error:', error);
        return NextResponse.json({ success: false, message: 'Server error processing verification.' }, { status: 500 });
    }
}
