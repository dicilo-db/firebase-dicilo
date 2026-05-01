'use server';

import { getAdminDb } from '@/lib/firebase-admin';

export interface AuditUserData {
    userId: string;
    name: string;
    email: string;
    role: string;
    country: string;
    city: string;
    isActive: boolean;
    isPaid: boolean;
    paidAt: string | null;
    createdAt: string;
    referrerId: string | null;
    referrerName: string | null;
}

export async function getMLMAuditData(): Promise<AuditUserData[]> {
    const db = getAdminDb();
    
    // Fetch registrations
    const registrationsSnap = await db.collection('registrations').get();
    
    // Fetch profiles to get country, city, and role
    const profilesSnap = await db.collection('private_profiles').get();
    const profilesMap = new Map<string, { role: string, country: string, city: string }>();
    
    profilesSnap.docs.forEach(doc => {
        const data = doc.data();
        profilesMap.set(doc.id, {
            role: data.role || 'user',
            country: data.country || '',
            city: data.city || ''
        });
    });

    const flatUsers: AuditUserData[] = [];

    registrationsSnap.docs.forEach(doc => {
        const data = doc.data();
        const userId = doc.id; // Usually registration ID or ownerUid
        const profile = profilesMap.get(data.ownerUid || userId) || { role: 'user', country: data.country || '', city: data.city || '' };

        const isActive = data.isEmailVerified !== false;
        const isPaid = data.referralRewardPaid !== false;

        flatUsers.push({
            userId: userId,
            name: data.businessName || data.firstName + ' ' + (data.lastName || ''),
            email: data.email || '',
            role: profile.role,
            country: profile.country || data.country || '',
            city: profile.city || data.city || '',
            isActive: isActive,
            isPaid: isPaid,
            paidAt: data.referralRewardPaidAt ? data.referralRewardPaidAt.toDate().toISOString() : null,
            createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
            referrerId: data.referrerId || null,
            referrerName: data.referrerName || null
        });
    });

    // Sort by created at descending
    flatUsers.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return flatUsers;
}
