import { NextResponse } from 'next/server';
import { getFirestore, collection, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { generateUniqueCode } from '@/lib/code-generator';

const db = getFirestore(app);

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
        const profileRef = doc(db, 'private_profiles', uid);
        const profileSnap = await getDoc(profileRef);

        if (profileSnap.exists()) {
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
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        await setDoc(profileRef, profileData);

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
