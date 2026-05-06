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

export async function createBlockAction(startTimeIso: string, isFullDay: boolean, endTimeIso?: string) {
    try {
        const db = getAdminDb();
        const blockData = {
            startTime: startTimeIso,
            endTime: isFullDay ? null : (endTimeIso || null),
            status: 'blocked',
            type: isFullDay ? 'full_day_block' : (endTimeIso ? 'time_range_block' : 'specific_hour_block'),
            clientName: 'BLOQUEO DE CALENDARIO',
            clientPhone: '',
            clientEmail: '',
            reason: 'Vacaciones o Día no disponible',
            createdAt: new Date().toISOString()
        };
        const ref = await db.collection('crm_appointments').add(blockData);
        return { success: true, id: ref.id };
    } catch (error: any) {
        console.error('Error creating block:', error);
        return { success: false, error: error.message };
    }
}
