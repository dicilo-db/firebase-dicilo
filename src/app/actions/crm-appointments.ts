'use server';

import { getAdminDb } from '@/lib/firebase-admin';

export async function updateAppointmentTimeAction(id: string, startTime: string, endTime?: string) {
    try {
        const db = getAdminDb();
        const updates: any = { startTime };
        if (endTime) {
            updates.endTime = endTime;
        }
        await db.collection('crm_appointments').doc(id).update(updates);
        return { success: true };
    } catch (error: any) {
        console.error('Error updating appointment:', error);
        return { success: false, error: error.message };
    }
}

export async function deleteAppointmentAction(id: string) {
    try {
        const db = getAdminDb();
        await db.collection('crm_appointments').doc(id).delete();
        return { success: true };
    } catch (error: any) {
        console.error('Error deleting appointment:', error);
        return { success: false, error: error.message };
    }
}
