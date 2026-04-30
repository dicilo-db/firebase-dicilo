'use server';

import { getAdminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';
import { revalidatePath, unstable_noStore as noStore } from 'next/cache';
import { logActionAndReward } from './freelancer-rewards';

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

        revalidatePath('/dashboard/freelancer');
        return { success: true, message: `Se te han asignado ${count} registros exitosamente.`, count };
    } catch (error: any) {
        console.error("Error claiming records:", error);
        return { success: false, message: error.message || 'Error interno al asignar registros.' };
    }
}

export async function getAssignedRecords(uid: string): Promise<{ success: boolean; data?: FreelanceRecord[]; error?: string }> {
    try {
        noStore();
        const db = getAdminDb();
        const snapshot = await db.collection('businesses')
            .where('assignedTo', '==', uid)
            .where('assignmentStatus', '==', 'assigned')
            .get();

        const records = snapshot.docs.map(doc => {
            const data = doc.data();
            // Convert any Firestore Timestamps to ISO strings
            const serializedData = Object.entries(data).reduce((acc, [key, value]) => {
                if (value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
                    acc[key] = value.toDate().toISOString();
                } else if (value && typeof value === 'object' && !Array.isArray(value)) {
                    // Just stringify/parse nested objects to avoid prototype issues
                    try {
                        acc[key] = JSON.parse(JSON.stringify(value));
                    } catch(e) {
                        acc[key] = null;
                    }
                } else {
                    acc[key] = value;
                }
                return acc;
            }, {} as any);
            
            return { id: doc.id, ...serializedData } as FreelanceRecord;
        });
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
        
        revalidatePath('/dashboard/freelancer');
        return { success: true };
    } catch (error: any) {
        console.error("Error saving draft:", error);
        return { success: false, error: error.message };
    }
}

export async function sendRecordToClient(recordId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const db = getAdminDb();
        
        // 1. Fetch latest data to ensure it is filled
        const docRef = db.collection('businesses').doc(recordId);
        const docSnap = await docRef.get();
        if (!docSnap.exists) {
            return { success: false, error: 'El registro ya no existe.' };
        }
        
        const data = docSnap.data() as any;
        const requiredFields = ['name', 'email', 'phone', 'category', 'city', 'country'];
        const missingFields = requiredFields.filter(f => !data[f]);
        
        if (missingFields.length > 0) {
            return { success: false, error: `Faltan campos obligatorios: ${missingFields.join(', ')}. Por favor, edita y guarda el registro completo primero.` };
        }

        const crypto = await import('crypto');
        
        // Generate secure random token
        const token = crypto.randomBytes(32).toString('hex');
        const now = admin.firestore.FieldValue.serverTimestamp();

        await docRef.update({
            assignmentStatus: 'filled',
            verificationStatus: 'pending_client_approval',
            verificationToken: token,
            sentAt: now,
            updatedAt: now
        });

        // Trigger reward and log
        if (data.assignedTo) {
            await logActionAndReward(data.assignedTo, 'p2_sent_to_client', recordId, 'businesses');
        }

        // Trigger N8N Webhook
        const webhookUrl = process.env.N8N_WEBHOOK_URL;
        const payload = {
            businessId: recordId,
            email: data.email,
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

        revalidatePath('/dashboard/freelancer');
        return { success: true };
    } catch (error: any) {
        console.error("Error sending to client:", error);
        return { success: false, error: error.message };
    }
}
