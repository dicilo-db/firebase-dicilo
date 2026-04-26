'use server';

import { getAdminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';

export interface FreelanceRecord {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    category?: string;
    category_key?: string;
    address?: string;
    city?: string;
    country?: string;
    description?: string;
    assignmentStatus?: 'available' | 'assigned' | 'filled';
    verificationStatus?: 'draft' | 'pending_client_approval' | 'confirmed' | 'rejected';
    assignedTo?: string | null;
    [key: string]: any;
}

export async function checkPendingRecords(uid: string): Promise<boolean> {
    const db = getAdminDb();
    const snap = await db.collection('businesses')
        .where('assignedTo', '==', uid)
        .where('assignmentStatus', '==', 'assigned')
        .limit(1)
        .get();
    return !snap.empty;
}

export async function claimRecordPackage(uid: string): Promise<{ success: boolean; message: string; count?: number }> {
    try {
        const db = getAdminDb();
        
        // Check if user already has pending records
        const hasPending = await checkPendingRecords(uid);
        if (hasPending) {
            return { success: false, message: 'Ya tienes un paquete de registros asignado y pendiente de enviar.' };
        }

        const count = await db.runTransaction(async (transaction) => {
            // Find available records
            const query = db.collection('businesses')
                .where('assignmentStatus', '==', 'available')
                .limit(50);
                
            const snapshot = await transaction.get(query);
            
            if (snapshot.empty) {
                return 0;
            }

            const now = admin.firestore.FieldValue.serverTimestamp();

            snapshot.docs.forEach((doc) => {
                transaction.update(doc.ref, {
                    assignmentStatus: 'assigned',
                    verificationStatus: 'draft',
                    assignedTo: uid,
                    assignedAt: now
                });
            });

            return snapshot.docs.length;
        });

        if (count === 0) {
            return { success: false, message: 'No hay registros disponibles en este momento. Intenta más tarde.' };
        }

        return { success: true, message: `Se te han asignado ${count} registros exitosamente.`, count };
    } catch (error: any) {
        console.error("Error claiming records:", error);
        return { success: false, message: error.message || 'Error interno al asignar registros.' };
    }
}

export async function getAssignedRecords(uid: string): Promise<{ success: boolean; data?: FreelanceRecord[]; error?: string }> {
    try {
        const db = getAdminDb();
        const snapshot = await db.collection('businesses')
            .where('assignedTo', '==', uid)
            .where('assignmentStatus', '==', 'assigned')
            .orderBy('assignedAt', 'desc')
            .get();

        const records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FreelanceRecord));
        return { success: true, data: records };
    } catch (error: any) {
        console.error("Error fetching assigned records:", error);
        return { success: false, error: error.message };
    }
}

export async function saveRecordDraft(recordId: string, data: Partial<FreelanceRecord>): Promise<{ success: boolean; error?: string }> {
    try {
        const db = getAdminDb();
        
        // Remove undefined fields
        const cleanData = Object.fromEntries(Object.entries(data).filter(([_, v]) => v !== undefined));
        
        await db.collection('businesses').doc(recordId).update({
            ...cleanData,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        return { success: true };
    } catch (error: any) {
        console.error("Error saving draft:", error);
        return { success: false, error: error.message };
    }
}

export async function sendRecordToClient(recordId: string, data: Partial<FreelanceRecord>): Promise<{ success: boolean; error?: string }> {
    try {
        const db = getAdminDb();
        const crypto = await import('crypto');
        
        // Generate secure random token
        const token = crypto.randomBytes(32).toString('hex');
        const now = admin.firestore.FieldValue.serverTimestamp();

        // Clean data
        const cleanData = Object.fromEntries(Object.entries(data).filter(([_, v]) => v !== undefined));

        await db.collection('businesses').doc(recordId).update({
            ...cleanData,
            assignmentStatus: 'filled',
            verificationStatus: 'pending_client_approval',
            verificationToken: token,
            sentAt: now,
            updatedAt: now
        });

        // Trigger N8N Webhook
        const webhookUrl = process.env.N8N_WEBHOOK_URL;
        const payload = {
            businessId: recordId,
            email: cleanData.email,
            linkAceptar: `https://dicilo.net/api/verificar?action=accept&token=${token}`,
            linkRechazar: `https://dicilo.net/api/verificar?action=deny&token=${token}`
        };

        if (webhookUrl) {
            try {
                await fetch(webhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            } catch (webhookError) {
                console.error("Failed to call N8N webhook, but record was saved:", webhookError);
                // We still consider it a success for the UI if the DB was updated
            }
        } else {
            console.log("No N8N_WEBHOOK_URL set. Payload would be:", payload);
        }

        return { success: true };
    } catch (error: any) {
        console.error("Error sending to client:", error);
        return { success: false, error: error.message };
    }
}
