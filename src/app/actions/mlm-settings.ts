'use server';

import { getAdminDb } from '@/lib/firebase-admin';

export interface MLMSettings {
    level1Percentage: number;
    level2Percentage: number;
    level3Percentage: number;
    seasonBonusAmount: number; // Flat bonus or static
    seasonMultiplier: number;  // Multiplicador X (ej. x1.5 para diciembre)
    isActive: boolean;
}

const DEFAULT_SETTINGS: MLMSettings = {
    level1Percentage: 20,
    level2Percentage: 10,
    level3Percentage: 5,
    seasonBonusAmount: 0,
    seasonMultiplier: 1.0,
    isActive: true,
};

export async function getMLMSettings(): Promise<MLMSettings> {
    const db = getAdminDb();
    const docRef = db.collection('platform_settings').doc('mlm_commissions');
    const snap = await docRef.get();
    
    if (!snap.exists) {
        return DEFAULT_SETTINGS;
    }
    
    return { ...DEFAULT_SETTINGS, ...snap.data() } as MLMSettings;
}

export async function saveMLMSettings(settings: MLMSettings) {
    try {
        const db = getAdminDb();
        const docRef = db.collection('platform_settings').doc('mlm_commissions');
        
        await docRef.set(settings, { merge: true });
        return { success: true };
    } catch (error: any) {
        console.error("Error saving MLM Settings:", error);
        return { success: false, error: error.message };
    }
}
