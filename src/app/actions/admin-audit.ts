'use server';

import { getAdminDb } from '@/lib/firebase-admin';

export interface AuditReferrerData {
    referrerId: string;
    referrerName: string;
    referrerRole: string;
    totalBrought: number;
    activeCount: number;
    inactiveCount: number;
    paidCount: number;
    totalMoneyEarned: number;
    referredUsers: {
        registrationId: string;
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
    
    // 1. Fetch all registrations to group by referrer
    const registrationsSnap = await db.collection('registrations').get();
    
    const referrersMap = new Map<string, AuditReferrerData>();

    // 2. We will also need the referrers' roles. We can fetch them as we need or pre-fetch all private_profiles.
    // For a real production app with many users, we should ideally query specifically, but for an audit dashboard, 
    // it's acceptable to fetch all profiles or fetch individually. Let's fetch all to map roles.
    const profilesSnap = await db.collection('private_profiles').get();
    const rolesMap = new Map<string, string>();
    profilesSnap.docs.forEach(doc => {
        rolesMap.set(doc.id, doc.data().role || 'user');
    });

    registrationsSnap.docs.forEach(doc => {
        const data = doc.data();
        const referrerId = data.referrerId || 'SIN_REFERIDOR';
        
        if (!referrersMap.has(referrerId)) {
            referrersMap.set(referrerId, {
                referrerId: referrerId,
                referrerName: data.referrerName || 'Desconocido',
                referrerRole: rolesMap.get(referrerId) || 'user',
                totalBrought: 0,
                activeCount: 0,
                inactiveCount: 0,
                paidCount: 0,
                totalMoneyEarned: 0,
                referredUsers: []
            });
        }

        const refData = referrersMap.get(referrerId)!;
        // For backwards compatibility:
        // Older registrations didn't have isEmailVerified or referralRewardPaid flags.
        // Since old registrations were instantly active and paid, if the flag is undefined, we assume true.
        const isActive = data.isEmailVerified !== false;
        const isPaid = data.referralRewardPaid !== false;

        refData.totalBrought++;
        if (isActive) refData.activeCount++;
        else refData.inactiveCount++;

        if (isPaid) {
            refData.paidCount++;
            // If the referrer is PRO, they earned 0.50 per paid active user
            if (['freelancer', 'team_leader', 'team_office', 'admin', 'superadmin'].includes(refData.referrerRole)) {
                refData.totalMoneyEarned += 0.50; 
            }
        }

        refData.referredUsers.push({
            registrationId: doc.id,
            name: data.businessName || data.firstName + ' ' + (data.lastName || ''),
            email: data.email || '',
            isActive: isActive,
            isPaid: isPaid,
            paidAt: data.referralRewardPaidAt ? data.referralRewardPaidAt.toDate().toISOString() : null,
            createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : new Date().toISOString()
        });
    });

    return Array.from(referrersMap.values()).sort((a, b) => b.totalBrought - a.totalBrought);
}
