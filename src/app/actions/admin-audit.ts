'use server';

import { getAdminDb } from '@/lib/firebase-admin';

export interface AuditReferrerData {
    referrerId: string;
    referrerName: string;
    referrerRole: string;
    referrerCountry: string;
    referrerCity: string;
    totalBrought: number;
    activeCount: number;
    inactiveCount: number;
    paidCount: number;
    totalMoneyEarned: number; // Historical estimate
    blackCardBalance: number; // DiciPoints
    greenCardBalance: number; // EUR
    referredUsers: {
        registrationId: string;
        ownerUid: string | null;
        name: string;
        email: string;
        isActive: boolean;
        isPaid: boolean;
        paidAt: string | null;
        createdAt: string;
    }[];
}

export async function getMLMAuditData(): Promise<AuditReferrerData[]> {
    const db = getAdminDb();
    
    // 1. Fetch all registrations
    const registrationsSnap = await db.collection('registrations').get();
    
    const referrersMap = new Map<string, AuditReferrerData>();

    // 2. Fetch profiles to map roles, country and city
    const profilesSnap = await db.collection('private_profiles').get();
    const profilesMap = new Map<string, { role: string, country: string, city: string }>();
    profilesSnap.docs.forEach(doc => {
        const d = doc.data();
        profilesMap.set(doc.id, {
            role: d.role || 'user',
            country: d.country || '',
            city: d.city || ''
        });
    });

    // 2.5 Fetch wallets to get the actual balances
    const walletsSnap = await db.collection('wallets').get();
    const walletsMap = new Map<string, { balance: number, eurBalance: number }>();
    walletsSnap.docs.forEach(doc => {
        const d = doc.data();
        walletsMap.set(doc.id, {
            balance: d.balance || 0,
            eurBalance: d.eurBalance || 0
        });
    });

    // 3. Build the Grouped Map
    registrationsSnap.docs.forEach(doc => {
        const data = doc.data();
        const referrerId = data.referrerId || 'SIN_REFERIDOR';
        
        if (!referrersMap.has(referrerId)) {
            const rProfile = profilesMap.get(referrerId) || { role: 'user', country: '', city: '' };
            const rWallet = walletsMap.get(referrerId) || { balance: 0, eurBalance: 0 };
            
            referrersMap.set(referrerId, {
                referrerId: referrerId,
                referrerName: data.referrerName || 'Desconocido',
                referrerRole: rProfile.role,
                referrerCountry: rProfile.country,
                referrerCity: rProfile.city,
                totalBrought: 0,
                activeCount: 0,
                inactiveCount: 0,
                paidCount: 0,
                totalMoneyEarned: 0,
                blackCardBalance: rWallet.balance,
                greenCardBalance: rWallet.eurBalance,
                referredUsers: []
            });
        }

        const refData = referrersMap.get(referrerId)!;
        const isActive = data.isEmailVerified !== false;
        const isPaid = data.referralRewardPaid !== false;

        refData.totalBrought++;
        if (isActive) refData.activeCount++;
        else refData.inactiveCount++;

        if (isPaid) refData.paidCount++;

        refData.referredUsers.push({
            registrationId: doc.id,
            ownerUid: data.ownerUid || null,
            name: data.businessName || data.firstName + ' ' + (data.lastName || ''),
            email: data.email || '',
            isActive: isActive,
            isPaid: isPaid,
            paidAt: data.referralRewardPaidAt ? data.referralRewardPaidAt.toDate().toISOString() : null,
            createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : new Date().toISOString()
        });
    });

    // Return without calculating the deep history, since we have the real wallet balances now
    return Array.from(referrersMap.values()).sort((a, b) => b.totalBrought - a.totalBrought);
}
