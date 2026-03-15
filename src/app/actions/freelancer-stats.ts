'use server';

import { getAdminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';

export interface FreelancerStats {
    totalEarnings: number; // User's cut only
    pendingPayout: number;
    paidPayout: number;
    totalPosts: number;
    totalClicks: number;
    totalBusinessesRegistered: number;
    recentTransactions: Transaction[];
    performanceByCampaign: { campaignName: string, earnings: number, posts: number }[];
    recentProspects: Prospect[];
}

export interface Prospect {
    id: string;
    companyName: string;
    contactName: string;
    phone: string;
    email: string;
    companyEmail: string;
    category: string;
    city: string;
    country: string;
    comments: string;
    website: string;
    status: string;
    pointsPaid: boolean;
    rewardAmount: number;
    converted: boolean;
    date: string;
}

export interface Transaction {
    id: string;
    amount: number;
    status: 'pending' | 'paid' | 'processing';
    date: string;
    description: string;
}

export async function getFreelancerStats(userId: string): Promise<{ success: boolean; stats?: FreelancerStats; error?: string }> {
    try {
        if (!userId) throw new Error('Unauthorized');

        const db = getAdminDb();

        // 1. Fetch Completed Actions (Posts)
        const actionsSnap = await db.collection('user_campaign_actions')
            .where('userId', '==', userId)
            // .where('isPublished', '==', true) // assuming we only count published/valid actions
            // .orderBy('created_at', 'desc') // Removed to avoid composite index requirement
            .get();

        // Sorting in memory
        const docs = actionsSnap.docs.sort((a, b) => {
            const dateA = a.data().created_at?.toDate()?.getTime() || 0;
            const dateB = b.data().created_at?.toDate()?.getTime() || 0;
            return dateB - dateA; // Descending
        });

        let totalEarnings = 0;
        let totalPosts = 0;
        const totalClicks = 0; // If we track clicks separately, query them here. For now 0 or derived.
        const campaignMap = new Map<string, { earnings: number, posts: number, campaignName: string }>();
        const recentTransactions: Transaction[] = [];

        docs.forEach(doc => {
            const data = doc.data();
            const amount = data.rewardAmount || 0; // Use the stored user reward, NOT campaign total

            totalEarnings += amount;
            totalPosts += 1;

            // Group by Campaign
            const cId = data.campaignId;
            if (!campaignMap.has(cId)) {
                campaignMap.set(cId, { earnings: 0, posts: 0, campaignName: data.companyName || 'Unknown' });
            }
            const current = campaignMap.get(cId)!;
            current.earnings += amount;
            current.posts += 1;
            // Update name just in case
            if (data.companyName) current.campaignName = data.companyName;

            // Mock Transactions from actions (Active earning history)
            if (recentTransactions.length < 10) {
                recentTransactions.push({
                    id: doc.id,
                    amount: amount,
                    status: 'paid', // Instant credit to wallet logic
                    date: data.created_at?.toDate().toISOString() || new Date().toISOString(),
                    description: `Post for ${data.companyName}`
                });
            }
        });

        // 2. Fetch Wallet State (or simulate Payout status)
        // If we have a 'payouts' collection, query it. 
        // For simplified MVP, we calculate pending as totalEarnings (assuming no withdrawals yet).
        // Or check 'user_wallets' collection.

        // Let's assume Pending = Balance available to withdraw.
        // Paid = processed withdrawals.
        // Queries to 'payouts' collection:

        // Mocking Payouts for now or query real 'payout_requests'
        let paidPayout = 0;
        // const payoutsSnap = await db.collection('payout_requests').where('userId', '==', userId).where('status', '==', 'paid').get();
        // payoutsSnap.forEach(p => paidPayout += p.data().amount);

        const pendingPayout = totalEarnings - paidPayout;

        // 3. Fetch Registered Businesses (Recommendations/Prospects)
        const prospectsSnap = await db.collection('recommendations')
            .where('userId', '==', userId)
            // .orderBy('createdAt', 'desc') // Removed to avoid index requirement
            .get();
        
        const totalBusinessesRegistered = prospectsSnap.size;

        const recentProspects: Prospect[] = prospectsSnap.docs
            .map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    companyName: data.companyName || 'Unknown',
                    contactName: data.contactName || 'Unknown',
                    phone: data.phone || data.companyPhone || '',
                    email: data.email || '',
                    companyEmail: data.companyEmail || '',
                    category: data.category || 'General',
                    city: data.city || '',
                    country: data.country || '',
                    comments: data.comments || '',
                    website: data.website || '',
                    status: data.status || 'pending',
                    pointsPaid: !!data.pointsPaid,
                    rewardAmount: data.rewardAmount || 10,
                    converted: !!data.converted,
                    date: data.createdAt?.toDate().toISOString() || data.timestamp?.toDate().toISOString() || new Date().toISOString()
                };
            })
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 10);

        return {
            success: true,
            stats: {
                totalEarnings,
                pendingPayout,
                paidPayout,
                totalPosts,
                totalClicks, 
                totalBusinessesRegistered,
                recentTransactions,
                performanceByCampaign: Array.from(campaignMap.values()),
                recentProspects
            }
        };

    } catch (error: any) {
        console.error('Error fetching stats:', error);
        return { success: false, error: 'Failed to load statistics' };
    }
}
