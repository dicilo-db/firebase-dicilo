import { NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase-admin';
import { createPrivateUserProfile } from '@/lib/private-user-service';

export async function POST(request: Request) {
    try {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const token = authHeader.split('Bearer ')[0]; // wait, split(' ')[1]
        // Basic fix:
        const idToken = authHeader.split(' ')[1];

        let decodedToken;
        try {
            decodedToken = await getAdminAuth().verifyIdToken(idToken);
        } catch (e) {
            return NextResponse.json({ error: 'Invalid Token' }, { status: 401 });
        }

        const body = await request.json();
        const { uid, email, firstName, lastName, phoneNumber, contactType, referralCode } = body;

        if (decodedToken.uid !== uid) {
            return NextResponse.json({ error: 'Forbidden: UID mismatch' }, { status: 403 });
        }

        if (!uid || !email || !firstName || !lastName) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const result = await createPrivateUserProfile(uid, {
            firstName,
            lastName,
            email,
            whatsapp: contactType === 'whatsapp' ? phoneNumber : undefined,
            phone: phoneNumber,
            contactType,
            referralCode
        });

        if (!result.success) {
            // If it failed because it exists, return 200 with existing profile
            if (result.message === 'Profile already exists') {
                return NextResponse.json({ message: result.message, profile: result.profile }, { status: 200 });
            }
            return NextResponse.json({ error: result.message }, { status: 500 });
        }

        return NextResponse.json(
            { message: 'Profile created successfully', profile: result.profile },
            { status: 201 }
        );

    } catch (error: any) {
        console.error('Error creating private profile:', error);
        return NextResponse.json(
            { error: 'Internal Server Error', details: error.message },
            { status: 500 }
        );
    }
}

