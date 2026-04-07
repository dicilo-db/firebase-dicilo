'use server';

import { getAdminDb } from '@/lib/firebase-admin';

export interface FreelancerData {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    uniqueCode: string;
    role: string;
    isFreelancer: boolean;
    diciPoints: number;
    euroBalance: number;
    city?: string;
    country?: string;
    interests?: string[];
    createdAt?: string;
}

export async function getFreelancersList(): Promise<{ success: boolean; data: FreelancerData[]; error?: string }> {
    try {
        const db = getAdminDb();
        const profilesSnap = await db.collection('private_profiles').get();

        const freelancers: FreelancerData[] = [];

        // Filter for freelancers
        const freelancerDocs = profilesSnap.docs.filter(doc => {
            const data = doc.data();
            return data.role === 'freelancer' ||
                data.isFreelancer === true ||
                data.role === 'team_office';
        });

        // Parallel fetch for wallets
        await Promise.all(freelancerDocs.map(async (userDoc) => {
            const userData = userDoc.data();
            let diciPoints = 0;
            let euroBalance = 0;

            try {
                const walletDoc = await db.collection('wallets').doc(userDoc.id).get();
                if (walletDoc.exists) {
                    const wData = walletDoc.data();
                    diciPoints = wData?.balance || 0;
                    // Check possible fields for EUR balance
                    euroBalance = wData?.eurBalance || wData?.cashBalance || wData?.earnings || 0;
                }
            } catch (e) {
                console.error(`Failed to fetch wallet for ${userDoc.id}`, e);
            }

            freelancers.push({
                id: userDoc.id,
                firstName: userData.firstName || '',
                lastName: userData.lastName || '',
                email: userData.email || '',
                uniqueCode: userData.uniqueCode || '-',
                role: userData.role || 'user',
                isFreelancer: !!userData.isFreelancer,
                diciPoints: diciPoints,
                euroBalance: euroBalance,
                city: userData.city || '',
                country: userData.country || '',
                interests: userData.interests || [],
                createdAt: userData.createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
            });
        }));

        return { success: true, data: freelancers };

    } catch (error: any) {
        console.error('Error in getFreelancersList:', error);
        return { success: false, data: [], error: error.message };
    }
}

export async function getFreelancerPayoutMethod(uid: string) {
    try {
        const db = getAdminDb();
        // Check for new Global Payout method first
        const docSnap = await db.collection('user_payout_methods').doc(uid).get();
        if (docSnap.exists) {
            return { success: true, data: { source: 'Global', ...docSnap.data() } };
        }
        
        // Fallback to legacy/local financialData inside private_profiles
        const profileSnap = await db.collection('private_profiles').doc(uid).get();
        if (profileSnap.exists) {
            const profileData = profileSnap.data();
            if (profileData && profileData.financialData) {
                return { 
                    success: true, 
                    data: { 
                        source: 'Local (Venezuela)', 
                        group: 'LOCAL_BANKING', 
                        details: profileData.financialData 
                    } 
                };
            }
        }

        return { success: false, error: 'No payout method configured' };
    } catch (error: any) {
        console.error('Error fetching payout method:', error);
        return { success: false, error: error.message };
    }
}
