import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { generateUniqueCode } from '@/lib/code-generator';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { uid, email, firstName, lastName, phoneNumber, contactType } = body;

        if (!uid || !email || !firstName || !lastName) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Check if profile already exists
        const profileRef = getAdminDb().collection('private_profiles').doc(uid);
        const profileSnap = await profileRef.get();

        if (profileSnap.exists) {
            return NextResponse.json(
                { message: 'Profile already exists', profile: profileSnap.data() },
                { status: 200 }
            );
        }

        // Generate Unique Code
        // Use provided phone number or empty string if not provided
        const phoneForCode = phoneNumber || '000';
        const uniqueCode = await generateUniqueCode(firstName, lastName, phoneForCode);

        // Create Profile Data
        const profileData = {
            uid,
            email,
            firstName,
            lastName,
            uniqueCode,
            contactPreferences: {
                whatsapp: contactType === 'whatsapp' ? phoneNumber : '',
                telegram: contactType === 'telegram' ? phoneNumber : '',
                email: true,
                frequency: 'weekly', // Default
            },
            interests: [],
            profileData: {
                travelInterest: null,
                multiplierInterest: false,
                rewardPreference: null,
                hobbies: '',
                socialGroup: 'none',
            },
            referrals: [],
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
        };

        await profileRef.set(profileData);

        return NextResponse.json(
            { message: 'Profile created successfully', profile: profileData },
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
