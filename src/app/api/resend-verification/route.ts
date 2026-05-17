import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { sendWelcomeEmail } from '@/lib/email';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email } = body;

        if (!email) {
            return NextResponse.json({ success: false, message: 'Email is required.' }, { status: 400 });
        }

        const db = getAdminDb();
        let userProfile = null;
        let isRegistration = false;
        let docRef = null;

        // 1. Check in private_profiles
        const profilesSnapshot = await db.collection('private_profiles').where('email', '==', email).limit(1).get();
        if (!profilesSnapshot.empty) {
            userProfile = profilesSnapshot.docs[0].data();
            docRef = profilesSnapshot.docs[0].ref;
        } else {
            // 2. Check in registrations if not found
            const regsSnapshot = await db.collection('registrations').where('email', '==', email).limit(1).get();
            if (!regsSnapshot.empty) {
                userProfile = regsSnapshot.docs[0].data();
                docRef = regsSnapshot.docs[0].ref;
                isRegistration = true;
            }
        }

        if (!userProfile || !docRef) {
            return NextResponse.json({ success: false, message: 'Usuario no encontrado.' }, { status: 404 });
        }

        if (userProfile.isEmailVerified) {
            return NextResponse.json({ success: false, message: 'El usuario ya está verificado.' }, { status: 400 });
        }

        // Generate a new code or use existing one
        const newCode = Math.floor(100000 + Math.random() * 900000).toString();

        await docRef.update({
            emailVerificationCode: newCode
        });

        // Send the email
        const firstName = userProfile.firstName || userProfile.businessName || 'Usuario';
        await sendWelcomeEmail(email, firstName, 'es', newCode);

        return NextResponse.json({ success: true, message: 'Código reenviado correctamente.' }, { status: 200 });

    } catch (error: any) {
        console.error('Error resending verification code:', error);
        return NextResponse.json({ success: false, message: 'Error interno del servidor.' }, { status: 500 });
    }
}
