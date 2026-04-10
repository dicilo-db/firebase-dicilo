'use server';

import { getAdminDb } from '@/lib/firebase-admin';
import crypto from 'crypto';

const SETTINGS_DOC_PATH = 'admin_settings/security';

function hashKey(key: string): string {
    return crypto.createHash('sha256').update(key).digest('hex');
}

export async function checkMasterKeyStatus(): Promise<{ exists: boolean; error?: string }> {
    try {
        const db = getAdminDb();
        const doc = await db.doc(SETTINGS_DOC_PATH).get();
        return { exists: doc.exists && !!doc.data()?.masterKeyHash };
    } catch (error: any) {
        console.error('Error checking master key:', error);
        return { exists: false, error: 'Failed to check status' };
    }
}

export async function setMasterKey(key: string): Promise<{ success: boolean; error?: string }> {
    try {
        if (!key || key.length < 4) {
            return { success: false, error: 'Key too short' };
        }
        const db = getAdminDb();
        const docRef = db.doc(SETTINGS_DOC_PATH);
        const doc = await docRef.get();

        if (doc.exists && doc.data()?.masterKeyHash) {
            return { success: false, error: 'Master Key already exists' };
        }

        const masterKeyHash = hashKey(key);
        await docRef.set({ masterKeyHash, createdAt: new Date().toISOString() }, { merge: true });

        return { success: true };
    } catch (error: any) {
        console.error('Error setting master key:', error);
        return { success: false, error: error.message };
    }
}

export async function verifyMasterKey(key: string): Promise<{ valid: boolean; error?: string }> {
    try {
        const db = getAdminDb();
        const doc = await db.doc(SETTINGS_DOC_PATH).get();

        if (!doc.exists || !doc.data()?.masterKeyHash) {
            return { valid: false, error: 'No Master Key set' };
        }

        const storedHash = doc.data()?.masterKeyHash;
        const inputHash = hashKey(key);

        return { valid: storedHash === inputHash };
    } catch (error: any) {
        console.error('Error verifying master key:', error);
        return { valid: false, error: error.message };
    }
}
