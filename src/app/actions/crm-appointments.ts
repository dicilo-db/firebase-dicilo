'use server';

import { getAdminDb } from '@/lib/firebase-admin';

export async function updateAppointmentTimeAction(id: string, startTime: string, endTime?: string, userId?: string) {
    try {
        if (!userId) {
            return { success: false, error: 'Unauthorized: No user ID provided' };
        }
        const db = getAdminDb();
        const apptDoc = await db.collection('crm_appointments').doc(id).get();
        if (!apptDoc.exists) {
            return { success: false, error: 'Appointment not found' };
        }
        const apptData = apptDoc.data();

        // Check ownership or admin privileges
        const profileSnap = await db.collection('private_profiles').doc(userId).get();
        const profile = profileSnap.exists ? profileSnap.data() : null;
        const isPrivileged = profile?.role && ['admin', 'superadmin', 'team_office'].includes(profile.role);

        if (apptData?.userId !== userId && !isPrivileged) {
            return { success: false, error: 'Unauthorized: You do not own this appointment' };
        }

        const updates: any = { startTime };
        if (endTime !== undefined) {
            updates.endTime = endTime;
        }
        await db.collection('crm_appointments').doc(id).update(updates);
        return { success: true };
    } catch (error: any) {
        console.error('Error updating appointment:', error);
        return { success: false, error: error.message };
    }
}

export async function updateAppointmentReasonAction(id: string, reason: string, userId?: string) {
    try {
        if (!userId) {
            return { success: false, error: 'Unauthorized: No user ID provided' };
        }
        const db = getAdminDb();
        const apptDoc = await db.collection('crm_appointments').doc(id).get();
        if (!apptDoc.exists) {
            return { success: false, error: 'Appointment not found' };
        }
        const apptData = apptDoc.data();

        // Check ownership or admin privileges
        const profileSnap = await db.collection('private_profiles').doc(userId).get();
        const profile = profileSnap.exists ? profileSnap.data() : null;
        const isPrivileged = profile?.role && ['admin', 'superadmin', 'team_office'].includes(profile.role);

        if (apptData?.userId !== userId && !isPrivileged) {
            return { success: false, error: 'Unauthorized: You do not own this appointment' };
        }

        await db.collection('crm_appointments').doc(id).update({ reason });
        return { success: true };
    } catch (error: any) {
        console.error('Error updating appointment reason:', error);
        return { success: false, error: error.message };
    }
}

export async function deleteAppointmentAction(id: string, userId?: string) {
    try {
        if (!userId) {
            return { success: false, error: 'Unauthorized: No user ID provided' };
        }
        const db = getAdminDb();
        const apptDoc = await db.collection('crm_appointments').doc(id).get();
        if (!apptDoc.exists) {
            return { success: false, error: 'Appointment not found' };
        }
        const apptData = apptDoc.data();

        // Check ownership or admin privileges
        const profileSnap = await db.collection('private_profiles').doc(userId).get();
        const profile = profileSnap.exists ? profileSnap.data() : null;
        const isPrivileged = profile?.role && ['admin', 'superadmin', 'team_office'].includes(profile.role);

        if (apptData?.userId !== userId && !isPrivileged) {
            return { success: false, error: 'Unauthorized: You do not own this appointment' };
        }

        await db.collection('crm_appointments').doc(id).delete();
        return { success: true };
    } catch (error: any) {
        console.error('Error deleting appointment:', error);
        return { success: false, error: error.message };
    }
}

export async function createBlockAction(
    startTimeIso: string, 
    isFullDay: boolean, 
    endTimeIso?: string | null, 
    reason?: string | null,
    userId?: string
) {
    try {
        if (!userId) {
            return { success: false, error: 'Unauthorized: No user ID provided' };
        }
        const db = getAdminDb();
        const blockData = {
            startTime: startTimeIso,
            endTime: isFullDay ? null : (endTimeIso || null),
            status: 'blocked',
            type: isFullDay ? 'full_day_block' : (endTimeIso ? 'time_range_block' : 'specific_hour_block'),
            clientName: 'BLOQUEO DE CALENDARIO',
            clientPhone: '',
            clientEmail: '',
            reason: reason && reason.trim() !== '' ? reason : 'Bloqueo manual',
            createdAt: new Date().toISOString(),
            userId: userId
        };
        const ref = await db.collection('crm_appointments').add(blockData);
        return { success: true, id: ref.id };
    } catch (error: any) {
        console.error('Error creating block:', error);
        return { success: false, error: error.message };
    }
}
