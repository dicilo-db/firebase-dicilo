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
    totalMoneyEarned: number;
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

    // 3. Build the Initial Grouped Map
    registrationsSnap.docs.forEach(doc => {
        const data = doc.data();
        const referrerId = data.referrerId || 'SIN_REFERIDOR';
        
        if (!referrersMap.has(referrerId)) {
            const rProfile = profilesMap.get(referrerId) || { role: 'user', country: '', city: '' };
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

    // 4. Calculate MLM Deep Earnings
    function getChildren(uid: string) {
        return referrersMap.get(uid)?.referredUsers || [];
    }

    const referrers = Array.from(referrersMap.values());

    referrers.forEach(refData => {
        let earned = 0;

        // --- LEVEL 1 (Direct Referrals) ---
        refData.referredUsers.forEach(child => {
            if (child.isActive && child.isPaid) {
                if (refData.referrerRole === 'freelancer') {
                    earned += 0.25;
                } else if (['team_leader', 'team_office', 'admin', 'superadmin'].includes(refData.referrerRole)) {
                    earned += 0.50;
                }
            }
        });

        // --- DEEP NETWORK (Level 2 to 6) for Team Leaders ---
        if (['team_leader', 'team_office', 'admin', 'superadmin'].includes(refData.referrerRole)) {
            let currentLevelUids = refData.referredUsers.map(u => u.ownerUid).filter(uid => uid) as string[];
            const multipliers = [0.01, 0.02, 0.03, 0.04, 0.05];

            for (let depth = 0; depth < 5; depth++) {
                if (currentLevelUids.length === 0) break;
                
                const nextLevelUids: string[] = [];
                const multiplier = multipliers[depth];

                currentLevelUids.forEach(uid => {
                    const children = getChildren(uid);
                    children.forEach(child => {
                        if (child.isActive && child.isPaid) {
                            earned += multiplier;
                        }
                        if (child.ownerUid) {
                            nextLevelUids.push(child.ownerUid);
                        }
                    });
                });

                currentLevelUids = nextLevelUids;
            }
        }

        refData.totalMoneyEarned = earned;
    });

    return referrers.sort((a, b) => b.totalBrought - a.totalBrought);
}
