'use server';

import { getAdminDb } from '@/lib/firebase-admin';
import { getWalletData } from './wallet';

export interface BusinessDashboardStats {
    visits: number;
    clicks: number;
    couponsUsed: number;
    totalCoupons: number;
    diciPoints: number;
    prepaidEur: number;
    inquiriesCount: number;
    unreadInquiriesCount: number;
}

export async function getBusinessDashboardStats(
    userId: string,
    activeId: string | null
): Promise<{ success: boolean; stats?: BusinessDashboardStats; error?: string }> {
    try {
        const db = getAdminDb();
        
        let diciPoints = 0;
        let prepaidEur = 0;

        // 1. Fetch Wallet balance
        if (userId) {
            const wallet = await getWalletData(userId);
            diciPoints = wallet.balance || 0;
            prepaidEur = wallet.valueInEur || 0;
        }

        let visits = 0;
        let clicks = 0;
        let couponsUsed = 0;
        let totalCoupons = 0;
        let inquiriesCount = 0;
        let unreadInquiriesCount = 0;

        if (activeId) {
            // 2. Fetch daily stats for views & clicks
            const statsSnap = await db.collection('ad_stats_daily')
                .where('adId', '==', activeId)
                .get();

            statsSnap.forEach(doc => {
                const data = doc.data();
                visits += data.views || 0;
                clicks += (data.clicks || 0) + (data.driveToStoreCount || 0) + (data.socialClickCount || 0);
            });

            // 3. Fetch coupon counts
            const couponsSnap = await db.collection('coupons')
                .where('companyId', '==', activeId)
                .get();
            totalCoupons = couponsSnap.size;

            const assignmentsSnap = await db.collection('coupon_assignments')
                .where('companyId', '==', activeId)
                .get();
            couponsUsed = assignmentsSnap.size; // total claimed coupons

            // 4. Fetch business messages count
            const messagesSnap = await db.collection('business_messages')
                .where('businessId', '==', activeId)
                .get();
            inquiriesCount = messagesSnap.size;

            messagesSnap.forEach(doc => {
                const data = doc.data();
                if (data.read === false) {
                    unreadInquiriesCount++;
                }
            });
        }

        return {
            success: true,
            stats: {
                visits,
                clicks,
                couponsUsed,
                totalCoupons,
                diciPoints,
                prepaidEur,
                inquiriesCount,
                unreadInquiriesCount
            }
        };

    } catch (e: any) {
        console.error("Error fetching business dashboard stats:", e);
        return { success: false, error: e.message };
    }
}
